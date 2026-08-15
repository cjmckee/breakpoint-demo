/**
 * Shared presentation for the training minigames.
 *
 * Every core anchor has its own minigame with a distinct interaction, but they all
 * share the same frame, the same 3-attempt round pips, and the same result readout so
 * the training screen feels like one system. Each minigame runs three pass/fail
 * attempts (see useMinigameRounds) and reports the number of successes (0-3) via
 * onComplete. See docs/training-redesign.md.
 *
 * Every game opens on a standardized start screen (phase === 'ready'): the how-to line
 * plus a Start button, with Space/Enter to begin — so the first attempt is never a
 * free miss from being dropped straight into play. The arena (children) and footer
 * (round pips + the real control buttons) stay mounted underneath that start screen the
 * whole time — only the arena gets the overlay — so the buttons are sitting in their
 * final resting place before play begins instead of popping in at go-time.
 */

import React, { useEffect } from 'react';
import type { MinigameRounds, RoundPhase } from './useMinigameRounds';
import { TOTAL_ROUNDS } from './useMinigameRounds';
import { isActionKey } from '../../utils/gameKeys';

export interface MinigameProps {
  /** Called once all attempts resolve, with the number of supports earned (0-3). */
  onComplete: (successes: number) => void;
  /** Fractional widening of the success window from EffectKey.MINIGAME_WINDOW_BONUS (0.10 = +10%). */
  windowBonus?: number;
  /** Called once, the moment the player commits their first attempt. */
  onFirstAttempt?: () => void;
}

/** Start overlay shown over the arena while phase === 'ready'. Space/Enter (or the button) begins. */
const StartGate: React.FC<{ onStart: () => void; controls?: string }> = ({ onStart, controls }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isActionKey(e) || e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-pixel-bg/95 border-2 border-pixel-border p-4 text-center">
      {/* Keyboard shortcuts, then the reminder that the buttons below are already the
          real controls — this is the only place that's stated. */}
      <div className="flex flex-col items-center gap-2">
        {controls && (
          <p className="text-sm text-pixel-text uppercase tracking-wide leading-relaxed">{controls}</p>
        )}
        <p className="text-xs text-pixel-text-muted">or use the buttons below once you start</p>
      </div>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onStart();
        }}
        className="font-bold border-4 transition-all duration-150 ease-in-out cursor-pointer bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light active:translate-y-1 px-8 py-2 text-base select-none touch-none"
      >
        ▶ Start
      </button>
      <p className="text-xs text-pixel-text-muted">Space or Enter to begin</p>
    </div>
  );
};

export const MinigameShell: React.FC<{
  title: string;
  subtitle: string;
  phase: RoundPhase;
  onStart: () => void;
  /** Optional short controls hint shown on the start screen (e.g. "← / → move · Space strike"). */
  controls?: string;
  /** Arena content — the canvas the minigame runs in. Covered by the start overlay while ready. */
  children: React.ReactNode;
  /** Round pips + the action buttons, rendered below the arena. Stays visible (disabled)
   *  even before the game starts, so the buttons never appear for the first time at go-time. */
  footer: React.ReactNode;
}> = ({ title, subtitle, phase, onStart, controls, children, footer }) => {
  const ready = phase === 'ready';
  return (
    <div className="bg-pixel-card border-4 border-pixel-border p-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-pixel-text">{title}</h3>
        <p className="text-sm text-pixel-text-muted">{subtitle}</p>
      </div>
      <div className="relative">
        {children}
        {ready && <StartGate onStart={onStart} controls={controls} />}
      </div>
      {footer}
    </div>
  );
};

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
          ? 'bg-pixel-success border-pixel-success'
          : played === false
            ? 'bg-pixel-error border-pixel-error'
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

/**
 * Primary action button for a minigame. Fires on pointer DOWN (not click) so touch
 * and mouse both register at the moment of press — important for the timing games,
 * where waiting for the click/tap-release adds latency. `touch-none`/`select-none`
 * stop a press from scrolling the page or selecting text on mobile.
 *
 * Deliberately oversized: this is the button players hammer under time pressure, so it
 * gets a target roughly twice the height of a standard button.
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
    className="font-bold border-4 transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light active:translate-y-1 px-8 py-10 text-lg w-full select-none touch-none"
  >
    {children}
  </button>
);
