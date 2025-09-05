// store.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { 
    Difficulty, 
    PlayerActionState, 
    Healer, 
    GameState, 
    Consumable, 
    ShieldState, 
    ActiveDotState, 
    ActiveHotState, 
    LevelData, 
    ShopItem, 
    PlayerAction, 
    LevelSummaryStats,
    HealerAbility,
    HotEffect,
    DotEffect
} from './types';
import { deepCopy, getRandomElements } from './utils';
import { TICK_RATE, DIFFICULTY_MODIFIERS, ALL_PLAYER_ACTIONS, ALL_CONSUMABLES, MAX_CONSUMABLES } from './constants';

const createHealer = (name: string, icon: string): Healer => {
    // Basic healer setup
    const abilities: HealerAbility[] = [
        { id: `${name}-heal`, name: 'Cura Minore', icon: '❤️', cooldown: 5, timeToNextUse: 3, healAmount: 10 },
        { id: `${name}-hot`, name: 'Rigenerazione', icon: '🌿', cooldown: 12, timeToNextUse: 8, hot: { id: 'regen', heal: 3, duration: 9, icon: '🌿' } }
    ];
    return {
        id: name.toLowerCase(),
        name,
        icon,
        maxHp: 100,
        abilities,
        stunTimer: 0
    };
};

const getUpgradeDescription = (action: PlayerActionState): string => {
    switch(action.id) {
        case 'slap': return `Livello ${action.level + 1}: +5 Danno, -0.5s Cooldown.`;
        case 'headbutt': return `Livello ${action.level + 1}: +15 Danno, -0.2s Auto-stordimento.`;
        case 'voodoo_curse': return `Livello ${action.level + 1}: +2 Danno/sec, +2s Durata.`;
        case 'food_poisoning': return `Livello ${action.level + 1}: +3 Danno/sec, -2s Cooldown.`;
        case 'uncontrolled_rage': return `Livello ${action.level + 1}: +25 Danno, +10 Instabilità.`;
        default: return "Miglioramento generico.";
    }
};

const applyUpgrade = (action: PlayerActionState): void => {
    switch(action.id) {
        case 'slap':
            action.damage += 5;
            action.cooldown = Math.max(0.5, action.cooldown - 0.5);
            break;
        case 'headbutt':
            action.damage += 15;
            if(action.stunDuration) {
                action.stunDuration = Math.max(0, action.stunDuration - 0.2);
            }
            break;
        case 'voodoo_curse':
            if (action.dot) {
                action.dot.damage += 2;
                action.dot.duration += 2;
            }
            break;
        case 'food_poisoning':
             if (action.dot) {
                action.dot.damage += 3;
            }
            action.cooldown = Math.max(5, action.cooldown - 2);
            break;
        case 'uncontrolled_rage':
            action.damage += 25;
            action.instabilityGain += 10;
            break;
    }
};

export class GameStore {
    // Core state
    gameState: GameState = 'start';
    hp = 100;
    shield: ShieldState | null = null;
    instability = 0;
    timer = 60;
    stunTimer = 0;

    // Player & Level
    playerActions: PlayerActionState[] = [];
    consumables: Consumable[] = [];
    activeDots: ActiveDotState[] = [];
    activeHots: ActiveHotState[] = [];
    levelData: LevelData | null = null;
    healers: Healer[] = [];

    // Meta-progression
    ragePoints = 0;
    currentLevel = 1;
    difficulty: Difficulty = 'Medium';
    win = false;
    shopItems: ShopItem[] = [];
    levelSummaryStats: LevelSummaryStats | null = null;
    
    // Internals
    private gameLoopInterval: number | null = null;
    private lastTick = 0;

    constructor() {
        makeAutoObservable(this);
        this.setupShop();
    }

    setupShop = () => {
        const actionShopItems: ShopItem[] = [];

        // Generate upgrades for owned actions
        this.playerActions.forEach(ownedAction => {
            const baseAction = ALL_PLAYER_ACTIONS.find(a => a.id === ownedAction.id);
            if (!baseAction) return;

            actionShopItems.push({
                id: `upgrade_${ownedAction.id}_${ownedAction.level}`,
                name: `Potenzia: ${ownedAction.name}`,
                description: getUpgradeDescription(ownedAction),
                cost: Math.floor(baseAction.baseCost * 1.5 * ownedAction.level),
                category: 'Potenziamento',
                type: 'upgrade',
                payload: baseAction,
                owned: false,
            });
        });

        // Generate new actions to buy with rarity-based selection
        const unownedActions = ALL_PLAYER_ACTIONS.filter(action =>
            !this.playerActions.some(pa => pa.id === action.id) && this.currentLevel >= action.minLevel
        );

        const common = unownedActions.filter(a => a.rarity === 'Common');
        const uncommon = unownedActions.filter(a => a.rarity === 'Uncommon');
        const rare = unownedActions.filter(a => a.rarity === 'Rare');
        const epic = unownedActions.filter(a => a.rarity === 'Epic');

        const offeredActions = [
            ...common,
            ...getRandomElements(uncommon, 2),
            ...getRandomElements(rare, 1),
            ...getRandomElements(epic, 1),
        ];

        offeredActions.forEach(action => {
            actionShopItems.push({
                id: `action_${action.id}`,
                name: action.name,
                description: action.description,
                cost: action.baseCost,
                category: 'Azione',
                type: 'action',
                payload: action,
                owned: false,
            });
        });

        const consumableItems: ShopItem[] = ALL_CONSUMABLES.map(consumable => {
            let cost = 50;
             if (consumable.id === 'painful_onion') cost = 60;
             if (consumable.id === 'corrupted_coffee') cost = 80;

            return {
                id: `consumable_${consumable.id}`,
                name: consumable.name,
                description: consumable.description,
                cost,
                category: 'Consumabile',
                type: 'consumable',
                payload: consumable,
            }
        });

        actionShopItems.sort((a,b) => a.cost - b.cost);
        this.shopItems = [...actionShopItems, ...consumableItems];
    }

