// FIX: Define all the necessary types for the application.
export enum GameStatus {
  StartScreen,
  Playing,
  LevelComplete,
  GameOver,
  ReplacingAction,
}

export enum Difficulty {
  Easy = 'Easy',
  Normal = 'Normal',
  Hard = 'Hard',
}

export interface DotEffect {
  id: string; // e.g., 'bleed', 'poison'
  icon: string;
  damage: number;
  duration: number;
  ticks: number;
}

export interface PlayerActionState {
  id: string;
  name: string;
  icon: string;
  damage: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  dot?: DotEffect;
  stunDuration?: number; // in seconds
}

export interface ActiveDotState {
  id:string;
  icon: string;
  remainingDuration: number;
  damagePerTick: number;
  interval: number;
  timeToNextTick: number;
}

export interface ActiveHotState {
  id: string;
  icon: string;
  remainingDuration: number;
  healPerTick: number;
  interval: number;
  timeToNextTick: number;
}

export interface ShieldState {
    amount: number;
    // Potentially add duration in the future
}

export interface StatUpgrade {
  id: string;
  type: 'stat_boost';
  title: string;
  description: string;
  apply: (actions: PlayerActionState[]) => PlayerActionState[];
}

export interface NewActionUpgrade {
  id: string;
  type: 'new_action';
  action: PlayerActionState;
}

export type Upgrade = StatUpgrade | NewActionUpgrade;


export type HealerAbilityType = 'direct_heal' | 'cleanse' | 'shield' | 'regeneration';

export interface HealerAbility {
    id: string;
    type: HealerAbilityType;
    name: string;
    icon: string;
    amount?: number; // for heal, shield, regen
    duration?: number; // for shield, regen
    ticks?: number; // for regen
    cooldown: number;
    timeToNextUse: number;
}

export interface Healer {
  id: string;
  name: string;
  icon: string;
  abilities: HealerAbility[];
}

export interface Level {
  level: number;
  characterMaxHp: number;
  timer: number; // in seconds
  healers: Healer[];
}

export interface EventLogMessage {
  id: number;
  message: string;
  type: 'damage' | 'heal' | 'effect' | 'info' | 'shield';
}