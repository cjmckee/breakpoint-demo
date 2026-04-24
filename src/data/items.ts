/**
 * Item Database
 * All available items in the game
 */

import type { Item, ItemType } from '../types/items';
import { EffectKey } from '../types/game';

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
      spin: 5,
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
      forehand: 2,
      backhand: 2,
      overhead: 5
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
      slice: 5,
      return: 5
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
      placement: 2,
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
      return: 3,
      volley: 3,
      slice: 3
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
      stamina: 2
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
      anticipation: 3
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
      spin: 2
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
      stamina: 2
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
      overhead: 3,
      offensive: 2
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
      speed: 1
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
      anticipation: 3,
      placement: 4
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
      focus: 6,
      serve: 4,
      volley: 4,
      overhead: 2,
      offensive: 2
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
      forehand: 3,
      backhand: 3,
      return: 2
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
      speed: 3,
      spin: 3,
      anticipation: 2,
      slice: 3
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
      anticipation: 1
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
      recovery: 3,
      stamina: 2
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
      focus: 3,
      offensive: 5,
      strength: 2
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
      slice: 4
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
      focus: 3,
      recovery: 6,
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
      offensive: 5,
      strength: 4,
      serve: 4,
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
      slice: 7,
      spin: 4,
      volley: 3,
      dropShot: 3,
    }
  }
}

export const STYLISH_HEADBAND: Item = {
  id: 'stylish_headband',
  name: 'Stylish Headband',
  description: 'A lightweight headband that helps you stay focused on the rallies. And your opponents focus on how stylish it is.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      focus: 4,
      stamina: 4,
      speed: 3
    },
  },
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

export const LUCKY_PENNY: Item = {
  id: 'lucky_penny',
  name: 'Lucky Penny',
  description: 'Found heads-up on the ground. Abe would want you to hit more volleys.',
  type: 'lucky',
  modifiers: {
    statBoosts: {
      serve: 3,
      volley: 3,
      overhead: 3,
      offensive: 2
    },
    additional: {
      ability_chance_bonus: 15,
    },
  },
};

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
      offensive: 3,
      spin: 5,
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
      defensive: 4,
      strength: 4,
      slice: 2,
      shotVariety: 4
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
      speed: 3,
      focus: 3,
      overhead: 2,
      spin: 3
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
      serve: 3,
      return: 2,
      recovery: 3,
      focus: 2
    }
  }
}

export const CHAMPION_WRISTBAND: Item = {
  id: 'champion_wristband',
  name: 'Champion Wristband',
  description: 'A symbolic wristband marking your rise from beginner to competitor. Wear it with pride.',
  type: 'lucky',
  modifiers: {
    statBoosts: {
      focus: 3,
      forehand: 3,
      backhand: 2,
      return: 4,
      slice: 4
    },
  },
}

// ============================================================================
// NEW EQUIPMENT - RACQUETS
// ============================================================================

export const DROPSHOT_RACQUET: Item = {
  id: 'dropshot_racquet',
  name: 'Dropshot Specialist',
  description: 'A finely tuned racquet for players who win points at the net with touch and deception.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      dropShot: 6,
      slice: 4,
      placement: 5,
      volley: 3,
    },
  },
};

export const GRAND_SLAM_RACQUET: Item = {
  id: 'grand_slam_racquet',
  name: 'Grand Slam Frame',
  description: 'The racquet used by champions on the biggest stages. Heavy on power and precision.',
  type: 'equipment',
  equipmentSlot: 'racquet',
  modifiers: {
    statBoosts: {
      serve: 6,
      forehand: 5,
      backhand: 5,
      overhead: 4,
      strength: 4,
      placement: 4,
    },
  },
};

// ============================================================================
// NEW EQUIPMENT - SHOES
// ============================================================================

export const HARD_COURT_SHOES: Item = {
  id: 'hard_court_shoes',
  name: 'Hard Court Shoes',
  description: 'Durable shoes built for the grind of hard court surfaces. Great all-around traction.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      speed: 5,
      agility: 4,
      stamina: 3,
      return: 3,
    },
  },
};

export const RECOVERY_BOOTS: Item = {
  id: 'recovery_boots',
  name: 'Recovery Boots',
  description: 'Heavily cushioned shoes that reduce fatigue and keep your legs fresh late in matches.',
  type: 'equipment',
  equipmentSlot: 'shoes',
  modifiers: {
    statBoosts: {
      stamina: 5,
      recovery: 6,
      speed: 3,
    },
    additional: {
      [EffectKey.ENERGY_COST_REDUCTION]: 2,
    },
  },
};

// ============================================================================
// NEW EQUIPMENT - OUTFITS
// ============================================================================

export const AERODYNAMIC_SUIT: Item = {
  id: 'aerodynamic_suit',
  name: 'Aerodynamic Suit',
  description: 'A form-fitting performance suit that reduces drag and maximizes explosive movement.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      speed: 5,
      agility: 5,
      offensive: 4,
      strength: 3,
    },
  },
};

