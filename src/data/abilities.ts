import {
  Ability,
  AbilityRarity,
  AbilityName,
  EffectKey,
} from '../types/game';

// Complete ability definitions with all rarities.
// Abilities are effects-only — no stat boosts. Stats come from training and equipment.
// All additional effects scale linearly with ability level (value × level).
export const ABILITY_DEFINITIONS: Record<string, Ability> = {
  // ==================== COMMON ABILITIES ====================
  // Common = single focused bonus on one shot type or positioning dimension.
  // No training bonuses or key moment effects at this tier.

  [AbilityName.HEAVY_HITTER]: {
    name: AbilityName.HEAVY_HITTER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.PACE]: 7,
      },
    },
    description:
      'You hit the ball so hard that opponents can hear it coming. Your groundstrokes land like cannonballs.',
    effects: 'Bonus quality on all power shots.',
  },

  [AbilityName.SPIN_MASTER]: {
    name: AbilityName.SPIN_MASTER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.SIDE_SPIN]: 7,
      },
    },
    description:
      'You can put an incredible amount of spin on the ball, making it bounce unpredictably and sit up awkwardly for opponents.',
    effects: 'Bonus quality on spin shots.',
  },

  [AbilityName.SOFT_HANDS]: {
    name: AbilityName.SOFT_HANDS,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.TOUCH]: 7,
      },
    },
    description:
      "Your touch at the net is pure art. Drop shots, slices, and angles barely clear the net. Opponents can only watch.",
    effects: 'Bonus quality on drop shots and volleys.',
  },

  [AbilityName.OVERHEAD_SMASH]: {
    name: AbilityName.OVERHEAD_SMASH,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.SMASH_POWER]: 7,
      },
    },
    description:
      'You put away overheads with ruthless efficiency. Lobs are not a safe play against you.',
    effects: 'Bonus quality on overhead shots.',
  },

  [AbilityName.RANGY_RETURN]: {
    name: AbilityName.RANGY_RETURN,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.REACH]: 7,
      },
    },
    description:
      'Your exceptional reach lets you get to balls others would call winners. Nothing is truly out of range.',
    effects: 'Reduces difficulty penalty when stretched out of position.',
  },

  [AbilityName.SLIDER]: {
    name: AbilityName.SLIDER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 5,
        [EffectKey.RECOVERY_SPEED]: 2,
      },
    },
    description:
      "You move around the court like you're on ice skates. Your footwork is effortless and your opponents can't open up the court.",
    effects: 'Improved court coverage and position recovery speed.',
  },

  [AbilityName.BASELINER]: {
    name: AbilityName.BASELINER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.RALLY_MOMENTUM]: 6,
      },
    },
    description:
      "You've mastered the art of grinding from the baseline. Long rallies are your territory — the longer it goes, the more the point is yours.",
    effects: 'Bonus shot quality when rally length exceeds 4 shots.',
  },

  [AbilityName.NETCRASHER]: {
    name: AbilityName.NETCRASHER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.TOUCH]: 3,
        [EffectKey.PACE]: 2,
        [EffectKey.RECOVERY_SPEED]: 3,
      },
    },
    description:
      "You charge the net at every opportunity. Your opponents never know when you'll suddenly materialize to finish the point.",
    effects: 'Small bonuses to touch, pace, and recovery speed — built for net-rushing.',
  },

  [AbilityName.NATIONAL_ICON]: {
    name: AbilityName.NATIONAL_ICON,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.EVENT_TRIGGER_BONUS]: 6,
        [EffectKey.MOOD_GAIN_BONUS]: 3,
        [EffectKey.RELATIONSHIP_GAIN_BONUS]: 3,
      },
    },
    description:
      'You are popular among fans and players alike. The perks of fame follow you everywhere you go.',
    effects: 'More frequent special events. Bonus mood and relationship gains.',
  },

  // ==================== UNCOMMON ABILITIES ====================
  // Uncommon = broader effects, energy management, or key moment advantage.
  // These change how you play across a match, not just a single shot type.

  [AbilityName.SPEED_DEMON]: {
    name: AbilityName.SPEED_DEMON,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 7,
        [EffectKey.RECOVERY_SPEED]: 4,
        [EffectKey.ENERGY_COST_REDUCTION]: 2,
      },
    },
    description:
      "You're so fast the cameras can hardly keep up. You don't just get to balls — you arrive there early.",
    effects: 'Greatly improved court coverage and position recovery. Reduces energy cost of activities.',
  },

  [AbilityName.IRON_LEGS]: {
    name: AbilityName.IRON_LEGS,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.ENERGY_COST_REDUCTION]: 6,
        [EffectKey.RECOVERY_SPEED]: 3,
      },
    },
    description:
      "Your legs never seem to give out. Long five-setters are where you truly shine — opponents crack before you do.",
    effects: 'Significantly reduces energy cost of all activities. Faster position recovery between shots.',
  },

  [AbilityName.SERVE_CANNON]: {
    name: AbilityName.SERVE_CANNON,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.SMASH_POWER]: 6,
        [EffectKey.PACE]: 4,
      },
    },
    description:
      "Your serve is a weapon. First balls land like missiles, second serves still hurt, and overheads end points instantly.",
    effects: 'Bonus quality on overhead shots and power shots. Serve-and-overhead game package.',
  },

  [AbilityName.CLUTCH]: {
    name: AbilityName.CLUTCH,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.CLUTCH_PERFORMANCE]: 6,
      },
    },
    description:
      "When the pressure is on, you rise. Break points, tiebreaks, match points — you've been here before and you know how to handle it.",
    effects: '+6% win probability at key moments.',
  },

  // ==================== RARE ABILITIES ====================
  // Rare = mastery of a psychological or tactical dimension. Each rare ability
  // has a distinct primary focus — no two share the same lead effect.

  [AbilityName.MENTAL_FORTITUDE]: {
    name: AbilityName.MENTAL_FORTITUDE,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.MENTAL_RESILIENCE]: 6,
        [EffectKey.MOOD_GAIN_BONUS]: 5,
        [EffectKey.TRAINING_TIER_BONUS]: 1,
      },
    },
    description:
      'Your mental game is unbreakable. Pressure rolls off you, your mood stays high, and your training sessions hit harder.',
    effects: 'Reduces pressure penalties on shot quality. Bonus mood gains. Improves training session tier.',
  },

  [AbilityName.PRESSURE_COOKER]: {
    name: AbilityName.PRESSURE_COOKER,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.PERFECT_TIMING]: 7,
        [EffectKey.MENTAL_RESILIENCE]: 4,
      },
    },
    description:
      "Pressure is your oxygen. The tighter the situation, the more precise you become. Opponents expect you to crack — you never do.",
    effects: 'Recovers shot quality lost to pressure. Reduces pressure penalties.',
  },

  [AbilityName.ALL_COURT_MAESTRO]: {
    name: AbilityName.ALL_COURT_MAESTRO,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 8,
        [EffectKey.REACH]: 6,
        [EffectKey.RECOVERY_SPEED]: 4,
      },
    },
    description:
      "You read the court like a chess grandmaster. Every ball is reachable, every position is recoverable, every corner covered.",
    effects: 'Major court coverage, extended reach, and fast position recovery. Nothing gets past you.',
  },

  // ==================== LEGENDARY ABILITIES ====================
  // Legendary = transcendent, multi-dimensional mastery. Game-defining effects.

  [AbilityName.LEGENDARY_FOCUS]: {
    name: AbilityName.LEGENDARY_FOCUS,
    level: 1,
    rarity: AbilityRarity.LEGENDARY,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.CLUTCH_PERFORMANCE]: 8,
        [EffectKey.PERFECT_TIMING]: 5,
        [EffectKey.UNSTOPPABLE_MOMENTUM]: 3,
        [EffectKey.CHAMPION_AURA]: 2,
        [EffectKey.TRAINING_TIER_BONUS]: 1,
        [EffectKey.ABILITY_CHANCE_BONUS]: 10,
      },
    },
    description:
      "You have the focus of a champion. When you're in the zone, nothing can stop you. Key moments, momentum, training — everything elevates.",
    effects: '+8% key moment win probability. Timing precision under pressure. Amplified winning momentum. Training and ability bonuses.',
  },

  [AbilityName.APEX_PREDATOR]: {
    name: AbilityName.APEX_PREDATOR,
    level: 1,
    rarity: AbilityRarity.LEGENDARY,
    shopAvailable: false,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.PACE]: 6,
        [EffectKey.SIDE_SPIN]: 4,
        [EffectKey.TOUCH]: 4,
        [EffectKey.COURT_COVERAGE]: 5,
        [EffectKey.UNSTOPPABLE_MOMENTUM]: 4,
        [EffectKey.RALLY_MOMENTUM]: 5,
      },
    },
    description:
      "You are the complete player. Every shot is a threat, every defensive position is temporary. Opponents see no way out.",
    effects: 'Bonuses to power shots, spin, finesse, and court coverage. Amplified winning momentum and rally dominance.',
  },
};
