// constants.ts
import { Difficulty, PlayerAction, Consumable, Rarity } from './types';

export const TICK_RATE = 100; // ms per game tick
export const MAX_CONSUMABLES = 4; // Max number of unique consumable stacks
export const MAX_PLAYER_ACTIONS = 4; // Max number of actions a player can have
export const MAX_INSTABILITY = 100;
export const INSTABILITY_STUN_DURATION = 5; // seconds
export const MAX_ACTION_LEVEL = 10;

export const RARITY_DATA: Record<Rarity, {
    name: string;
    color: string;
    textColor: string;
    chance: number;
}> = {
    'Common':   { name: 'Comune',     color: 'border-slate-400',  textColor: 'text-slate-300',  chance: 1.0 },
    'Uncommon': { name: 'Non Comune', color: 'border-green-500',  textColor: 'text-green-400',  chance: 0.6 },
    'Rare':     { name: 'Raro',       color: 'border-blue-500',   textColor: 'text-blue-400',   chance: 0.3 },
    'Epic':     { name: 'Epico',      color: 'border-purple-600', textColor: 'text-purple-500', chance: 0.1 },
};


export const DIFFICULTY_MODIFIERS: Record<Difficulty, { description: string; healerCdModifier: number; playerDamageModifier: number }> = {
  'Easy': {
    description: "A gentle introduction to the art of dying. Healers are a bit slow.",
    healerCdModifier: 1.25,
    playerDamageModifier: 1.1,
  },
  'Medium': {
    description: "A balanced challenge. Healers are competent, but so are you.",
    healerCdModifier: 1.0,
    playerDamageModifier: 1.0,
  },
  'Hard': {
    description: "You're in for a world of hurt. Or, a world of not-hurt, which is worse. Good luck.",
    healerCdModifier: 0.8,
    playerDamageModifier: 0.9,
  }
};

export const ALL_PLAYER_ACTIONS: PlayerAction[] = [
    {
        id: 'slap',
        name: 'Tirarsi uno schiaffo',
        description: 'Un gesto patetico ma efficace. Danno basso, cooldown rapido.',
        icon: '👋',
        damage: 10,
        cooldown: 1,
        instabilityGain: 5,
        minLevel: 1,
        baseCost: 25,
        rarity: 'Common',
    },
    {
        id: 'headbutt',
        name: 'Testata sul Muro',
        description: 'Molto stupido, ma fa un male cane. Danno elevato, ma ti stordisce leggermente.',
        icon: '🧱',
        damage: 45,
        cooldown: 11,
        instabilityGain: 15,
        stunDuration: 1.8,
        minLevel: 1,
        baseCost: 110,
        rarity: 'Uncommon',
    },
    {
        id: 'food_poisoning',
        name: 'Intossicazione Alimentare',
        description: 'Un potente e duraturo veleno. Lento ad agire, ma letale.',
        icon: '🤢',
        damage: 0,
        cooldown: 18,
        instabilityGain: 10,
        dot: {
            id: 'food_poisoning_dot',
            damage: 8,
            duration: 15,
            icon: '🤢'
        },
        minLevel: 2,
        baseCost: 120,
        rarity: 'Uncommon',
    },
    {
        id: 'voodoo_curse',
        name: 'Maledizione Voodoo Fai-da-te',
        description: 'Applica un doloroso effetto nel tempo. Aumenta molto l\'instabilità.',
        icon: '🔮',
        damage: 0,
        cooldown: 18,
        instabilityGain: 20,
        dot: {
            id: 'voodoo_curse_dot',
            damage: 10,
            duration: 12,
            icon: '🔮'
        },
        minLevel: 2,
        baseCost: 180,
        rarity: 'Rare',
    },
    {
        id: 'uncontrolled_rage',
        name: 'Rabbia Incontrollata',
        description: 'Scatena una furia distruttiva, infliggendoti danni massicci ma aumentando l\'instabilità a dismisura. Costoso, ma spettacolare.',
        icon: '😡',
        damage: 85,
        cooldown: 30,
        instabilityGain: 40,
        minLevel: 3,
        baseCost: 300,
        rarity: 'Epic',
    },
    {
        id: 'painful_meditation',
        name: 'Meditazione Dolorosa',
        description: 'Focalizza il tuo dolore. Infligge più danni più bassa è la tua salute.',
        icon: '🧘',
        damage: 10, // Base damage
        cooldown: 20,
        instabilityGain: 12,
        damageScalingOnMissingHp: 0.5, // 0.5 damage per 1 missing HP
        minLevel: 3,
        baseCost: 220,
        rarity: 'Rare',
    },
    {
        id: 'short_circuit',
        name: 'Cortocircuito Mentale',
        description: 'Un\'ondata di energia caotica che ti danneggia e ha il 30% di probabilità di stordire un guaritore a caso per 3s.',
        icon: '⚡️',
        damage: 30,
        cooldown: 15,
        instabilityGain: 18,
        stunChance: 0.3,
        healerStunDuration: 3,
        minLevel: 4,
        baseCost: 280,
        rarity: 'Rare',
    },
    {
        id: 'blood_pact',
        name: 'Patto di Sangue',
        description: 'Un rituale oscuro che infligge danni enormi, ma ti lascia sanguinante, subendo danni nel tempo.',
        icon: '🩸',
        damage: 70,
        cooldown: 35,
        instabilityGain: 35,
        dot: {
            id: 'blood_pact_dot',
            damage: 12,
            duration: 10,
            icon: '🩸'
        },
        minLevel: 5,
        baseCost: 450,
        rarity: 'Epic',
    }
];

export const ALL_CONSUMABLES: Omit<Consumable, 'quantity'>[] = [
    {
        id: 'painful_onion',
        name: 'Cipolla Dolorosa',
        icon: '🧅',
        description: 'Le lacrime non sono solo per la tristezza. Stordisce tutti i guaritori per 2 secondi.',
        effect: { type: 'STUN_ALL_HEALERS', duration: 2 }
    },
    {
        id: 'corrupted_coffee',
        name: 'Caffè Corrotto',
        icon: '☕',
        description: 'Energizzante e... velenoso. Ti infligge un potente danno nel tempo.',
        effect: {
            type: 'APPLY_SELF_DOT',
            dot: {
                id: 'coffee_dot',
                damage: 10,
                duration: 8,
                icon: '☕'
            }
        }
    },
    {
        id: 'weakening_potion',
        name: 'Pozione Indebolente',
        icon: '🧪',
        description: 'Una mistura vile che riduce tutte le cure ricevute del 50% per 10 secondi.',
        effect: { type: 'REDUCE_HEALING', reductionPercent: 0.5, duration: 10 }
    },
    {
        id: 'shrapnel_bomb',
        name: 'Bomba a Frammentazione',
        icon: '💣',
        description: 'Esplode in una pioggia di schegge. 15 danni istantanei e un breve sanguinamento.',
        effect: {
            type: 'DAMAGE_AND_DOT',
            damage: 15,
            dot: {
                id: 'shrapnel_dot',
                damage: 6,
                duration: 5,
                icon: '🩸'
            }
        }
    }
];