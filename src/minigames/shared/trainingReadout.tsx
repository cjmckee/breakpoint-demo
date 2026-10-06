/**
 * The training-flavoured half of a minigame footer.
 *
 * These talk about clean reps and the session's pay, which is training's
 * vocabulary and nobody else's — a story minigame must not show them. They lived
 * in MinigameShell, which is meant to be context-agnostic, so they have a file of
 * their own that only the training games import.
 */

import React from 'react';

/** The "+N clean reps" readout shown after all attempts resolve. */
export const RepResult: React.FC<{ count: number; note: string }> = ({ count, note }) => (
  <div className="text-center">
    <div
      className={`text-5xl font-bold mb-1 ${count > 0 ? 'text-pixel-success' : 'text-pixel-text-muted'}`}
    >
      +{count}
    </div>
    <div className="text-sm text-pixel-text-muted">{note}</div>
    <div className="text-xs text-pixel-text-muted mt-2">
      {count === 0
        ? 'no clean reps — the session still pays its base'
        : `clean ${count === 1 ? 'rep' : 'reps'} — each one adds to the session's pay`}
    </div>
  </div>
);

/** Standard flavor note keyed by how many clean reps landed (0-3). */
export function countNote(
  count: number,
  clean: string,
  ok: string,
  low: string,
  none: string,
): string {
  if (count >= 3) return clean;
  if (count === 2) return ok;
  if (count === 1) return low;
  return none;
}
