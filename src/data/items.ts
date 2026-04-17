/**
 * Item Database
 * All available items in the game
 */

import type { Item } from '../types/items';

// ============================================================================
// EQUIPMENT - RACQUETS
// ============================================================================

export const BEGINNER_RACQUET: Item = {
  id: 'beginner_racquet',
  name: 'Beginner Racquet',
  description: 'A basic racquet for learning the fundamentals.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      serve: 2,
      forehand: 2,
    },
  },
};

export const PRO_RACQUET: Item = {
  id: 'pro_racquet',
  name: 'Pro Racquet',
  description: 'A professional-grade racquet with excellent balance and control.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      serve: 5,
      forehand: 3,
      backhand: 3,
    },
  },
};

export const POWER_RACQUET: Item = {
  id: 'power_racquet',
  name: 'Power Racquet',
  description: 'A heavy racquet designed for maximum power on every shot.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      serve: 8,
      strength: 5,
    },
  },
};

export const CONTROL_RACQUET: Item = {
  id: 'control_racquet',
  name: 'Control Racquet',
  description: 'Precision engineering for surgical shot placement.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      placement: 6,
      spin: 4,
      forehand: 2,
      backhand: 2,
    },
  },
};

export const SPIN_RACQUET: Item = {
  id: 'spin_racquet',
  name: 'Spin Master Racquet',
  description: 'An open string pattern racquet that generates incredible spin on every shot.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      spin: 8,
      forehand: 3,
      slice: 3,
    },
  },
};

export const ALLROUND_RACQUET: Item = {
  id: 'allround_racquet',
  name: 'All-Court Racquet',
  description: 'A versatile racquet that performs well in every situation.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      serve: 3,
      forehand: 3,
      backhand: 3,
      volley: 3,
    },
  },
};

// ============================================================================
// EQUIPMENT - SHOES
// ============================================================================

export const RUNNING_SHOES: Item = {
  id: 'running_shoes',
  name: 'Running Shoes',
  description: 'Lightweight shoes for quick movement around the court.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      speed: 3,
      agility: 2,
    },
  },
};

export const COURT_SHOES: Item = {
  id: 'court_shoes',
  name: 'Court Shoes',
  description: 'Professional tennis shoes with superior grip and stability.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      speed: 5,
      agility: 5,
      stamina: 2,
    },
  },
};

export const CLAY_COURT_SHOES: Item = {
  id: 'clay_court_shoes',
  name: 'Clay Court Specialists',
  description: 'Shoes optimized for sliding on clay surfaces.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      speed: 4,
      agility: 6,
      defensive: 3,
    },
  },
};

export const LIGHTWEIGHT_TRAINERS: Item = {
  id: 'lightweight_trainers',
  name: 'Lightweight Trainers',
  description: 'Ultra-light shoes that maximize speed at the cost of stability.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      speed: 8,
      agility: 3,
    },
    additional: {
      energy_cost_reduction: 2,
    },
  },
};

export const GRASS_COURT_SHOES: Item = {
  id: 'grass_court_shoes',
  name: 'Grass Court Shoes',
  description: 'Shoes with pimpled soles designed for grass court traction.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      speed: 5,
      agility: 4,
      volley: 3,
    },
  },
};

// ============================================================================
// EQUIPMENT - OUTFITS
// ============================================================================

export const PRACTICE_OUTFIT: Item = {
  id: 'practice_outfit',
  name: 'Practice Outfit',
  description: 'Comfortable clothing for training sessions.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      stamina: 2,
      recovery: 1,
    },
  },
};

export const TOURNAMENT_OUTFIT: Item = {
  id: 'tournament_outfit',
  name: 'Tournament Outfit',
  description: 'Professional attire that boosts confidence and performance.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      stamina: 4,
      focus: 3,
      recovery: 2,
    },
  },
};

export const COMPRESSION_OUTFIT: Item = {
  id: 'compression_outfit',
  name: 'Compression Outfit',
  description: 'Tight-fitting gear that enhances circulation and endurance.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      stamina: 6,
      recovery: 4,
      strength: 2,
    },
    additional: {
      energy_cost_reduction: 3,
    },
  },
};

export const RETRO_OUTFIT: Item = {
  id: 'retro_outfit',
  name: 'Retro Tennis Whites',
  description: 'Classic all-white tennis attire. Old school cool with a confidence boost.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      focus: 4,
      serve: 2,
      volley: 3,
    },
    additional: {
      mood_gain_bonus: 2,
    },
  },
};

export const SPONSOR_OUTFIT: Item = {
  id: 'sponsor_outfit',
  name: 'Sponsored Kit',
  description: 'Branded performance gear from a major sponsor. Looks great, plays better.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      stamina: 5,
      strength: 3,
      focus: 3,
    },
    additional: {
      training_stat_multiplier: 0.1,
    },
  },
};

