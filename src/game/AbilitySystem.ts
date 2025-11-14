/**
 * Ability System
 * Defines all abilities, their effects, and modifiers
 * Converted from Python training.py ABILITY_DEFINITIONS
 */

import {
  Ability,
  AbilityRarity,
  AbilityName,
  Modifiers,
  StatBoosts,
} from '../types/game';

// Complete ability definitions with all rarities
export const ABILITY_DEFINITIONS: Record<string, Ability> = {
  // ==================== COMMON ABILITIES ====================
  [AbilityName.BASELINER]: {
    name: AbilityName.BASELINER,
    level: 1,
    rarity: 'common',
    modifiers: {
      statBoosts: {
        forehand: 3,
        backhand: 3,
      },
      additional: {
        session_tier: 1,
      },
    },
    description:
      "You've mastered the art of staying at the baseline. Groundstrokes are your bread and butter, and you can rally all day long.",
    effects:
      'Increases forehand and backhand stats by 3. Increase a session tier when you\'re feeling lucky.',
  },

  [AbilityName.NETCRASHER]: {
    name: AbilityName.NETCRASHER,
    level: 1,
    rarity: 'common',
    modifiers: {
      statBoosts: {
        serve: 3,
        volley: 3,
        speed: 3,
      },
    },
    description:
      "You love charging the net like a maniac. Your opponents never know when you'll suddenly appear at the net to finish the point.",
    effects: 'Increases serve, volley, and speed stats by 3.',
  },

  [AbilityName.SLIDER]: {
    name: AbilityName.SLIDER,
    level: 1,
    rarity: 'common',
    modifiers: {
      statBoosts: {
        speed: 3,
        agility: 3,
      },
      additional: {
        court_range: 1,
      },
    },
    description:
      "You move around the court like you're on ice skates. Your footwork is so smooth, opponents think you're teleporting.",
    effects: 'Increases speed and agility stats by 3. Improves court coverage.',
  },

  [AbilityName.CLUTCH]: {
    name: AbilityName.CLUTCH,
    level: 1,
    rarity: 'common',
    modifiers: {
      statBoosts: {
        focus: 3,
      },
      additional: {
        clutch: 1,
      },
    },
    description:
      "When the pressure is on, you thrive. You actually play better when you're down match point.",
    effects: 'Increases focus stat by 3. Improves clutch performance.',
  },

  [AbilityName.HEAVY_HITTER]: {
    name: AbilityName.HEAVY_HITTER,
    level: 1,
    rarity: 'common',
    modifiers: {
      statBoosts: {
        forehand: 3,
        strength: 5,
      },
      additional: {
        pace: 1,
      },
    },
    description:
      'You hit the ball so hard that opponents can hear it coming. Your forehand is like a cannon shot.',
    effects:
      'Increases forehand stat by 3 and strength by 5. Adds extra pace to your shots.',
  },

  // ==================== UNCOMMON ABILITIES ====================
  [AbilityName.SPEED_DEMON]: {
    name: AbilityName.SPEED_DEMON,
    level: 1,
    rarity: 'uncommon',
    modifiers: {
      statBoosts: {
        speed: 5,
        agility: 5,
        stamina: 3,
      },
      additional: {
        court_coverage: 2,
        recovery_speed: 1,
      },
    },
    description:
      "You're so fast the cameras can hardly keep up. Your opponents are seeing ghosts on the court.",
    effects:
      'Increases speed and agility by 5, stamina by 3. Significantly improves court coverage and recovery speed.',
  },

  // ==================== RARE ABILITIES ====================
  [AbilityName.MENTAL_FORTITUDE]: {
    name: AbilityName.MENTAL_FORTITUDE,
    level: 1,
    rarity: 'rare',
    modifiers: {
      statBoosts: {
        focus: 8,
        recovery: 6,
        anticipation: 4,
      },
      additional: {
        mental_resilience: 3,
        focus_duration: 2,
        clutch_performance: 1,
      },
    },
    description:
      'Your mental game is unbreakable. You can handle any pressure situation and always find a way to win.',
    effects:
      'Increases focus by 8, recovery by 6, anticipation by 4. Greatly improves mental resilience and focus.',
  },

  // ==================== LEGENDARY ABILITIES ====================
  [AbilityName.LEGENDARY_FOCUS]: {
    name: AbilityName.LEGENDARY_FOCUS,
    level: 1,
    rarity: 'legendary',
    modifiers: {
      statBoosts: {
        focus: 10,
        anticipation: 8,
        shotVariety: 6,
        serve: 5,
      },
      additional: {
        legendary_moment: 5,
        perfect_timing: 3,
        unstoppable_momentum: 2,
        champion_aura: 1,
      },
    },
    description:
      "You have the focus of a champion. When you're in the zone, nothing can stop you from achieving greatness.",
    effects:
      'Massive boosts to focus, anticipation, shot variety, and serve. Grants legendary status and champion aura.',
  },
};

