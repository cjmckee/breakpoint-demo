import {
  Ability,
  AbilityRarity,
  AbilityName,
  EffectKey,
} from '../types/game';

// Complete ability definitions with all rarities.
// Abilities are effects-only — no stat boosts. Stats come from training and equipment.
// All additional effects scale linearly with ability level (value × level).
//
// Design principles:
//   Common    — single focused shot or positioning bonus
//   Uncommon  — broader effects, energy management, key moment boost
//   Rare      — psychological/training mastery; single powerful effect or 2-effect package
//   Legendary — multi-dimensional, game-defining
export const ABILITY_DEFINITIONS: Record<string, Ability> = {
  // ==================== COMMON ABILITIES ====================

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
      'You can put incredible spin on the ball, making it bounce unpredictably and sit up awkwardly.',
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
      'You put away overheads with ruthless efficiency. Opponents learn quickly not to lob you.',
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
      "You've mastered the art of grinding from the baseline. The longer the rally, the more the point is yours.",
    effects: 'Bonus shot quality when rally length exceeds 4 shots.',
  },

  [AbilityName.SLIDER]: {
    name: AbilityName.SLIDER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 6,
      },
    },
    description:
      "You move around the court like you're on ice skates. Your footwork is effortless — opponents can't open up the court.",
    effects: 'Improved court coverage.',
  },

  [AbilityName.NETCRASHER]: {
    name: AbilityName.NETCRASHER,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.NET_GAME]: 5,
        [EffectKey.TOUCH]: 2,
      },
    },
    description:
      "You charge the net at every opportunity. Once you're up there, you're a completely different threat.",
    effects: 'Bonus quality on all shots when positioned at the net. Minor touch bonus.',
  },

  [AbilityName.CROWD_FAVORITE]: {
    name: AbilityName.CROWD_FAVORITE,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.MOOD_GAIN_BONUS]: 5,
        [EffectKey.RELATIONSHIP_GAIN_BONUS]: 3,
      },
    },
    description:
      'The crowd loves you and the other players respect you. You draw energy from every interaction.',
    effects: 'Bonus mood gains. Bonus relationship gains.',
  },

  [AbilityName.SPOTLIGHT]: {
    name: AbilityName.SPOTLIGHT,
    level: 1,
    rarity: AbilityRarity.COMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.EVENT_TRIGGER_BONUS]: 7,
      },
    },
    description:
      "Wherever you go, something interesting happens. Sponsors, media, fans — life on tour has a way of finding you.",
    effects: 'More frequent special events.',
  },

  // ==================== UNCOMMON ABILITIES ====================

  [AbilityName.SPEED_DEMON]: {
    name: AbilityName.SPEED_DEMON,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.COURT_COVERAGE]: 7,
        [EffectKey.RECOVERY_SPEED]: 4,
      },
    },
    description:
      "You're so fast the cameras can barely keep up. You don't just get to balls — you arrive early.",
    effects: 'Greatly improved court coverage. Faster position recovery between shots.',
  },

  [AbilityName.IRON_LEGS]: {
    name: AbilityName.IRON_LEGS,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.ENERGY_COST_REDUCTION]: 6,
        [EffectKey.RECOVERY_SPEED]: 2,
      },
    },
    description:
      "Your legs never seem to give out. Long five-setters are where you truly shine — opponents crack before you do.",
    effects: 'Significantly reduces energy cost of all activities. Minor position recovery bonus.',
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
      "Your serve is a weapon. First balls land like missiles, second serves still hurt, and overheads end points clean.",
    effects: 'Bonus quality on overhead shots and power shots.',
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
      "When the pressure is on, you rise. Break points, tiebreaks, match points — you've been here before.",
    effects: '+6% win probability at key moments.',
  },

  [AbilityName.QUICK_RECOVERY]: {
    name: AbilityName.QUICK_RECOVERY,
    level: 1,
    rarity: AbilityRarity.UNCOMMON,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.ENERGY_GAIN_BONUS]: 6,
      },
    },
    description:
      "You bounce back faster than anyone. Rest days feel like twice as long for you — you show up recharged and ready.",
    effects: 'Gain more energy from rest and recovery activities.',
  },


  // ==================== RARE ABILITIES ====================

  [AbilityName.MENTAL_FORTITUDE]: {
    name: AbilityName.MENTAL_FORTITUDE,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.MENTAL_RESILIENCE]: 7,
      },
    },
    description:
      'Your mental game is unbreakable. Pressure rolls off you. Opponents watch their psychological tactics fail one by one.',
    effects: 'Significantly reduces pressure penalties on shot quality.',
  },

  [AbilityName.PRESSURE_COOKER]: {
    name: AbilityName.PRESSURE_COOKER,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.PERFECT_TIMING]: 7,
        [EffectKey.MENTAL_RESILIENCE]: 3,
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
        [EffectKey.REACH]: 5,
      },
    },
    description:
      "You read the court like a chess grandmaster. Every ball is reachable, every corner covered.",
    effects: 'Major court coverage improvement. Extended reach reduces difficulty when stretched.',
  },

  [AbilityName.IRON_WILL]: {
    name: AbilityName.IRON_WILL,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.FOCUS_DURATION]: 2,
        [EffectKey.ENERGY_COST_REDUCTION]: 1,
      },
    },
    description:
      "You are built for the long haul. Three-hour matches, five-setters, back-to-back days — you show up the same every time.",
    effects: 'Reduces fatigue accumulation during matches. Minor energy cost reduction.',
  },

  [AbilityName.GRINDER]: {
    name: AbilityName.GRINDER,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.EXPERIENCE_GAIN_BONUS]: 0.10,
      },
    },
    description:
      "Every match teaches you more than it teaches your opponent. Win or lose, you walk away sharper.",
    effects: '+10% experience gained from matches.',
  },

  [AbilityName.DEDICATED]: {
    name: AbilityName.DEDICATED,
    level: 1,
    rarity: AbilityRarity.RARE,
    modifiers: {
      statBoosts: {},
      additional: {
        [EffectKey.TRAINING_TIER_BONUS]: 1,
        [EffectKey.ABILITY_CHANCE_BONUS]: 5,
      },
    },
    description:
      "Training is your religion. You consistently get more out of every practice session — and occasionally unlock something special.",
    effects: 'Upgrades training session tier. Increased chance to gain an ability from diamond sessions.',
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
      "You have the focus of a champion. When you're in the zone, nothing can stop you. Every dimension of your game elevates.",
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
    effects: 'Bonuses to power, spin, finesse, and court coverage. Amplified winning momentum and rally dominance.',
  },
};