export const SPACE_SUIT: Item = {
  id: 'space_suit',
  name: 'Space Suit',
  description: 'You found this left over after your match with Cosmo Comet. It is a bit bulky though.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      stamina: 3,
      offensive: 2,
      speed: 1,
      spin: 3,
      anticipation: 2
    }
  }
}

// ============================================================================
// EQUIPMENT - HATS
// ============================================================================

export const VISOR: Item = {
  id: 'visor',
  name: 'Visor',
  description: 'A simple visor to keep the sun out of your eyes.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      focus: 2,
    },
  },
};

export const HEADBAND: Item = {
  id: 'headband',
  name: 'Headband',
  description: 'An iconic headband that helps you stay in the zone.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      focus: 3,
      anticipation: 2,
    },
    additional: {
      training_stat_multiplier: 0.1,
    },
  },
};

export const CAP: Item = {
  id: 'cap',
  name: 'Baseball Cap',
  description: 'A stylish cap with a slight performance boost.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      focus: 2,
      offensive: 1,
    },
  },
};

export const LUCKY_HAT: Item = {
  id: 'lucky_hat',
  name: 'Lucky Hat',
  description: 'An old, worn hat that seems to bring good fortune.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      focus: 4,
      anticipation: 3,
      shotVariety: 2,
    },
  },
};

export const SWEATBAND: Item = {
  id: 'sweatband',
  name: 'Sweatband',
  description: 'A thick wristband-style headband that keeps sweat out of your eyes.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      stamina: 3,
      focus: 2,
      recovery: 2,
    },
  },
};

export const BANDANA: Item = {
  id: 'bandana',
  name: 'Bandana',
  description: 'A pirate-style bandana that channels raw intensity.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      offensive: 3,
      strength: 2,
      serve: 2,
    },
  },
};

export const CHEF_HAT: Item = {
  id: 'chef_hat',
  name: 'Chef\'s Hat',
  description: 'One of the players from Dobry Pomidor left this behind. You put it on and instantly feel more confident with your slices.',
  type: 'equipment',
  equipmentSlot: 'hat',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      slice: 5,
      spin: 2,
      volley: 2
    }
  }
}

// ============================================================================
// CONSUMABLES - INSTANT
// ============================================================================

export const ENERGY_DRINK: Item = {
  id: 'energy_drink',
  name: 'Energy Drink',
  description: 'A refreshing drink that instantly restores energy.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 30,
    },
  },
};

export const SPORTS_DRINK: Item = {
  id: 'sports_drink',
  name: 'Sports Drink',
  description: 'A hydrating drink that restores energy and lifts your spirits.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 20,
      moodChange: 5,
    },
  },
};

export const RECOVERY_SHAKE: Item = {
  id: 'recovery_shake',
  name: 'Recovery Shake',
  description: 'A protein-packed shake that aids recovery and improves mood.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 15,
      moodChange: 10,
    },
  },
};

export const SUPER_ENERGY_GEL: Item = {
  id: 'super_energy_gel',
  name: 'Super Energy Gel',
  description: 'An intense energy boost for when you need it most.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 50,
    },
  },
};

export const GRANDMAS_LUCKY_COOKIES: Item = {
  id: 'grandmas_lucky_cookies',
  name: "Grandma's Lucky Cookies",
  description: 'A tin of homemade cookies. Somehow they taste exactly like confidence.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 20,
      moodChange: 15,
    },
  },
};

export const SKI_PASS: Item = {
  id: 'ski_pass',
  name: 'Aspen Slopes Ski Pass',
  description: 'A ski pass someone left from the Aspen Slopes match. It\'s still valid for one more trip.',
  type: 'consumable',
  shopAvailable: false,
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 20,
      moodChange: 25,
    },
  }
}

// ============================================================================
// CONSUMABLES - NEXT ACTIVITY
// ============================================================================

export const FOCUS_PILL: Item = {
  id: 'focus_pill',
  name: 'Focus Pill',
  description: 'Enhances mental clarity for your next training session or match.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        focus: 10,
        anticipation: 5,
      },
    },
  },
};

export const PERFORMANCE_ENHANCER: Item = {
  id: 'performance_enhancer',
  name: 'Performance Enhancer',
  description: 'A legal supplement that boosts all technical skills temporarily.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        serve: 5,
        forehand: 5,
        backhand: 5,
        volley: 5,
      },
    },
  },
};

export const STAMINA_BOOST: Item = {
  id: 'stamina_boost',
  name: 'Stamina Boost',
  description: 'Increases endurance and recovery for the next activity.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        stamina: 10,
        recovery: 5,
      },
    },
  },
};

