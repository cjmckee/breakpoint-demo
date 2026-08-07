import type { PlayerStats } from '../../types/index.js';
import type { ArchetypeProfile } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';

/**
 * Create a player with ALL 20 stats set to the same value.
 * Useful for isolating how a single rating level performs.
 */
export function createUniformPlayer(name: string, rating: number): PlayerProfile {
  const r = Math.max(0, Math.min(100, rating));
  const stats: PlayerStats = {
    core: {
      serve: r, forehand: r, backhand: r, return: r, net: r,
    },
    technical: {
      slice: r, spin: r, placement: r,
    },
    physical: {
      speed: r, stamina: r, strength: r,
    },
    mental: {
      focus: r, anticipation: r, tactics: r,
    },
  };
  return new PlayerProfile(`uniform_${rating}`, name, stats);
}

/**
 * Create a uniform-rating player carrying a specific archetype profile, so the
 * only difference from a baseline uniform player is the archetype behavior.
 */
export function createArchetypePlayer(
  name: string,
  rating: number,
  archetypeProfile: ArchetypeProfile,
): PlayerProfile {
  const r = Math.max(0, Math.min(100, rating));
  const stats: PlayerStats = {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
  return new PlayerProfile(`archetype_${name}_${rating}`, name, stats, archetypeProfile);
}

/**
 * Create a player with different ratings per stat category.
 * Useful for testing how category imbalances affect performance.
 */
export function createSkewedPlayer(
  name: string,
  technicalRating: number,
  physicalRating: number,
  mentalRating: number,
): PlayerProfile {
  const t = Math.max(0, Math.min(100, technicalRating));
  const p = Math.max(0, Math.min(100, physicalRating));
  const m = Math.max(0, Math.min(100, mentalRating));
  const stats: PlayerStats = {
    core: {
      serve: t, forehand: t, backhand: t, return: t, net: t,
    },
    technical: {
      slice: t, spin: t, placement: t,
    },
    physical: {
      speed: p, stamina: p, strength: p,
    },
    mental: {
      focus: m, anticipation: m, tactics: m,
    },
  };
  return new PlayerProfile(`skewed_${t}_${p}_${m}`, name, stats);
}
