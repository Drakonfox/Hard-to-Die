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
import { TICK_RATE, DIFFICULTY_MODIFIERS, ALL_PLAYER_ACTIONS, ALL_CONSUMABLES, MAX_CONSUMABLES, MAX_PLAYER_ACTIONS, MAX_INSTABILITY, INSTABILITY_STUN_DURATION, MAX_ACTION_LEVEL } from './constants';

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
        case 'slap': return `Livello ${action.level + 1}: +5 Danno, -0.1s Cooldown.`;
        case 'headbutt': return `Livello ${action.level + 1}: +15 Danno, -0.2s Auto-stordimento.`;
        case 'voodoo_curse': return `Livello ${action.level + 1}: +2 Danno/sec, +2s Durata.`;
        case 'food_poisoning': return `Livello ${action.level + 1}: +3 Danno/sec, -2s Cooldown.`;
        case 'uncontrolled_rage': return `Livello ${action.level + 1}: +25 Danno, +10 Instabilità.`;
        case 'painful_meditation': return `Livello ${action.level + 1}: +0.1 Danno/HP mancante.`;
        case 'short_circuit': return `Livello ${action.level + 1}: +10 Danno, +5% Prob. Stordimento.`;
        case 'blood_pact': return `Livello ${action.level + 1}: +20 Danno, +3 Danno/sec sanguinamento.`;
        default: return "Miglioramento generico.";
    }
};

