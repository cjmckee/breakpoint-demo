/**
 * The training-flavoured half of a minigame footer.
 *
 * These say "support stats" and "the core rep still counts", which is training's
 * vocabulary and nobody else's — a story minigame must not show them. They lived
 * in MinigameShell, which is meant to be context-agnostic, so they moved here to
 * sit beside the screen that means them.
 */

import React from 'react';

/** The "+N support stats earned" readout shown after all attempts resolve. */
export const SupportResult: React.FC<{ count: number; note: string }> = ({ count, note }) => (
  <div className="text-center">
    <div className={`text-5xl font-bold mb-1 ${count > 0 ? 'text-pixel-success' : 'text-pixel-text-muted'}`}>
      +{count}
    </div>
    <div className="text-sm text-pixel-text-muted">{note}</div>
    <div className="text-xs text-pixel-text-muted mt-2">
      {count === 0 ? 'no bonus stats — the core rep still counts' : `bonus ${count === 1 ? 'stat' : 'stats'} earned`}
    </div>
  </div>
);

/** Standard flavor note keyed by how many supports were earned (0-3). */
export function countNote(count: number, clean: string, ok: string, low: string, none: string): string {
  if (count >= 3) return clean;
  if (count === 2) return ok;
  if (count === 1) return low;
  return none;
}
