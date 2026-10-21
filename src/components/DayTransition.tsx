/**
 * Day Transition
 *
 * A short card between one day and the next: a few seconds of "b-roll" (dawn over
 * the court, the player out for a morning jog, a ball knocking over the net, the ball
 * machine, the clay being swept, the coach arriving) while the day number rolls over.
 * It covers whatever the new morning opens with, so the first modal of the day fades
 * in from it rather than cutting in on the night.
 *
 * Tapping skips it. With reduced motion it is a still card for a moment instead.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { TimeManager } from '../game/TimeManager';
import { usePlayerAppearance } from '../hooks/usePlayerAppearance';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { PixelSprite } from './sprites/PixelSprite';
import { CHARACTERS } from '../data/characters';
import type { SpritePose } from '../types/appearance';
import { transitionsEnabled } from '../utils/transitionsEnabled';

/** Whole transition, fade in to fade out. Kept in step with `day-tx-*` in index.css. */
const DAY_TRANSITION_MS = 2400;
/** With reduced motion: long enough to read the new day, nothing moves. */
const STILL_TRANSITION_MS = 900;

const VIGNETTES = ['sunrise', 'jog', 'rally', 'machine', 'sweep', 'coach'] as const;
type Vignette = (typeof VIGNETTES)[number];

interface Transition {
  /** Bumps on every new day, so back-to-back days restart the animation. */
  key: number;
  fromDay: number;
  toDay: number;
  /** Set when the new day starts a new season. */
  newSeason: number | null;
  vignette: Vignette;
}

/** The dawn sky with a pixel court line and net along the bottom, shared by every vignette. */
const Court: React.FC = () => (
  <>
    <rect x="0" y="38" width="96" height="10" className="fill-[#2f6b45]" />
    <rect x="0" y="38" width="96" height="1" className="fill-[#e8e8e8]" />
    <rect x="47" y="30" width="2" height="9" className="fill-[#cfcfcf]" />
    <rect x="49" y="31" width="1" height="7" className="fill-[#9a9a9a]" />
  </>
);

const Sunrise: React.FC = () => (
  <svg viewBox="0 0 96 48" className="w-full h-full" shapeRendering="crispEdges">
    <rect width="96" height="48" className="day-tx-sky" />
    <g className="day-tx-moon">
      <rect x="18" y="8" width="6" height="6" className="fill-[#f2f0d8]" />
      <rect x="21" y="8" width="3" height="3" className="day-tx-moon-shadow" />
    </g>
    <g className="day-tx-sun">
      <rect x="66" y="40" width="10" height="10" className="fill-[#ffcf4a]" />
      <rect x="64" y="42" width="14" height="6" className="fill-[#ffcf4a]" />
    </g>
    <Court />
  </svg>
);

const Rally: React.FC = () => (
  <svg viewBox="0 0 96 48" className="w-full h-full" shapeRendering="crispEdges">
    <rect width="96" height="48" className="day-tx-sky day-tx-sky-early" />
    <Court />
    {/* Across the court from the right, and three bounces on the way. */}
    <g className="day-tx-ball-x">
      <g className="day-tx-ball-y">
        <rect x="0" y="0" width="3" height="3" className="fill-[#d7f04a]" />
      </g>
    </g>
  </svg>
);

const Jog: React.FC = () => {
  const appearance = usePlayerAppearance();
  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 96 48"
        className="absolute inset-0 w-full h-full"
        shapeRendering="crispEdges"
      >
        <rect width="96" height="48" className="day-tx-sky day-tx-sky-early" />
        <rect x="0" y="38" width="96" height="10" className="fill-[#2f6b45]" />
        <rect x="0" y="38" width="96" height="1" className="fill-[#e8e8e8]" />
      </svg>
      <div className="day-tx-jogger absolute bottom-[18%] left-0">
        <PixelSprite
          appearance={appearance}
          pose="run"
          facing="right"
          scale={3}
          fps={10}
          racquet={false}
        />
      </div>
    </div>
  );
};

/** Three balls from a ball machine on the baseline, lobbed over the net one after another. */
const BallMachine: React.FC = () => (
  <svg viewBox="0 0 96 48" className="w-full h-full" shapeRendering="crispEdges">
    <rect width="96" height="48" className="day-tx-sky day-tx-sky-early" />
    <Court />
    {[0, 1, 2].map((i) => (
      <g key={i} className="day-tx-shot-x" style={{ animationDelay: `${0.25 + i * 0.6}s` }}>
        <g className="day-tx-shot-y" style={{ animationDelay: `${0.25 + i * 0.6}s` }}>
          <rect x="14" y="31" width="3" height="3" className="fill-[#d7f04a]" />
        </g>
      </g>
    ))}
    {/* The machine: a grey box with a dark mouth and a hopper of balls on top. */}
    <rect x="5" y="31" width="9" height="7" className="fill-[#6b7280]" />
    <rect x="12" y="32" width="2" height="2" className="fill-[#1f2937]" />
    <rect x="6" y="29" width="7" height="2" className="fill-[#4b5563]" />
    <rect x="7" y="28" width="2" height="1" className="fill-[#d7f04a]" />
    <rect x="10" y="28" width="2" height="1" className="fill-[#d7f04a]" />
    <rect x="6" y="38" width="2" height="1" className="fill-[#1f2937]" />
    <rect x="11" y="38" width="2" height="1" className="fill-[#1f2937]" />
  </svg>
);

/** Footmarks left on the clay from yesterday, which the drag brush smooths away. */
const FOOTMARKS: ReadonlyArray<readonly [number, number]> = [
  [14, 22],
  [20, 26],
  [31, 15],
  [37, 19],
  [52, 30],
  [58, 34],
  [70, 12],
  [76, 16],
  [84, 36],
  [24, 40],
  [44, 8],
  [64, 42],
];

