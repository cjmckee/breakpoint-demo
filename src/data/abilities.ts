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
  [AbilityName.BASELINER]: {
    name: AbilityName.BASELINER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.RALLY_MOMENTUM]: 4,
        [EffectKey.TRAINING_TIER_BONUS]: 1,
      },
    },
    description:
      "You've mastered the art of staying at the baseline. Groundstrokes are your bread and butter, and you can rally all day long.",
    effects:
      'Gains bonus shot quality on long rallies (5+ shots). Improves training session quality.',
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
        [EffectKey.RECOVERY_SPEED]: 1,
      },
    },
    description:
      "You love charging the net like a maniac. Your opponents never know when you'll suddenly appear at the net to finish the point.",
    effects: 'Bonus quality on volleys and drop shots. Extra pace on power shots. Faster court position recovery.',
  },

  [AbilityName.SLIDER]: {
    name: AbilityName.SLIDER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 3,
        [EffectKey.REACH]: 2,
      },
    },
    description:
      "You move around the court like you're on ice skates. Your footwork is so smooth, opponents think you're teleporting.",
    effects: 'Improved court coverage and position recovery. Extended reach reduces difficulty when out of position.',
  },

  [AbilityName.CLUTCH]: {
    name: AbilityName.CLUTCH,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.CLUTCH_PERFORMANCE]: 5,
        [EffectKey.TRAINING_TIER_BONUS]: 1,
      },
    },
    description:
      "When the pressure is on, you thrive. You actually play better when you're down match point.",
    effects: '+5% win probability at key moments. Improves training session quality.',
  },

  [AbilityName.HEAVY_HITTER]: {
    name: AbilityName.HEAVY_HITTER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.PACE]: 5,
      },
    },
    description:
      'You hit the ball so hard that opponents can hear it coming. Your forehand is like a cannon shot.',
    effects: 'Significant bonus quality on power shots.',
  },

  [AbilityName.OVERHEAD_SMASH]: {
    name: AbilityName.OVERHEAD_SMASH,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.SMASH_POWER]: 6,
      },
    },
    description:
      'You have a powerful overhead smash that can finish points in an instant.',
    effects: 'Major bonus quality on overhead shots.',
  },

  [AbilityName.RANGY_RETURN]: {
    name: AbilityName.RANGY_RETURN,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.REACH]: 5,
      },
    },
    description:
      'Your exceptional reach allows you to return even the most difficult shots.',
    effects: 'Significantly reduces difficulty when stretched out of position.',
  },

  [AbilityName.SPIN_MASTER]: {
    name: AbilityName.SPIN_MASTER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.SIDE_SPIN]: 6,
      },
    },
    description:
      'You can put an incredible amount of spin on the ball, making it difficult for opponents to predict its trajectory.',
    effects: 'Greatly enhances spin shot effectiveness.',
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
      'You are popular among fans and players alike. You get some extra free perks.',
    effects: 'More frequent special events. Bonus mood and relationship gains.',
  },

  [AbilityName.SOFT_HANDS]: {
    name: AbilityName.SOFT_HANDS,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.TOUCH]: 6,
      },
    },
    description:
      "Your touch at the net is pure art. Drop shots, slices, and angles barely clear the net. Opponents can only watch.",
    effects: 'Major bonus quality on drop shots and volleys.',
  },

  // ==================== UNCOMMON ABILITIES ====================
  [AbilityName.SPEED_DEMON]: {
    name: AbilityName.SPEED_DEMON,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 5,
        [EffectKey.RECOVERY_SPEED]: 3,
        [EffectKey.ENERGY_COST_REDUCTION]: 2,
      },
    },
    description:
      "You're so fast the cameras can hardly keep up. Your opponents are seeing ghosts on the court.",
    effects: 'Greatly improved court coverage and recovery speed. Reduces energy cost of activities.',
  },

  [AbilityName.IRON_LEGS]: {
    name: AbilityName.IRON_LEGS,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.ENERGY_COST_REDUCTION]: 4,
        [EffectKey.RECOVERY_SPEED]: 2,
        [EffectKey.MOOD_GAIN_BONUS]: 3,
      },
    },
    description:
      "Your legs never seem to give out. Long five-setters are where you truly shine — opponents crack before you do.",
    effects: 'Significantly reduces energy cost of all activities. Faster position recovery. Bonus mood gains.',
  },

  [AbilityName.SERVE_CANNON]: {
    name: AbilityName.SERVE_CANNON,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.PACE]: 6,
        [EffectKey.SMASH_POWER]: 3,
      },
    },
    description:
      "Your serve is a weapon that opponents dread. First balls land like missiles, and second serves still have enough pop to hurt.",
    effects: 'Major bonus on power shots. Bonus on overhead smashes.',
  },

  // ==================== RARE ABILITIES ====================
  [AbilityName.MENTAL_FORTITUDE]: {
    name: AbilityName.MENTAL_FORTITUDE,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.MENTAL_RESILIENCE]: 5,
        [EffectKey.CLUTCH_PERFORMANCE]: 5,
        [EffectKey.MOOD_GAIN_BONUS]: 4,
        [EffectKey.PERFECT_TIMING]: 3,
      },
    },
    description:
      'Your mental game is unbreakable. You can handle any pressure situation and always find a way to win.',
    effects: '+5% key moment win probability. Reduces pressure penalties. Recovers quality lost to pressure. Bonus mood gains.',
  },

  [AbilityName.ALL_COURT_MAESTRO]: {
    name: AbilityName.ALL_COURT_MAESTRO,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 6,
        [EffectKey.REACH]: 5,
        [EffectKey.RECOVERY_SPEED]: 3,
      },
    },
    description:
      "You read the court like a chess grandmaster. Every ball is reachable, every position recoverable.",
    effects: 'Greatly improves court coverage, extended reach, and position recovery speed.',
  },

  [AbilityName.PRESSURE_COOKER]: {
    name: AbilityName.PRESSURE_COOKER,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.CLUTCH_PERFORMANCE]: 8,
        [EffectKey.MENTAL_RESILIENCE]: 4,
        [EffectKey.PERFECT_TIMING]: 4,
      },
    },
    description:
      "Pressure is your oxygen. At 5-5 in the third, you become a different player — calm, precise, lethal.",
    effects: '+8% key moment win probability. Strong pressure resistance. Significantly recovers quality lost to pressure.',
  },

  // ==================== LEGENDARY ABILITIES ====================
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
      "You have the focus of a champion. When you're in the zone, nothing can stop you from achieving greatness.",
    effects: '+8% key moment win probability. Timing precision under pressure. Amplified winning momentum. Training bonuses.',
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
    effects: 'Major bonuses to power shots, spin, finesse, and court coverage. Amplified winning momentum and rally dominance.',
  },
};
