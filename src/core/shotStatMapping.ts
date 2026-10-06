/**
 * Shot type → primary stat name.
 *
 * Descriptive only: this is what the match feed and telemetry report as the stat
 * behind a shot. Shot QUALITY is computed separately from the composite weights in
 * PlayerProfile.getRallyCompositeSpec(), and the two must agree about which stat
 * owns a shot.
 *
 * Order matters. Most shot types carry a wing suffix — `volley_forehand`,
 * `slice_backhand`, `return_forehand`, `drop_shot_forehand` — so a substring test
 * for 'forehand' matches nearly everything. The specific families are therefore
 * tested first and the bare wings last.
 */

import type { ShotType, StatName } from '../types';
import type { GamePhase } from '../types/archetype';

export function getPrimaryStatName(shotType: ShotType | string): StatName {
  const s = String(shotType);

  // Specific families first — each of these also contains 'forehand'/'backhand'.
  if (s.includes('serve')) return 'serve';
  if (s.includes('return')) return 'return';
  if (s.includes('volley')) return 'net'; // also covers half_volley_*
  if (s.includes('overhead')) return 'net';
  if (s.includes('drop')) return 'placement';
  if (s.includes('slice')) return 'slice'; // also covers defensive_slice_*
  if (s.includes('angle') || s.includes('lob') || s.includes('passing')) return 'placement';

  // Bare wings and their power/approach variants.
  if (s.includes('forehand')) return 'forehand';
  if (s.includes('backhand')) return 'backhand';

  return 'placement';
}

/**
 * The game phase a shot belongs to, for phase specialties: the serve it is, a
 * return, a net shot, or a forehand or backhand drive. Shots that run on another
 * stat (slices, drops, lobs, angles, passes) belong to no phase, so a forehand
 * specialty does not reach a forehand slice.
 */
export function phaseOfShot(shotType: ShotType | string): GamePhase | null {
  const s = String(shotType);
  if (s === 'serve_first') return 'first_serve';
  if (s === 'serve_second') return 'second_serve';
  const stat = getPrimaryStatName(s);
  if (stat === 'return' || stat === 'net' || stat === 'forehand' || stat === 'backhand') {
    return stat;
  }
  return null;
}
