/**
 * Venues: where a match is played. Each names its surface, and may carry
 * conditions both players feel (wind, heat, a home crowd), applied by the match
 * engines through core/venue.ts.
 *
 * Team matches and tournaments name a venue, and their surface is the venue's.
 * Practice matches pick a surface and have no venue.
 */

import type { Venue } from '../types/game';

// ============================================================================
// CLUB TIER — each team match is at the other club's courts
// ============================================================================

export const ASPEN_SLOPES_ACADEMY: Venue = {
  id: 'aspen_slopes_academy',
  name: 'Aspen Slopes Academy',
  surface: 'hard',
};

export const AZALEA_FOREST_CLUB: Venue = {
  id: 'azalea_forest_club',
  name: 'Azalea Forest Tennis Club',
  surface: 'grass',
};

export const COSMO_COMET: Venue = {
  id: 'cosmo_comet',
  name: 'Cosmo Comet',
  surface: 'clay',
};

export const SUNSET_DRIVE: Venue = {
  id: 'sunset_drive',
  name: 'Sunset Drive',
  surface: 'hard',
};

export const DOBRY_POMIDOR: Venue = {
  id: 'dobry_pomidor',
  name: 'Dobry Pomidor',
  surface: 'clay',
};

export const RIVERSIDE_ACADEMY: Venue = {
  id: 'riverside_academy',
  name: 'Riverside Academy',
  surface: 'hard',
};

// ============================================================================
// REGISTRY
// ============================================================================

const ALL_VENUES: Venue[] = [
  ASPEN_SLOPES_ACADEMY,
  AZALEA_FOREST_CLUB,
  COSMO_COMET,
  SUNSET_DRIVE,
  DOBRY_POMIDOR,
  RIVERSIDE_ACADEMY,
];

export const VENUES: Readonly<Record<string, Venue>> = Object.fromEntries(
  ALL_VENUES.map((venue) => [venue.id, venue]),
);

/** The venue with this id, or undefined for a match with none (practice). */
export function getVenue(id: string | undefined): Venue | undefined {
  return id === undefined ? undefined : VENUES[id];
}
