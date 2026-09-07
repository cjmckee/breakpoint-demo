/**
 * Posture System
 *
 * A posture is *how* an option plays the point. It is the unit the opponent's
 * archetype is strong or weak against, so the whole matchup lives in one
 * POSTURE_VS_ARCHETYPE table instead of hand-authored strongAgainst/weakAgainst
 * lists on every option. A new option inherits sane matchup coverage from its
 * posture rather than needing five more authored relationships.
 */

import type { ArchetypeType } from './archetypes';
import type { KeyMomentPosture } from './tacticalOptions';

/** How a posture fares against an archetype. */
export type MatchupVerdict = 'strong' | 'neutral' | 'weak';

/**
 * The matchup chart, balanced on both axes:
 *
 *  - every archetype has exactly 2 postures strong against it, 2 weak, 2 neutral,
 *    so no opponent is systematically easier or harder to read;
 *  - every posture is strong against exactly as many archetypes as it is weak
 *    against (power and net at 2/2, the specialists at 1/1), so no posture is
 *    strictly better than another.
 *
 * `all_court` is deliberately neutral to every posture. It is not a gap to be
 * filled — it is the archetype with no hole, and what beats it is refusing to be
 * predictable (see the repeat-posture decay), not any single shot.
 *
 * Verified by keyMomentProbe's coverage section; changing a cell without
 * preserving the row and column balance will fail it.
 */
export const POSTURE_VS_ARCHETYPE: Record<
  KeyMomentPosture,
  Partial<Record<ArchetypeType, MatchupVerdict>>
> = {
  // Beats a pusher (overpower them) and a serve-volleyer (returns at their feet).
  // Loses to a bigger hitter, and to a counterpuncher who feeds on pace.
  power: { defensive: 'strong', serve_volley: 'strong', aggressive: 'weak', counterpuncher: 'weak' },

  // Beats a pusher (finish the floaters) and a counterpuncher (they need time).
  // Loses to a baseliner who passes, and to someone better at the net than you.
  net: { defensive: 'strong', counterpuncher: 'strong', aggressive: 'weak', serve_volley: 'weak' },

  // Beats a big hitter — absorb the pace and let them over-hit.
  // Loses to a pusher, whose game it is.
  neutralize: { aggressive: 'strong', defensive: 'weak' },

  // Beats a hitter committed early.
  // Loses to a serve-volleyer, for whom a short ball is an invitation forward.
  deception: { aggressive: 'strong', serve_volley: 'weak' },

  // Beats a serve-volleyer — make them rally.
  // Loses to a counterpuncher, who wants the long one.
  attrition: { serve_volley: 'strong', counterpuncher: 'weak' },

  // Beats a counterpuncher — break the rhythm they feed on.
  // Loses to a pusher, who does not care how pretty it is; you have to hurt them.
  variety: { counterpuncher: 'strong', defensive: 'weak' },
};

/** How a posture fares against a given archetype. */
export function getMatchup(
  posture: KeyMomentPosture,
  archetype: ArchetypeType
): MatchupVerdict {
  return POSTURE_VS_ARCHETYPE[posture][archetype] ?? 'neutral';
}

/**
 * Display metadata per posture. The hints replace the per-option
 * bestAgainstHint/worstAgainstHint prose — they describe opponents in plain
 * language rather than naming archetypes, and every option of a posture shares
 * them, which is also what teaches the player that the postures are a grouping.
 */
export interface PostureMeta {
  label: string;
  /** One line on what the posture is trying to do. */
  summary: string;
  bestAgainstHint: string;
  worstAgainstHint: string;
  /**
   * The posture's colour, used everywhere it appears. Posture is the unit the
   * matchup keys off, so a player who learns "the blue ones beat this opponent"
   * has learned the actual mechanic — the colour is a shortcut to the grouping,
   * not decoration. Six distinct hues, all legible on the dark pixel ground.
   */
  color: string;
}

export const POSTURE_META: Record<KeyMomentPosture, PostureMeta> = {
  power: {
    label: 'Power',
    color: '#ef4444',
    summary: 'Overpower them and end it early',
    bestAgainstHint: 'retrievers who sit back, and anyone rushing the net',
    worstAgainstHint: 'bigger hitters, and players who feed off your pace',
  },
  net: {
    label: 'Net',
    color: '#f97316',
    summary: 'Take the net and finish short',
    bestAgainstHint: 'players who float the ball back, and anyone who needs time',
    worstAgainstHint: 'clean passers, and players more comfortable at the net than you',
  },
  neutralize: {
    label: 'Neutralize',
    color: '#38bdf8',
    summary: 'Absorb the pace and start the rally on your terms',
    bestAgainstHint: 'big hitters who will over-press if you give them nothing',
    worstAgainstHint: 'patient retrievers who are happy to rally all day',
  },
  deception: {
    label: 'Deception',
    color: '#a855f7',
    summary: 'Wrong-foot them',
    bestAgainstHint: 'players who commit early and load up on the ball',
    worstAgainstHint: 'anyone already moving forward — a short ball invites them in',
  },
  attrition: {
    label: 'Attrition',
    color: '#22c55e',
    summary: 'Extend it and make them pay later',
    bestAgainstHint: 'net-rushers who would rather not rally at all',
    worstAgainstHint: 'counterpunchers who want the long rally as much as you do',
  },
  variety: {
    label: 'Variety',
    color: '#eab308',
    summary: 'Refuse to be predictable',
    bestAgainstHint: 'players who settle into a rhythm and feed on it',
    worstAgainstHint: 'retrievers who chase everything down regardless',
  },
};
