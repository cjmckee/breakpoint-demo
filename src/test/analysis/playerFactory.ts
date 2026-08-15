import type { PlayerStats } from '../../types/index.js';
import type {
  ArchetypeProfile, BroadArchetype, GamePhase, PhaseSpec, SpecialtyTier,
} from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PATHS_BY_PHASE } from '../../data/archetypeTree.js';

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

// ─── Sampling the real build space ───────────────────────────

/**
 * Draw an archetype profile the way a PLAYER builds one.
 *
 * The five profiles in `profileForArchetype` are not legacy leftovers — they are
 * how every authored opponent in the game is built. They are the wrong model for
 * the other side of the net. A player picks a broad archetype and then spends
 * one specialization point per level across six phases, three paths each, up to
 * tier III; the presets between them cover 13 of the 18 paths and never reach
 * tier III at all, so a population drawn from them is missing:
 *
 *   fs_sniper, fs_curveball, ss_pancake, ss_gambler, bh_bazooka   (5 of 18 paths)
 *   every tier-III effect in the game
 *
 * `fs_curveball` matters most: it carries the only SLICE_PREFERENCE_FOREHAND in
 * the game, so a preset-only population makes `slice` a backhand stat by
 * construction before any measurement starts.
 *
 * @param rng     0-1 source, so callers can seed a reproducible population
 * @param points  specialization points to spend. A player gets
 *                STARTING_SPECIALIZATION_POINTS at the Coach Gonzalez event and
 *                one per level after, so ~6 is a mid-game build.
 * @param maxTier highest specialty tier to allow. gameStore blocks upgrades
 *                entirely below player tier 2, so pass 1 to model the shipped
 *                tier-1 ladder, where every specialty is capped at tier I.
 */
export function drawPlayerProfile(
  rng: () => number,
  points: number,
  maxTier: SpecialtyTier = 3,
): ArchetypeProfile {
  const broads: BroadArchetype[] = ['baseliner', 'net_attacker', 'all_courter'];
  const phases = Object.keys(PATHS_BY_PHASE) as GamePhase[];
  const chosen: Partial<Record<GamePhase, PhaseSpec>> = {};

  let remaining = points;
  let guard = 0;
  while (remaining > 0 && guard++ < 200) {
    const phase = phases[Math.floor(rng() * phases.length)];
    const current = chosen[phase];
    if (!current) {
      const paths = PATHS_BY_PHASE[phase];
      chosen[phase] = { path: paths[Math.floor(rng() * paths.length)].id, tier: 1 };
      remaining--;
    } else if (current.tier < maxTier) {
      chosen[phase] = { path: current.path, tier: (current.tier + 1) as SpecialtyTier };
      remaining--;
    }
    // Every phase already at maxTier: nothing left to buy, so stop.
    if (phases.every(p => (chosen[p]?.tier ?? 0) >= maxTier)) break;
  }

  return {
    broad: broads[Math.floor(rng() * broads.length)],
    phases: chosen,
    specializationPoints: remaining,
    respecTokens: 0,
  };
}
