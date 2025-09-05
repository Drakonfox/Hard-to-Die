// FIX: Define all the necessary constants for the application.
import { Difficulty, PlayerActionState, Level, Upgrade, StatUpgrade, Healer, HealerAbility, Consumable, HealerStunUpgrade } from './types';
import { deepCopy } from './utils';

export const DIFFICULTY_MODIFIERS: Record<Difficulty, {
  description: string;
  hpMultiplier: number;
  timerMultiplier: number;
  healMultiplier: number;
}> = {
  [Difficulty.Easy]: {
    description: "Healers are weaker and you have more time. A gentle path to the afterlife.",
    hpMultiplier: 1.2,
    timerMultiplier: 1.2,
    healMultiplier: 0.8,
  },
  [Difficulty.Normal]: {
    description: "A balanced challenge. The healers won't make it easy for you.",
    hpMultiplier: 1.0,
    timerMultiplier: 1.0,
    healMultiplier: 1.0,
  },
  [Difficulty.Hard]: {
    description: "Healers are relentless and time is short. Only for those truly committed to their demise.",
    hpMultiplier: 0.8,
    timerMultiplier: 0.8,
    healMultiplier: 1.2,
  },
};

export const INITIAL_ACTIONS: PlayerActionState[] = [
  {
    id: 'punch',
    name: 'Self Punch',
    icon: '👊',
    damage: 10,
    cooldown: 2,
    currentCooldown: 0,
    description: "A simple punch to the face. It's a start.",
    instabilityGain: 15,
  },
  {
    id: 'stub_toe',
    name: 'Stub Toe',
    icon: '🦶',
    damage: 5,
    cooldown: 1,
    currentCooldown: 0,
    description: 'Deliberately stub your toe. Annoyingly painful.',
    instabilityGain: 5,
  },
];

export const ACTION_POOL: PlayerActionState[] = [
  {
    id: 'explosive_shot',
    name: 'Explosive Shot',
    icon: '💥',
    damage: 40,
    cooldown: 20,
    currentCooldown: 0,
    description: 'A massive burst of self-inflicted damage. Long cooldown.',
    instabilityGain: 40,
  },
  {
    id: 'bleed',
    name: 'Bleed',
    icon: '🔪',
    damage: 5,
    cooldown: 8,
    currentCooldown: 0,
    description: 'Cause a bleeding wound. Deals damage over time.',
    dot: { id: 'bleed', icon: '🩸', damage: 12, duration: 4, ticks: 4 },
    instabilityGain: 20,
  },
  {
    id: 'set_on_fire',
    name: 'Set on Fire',
    icon: '🔥',
    damage: 5,
    cooldown: 12,
    currentCooldown: 0,
    description: 'A fiery embrace. Deals rapid damage over a short time.',
    dot: { id: 'burn', icon: '🔥', damage: 18, duration: 3, ticks: 6 },
    instabilityGain: 25,
  },
  {
    id: 'poison_self',
    name: 'Poison Self',
    icon: '🧪',
    damage: 2,
    cooldown: 15,
    currentCooldown: 0,
    description: 'Ingest a foul concoction. Deals damage over a long time.',
    dot: { id: 'poison', icon: '☠️', damage: 20, duration: 10, ticks: 5 },
    instabilityGain: 30,
  },
  {
    id: 'self_stun',
    name: 'Self-Stun',
    icon: '😵',
    damage: 2,
    cooldown: 12,
    currentCooldown: 0,
    description: 'Hit yourself so hard you get stunned for 2 seconds.',
    stunDuration: 2,
    instabilityGain: 10,
  },
  {
    id: 'bang_head',
    name: 'Bang Head',
    icon: '🤕',
    damage: 25,
    cooldown: 5,
    currentCooldown: 0,
    description: 'Repeatedly bang your head against a wall. Effective, but dizzying.',
    instabilityGain: 25,
  }
];


export const STAT_UPGRADE_POOL: StatUpgrade[] = [
  {
    id: 'punch_upgrade_1',
    type: 'stat_boost',
    title: 'Stronger Punches',
    description: 'Increase the damage of Self Punch by 5.',
    icon: '💪',
    apply: (actions: PlayerActionState[]): PlayerActionState[] => {
      const newActions = deepCopy(actions);
      const punch = newActions.find(a => a.id === 'punch');
      if (punch) {
        punch.damage += 5;
      }
      return newActions;
    }
  },
  {
    id: 'cooldown_reduction_1',
    type: 'stat_boost',
    title: 'Faster Actions',
    description: 'Reduce the cooldown of all your actions by 10% (min 0.5s).',
    icon: '⚡️',
    apply: (actions: PlayerActionState[]): PlayerActionState[] => {
      return actions.map(action => ({
        ...action,
        cooldown: Math.max(0.5, action.cooldown * 0.9),
      }));
    }
  },
  {
    id: 'stub_toe_upgrade_1',
    type: 'stat_boost',
    title: 'Sharper Furniture',
    description: 'Increase damage of Stub Toe by 5 and reduce its cooldown by 0.5s.',
    icon: '🛋️',
    apply: (actions: PlayerActionState[]): PlayerActionState[] => {
        const newActions = deepCopy(actions);
        const stubToe = newActions.find(a => a.id === 'stub_toe');
        if (stubToe) {
            stubToe.damage += 5;
            stubToe.cooldown = Math.max(0.5, stubToe.cooldown - 0.5);
        }
        return newActions;
    }
  },
  {
    id: 'glass_bones',
    type: 'stat_boost',
    title: 'Glass Bones',
    description: 'All your actions deal 20% more damage.',
    icon: '🦴',
    apply: (actions: PlayerActionState[]): PlayerActionState[] => {
      return actions.map(action => ({
        ...action,
        damage: Math.round(action.damage * 1.2),
      }));
    }
  },
  {
    id: 'cooldown_reduction_2',
    type: 'stat_boost',
    title: 'Lightning Reflexes',
    description: 'Reduce cooldown of all actions by another 15%.',
    icon: '🏃',
    apply: (actions: PlayerActionState[]): PlayerActionState[] => {
        return actions.map(action => ({
            ...action,
            cooldown: Math.max(0.5, action.cooldown * 0.85),
        }));
    }
  },
];