    startGame = (difficulty: Difficulty) => {
        this.difficulty = difficulty;
        this.currentLevel = 1;
        this.ragePoints = 50;
        this.playerActions = [];
        this.levelData = null;
        this.consumables = [];
        this.setupShop();
        this.gameState = 'shop';
    }

    loadLevel = (levelNumber: number) => {
        const healersForLevel: Healer[] = [];

        if (levelNumber === 1) {
            healersForLevel.push({
                id: 'acolyte', name: 'Apprendista Guaritore', icon: '🧑‍⚕️', maxHp: 100,
                abilities: [ { id: 'acolyte-mend', name: 'Cura Debole', icon: '🩹', cooldown: 8, timeToNextUse: 4, healAmount: 8 } ],
                stunTimer: 0
            });
        } else if (levelNumber === 2) {
             healersForLevel.push(createHealer('Chierico', '🙏'));
        } else {
            healersForLevel.push(createHealer('Chierico', '🙏'));
            if (levelNumber >= 3) healersForLevel.push(createHealer('Sciamano', '🌿'));
            if (levelNumber >= 5) healersForLevel.push(createHealer('Paladino', '🛡️'));
        }
    
        const newLevelData: LevelData = {
            level: levelNumber,
            characterMaxHp: 100 + (levelNumber - 1) * 20,
            timeLimit: 60,
            healers: healersForLevel
        };

        this.levelData = newLevelData;
        this.hp = this.levelData.characterMaxHp;
        this.timer = this.levelData.timeLimit;
        this.healers = deepCopy(this.levelData.healers);
        this.instability = 0;
        this.shield = null;
        this.activeDots = [];
        this.activeHots = [];
        this.stunTimer = 0;
        
        this.gameState = 'playing';
        this.win = false;
        this.lastTick = Date.now();
        this.gameLoopInterval = setInterval(this.gameLoop, TICK_RATE);
    }

    stopGameLoop = () => {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
    }
    
    gameLoop = () => {
        runInAction(() => {
            const now = Date.now();
            const delta = (now - this.lastTick) / 1000;
            this.lastTick = now;
    
            if (this.gameState !== 'playing') return;
    
            this.timer = Math.max(0, this.timer - delta);
            this.stunTimer = Math.max(0, this.stunTimer - delta);
            this.playerActions.forEach(a => {
                a.currentCooldown = Math.max(0, a.currentCooldown - delta);
            });
            this.healers.forEach(h => {
                if (h.stunTimer && h.stunTimer > 0) {
                    h.stunTimer = Math.max(0, h.stunTimer - delta);
                } else {
                    h.abilities.forEach(ab => {
                        ab.timeToNextUse = Math.max(0, ab.timeToNextUse - delta);
                    });
                }
            });

            let dotDamage = 0;
            this.activeDots.forEach(dot => {
                dot.remainingDuration -= delta;
                dotDamage += dot.damage * delta;
            });
            this.activeDots = this.activeDots.filter(d => d.remainingDuration > 0);
            
            let hotHealing = 0;
            this.activeHots.forEach(hot => {
                hot.remainingDuration -= delta;
                hotHealing += hot.heal * delta;
            });
            this.activeHots = this.activeHots.filter(h => h.remainingDuration > 0);
            
            this.applyDamage(dotDamage, true);
            this.applyHealing(hotHealing);

            this.healers.forEach(h => {
                if(h.stunTimer && h.stunTimer > 0) return;
                h.abilities.forEach(ability => {
                    if (ability.timeToNextUse <= 0) {
                        this.useHealerAbility(ability);
                        ability.timeToNextUse = ability.cooldown * (DIFFICULTY_MODIFIERS[this.difficulty].healerCdModifier);
                    }
                });
            });

            if (this.hp <= 0) {
                this.win = true;
                this.gameState = 'level-won';
                this.calculateLevelSummary();
                this.stopGameLoop();
            } else if (this.timer <= 0) {
                this.win = false;
                this.gameState = 'game-over';
                this.stopGameLoop();
            }
        });
    }

