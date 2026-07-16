/**
 * Shared presentation for the training minigames.
 *
 * Every core anchor has its own minigame with a distinct interaction, but they all
 * share the same frame and the same result readout so the training screen feels like
 * one system. Each minigame implements onComplete(score: 0..1); scoreToCount() turns
 * that into 1-3 supports. See docs/training-redesign.md.
 */

import React from 'react';
import type { SupportCount } from '../../game/AnchorTrainingSystem';

export interface MinigameProps {
  /** Called once the interaction resolves, with a 0..1 performance score. */
  onComplete: (score: number) => void;
}

export const MinigameShell: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="bg-pixel-card border-4 border-pixel-border p-6">
    <div className="text-center mb-4">
      <h3 className="text-xl font-bold text-pixel-text">{title}</h3>
      <p className="text-sm text-pixel-text-muted">{subtitle}</p>
    </div>
    {children}
  </div>
);

/** The shared "+N support stats earned" readout shown after the interaction resolves. */
export const SupportResult: React.FC<{ count: SupportCount; note: string }> = ({ count, note }) => (
  <div className="text-center">
    <div className="text-5xl font-bold text-green-500 mb-1">+{count}</div>
    <div className="text-sm text-pixel-text-muted">{note}</div>
    <div className="text-xs text-pixel-text-muted mt-2">
      support {count === 1 ? 'stat' : 'stats'} earned
    </div>
  </div>
);

/** Standard flavor note keyed by how many supports were earned. */
export function countNote(count: SupportCount, clean: string, ok: string, low: string): string {
  return count === 3 ? clean : count === 2 ? ok : low;
}
