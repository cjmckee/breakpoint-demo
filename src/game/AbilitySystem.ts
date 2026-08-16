/**
 * Ability System
 * Runtime methods for working with ability definitions.
 * Ability data lives in src/data/abilities.ts.
 */

import {
  Ability,
  AbilityRarity,
  StatBoosts,
} from '../types/game';

import { ABILITY_DEFINITIONS } from '../data/abilities';

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
   * Get a random ability of a specific rarity
   */
  static getRandomAbilityByRarity(rarity: AbilityRarity): Ability | null {
    const abilities = this.getAbilitiesByRarity(rarity);

    if (abilities.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * abilities.length);
    return abilities[randomIndex];
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