    useHealerAbility = (ability: HealerAbility) => {
        if (ability.healAmount) {
            this.applyHealing(ability.healAmount);
        }
        if (ability.hot) {
            this.addHot(ability.hot);
        }
    }

    applyDamage = (amount: number, isDot = false) => {
        if (!isDot) {
            amount *= DIFFICULTY_MODIFIERS[this.difficulty].playerDamageModifier;
        }

        if (this.shield && this.shield.amount > 0) {
            const shieldDamage = Math.min(this.shield.amount, amount);
            this.shield.amount -= shieldDamage;
            amount -= shieldDamage;
        }
        this.hp -= amount;
    }

    applyHealing = (amount: number) => {
        if (!this.levelData) return;
        this.hp = Math.min(this.levelData.characterMaxHp, this.hp + amount);
    }
    
    addHot = (hotEffect: HotEffect) => {
        const existingHot = this.activeHots.find(h => h.id === hotEffect.id);
        if (existingHot) {
            existingHot.remainingDuration = Math.max(existingHot.remainingDuration, hotEffect.duration);
        } else {
            this.activeHots.push({ ...hotEffect, remainingDuration: hotEffect.duration });
        }
    }

    addDot = (dotEffect: DotEffect) => {
        const existingDot = this.activeDots.find(d => d.id === dotEffect.id);
        if (existingDot) {
            existingDot.remainingDuration = dotEffect.duration;
        } else {
            this.activeDots.push({ ...dotEffect, remainingDuration: dotEffect.duration });
        }
    }

    useAction = (action: PlayerActionState) => {
        if (action.currentCooldown > 0 || this.stunTimer > 0) return;

        action.currentCooldown = action.cooldown;
        if (action.damage > 0) {
            this.applyDamage(action.damage);
        }
        if (action.instabilityGain > 0) {
            this.instability = Math.min(100, this.instability + action.instabilityGain);
        }
        if (action.stunDuration) {
            this.stunTimer = action.stunDuration;
        }
        if (action.dot) {
            this.addDot(action.dot);
        }
    }
    
    useConsumable = (consumableId: string) => {
        const consumable = this.consumables.find(c => c.id === consumableId);
        if (!consumable || consumable.quantity <= 0) return;

        runInAction(() => {
            consumable.quantity--;
            const effect = consumable.effect;
            if (effect.type === 'STUN_ALL_HEALERS') {
                this.healers.forEach(h => h.stunTimer = (h.stunTimer || 0) + effect.duration);
            } else if (effect.type === 'APPLY_SELF_DOT') {
                this.addDot(effect.dot);
            }

            if (consumable.quantity <= 0) {
                this.consumables = this.consumables.filter(c => c.id !== consumableId);
            }
        });
    }

    calculateLevelSummary = () => {
        const damageDone = (this.levelData?.characterMaxHp || 100) - Math.max(0, this.hp);
        const damageBonus = Math.floor(damageDone * 1.5);
        const timeBonus = Math.floor(this.timer * 10);
        const overkillBonus = Math.floor(Math.abs(this.hp) * 5);
        const total = damageBonus + timeBonus + overkillBonus;
        
        this.levelSummaryStats = { damageBonus, timeBonus, overkillBonus, total };
        this.ragePoints += total;
    }

    enterShop = () => {
        this.playerActions.forEach(action => action.currentCooldown = 0);
        this.setupShop();
        this.gameState = 'shop';
    }

    nextLevel = () => {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
    }

    proceedFromShop = () => {
        if (this.levelData === null) { 
            this.loadLevel(1);
        } else {
            this.nextLevel();
        }
    }

    buyShopItem = (item: ShopItem) => {
        if (this.ragePoints < item.cost) return;

        runInAction(() => {
            this.ragePoints -= item.cost;
            if (item.type === 'action') {
                this.playerActions.push({ ...(item.payload as PlayerAction), currentCooldown: 0, level: 1 });
            } else if (item.type === 'upgrade') {
                const actionToUpgrade = this.playerActions.find(pa => pa.id === (item.payload as PlayerAction).id);
                if(actionToUpgrade) {
                    applyUpgrade(actionToUpgrade);
                    actionToUpgrade.level++;
                }
            } else if (item.type === 'consumable') {
                const consumablePayload = item.payload as Omit<Consumable, 'quantity'>;
                const existingConsumable = this.consumables.find(c => c.id === consumablePayload.id);

                if (existingConsumable) {
                    existingConsumable.quantity++;
                } else {
                    if (this.consumables.length >= MAX_CONSUMABLES) {
                        this.ragePoints += item.cost; // Refund
                        return;
                    }
                    this.consumables.push({ ...consumablePayload, quantity: 1 });
                }
            }
            // Refresh shop to show new upgrades or remove bought actions
            this.setupShop();
        });
    }

    restartGame = () => {
        this.stopGameLoop();
        this.gameState = 'start';
    }
}