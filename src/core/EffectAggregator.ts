/**
 * EffectAggregator
 * Collects and merges all active stat boosts and additional effects
 * from a player's equipped items, story items, and abilities.
 *
 * Lucky items count only while equipped in the `charm` slot. They used to apply
 * from inventory, which meant holding all eight stacked to ~87 stat points with
 * no decision attached.
 */

import type { Ability, Player, StatBoosts } from '../types/game';
import { aggregateArchetypeEffects } from '../data/archetypeTree';
import { ABILITY_LEVEL_MULTIPLIER } from '../config/shotThresholds';

/** An ability level's effect multiplier (level 1 = ×1). */
export function levelMultiplier(level: number): number {
  const top = ABILITY_LEVEL_MULTIPLIER.length - 1;
  return ABILITY_LEVEL_MULTIPLIER[Math.max(1, Math.min(top, Math.round(level)))];
}

/**
 * The match and activity effects of a set of abilities, summed. Every effect
 * scales with the ability's level by ABILITY_LEVEL_MULTIPLIER: a level-3 Heavy
 * Hitter is twice a level-1 one.
 */
export function abilityEffects(abilities: readonly Ability[] = []): Record<string, number> {
  const effects: Record<string, number> = {};
  for (const ability of abilities) {
    const multiplier = levelMultiplier(ability.level);
    for (const [key, value] of Object.entries(ability.modifiers.additional ?? {})) {
      effects[key] = (effects[key] ?? 0) + value * multiplier;
    }
  }
  return effects;
}

export interface AggregatedEffects {
  statBoosts: StatBoosts;
  effects: Record<string, number>;
}

export class EffectAggregator {
  /**
   * Collect all active stat boosts and additional effects from
   * equipped items (charm included), story items, and abilities.
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

    // Story items (passive)
    for (const item of player.storyItems) {
      if (item.modifiers) {
        this.mergeStatBoosts(statBoosts, item.modifiers.statBoosts);
        this.mergeEffects(effects, item.modifiers.additional);
      }
    }

    // Abilities — effects only, no stat boosts (stats come from training and equipment)
    this.mergeEffects(effects, abilityEffects(player.abilities));

    // Archetype specialties — behavior effects (decision layer), scaled by tier
    this.mergeEffects(effects, aggregateArchetypeEffects(player.archetypeProfile));

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

  private static mergeEffects(
    target: Record<string, number>,
    source?: Record<string, number>,
  ): void {
    if (!source) return;
    for (const [key, value] of Object.entries(source)) {
      target[key] = (target[key] || 0) + value;
    }
  }
}