export class AbilitySystem {
  /**
   * Get ability definition by name
   */
  static getAbility(abilityName: string): Ability | undefined {
    return ABILITY_DEFINITIONS[abilityName];
  }

  /**
   * Create an ability instance with a specific level
   */
  static createAbility(abilityName: string, level: number = 1): Ability | null {
    const baseAbility = this.getAbility(abilityName);

    if (!baseAbility) {
      return null;
    }

    // Scale stat boosts by level
    const scaledStatBoosts: StatBoosts = {};
    for (const [stat, value] of Object.entries(baseAbility.modifiers.statBoosts)) {
      if (value !== undefined) {
        scaledStatBoosts[stat as keyof StatBoosts] = value * level;
      }
    }

    // Scale additional modifiers by level
    const scaledAdditional: Record<string, number> = {};
    if (baseAbility.modifiers.additional) {
      for (const [key, value] of Object.entries(baseAbility.modifiers.additional)) {
        scaledAdditional[key] = value * level;
      }
    }

    return {
      ...baseAbility,
      level,
      modifiers: {
        statBoosts: scaledStatBoosts,
        additional: scaledAdditional,
      },
    };
  }

  /**
   * Get all abilities of a specific rarity
   */
  static getAbilitiesByRarity(rarity: AbilityRarity): Ability[] {
    return Object.values(ABILITY_DEFINITIONS).filter(
      ability => ability.rarity === rarity
    );
  }

  /**
   * Get ability rarity color for UI
   */
  static getRarityColor(rarity: AbilityRarity): string {
    const colors = {
      common: '#9CA3AF', // gray
      uncommon: '#10B981', // green
      rare: '#3B82F6', // blue
      legendary: '#F59E0B', // gold
    };

    return colors[rarity];
  }

  /**
   * Get ability rarity emoji
   */
  static getRarityEmoji(rarity: AbilityRarity): string {
    const emojis = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      legendary: '🟡',
    };

    return emojis[rarity];
  }

  /**
   * Calculate total stat boosts from multiple abilities
   */
  static calculateTotalBoosts(abilities: Ability[]): StatBoosts {
    const total: StatBoosts = {};

    for (const ability of abilities) {
      for (const [stat, value] of Object.entries(ability.modifiers.statBoosts)) {
        if (value !== undefined) {
          const currentValue = total[stat as keyof StatBoosts] || 0;
          total[stat as keyof StatBoosts] = currentValue + value;
        }
      }
    }

    return total;
  }

  /**
   * Check if player has a specific ability
   */
  static hasAbility(abilities: Ability[], abilityName: string): boolean {
    return abilities.some(ability => ability.name === abilityName);
  }

  /**
   * Get ability level
   */
  static getAbilityLevel(abilities: Ability[], abilityName: string): number {
    const ability = abilities.find(a => a.name === abilityName);
    return ability?.level || 0;
  }

  /**
   * Get ability description with level scaling info
   */
  static getAbilityDescription(ability: Ability): string {
    let description = ability.description;

    if (ability.level > 1) {
      description += ` (Level ${ability.level} - ${ability.level}x effectiveness)`;
    }

    return description;
  }

  /**
   * Get list of all available ability names
   */
  static getAllAbilityNames(): string[] {
    return Object.keys(ABILITY_DEFINITIONS);
  }

  /**
   * Validate ability name
   */
  static isValidAbility(abilityName: string): boolean {
    return abilityName in ABILITY_DEFINITIONS;
  }
}