export const POWER_SUPPLEMENT: Item = {
  id: 'power_supplement',
  name: 'Power Supplement',
  description: 'Temporarily increases strength and power on shots.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        strength: 8,
        serve: 4,
      },
    },
  },
};

export const SPEED_BOOSTER: Item = {
  id: 'speed_booster',
  name: 'Speed Booster',
  description: 'Enhances court coverage and movement for your next match.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        speed: 10,
        agility: 8,
      },
    },
  },
};

export const CONFIDENCE_TAPE: Item = {
  id: 'confidence_tape',
  name: 'Confidence Tape',
  description: 'Kinesiology tape that makes you feel invincible. Mostly placebo, but it works.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        offensive: 6,
        defensive: 6,
      },
      additional: {
        mood_gain_bonus: 5,
      },
    },
  },
};

export const COACHES_NOTES: Item = {
  id: 'coaches_notes',
  name: "Coach's Notes",
  description: 'Detailed scouting notes on your next opponent. Study up before the match.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        anticipation: 12,
        placement: 6,
        return: 4,
      },
    },
  },
};

export const LUCKY_PENNY: Item = {
  id: 'lucky_penny',
  name: 'Lucky Penny',
  description: 'Found heads-up on the ground. Use it for a boost of luck in your next activity.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        serve: 3,
        forehand: 3,
        backhand: 3,
      },
      additional: {
        ability_chance_bonus: 15,
      },
    },
  },
};

export const BANANA: Item = {
  id: 'banana',
  name: 'Banana',
  description: 'A perfectly ripe banana. Great for quick energy and preventing cramps.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 15,
      moodChange: 3,
    },
  },
};

export const STRAWBERRIES: Item = {
  id: 'strawberries',
  name: 'Strawberries',
  description: 'A box of fresh strawberries. And they were on sale.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 10,
      moodChange: 5,
    },
  },
}

export const ORANGE_SLICE: Item = {
  id: 'orange_slice',
  name: 'Orange Slice',
  description: 'A refreshing slice of orange. From a very nice lady.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 5,
      moodChange: 20,
    },
  },
};

export const MOTIVATIONAL_PLAYLIST: Item = {
  id: 'motivational_playlist',
  name: 'Motivational Playlist',
  description: 'A curated playlist that gets you hyped up. Listen before your next match.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        focus: 5,
        strength: 5,
        speed: 3,
      },
      additional: {
        mood_gain_bonus: 3,
      },
    },
  },
};

export const ICE_BATH_VOUCHER: Item = {
  id: 'ice_bath_voucher',
  name: 'Ice Bath Voucher',
  description: 'A voucher for a professional ice bath session. Restores energy and aids recovery.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 40,
      moodChange: -5,
    },
  },
};

// ============================================================================
// LUCKY ITEMS
// ============================================================================

export const LUCKY_CHARM: Item = {
  id: 'lucky_charm',
  name: 'Lucky Charm',
  description: 'A mysterious charm that brings good fortune. Provides passive bonuses while in inventory.',
  type: 'lucky',
  modifiers: {
    statBoosts: {
      serve: 2,
      forehand: 2,
      backhand: 2,
      speed: 2,
      focus: 2,
    },
    additional: {
      event_trigger_bonus: 5,
      mood_gain_bonus: 1,
    },
  },
};

export const FOUR_LEAF_CLOVER: Item = {
  id: 'four_leaf_clover',
  name: 'Four-Leaf Clover',
  description: 'A rare clover that brings subtle improvements across all areas.',
  type: 'lucky',
  modifiers: {
    statBoosts: {
      serve: 1,
      forehand: 1,
      backhand: 1,
      volley: 1,
      speed: 1,
      stamina: 1,
      focus: 1,
      anticipation: 1,
    },
    additional: {
      event_trigger_bonus: 10,
      training_tier_bonus: 1,
    },
  },
};

export const TENNIS_BALL_KEYCHAIN: Item = {
  id: 'tennis_ball_keychain',
  name: 'Tennis Ball Keychain',
  description: 'A miniature tennis ball keychain given to you by a fan. Reminds you why you play.',
  type: 'lucky',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      focus: 3,
      recovery: 2,
      anticipation: 2,
    },
    additional: {
      mood_gain_bonus: 2,
      relationship_gain_bonus: 3,
    },
  },
};

export const LUCKY_SPROUT: Item = {
  id: 'lucky_sprout',
  name: 'Lucky Sprout',
  description: 'A small plant left behind by an opponent from Azalea Forest. You enjoy taking care of it.',
  type: 'lucky',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      defensive: 2,
      anticipation: 2,
      placement: 2
    }
  }
}

