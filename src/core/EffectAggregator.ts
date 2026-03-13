/**
 * EffectAggregator
 * Collects and merges all active stat boosts and additional effects
 * from a player's equipped items, lucky items, story items, and abilities.
 */

import type { Player, StatBoosts } from '../types/game';

export interface AggregatedEffects {
  statBoosts: StatBoosts;
  effects: Record<string, number>;
}

export class EffectAggregator {
  /**
   * Collect all active stat boosts and additional effects from
   * equipped items, lucky items, story items, and abilities.
   */
  static getActiveEffects(player: Player): AggregatedEffects {
    const statBoosts: StatBoosts = {};
    const effects: Record<string, number> = {};

    // Equipped items
    for (const item of Object.values(player.equippedItems)) {
      if (item?.modifiers) {
        this.mergeStatBoosts(statBoosts, item.modifiers.statBoosts);
        this.mergeEffects(effects, item.modifiers.additional);
      }
    }

    // Lucky items in inventory (passive)
    for (const item of player.inventory) {
      if (item.type === 'lucky' && item.modifiers) {
        this.mergeStatBoosts(statBoosts, item.modifiers.statBoosts);
        this.mergeEffects(effects, item.modifiers.additional);
      }
    }

    // Story items (passive)
    for (const item of player.storyItems) {
      if (item.modifiers) {
        this.mergeStatBoosts(statBoosts, item.modifiers.statBoosts);
        this.mergeEffects(effects, item.modifiers.additional);
      }
    }

    // Abilities
    for (const ability of player.abilities) {
      this.mergeStatBoosts(statBoosts, ability.modifiers.statBoosts);
      this.mergeEffects(effects, ability.modifiers.additional);
    }

    return { statBoosts, effects };
  }

  /**
   * Get a specific effect value with a default fallback.
   */
  static getEffect(effects: Record<string, number>, key: string, defaultValue: number = 0): number {
    return effects[key] ?? defaultValue;
  }

  private static mergeStatBoosts(target: StatBoosts, source: StatBoosts): void {
    for (const [stat, value] of Object.entries(source)) {
      if (value !== undefined) {
        const key = stat as keyof StatBoosts;
        target[key] = (target[key] || 0) + value;
      }
    }
  }

  private static mergeEffects(target: Record<string, number>, source?: Record<string, number>): void {
    if (!source) return;
    for (const [key, value] of Object.entries(source)) {
      target[key] = (target[key] || 0) + value;
    }
  }
}