const applyUpgrade = (action: PlayerActionState): void => {
    switch(action.id) {
        case 'slap':
            action.damage += 5;
            action.cooldown = Math.max(0.1, action.cooldown - 0.1);
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
        case 'painful_meditation':
            if (action.damageScalingOnMissingHp) {
                action.damageScalingOnMissingHp += 0.1;
            }
            break;
        case 'short_circuit':
            action.damage += 10;
            if (action.stunChance) {
                action.stunChance = Math.min(1, action.stunChance + 0.05);
            }
            break;
        case 'blood_pact':
            action.damage += 20;
            if (action.dot) {
                action.dot.damage += 3;
            }
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
    healingReduction = { duration: 0, reductionPercent: 0 };
    instabilityTriggered = false;

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
    pendingShopPurchase: ShopItem | null = null;
    
    // Internals
    private gameLoopInterval: number | null = null;
    private lastTick = 0;

    constructor() {
        makeAutoObservable(this);
        this.setupShop();
    }

    setupShop = () => {
        const shopOfferings: ShopItem[] = [];

        // Generate upgrades for owned actions
        this.playerActions.forEach(ownedAction => {
            if (ownedAction.level >= MAX_ACTION_LEVEL) return;

            const baseAction = ALL_PLAYER_ACTIONS.find(a => a.id === ownedAction.id);
            if (!baseAction) return;

            shopOfferings.push({
                id: `upgrade_${ownedAction.id}_${ownedAction.level}`,
                name: `Potenzia: ${ownedAction.name}`,
                description: getUpgradeDescription(ownedAction),
                cost: Math.floor(baseAction.baseCost * Math.pow(1.5, ownedAction.level)),
                category: 'Potenziamento',
                type: 'upgrade',
                payload: baseAction,
                owned: false,
            });
        });

        // Generate a random sample of new actions to buy
        const unownedActions = ALL_PLAYER_ACTIONS.filter(action =>
            !this.playerActions.some(pa => pa.id === action.id) && this.currentLevel >= action.minLevel
        );
        
        const offeredActions = getRandomElements(unownedActions, 3);

        offeredActions.forEach(action => {
            shopOfferings.push({
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

        // Generate a random sample of consumables
        const offeredConsumables = getRandomElements(ALL_CONSUMABLES, 3);
        const consumableItems: ShopItem[] = offeredConsumables.map(consumable => {
            let cost = 75;
            if (consumable.id === 'painful_onion') cost = 60;
            if (consumable.id === 'corrupted_coffee') cost = 80;
            if (consumable.id === 'weakening_potion') cost = 100;
            if (consumable.id === 'shrapnel_bomb') cost = 50;

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

        shopOfferings.sort((a,b) => a.cost - b.cost);
        this.shopItems = [...shopOfferings, ...consumableItems];
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
                abilities: [ { id: 'acolyte-mend', name: 'Cura Debole', icon: '🩹', cooldown: 5, timeToNextUse: 4, healAmount: 10 } ],
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
        this.healingReduction = { duration: 0, reductionPercent: 0 };
        
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
            this.healingReduction.duration = Math.max(0, this.healingReduction.duration - delta);

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
        if (this.healingReduction.duration > 0) {
            amount *= (1 - this.healingReduction.reductionPercent);
        }
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
        
        let finalDamage = action.damage;
        if (action.damageScalingOnMissingHp && this.levelData) {
            const missingHp = this.levelData.characterMaxHp - this.hp;
            finalDamage += missingHp * action.damageScalingOnMissingHp;
        }

        if (finalDamage > 0) {
            this.applyDamage(finalDamage);
        }

        if (action.instabilityGain > 0) {
            this.instability += action.instabilityGain;
            if (this.instability >= MAX_INSTABILITY) {
                const timesTriggered = Math.floor(this.instability / MAX_INSTABILITY);
                this.instability %= MAX_INSTABILITY;

                this.instabilityTriggered = true;
                setTimeout(() => runInAction(() => { this.instabilityTriggered = false; }), 600);

                for (let i = 0; i < timesTriggered; i++) {
                    const nonStunnedHealers = this.healers.filter(h => !h.stunTimer || h.stunTimer <= 0);
                    if (nonStunnedHealers.length > 0) {
                        const targetHealer = nonStunnedHealers[Math.floor(Math.random() * nonStunnedHealers.length)];
                        targetHealer.stunTimer = (targetHealer.stunTimer || 0) + INSTABILITY_STUN_DURATION;
                    } else {
                        break; 
                    }
                }
            }
        }

        if (action.stunDuration) {
            this.stunTimer = action.stunDuration;
        }
        if (action.dot) {
            this.addDot(action.dot);
        }
        if (action.stunChance && action.healerStunDuration) {
            if (Math.random() < action.stunChance) {
                const nonStunnedHealers = this.healers.filter(h => !h.stunTimer || h.stunTimer <= 0);
                if (nonStunnedHealers.length > 0) {
                    const targetHealer = nonStunnedHealers[Math.floor(Math.random() * nonStunnedHealers.length)];
                    targetHealer.stunTimer = (targetHealer.stunTimer || 0) + action.healerStunDuration;
                }
            }
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
            } else if (effect.type === 'REDUCE_HEALING') {
                this.healingReduction = { duration: effect.duration, reductionPercent: effect.reductionPercent };
            } else if (effect.type === 'DAMAGE_AND_DOT') {
                this.applyDamage(effect.damage);
                this.addDot(effect.dot);
            }

            if (consumable.quantity <= 0) {
                this.consumables = this.consumables.filter(c => c.id !== consumableId);
            }
        });
    }

    calculateLevelSummary = () => {
        const damageDone = (this.levelData?.characterMaxHp || 100) - Math.max(0, this.hp);
        const damageBonus = Math.floor(damageDone * 0.75);
        const timeBonus = Math.floor(this.timer * 5);
        const overkillBonus = Math.floor(Math.abs(this.hp) * 2.5);
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
        if (this.pendingShopPurchase) return; // Prevent purchases while one is pending

        runInAction(() => {
            if (item.type === 'action') {
                if (this.playerActions.length >= MAX_PLAYER_ACTIONS) {
                    this.ragePoints -= item.cost;
                    this.pendingShopPurchase = item;
                    return; // Let the UI handle replacement
                }
                this.ragePoints -= item.cost;
                this.playerActions.push({ ...(item.payload as PlayerAction), currentCooldown: 0, level: 1 });
            } else if (item.type === 'upgrade') {
                this.ragePoints -= item.cost;
                const actionToUpgrade = this.playerActions.find(pa => pa.id === (item.payload as PlayerAction).id);
                if(actionToUpgrade) {
                    applyUpgrade(actionToUpgrade);
                    actionToUpgrade.level++;
                }
            } else if (item.type === 'consumable') {
                this.ragePoints -= item.cost;
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

    confirmActionReplacement = (actionToReplaceId: string) => {
        if (!this.pendingShopPurchase || this.pendingShopPurchase.type !== 'action') return;

        runInAction(() => {
            const newActionPayload = this.pendingShopPurchase!.payload as PlayerAction;
            const newAction: PlayerActionState = { ...newActionPayload, currentCooldown: 0, level: 1 };

            const indexToReplace = this.playerActions.findIndex(a => a.id === actionToReplaceId);
            
            if (indexToReplace !== -1) {
                this.playerActions[indexToReplace] = newAction;
            } else {
                // Safeguard: Should not happen if UI is correct. Refund and cancel.
                this.ragePoints += this.pendingShopPurchase!.cost;
                console.error("Could not find action to replace. Purchase cancelled and refunded.");
            }

            this.pendingShopPurchase = null;
            this.setupShop();
        });
    }

    cancelActionReplacement = () => {
        if (!this.pendingShopPurchase) return;

        runInAction(() => {
            this.ragePoints += this.pendingShopPurchase!.cost; // Refund points
            this.pendingShopPurchase = null;
        });
    }

    restartGame = () => {
        this.stopGameLoop();
        this.gameState = 'start';
    }
}