/** A clay court from above in early light, a drag brush pulled down it. */
const Sweep: React.FC = () => (
  <svg viewBox="0 0 96 48" className="w-full h-full" shapeRendering="crispEdges">
    <rect width="96" height="48" className="fill-[#c4673e]" />
    {FOOTMARKS.map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="3" height="2" className="fill-[#a8532f]" />
    ))}
    {/* The swept clay grows down behind the brush. */}
    <rect width="96" height="48" className="day-tx-swept fill-[#cd7147]" />
    {/* Lines stay on top: a baseline, the singles sidelines and the service line. */}
    <rect x="6" y="4" width="84" height="1" className="fill-[#f1ece4]" />
    <rect x="6" y="4" width="1" height="44" className="fill-[#f1ece4]" />
    <rect x="89" y="4" width="1" height="44" className="fill-[#f1ece4]" />
    <rect x="6" y="30" width="84" height="1" className="fill-[#f1ece4]" />
    <rect x="47" y="30" width="2" height="18" className="fill-[#f1ece4]" />
    <g className="day-tx-brush">
      <rect x="2" y="0" width="92" height="3" className="fill-[#5b3a24]" />
      <rect x="2" y="3" width="92" height="1" className="fill-[#3d2716]" />
      <rect x="47" y="-6" width="2" height="6" className="fill-[#8a6a4f]" />
    </g>
  </svg>
);

/** The coach walks on from the right, stops at the net and waves. */
const COACH = CHARACTERS.coach_gonzalez;
/** When the coach stops walking, as a share of the card; kept in step with `day-tx-coach`. */
const COACH_STOPS = 0.55;

const CoachArrives: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [walking, setWalking] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setWalking(false), DAY_TRANSITION_MS * COACH_STOPS);
    return () => window.clearTimeout(id);
  }, []);
  // With reduced motion the card is still, so the coach has already arrived.
  const pose: SpritePose = walking && !reducedMotion ? 'run' : 'cheer';
  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 96 48"
        className="absolute inset-0 w-full h-full"
        shapeRendering="crispEdges"
      >
        <rect width="96" height="48" className="day-tx-sky day-tx-sky-early" />
        <Court />
      </svg>
      <div className="day-tx-coach absolute bottom-[18%]">
        <PixelSprite
          appearance={COACH.appearance}
          pose={pose}
          facing={pose === 'run' ? 'left' : undefined}
          scale={3}
          fps={pose === 'run' ? 10 : 4}
          racquet={false}
        />
      </div>
    </div>
  );
};

const VIGNETTE_VIEWS: Record<Vignette, React.FC> = {
  sunrise: Sunrise,
  jog: Jog,
  rally: Rally,
  machine: BallMachine,
  sweep: Sweep,
  coach: CoachArrives,
};

/** Watches the calendar and plays the card whenever the day turns over. */
export const DayTransition: React.FC = () => {
  const [transition, setTransition] = useState<Transition | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!transitionsEnabled()) return;
    return useGameStore.subscribe((state, prev) => {
      // Loading a save or starting a career is not a new day.
      if (!prev.isInitialized || !state.isInitialized) return;
      if (state.gamePhase.type === 'player_creation') return;
      if (!TimeManager.isNewDay(prev.calendar, state.calendar)) return;
      if (state.calendar.currentDay < prev.calendar.currentDay) return;
      const toDay = TimeManager.seasonDay(state.calendar);
      setTransition((current) => ({
        key: (current?.key ?? 0) + 1,
        fromDay: TimeManager.seasonDay(prev.calendar),
        toDay,
        newSeason:
          state.calendar.currentSeason !== prev.calendar.currentSeason
            ? state.calendar.currentSeason
            : null,
        // Picked from the day, not the simulation's random stream.
        vignette: VIGNETTES[state.calendar.currentDay % VIGNETTES.length],
      }));
    });
  }, []);

  useEffect(() => {
    if (!transition) return;
    const id = window.setTimeout(
      () => setTransition(null),
      reducedMotion ? STILL_TRANSITION_MS : DAY_TRANSITION_MS,
    );
    return () => window.clearTimeout(id);
  }, [transition, reducedMotion]);

  const skip = useCallback(() => setTransition(null), []);

  if (!transition) return null;
  const View = VIGNETTE_VIEWS[transition.vignette];

  return (
    <div
      key={transition.key}
      className="day-tx fixed inset-0 z-[70] flex items-center justify-center bg-black/85 cursor-pointer"
      onClick={skip}
      role="status"
      aria-label={`Day ${transition.toDay}`}
      data-testid="day-transition"
      data-vignette={transition.vignette}
    >
      <div className="day-tx-card w-72 sm:w-96 border-8 border-pixel-border bg-pixel-bg">
        <div className="aspect-[2/1] overflow-hidden border-b-4 border-pixel-border">
          <View />
        </div>
        <div className="flex flex-col items-center gap-2 py-4">
          {transition.newSeason !== null && (
            <span className="text-xs text-pixel-accent">Season {transition.newSeason}</span>
          )}
          <div className="flex items-baseline gap-3 font-bold text-pixel-text">
            <span className="text-sm text-pixel-text-muted">DAY</span>
            {/* The old number rolls up and out as the new one rolls in. */}
            <span className="relative inline-block h-[1.5em] overflow-hidden text-3xl leading-[1.5em]">
              <span className="invisible">{transition.toDay}</span>
              {transition.newSeason === null && (
                <span className="day-tx-old absolute inset-0 text-center">
                  {transition.fromDay}
                </span>
              )}
              <span className="day-tx-new absolute inset-0 text-center text-pixel-accent">
                {transition.toDay}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
