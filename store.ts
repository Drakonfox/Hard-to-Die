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
import { deepCopy } from './utils';
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
        const actionItems: ShopItem[] = ALL_PLAYER_ACTIONS.map(action => {
            let cost = 100;
            if (action.id === 'slap') cost = 25;
            if (action.id === 'voodoo_curse') cost = 75;
            if (action.id === 'headbutt') cost = 100;
            if (action.id === 'food_poisoning') cost = 120;
            
            return {
                id: `action_${action.id}`,
                name: action.name,
                description: action.description,
                cost: cost,
                category: 'Azione',
                type: 'action',
                payload: action,
                owned: this.playerActions.some(pa => pa.id === action.id),
            };
        });

        const consumableItems: ShopItem[] = ALL_CONSUMABLES.map(consumable => {
            let cost = 50; // default cost for consumables
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

        this.shopItems = [...actionItems, ...consumableItems];
    }

    startGame = (difficulty: Difficulty) => {
        this.difficulty = difficulty;
        this.currentLevel = 1;
        this.ragePoints = 50; // Starting money
        this.playerActions = []; // Start with NO actions
        this.levelData = null;
        this.consumables = [];
        this.setupShop();
        this.gameState = 'shop'; // Go to shop first
    }

    loadLevel = (levelNumber: number) => {
        const healersForLevel: Healer[] = [];

        if (levelNumber === 1) {
            // Level 1: A single, weak healer to introduce the mechanics.
            healersForLevel.push({
                id: 'acolyte',
                name: 'Apprendista Guaritore',
                icon: '🧑‍⚕️',
                maxHp: 100,
                abilities: [
                    { id: 'acolyte-mend', name: 'Cura Debole', icon: '🩹', cooldown: 8, timeToNextUse: 4, healAmount: 8 }
                ],
                stunTimer: 0
            });
        } else {
            // Subsequent levels gradually introduce more and stronger healers.
            healersForLevel.push(createHealer('Chierico', '🙏'));
            if (levelNumber >= 3) {
                healersForLevel.push(createHealer('Sciamano', '🌿'));
            }
            if (levelNumber >= 5) {
                healersForLevel.push(createHealer('Paladino', '🛡️'));
            }
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

            // Apply effect
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
            if (item.type === 'action') {
                if (item.owned) return;
                this.ragePoints -= item.cost;
                this.playerActions.push({ ...(item.payload as PlayerAction), currentCooldown: 0 });
                const shopItem = this.shopItems.find(si => si.id === item.id);
                if (shopItem) shopItem.owned = true;
            } else if (item.type === 'consumable') {
                const consumablePayload = item.payload as Omit<Consumable, 'quantity'>;
                const existingConsumable = this.consumables.find(c => c.id === consumablePayload.id);

                if (existingConsumable) {
                    this.ragePoints -= item.cost;
                    existingConsumable.quantity++;
                } else {
                    if (this.consumables.length >= MAX_CONSUMABLES) return; // Inventory is full for new items
                    this.ragePoints -= item.cost;
                    this.consumables.push({ ...consumablePayload, quantity: 1 });
                }
            }
        });
    }

    restartGame = () => {
        this.stopGameLoop();
        this.gameState = 'start';
    }
}