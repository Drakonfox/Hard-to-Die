// constants.ts
import { Difficulty, PlayerAction, Consumable } from './types';

export const TICK_RATE = 100; // ms per game tick
export const MAX_CONSUMABLES = 4; // Max number of unique consumable stacks

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
        cooldown: 3,
        instabilityGain: 5,
        minLevel: 1,
        baseCost: 25,
    },
    {
        id: 'headbutt',
        name: 'Testata sul Muro',
        description: 'Molto stupido, ma fa un male cane. Danno elevato, ma ti stordisce.',
        icon: '🧱',
        damage: 40,
        cooldown: 12,
        instabilityGain: 15,
        stunDuration: 2,
        minLevel: 1,
        baseCost: 100,
    },
    {
        id: 'voodoo_curse',
        name: 'Maledizione Voodoo Fai-da-te',
        description: 'Applica un doloroso effetto nel tempo. Aumenta molto l\'instabilità.',
        icon: '🔮',
        damage: 0,
        cooldown: 15,
        instabilityGain: 25,
        dot: {
            id: 'voodoo_curse_dot',
            damage: 5,
            duration: 10,
            icon: '🔮'
        },
        minLevel: 2,
        baseCost: 75,
    },
    {
        id: 'food_poisoning',
        name: 'Intossicazione Alimentare',
        description: 'Un potente e duraturo veleno. Lento ad agire, ma letale.',
        icon: '🤢',
        damage: 0,
        cooldown: 20,
        instabilityGain: 10,
        dot: {
            id: 'food_poisoning_dot',
            damage: 8,
            duration: 15,
            icon: '🤢'
        },
        minLevel: 2,
        baseCost: 120,
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
    }
];