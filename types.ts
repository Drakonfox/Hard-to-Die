// types.ts

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface ShieldState {
  amount: number;
}

export interface ActiveEffectState {
  id: string;
  icon: string;
  remainingDuration: number;
}

export interface ActiveDotState extends ActiveEffectState {
  damage: number;
}

export interface ActiveHotState extends ActiveEffectState {
  heal: number;
}

export interface DotEffect {
  id: string;
  damage: number;
  duration: number;
  icon: string;
}

export interface HotEffect {
  id: string;
  heal: number;
  duration: number;
  icon: string;
}

export interface PlayerAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  damage: number;
  cooldown: number;
  instabilityGain: number;
  stunDuration?: number;
  dot?: DotEffect;
  minLevel: number;
  baseCost: number;
}

export interface PlayerActionState extends PlayerAction {
  currentCooldown: number;
  level: number;
}

export interface HealerAbility {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  timeToNextUse: number;
  healAmount?: number;
  hot?: HotEffect;
  shieldAmount?: number;
  dispel?: boolean;
}

export interface Healer {
  id: string;
  name: string;
  icon: string;
  maxHp: number;
  abilities: HealerAbility[];
  stunTimer?: number;
}

export type ConsumableEffect = 
  | { type: 'STUN_ALL_HEALERS'; duration: number }
  | { type: 'APPLY_SELF_DOT'; dot: DotEffect };

export interface Consumable {
  id: string;
  name: string;
  icon: string;
  description: string;
  effect: ConsumableEffect;
  quantity: number;
}

export interface LevelData {
  level: number;
  characterMaxHp: number;
  timeLimit: number;
  healers: Healer[];
}

export type GameState = 'start' | 'playing' | 'level-won' | 'game-over' | 'shop';

export type ShopItemCategory = 'Azione' | 'Potenziamento' | 'Consumabile';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: ShopItemCategory;
  type: 'action' | 'consumable' | 'upgrade';
  payload: PlayerAction | Omit<Consumable, 'quantity'>;
  owned?: boolean; // Only for actions/upgrades
}

export interface LevelSummaryStats {
    damageBonus: number;
    timeBonus: number;
    overkillBonus: number;
    total: number;
}