export const MENTAL_FOCUS_JERSEY: Item = {
  id: 'mental_focus_jersey',
  name: 'Mental Focus Jersey',
  description: 'Designed with biometric feedback tech. Reminds you to breathe, slow down, and play smart.',
  type: 'equipment',
  equipmentSlot: 'outfit',
  modifiers: {
    statBoosts: {
      focus: 6,
      anticipation: 5,
      recovery: 4,
      shotVariety: 3,
    },
    additional: {
      [EffectKey.MOOD_GAIN_BONUS]: 2,
    },
  },
};

// ============================================================================
// NEW EQUIPMENT - HATS
// ============================================================================

export const PRECISION_VISOR: Item = {
  id: 'precision_visor',
  name: 'Precision Visor',
  description: 'A visor fitted with a subtle trajectory guide strip. Helps your eye track placement.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      placement: 5,
      anticipation: 4,
      return: 3,
    },
  },
};

export const RALLY_KING_HEADBAND: Item = {
  id: 'rally_king_headband',
  name: 'Rally King Headband',
  description: 'A thick headband worn by players who thrive in long exchanges. Keeps focus sharp late in rallies.',
  type: 'equipment',
  equipmentSlot: 'hat',
  modifiers: {
    statBoosts: {
      stamina: 5,
      recovery: 4,
      backhand: 3,
      spin: 3,
    },
    additional: {
      [EffectKey.FOCUS_DURATION]: 1,
    },
  },
};

export const CHAMPIONS_CAP: Item = {
  id: 'champions_cap',
  name: "Champion's Cap",
  description: "A cap presented only to tournament champions. Wearing it, you feel like you belong in the big moments.",
  type: 'equipment',
  equipmentSlot: 'hat',
  shopAvailable: false,
  modifiers: {
    statBoosts: {
      focus: 5,
      serve: 4,
      forehand: 3,
      backhand: 3,
      anticipation: 4,
    },
    additional: {
      [EffectKey.CLUTCH_PERFORMANCE]: 1,
    },
  },
};

// ============================================================================
// NEW CONSUMABLES
// ============================================================================

export const TENNIS_ELBOW_GEL: Item = {
  id: 'tennis_elbow_gel',
  name: 'Tennis Elbow Gel',
  description: 'A topical gel that numbs the ache and gets you back on the court fast. It stings at first.',
  type: 'consumable',
  consumableEffect: {
    type: 'instant',
    instantEffects: {
      energyChange: 35,
      moodChange: -5,
    },
  },
};

export const ZONE_WATER: Item = {
  id: 'zone_water',
  name: 'Zone Water',
  description: 'An electrolyte drink with adaptogens. Supposedly puts you in the zone. Weirdly, it works.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        focus: 8,
        anticipation: 6,
        recovery: 4,
      },
      additional: {
        [EffectKey.MENTAL_RESILIENCE]: 1,
      },
    },
  },
};

export const NUTRITION_PACK: Item = {
  id: 'nutrition_pack',
  name: 'Grand Slam Nutrition Pack',
  description: 'A comprehensive pre-match nutrition system used by top pros. Covers all the bases.',
  type: 'consumable',
  consumableEffect: {
    type: 'next_activity',
    nextActivityBuffs: {
      statBoosts: {
        stamina: 8,
        strength: 6,
        serve: 5,
        forehand: 5,
      },
    },
  },
};

// ============================================================================
// CONSUMABLE SHOP COSTS
// Items have varied prices based on their power level.
// Used by ShopSystem instead of the flat cost: 10 default.
// ============================================================================

export const CONSUMABLE_SHOP_COSTS: Partial<Record<string, number>> = {
  banana: 5,
  strawberries: 5,
  orange_slice: 7,
  energy_drink: 10,
  sports_drink: 12,
  recovery_shake: 12,
  ice_bath_voucher: 18,
  super_energy_gel: 22,
  grandmas_lucky_cookies: 16,
  focus_pill: 18,
  performance_enhancer: 20,
  stamina_boost: 16,
  power_supplement: 15,
  speed_booster: 18,
  confidence_tape: 14,
  coaches_notes: 22,
  motivational_playlist: 16,
  tennis_elbow_gel: 20,
  zone_water: 25,
  nutrition_pack: 35,
};

// ============================================================================
// ITEM COLLECTIONS - Derived from filtering individual items by type
// ============================================================================

