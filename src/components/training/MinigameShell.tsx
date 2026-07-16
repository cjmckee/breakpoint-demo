/**
 * Shared presentation for the training minigames.
 *
 * Every core anchor has its own minigame with a distinct interaction, but they all
 * share the same frame, the same 3-attempt round pips, and the same result readout so
 * the training screen feels like one system. Each minigame runs three pass/fail
 * attempts (see useMinigameRounds) and reports the number of successes (0-3) via
 * onComplete. See docs/training-redesign.md.
 */

import React from 'react';
import type { MinigameRounds } from './useMinigameRounds';
import { TOTAL_ROUNDS } from './useMinigameRounds';

export interface MinigameProps {
  /** Called once all attempts resolve, with the number of supports earned (0-3). */
  onComplete: (successes: number) => void;
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

/**
 * Three-slot progress row: each attempt shows hit (green) or miss (red) once played,
 * the current attempt gets an accent ring, and unplayed attempts are dim.
 */
export const RoundPips: React.FC<MinigameRounds> = ({ round, results, successes, phase }) => (
  <div className="flex items-center justify-center gap-2">
    {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
      const played = results[i];
      const isCurrent = phase !== 'done' && i === round;
      const cls =
        played === true
          ? 'bg-green-500 border-green-400'
          : played === false
            ? 'bg-red-600 border-red-500'
            : isCurrent
              ? 'bg-pixel-bg border-pixel-accent'
              : 'bg-pixel-bg border-pixel-border';
      return <div key={i} className={`w-9 h-3 border-2 ${cls}`} />;
    })}
    <span className="text-xs text-pixel-text-muted ml-2">
      {successes}/{TOTAL_ROUNDS}
    </span>
  </div>
);

/** The shared "+N support stats earned" readout shown after all attempts resolve. */
export const SupportResult: React.FC<{ count: number; note: string }> = ({ count, note }) => (
  <div className="text-center">
    <div className={`text-5xl font-bold mb-1 ${count > 0 ? 'text-green-500' : 'text-pixel-text-muted'}`}>
      +{count}
    </div>
    <div className="text-sm text-pixel-text-muted">{note}</div>
    <div className="text-xs text-pixel-text-muted mt-2">
      {count === 0 ? 'no support stats — core work still counts' : `support ${count === 1 ? 'stat' : 'stats'} earned`}
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
