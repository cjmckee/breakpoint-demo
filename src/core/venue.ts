/**
 * Venue conditions as the match engines read them. MatchSimulator (quick sims,
 * the analysis harnesses) and MatchOrchestrator (the live match) both call
 * these, so a venue plays the same way in a measured match as in a played one.
 *
 * A match with no venue, or a venue with no conditions, plays exactly as its
 * surface does.
 */

import type { HomeSide, Venue } from '../types/game';

/** Effects a venue adds to each player. Both players get the same set. */
export function venueEffects(venue?: Venue): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(venue?.conditions?.effects ?? {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/** How much faster both players tire at this venue (1 = normal). */
export function venueFatigue(venue?: Venue): number {
  return venue?.conditions?.fatigue ?? 1;
}

/** The venue's wind, in serve-accuracy points (0 = calm). */
export function venueWind(venue?: Venue): number {
  return venue?.conditions?.wind ?? 0;
}

/** The side the crowd backs and how much it multiplies that side's momentum, if any. */
export function venueCrowd(
  venue: Venue | undefined,
  home: HomeSide | undefined,
): { side: HomeSide; gain: number } | null {
  const gain = venue?.conditions?.crowd;
  if (!home || gain === undefined || gain === 1) return null;
  return { side: home, gain };
}

/** Adds one effect set onto another, key by key. */
export function addEffects(
  base: Record<string, number>,
  extra: Record<string, number> = {},
): Record<string, number> {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    out[key] = (out[key] || 0) + value;
  }
  return out;
}
