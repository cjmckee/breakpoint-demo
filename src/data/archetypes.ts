/**
 * Archetype System
 * Defines opponent tendencies and display data for each play style archetype.
 * Used by the tactical counter system to determine strongAgainst/weakAgainst relationships.
 */

import type { PlayStyle } from '../types';

export type ArchetypeType = PlayStyle['type'];

export interface ArchetypeTendency {
  type: ArchetypeType;
  label: string;
  servingTendency: string;
  returningTendency: string;
  rallyTendency: string;
}

export const ARCHETYPE_DATA: Record<ArchetypeType, ArchetypeTendency> = {
  aggressive: {
    type: 'aggressive',
    label: 'Aggressive Baseliner',
    servingTendency: 'Goes for big serves, looks to end points early',
    returningTendency: 'Attacks the return with power, tries to take control immediately',
    rallyTendency: 'Hits hard from the baseline, always looking for winners',
  },
  defensive: {
    type: 'defensive',
    label: 'Defensive Pusher',
    servingTendency: 'Reliable placement, focuses on starting the rally',
    returningTendency: 'Gets everything back deep, waits for your mistakes',
    rallyTendency: 'Stays patient, extends rallies, wears you down',
  },
  counterpuncher: {
    type: 'counterpuncher',
    label: 'Counter-Puncher',
    servingTendency: 'Safe serves, sets up to defend and counter',
    returningTendency: 'Slices deep, neutralizes pace, resets the point',
    rallyTendency: 'Absorbs pace, redirects with angles, waits for openings',
  },
  serve_volley: {
    type: 'serve_volley',
    label: 'Serve & Volleyer',
    servingTendency: 'Big serve then rushes the net immediately',
    returningTendency: 'Chips the return short, approaches the net',
    rallyTendency: 'Looks to get to the net at every opportunity',
  },
  all_court: {
    type: 'all_court',
    label: 'All-Court Player',
    servingTendency: 'Mixes up serve placement and power unpredictably',
    returningTendency: 'Adapts return based on serve, comfortable with any approach',
    rallyTendency: 'Switches between offense and defense fluidly',
  },
};

/**
 * Get the tendency description relevant to the current situation.
 * @param archetype - The opponent's archetype
 * @param isServing - Whether the opponent is serving
 */
export function getRelevantTendency(archetype: ArchetypeType, isServing: boolean): string {
  const data = ARCHETYPE_DATA[archetype];
  return isServing ? data.servingTendency : data.returningTendency;
}

/**
 * Get archetype label for display.
 */
export function getArchetypeLabel(archetype: ArchetypeType): string {
  return ARCHETYPE_DATA[archetype].label;
}