export const LUCKY_JACKET: Item = {
  id: 'lucky_jacket',
  name: 'Lucky Ski Jacket',
  description: 'One of your parents left you this retro jacket. You think they were going to donate it, but now it\'s yours.',
  type: 'lucky',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      speed: 2,
      focus: 2,
      overhead: 1,
      spin: 2
    }
  }
}

export const LUCKY_TEETH: Item = {
  id: 'lucky_teeth',
  name: 'Lucky fake teeth',
  description: 'You found these dentures after the Sunset Drive team match. You don\'t know who they belong to, but they make your smile really pop.',
  type: 'lucky',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      serve: 1,
      return: 1,
      recovery: 2,
      focus: 2
    }
  }
}

// ============================================================================
// ITEM COLLECTIONS
// ============================================================================

export const ALL_RACQUETS: Item[] = [
  BEGINNER_RACQUET,
  PRO_RACQUET,
  POWER_RACQUET,
  CONTROL_RACQUET,
  SPIN_RACQUET,
  ALLROUND_RACQUET,
];

export const ALL_SHOES: Item[] = [
  RUNNING_SHOES,
  COURT_SHOES,
  CLAY_COURT_SHOES,
  LIGHTWEIGHT_TRAINERS,
  GRASS_COURT_SHOES,
];

export const ALL_OUTFITS: Item[] = [
  PRACTICE_OUTFIT,
  TOURNAMENT_OUTFIT,
  COMPRESSION_OUTFIT,
  RETRO_OUTFIT,
  SPONSOR_OUTFIT,
];

export const ALL_HATS: Item[] = [VISOR, HEADBAND, CAP, LUCKY_HAT, SWEATBAND, BANDANA];

export const ALL_CONSUMABLES_INSTANT: Item[] = [
  ENERGY_DRINK,
  SPORTS_DRINK,
  RECOVERY_SHAKE,
  SUPER_ENERGY_GEL,
  BANANA,
  ICE_BATH_VOUCHER,
];

export const ALL_CONSUMABLES_BUFF: Item[] = [
  FOCUS_PILL,
  PERFORMANCE_ENHANCER,
  STAMINA_BOOST,
  POWER_SUPPLEMENT,
  SPEED_BOOSTER,
  CONFIDENCE_TAPE,
  COACHES_NOTES,
  LUCKY_PENNY,
  MOTIVATIONAL_PLAYLIST,
];

export const ALL_LUCKY_ITEMS: Item[] = [LUCKY_CHARM, FOUR_LEAF_CLOVER, TENNIS_BALL_KEYCHAIN];

export const ALL_EQUIPMENT: Item[] = [
  ...ALL_RACQUETS,
  ...ALL_SHOES,
  ...ALL_OUTFITS,
  ...ALL_HATS,
];

export const ALL_CONSUMABLES: Item[] = [
  ...ALL_CONSUMABLES_INSTANT,
  ...ALL_CONSUMABLES_BUFF,
];

export const ALL_ITEMS: Item[] = [
  ...ALL_EQUIPMENT,
  ...ALL_CONSUMABLES,
  ...ALL_LUCKY_ITEMS,
];

/**
 * Get a random item from a specific category
 */
export function getRandomItem(items: Item[]): Item {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get items by tier for match rewards
 */
export function getItemsByTier(tier: 1 | 2 | 3 | 4): Item[] {
  switch (tier) {
    case 1:
      return [
        BEGINNER_RACQUET,
        RUNNING_SHOES,
        PRACTICE_OUTFIT,
        VISOR,
        SWEATBAND,
        BANANA,
        ...ALL_CONSUMABLES_INSTANT,
      ];
    case 2:
      return [
        PRO_RACQUET,
        ALLROUND_RACQUET,
        COURT_SHOES,
        TOURNAMENT_OUTFIT,
        RETRO_OUTFIT,
        HEADBAND,
        ...ALL_CONSUMABLES,
        LUCKY_CHARM,
        TENNIS_BALL_KEYCHAIN,
      ];
    case 3:
      return [
        POWER_RACQUET,
        CONTROL_RACQUET,
        SPIN_RACQUET,
        CLAY_COURT_SHOES,
        GRASS_COURT_SHOES,
        COMPRESSION_OUTFIT,
        CAP,
        BANDANA,
        ...ALL_CONSUMABLES_BUFF,
        ...ALL_LUCKY_ITEMS,
      ];
    case 4:
      return [
        CONTROL_RACQUET,
        SPIN_RACQUET,
        LIGHTWEIGHT_TRAINERS,
        COMPRESSION_OUTFIT,
        SPONSOR_OUTFIT,
        LUCKY_HAT,
        BANDANA,
        ...ALL_CONSUMABLES_BUFF,
        ...ALL_LUCKY_ITEMS,
      ];
    default:
      return ALL_ITEMS;
  }
}
