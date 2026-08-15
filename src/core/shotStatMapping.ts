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

import type { ShotType, StatName } from '../types/index.js';

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
