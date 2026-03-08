import type { PlayerStats } from '../../types/index.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';

/**
 * Create a player with ALL 20 stats set to the same value.
 * Useful for isolating how a single rating level performs.
 */
export function createUniformPlayer(name: string, rating: number): PlayerProfile {
  const r = Math.max(0, Math.min(100, rating));
  const stats: PlayerStats = {
    technical: {
      serve: r, forehand: r, backhand: r, volley: r, overhead: r,
      dropShot: r, slice: r, return: r, spin: r, placement: r,
    },
    physical: {
      speed: r, stamina: r, strength: r, agility: r, recovery: r,
    },
    mental: {
      focus: r, anticipation: r, shotVariety: r, offensive: r, defensive: r,
    },
  };
  return new PlayerProfile(`uniform_${rating}`, name, stats);
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
    technical: {
      serve: t, forehand: t, backhand: t, volley: t, overhead: t,
      dropShot: t, slice: t, return: t, spin: t, placement: t,
    },
    physical: {
      speed: p, stamina: p, strength: p, agility: p, recovery: p,
    },
    mental: {
      focus: m, anticipation: m, shotVariety: m, offensive: m, defensive: m,
    },
  };
  return new PlayerProfile(`skewed_${t}_${p}_${m}`, name, stats);
}