const ITEM_COLLECTIONS: Item[] = [
  // Racquets
  BEGINNER_RACQUET,
  PRO_RACQUET,
  POWER_RACQUET,
  CONTROL_RACQUET,
  SPIN_RACQUET,
  ALLROUND_RACQUET,
  DROPSHOT_RACQUET,
  GRAND_SLAM_RACQUET,
  // Shoes
  RUNNING_SHOES,
  COURT_SHOES,
  CLAY_COURT_SHOES,
  LIGHTWEIGHT_TRAINERS,
  GRASS_COURT_SHOES,
  HARD_COURT_SHOES,
  RECOVERY_BOOTS,
  // Outfits
  PRACTICE_OUTFIT,
  TOURNAMENT_OUTFIT,
  COMPRESSION_OUTFIT,
  RETRO_OUTFIT,
  SPONSOR_OUTFIT,
  SPACE_SUIT,
  AERODYNAMIC_SUIT,
  MENTAL_FOCUS_JERSEY,
  // Hats
  VISOR,
  HEADBAND,
  CAP,
  LUCKY_HAT,
  SWEATBAND,
  BANDANA,
  CHEF_HAT,
  STYLISH_HEADBAND,
  PRECISION_VISOR,
  RALLY_KING_HEADBAND,
  CHAMPIONS_CAP,
  // Consumables - instant
  ENERGY_DRINK,
  SPORTS_DRINK,
  RECOVERY_SHAKE,
  SUPER_ENERGY_GEL,
  GRANDMAS_LUCKY_COOKIES,
  SKI_PASS,
  BANANA,
  STRAWBERRIES,
  ORANGE_SLICE,
  ICE_BATH_VOUCHER,
  TENNIS_ELBOW_GEL,
  // Consumables - next activity
  FOCUS_PILL,
  PERFORMANCE_ENHANCER,
  STAMINA_BOOST,
  POWER_SUPPLEMENT,
  SPEED_BOOSTER,
  CONFIDENCE_TAPE,
  COACHES_NOTES,
  MOTIVATIONAL_PLAYLIST,
  ZONE_WATER,
  NUTRITION_PACK,
  // Lucky items
  LUCKY_PENNY,
  LUCKY_CHARM,
  FOUR_LEAF_CLOVER,
  TENNIS_BALL_KEYCHAIN,
  LUCKY_SPROUT,
  LUCKY_JACKET,
  LUCKY_TEETH,
  CHAMPION_WRISTBAND,
];

export const ALL_ITEMS: Item[] = ITEM_COLLECTIONS;

export function getItemsByType(type: ItemType): Item[] {
  return ALL_ITEMS.filter(item => item.type === type);
}

export const ALL_EQUIPMENT = getItemsByType('equipment');
export const ALL_CONSUMABLES = getItemsByType('consumable');
export const ALL_LUCKY_ITEMS = getItemsByType('lucky');

export const ALL_RACQUETS = ALL_EQUIPMENT.filter(item => item.equipmentSlot === 'racquet');
export const ALL_SHOES = ALL_EQUIPMENT.filter(item => item.equipmentSlot === 'shoes');
export const ALL_OUTFITS = ALL_EQUIPMENT.filter(item => item.equipmentSlot === 'outfit');
export const ALL_HATS = ALL_EQUIPMENT.filter(item => item.equipmentSlot === 'hat');

export const ALL_CONSUMABLES_INSTANT = ALL_CONSUMABLES.filter(
  item => item.consumableEffect?.type === 'instant'
);
export const ALL_CONSUMABLES_BUFF = ALL_CONSUMABLES.filter(
  item => item.consumableEffect?.type === 'next_activity'
);

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
        ...ALL_CONSUMABLES_INSTANT,
      ];
    case 2:
      return [
        PRO_RACQUET,
        ALLROUND_RACQUET,
        COURT_SHOES,
        HARD_COURT_SHOES,
        TOURNAMENT_OUTFIT,
        RETRO_OUTFIT,
        HEADBAND,
        PRECISION_VISOR,
        ...ALL_CONSUMABLES,
        LUCKY_CHARM,
        TENNIS_BALL_KEYCHAIN,
      ];
    case 3:
      return [
        POWER_RACQUET,
        CONTROL_RACQUET,
        SPIN_RACQUET,
        DROPSHOT_RACQUET,
        CLAY_COURT_SHOES,
        GRASS_COURT_SHOES,
        HARD_COURT_SHOES,
        RECOVERY_BOOTS,
        COMPRESSION_OUTFIT,
        AERODYNAMIC_SUIT,
        MENTAL_FOCUS_JERSEY,
        CAP,
        BANDANA,
        RALLY_KING_HEADBAND,
        ...ALL_CONSUMABLES_BUFF,
        ...ALL_LUCKY_ITEMS,
      ];
    case 4:
      return [
        CONTROL_RACQUET,
        SPIN_RACQUET,
        DROPSHOT_RACQUET,
        GRAND_SLAM_RACQUET,
        LIGHTWEIGHT_TRAINERS,
        RECOVERY_BOOTS,
        COMPRESSION_OUTFIT,
        SPONSOR_OUTFIT,
        AERODYNAMIC_SUIT,
        MENTAL_FOCUS_JERSEY,
        LUCKY_HAT,
        BANDANA,
        RALLY_KING_HEADBAND,
        ...ALL_CONSUMABLES_BUFF,
        ...ALL_LUCKY_ITEMS,
      ];
    default:
      return ALL_ITEMS;
  }
}
