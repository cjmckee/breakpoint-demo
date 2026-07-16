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

/**
 * Primary action button for a minigame. Fires on pointer DOWN (not click) so touch
 * and mouse both register at the moment of press — important for the timing games,
 * where waiting for the click/tap-release adds latency. `touch-none`/`select-none`
 * stop a press from scrolling the page or selecting text on mobile.
 */
export const MinigameActionButton: React.FC<{
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onPress, disabled = false, children }) => (
  <button
    type="button"
    disabled={disabled}
    onPointerDown={(e) => {
      e.preventDefault();
      if (!disabled) onPress();
    }}
    className="font-bold border-4 transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light active:translate-y-1 px-8 py-3 text-lg w-full select-none touch-none"
  >
    {children}
  </button>
);