export const HEALER_STUN_UPGRADE_POOL: HealerStunUpgrade[] = [
    {
        id: 'stun_duration_1',
        type: 'healer_stun_upgrade',
        title: 'Longer Stun',
        description: 'Increase the duration of your healer stun by 0.5 seconds.',
        stat: 'duration',
        amount: 0.5,
        icon: '⏳',
    },
    {
        id: 'instability_gain_1',
        type: 'healer_stun_upgrade',
        title: 'Volatile Actions',
        description: 'Your actions generate 25% more Instability.',
        stat: 'instability_gain',
        amount: 1.25, // Multiplier
        icon: '💥',
    }
];


export const CONSUMABLE_POOL: Omit<Consumable, 'instanceId'>[] = [
    {
        id: 'poison_vial',
        name: 'Vial of Poison',
        icon: '☠️',
        description: 'Drink this to deal 25 damage to yourself.',
        effect: { type: 'instant_damage', amount: 25 }
    },
    {
        id: 'cooldown_coffee',
        name: 'Cooldown Coffee',
        icon: '☕',
        description: 'Reduces all ability cooldowns by 3 seconds.',
        effect: { type: 'cooldown_reduction', amount: 3 }
    },
    {
        id: 'mystery_flask',
        name: 'Mystery Flask',
        icon: '❓',
        description: 'Who knows what this does? Deals between 5 and 50 damage.',
        effect: { type: 'instant_damage', amount: 0 } // Amount will be randomized on use
    }
];

// --- Level Generation ---

const HEALER_TEMPLATES = {
    Acolyte: (level: number): Healer => ({
        id: `acolyte-${level}-${Math.random()}`,
        name: 'Acolyte',
        icon: '🧑‍⚕️',
        abilities: [
            { id: 'weak_heal', type: 'direct_heal', name: 'Minor Heal', icon: '🩹', amount: 5 + level, cooldown: 5, timeToNextUse: 5 },
        ],
    }),
    Priest: (level: number): Healer => ({
        id: `priest-${level}-${Math.random()}`,
        name: 'Priest',
        icon: '✝️',
        abilities: [
            { id: 'heal', type: 'direct_heal', name: 'Heal', icon: '✨', amount: 10 + Math.floor(level * 1.5), cooldown: 6, timeToNextUse: 6 },
            { id: 'cleanse', type: 'cleanse', name: 'Purify', icon: '💧', cooldown: 15, timeToNextUse: 15 },
        ],
    }),
    Guardian: (level: number): Healer => ({
        id: `guardian-${level}-${Math.random()}`,
        name: 'Guardian',
        icon: '🛡️',
        abilities: [
            { id: 'shield', type: 'shield', name: 'Barrier', icon: '🔵', amount: 15 + level * 2, cooldown: 12, timeToNextUse: 12 },
            { id: 'regen', type: 'regeneration', name: 'Regrowth', icon: '🌿', amount: 12 + level, duration: 6, ticks: 6, cooldown: 18, timeToNextUse: 18 },
        ],
    }),
};


export const generateLevel = (levelNum: number): Level => {
    const characterMaxHp = 100 + (levelNum - 1) * 20;
    const timer = 60 + (levelNum - 1) * 5;
    
    const healers: Healer[] = [];
    
    // Level 1: Always one Acolyte
    healers.push(HEALER_TEMPLATES.Acolyte(levelNum));
    
    // Level 2+: Add a Priest
    if (levelNum >= 2) {
        healers.push(HEALER_TEMPLATES.Priest(levelNum));
    }
    
    // Level 4+: Add a Guardian
    if (levelNum >= 4) {
        healers.push(HEALER_TEMPLATES.Guardian(levelNum));
    }

    // Every 3 levels, add an extra Acolyte
    if (levelNum > 2 && levelNum % 3 === 0) {
        healers.push(HEALER_TEMPLATES.Acolyte(levelNum));
    }

    // Every 5 levels, the Priest gets stronger
    if (levelNum > 0 && levelNum % 5 === 0) {
        const priest = healers.find(h => h.name === 'Priest');
        if (priest) {
            priest.abilities = priest.abilities.map(a => ({...a, amount: (a.amount || 0) * 1.5, cooldown: a.cooldown * 0.9 }));
        }
    }

    return {
        level: levelNum,
        characterMaxHp,
        timer,
        healers,
    };
};