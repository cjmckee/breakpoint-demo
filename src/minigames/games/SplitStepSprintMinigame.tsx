/**
 * Split-Step Sprint — the Power + Quickness drill.
 *
 * Wait on the split step; an arrow names a direction; push it, and you sprint to
 * that cone. A button lights there: mash it until the meter fills. Reacting is
 * the Quickness half, mashing the Power half. Three reps, each a little faster.
 *
 * The rules live in splitStep.ts (pure, checked by splitStepCheck). This file is
 * the clock, the input and the drawing.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, RoundPips } from '../shared/MinigameShell';
import { RepResult, countNote } from '../shared/trainingReadout';
import type { MinigameProps } from '../types';
import { useMinigameRounds } from '../shared/useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from '../shared/minigameJuice';
import { MinigameArena, ARENA_W, ARENA_H, u, uMin, pctY } from '../shared/MinigameArena';
import { directionFromKey, type Direction } from '../../utils/gameKeys';
import { random } from '../../core/random';
import {
  MASH_BUTTONS,
  MASH_TARGET,
  SPRINT_DIRECTIONS,
  planRep,
  stepRep,
  type MashButton,
  type MissReason,
  type RepEvent,
  type RepPlan,
  type RepStage,
} from './splitStep';

const CENTRE = { x: ARENA_W / 2, y: ARENA_H / 2 };
/** The four cones, in arena units. */
const CONES: Record<Direction, { x: number; y: number }> = {
  up: { x: CENTRE.x, y: 9 },
  down: { x: CENTRE.x, y: ARENA_H - 9 },
  left: { x: 14, y: CENTRE.y },
  right: { x: ARENA_W - 14, y: CENTRE.y },
};
const ARROWS: Record<Direction, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
const MISS_TEXT: Record<MissReason, string> = {
  early: 'Too early!',
  wrong_way: 'Wrong way!',
  too_slow: 'Too slow!',
  out_of_time: 'Out of gas!',
};

/** Digit keys 1-4, on the main row or the number pad. */
function buttonFromKey(e: KeyboardEvent): MashButton | null {
  const m = /^(?:Digit|Numpad)([1-4])$/.exec(e.code);
  return m ? (Number(m[1]) as MashButton) : null;
}

export const SplitStepSprintMinigame: React.FC<MinigameProps> = ({
  onComplete,
  windowBonus = 0,
  onStart,
  config,
}) => {
  const rounds = useMinigameRounds({ minigame: 'split_step', config }, onComplete, onStart);
  const { frozen, trigger: hitstop } = useHitstop();

  const planRef = useRef<RepPlan | null>(null);
  const stageRef = useRef<RepStage>({ kind: 'wait' });
  const clockRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [plan, setPlan] = useState<RepPlan | null>(null);
  const [stage, setStage] = useState<RepStage>({ kind: 'wait' });
  const [burst, setBurst] = useState<Burst | null>(null);

  const playing = rounds.phase === 'playing';

  /** Feed one event through the rules; settle the attempt when the rep ends. */
  const dispatch = useCallback(
    (event: RepEvent) => {
      const p = planRef.current;
      if (!p) return;
      const before = stageRef.current;
      const next = stepRep(p, before, event);
      if (next === before) return;
      stageRef.current = next;
      setStage(next);

      if (next.kind === 'react') audioManager.playSfx('serve');
      if (next.kind === 'mash' && before.kind === 'react') audioManager.playSfx('hit_ground');
      if (next.kind === 'passed' || next.kind === 'missed') {
        const at = CONES[p.direction];
        const spot = next.kind === 'missed' && before.kind !== 'mash' ? CENTRE : at;
        setBurst({
          id: performance.now(),
          x: spot.x,
          y: pctY(spot.y),
          tone: next.kind === 'passed' ? 'good' : 'bad',
        });
        if (next.kind === 'passed') {
          hitstop();
          audioManager.playSfx('hit_volley');
        }
        rounds.commit(next.kind === 'passed');
      }
    },
    [hitstop, rounds],
  );

  // Arm a fresh rep for each playing attempt, and run its clock. The clock stands
  // still while the game is frozen (hitstop or the menu), so a paused rep is not lost.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    const p = planRep([random(), random(), random()], rounds.speed, windowBonus);
    planRef.current = p;
    stageRef.current = { kind: 'wait' };
    clockRef.current = 0;
    setPlan(p);
    setStage({ kind: 'wait' });

    let last = performance.now();
    const loop = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!frozen.current) {
        clockRef.current += dt;
        dispatch({ type: 'tick', t: clockRef.current });
      }
      const k = stageRef.current.kind;
      if (k !== 'passed' && k !== 'missed') rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  const pushDirection = useCallback(
    (direction: Direction) => {
      if (phaseIsLive(rounds.phase) && !frozen.current) {
        dispatch({ type: 'direction', t: clockRef.current, direction });
      }
    },
    [dispatch, frozen, rounds.phase],
  );
  const pressButton = useCallback(
    (button: MashButton) => {
      if (phaseIsLive(rounds.phase) && !frozen.current) {
        dispatch({ type: 'button', t: clockRef.current, button });
      }
    },
    [dispatch, frozen, rounds.phase],
  );

  // Keyboard: arrows or WASD to sprint, 1-4 to mash. Held keys repeat, and a held
  // key is not a mash, so repeats are ignored.
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      const button = buttonFromKey(e);
      if (!dir && !button) return;
      e.preventDefault();
      if (e.repeat) return;
      if (dir) pushDirection(dir);
      if (button) pressButton(button);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [pushDirection, pressButton]);

  const ran = stage.kind === 'mash' || stage.kind === 'passed';
  const missedRunning = stage.kind === 'missed' && stage.reason === 'out_of_time';
  const runner = plan && (ran || missedRunning) ? CONES[plan.direction] : CENTRE;
  const presses = stage.kind === 'mash' ? stage.presses : stage.kind === 'passed' ? MASH_TARGET : 0;
  const showButton = plan && (stage.kind === 'mash' || stage.kind === 'passed' || missedRunning);

  const caption = !playing
    ? ''
    : stage.kind === 'wait'
      ? 'Split step… wait for it'
      : stage.kind === 'react'
        ? 'Go!'
        : stage.kind === 'mash'
          ? `Mash ${plan?.button ?? ''}!`
          : stage.kind === 'passed'
            ? 'Got there!'
            : MISS_TEXT[stage.reason];

  const pad = (dir: Direction): React.ReactNode => (
    <button
      key={dir}
      type="button"
      disabled={!playing}
      data-testid={`sprint-dir-${dir}`}
      aria-label={`Sprint ${dir}`}
      onPointerDown={(e) => {
        e.preventDefault();
        pushDirection(dir);
      }}
      className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-3 text-xl select-none touch-none active:translate-y-1 disabled:opacity-50"
    >
      {ARROWS[dir]}
    </button>
  );

  return (
    <MinigameShell
      title="Split-Step Sprint"
      subtitle="React to the arrow, then mash the button that lights"
      controls="Arrows or WASD | Sprint · 1-4 | Mash"
      phase={rounds.phase}
      onStart={rounds.begin}
      footer={
        <>
          <div className="mb-4">
            <RoundPips {...rounds} />
          </div>
          {rounds.phase === 'done' ? (
            <RepResult
              count={rounds.successes}
              note={countNote(
                rounds.successes,
                'Three sprints, three full meters!',
                'Two clean sprints. Quick feet.',
                'One clean sprint. Stay on your toes!',
                'Caught flat-footed. Watch the arrow.',
              )}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">{SPRINT_DIRECTIONS.map(pad)}</div>
              <div className="flex gap-2">
                {MASH_BUTTONS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    disabled={!playing}
                    data-testid={`sprint-button-${b}`}
                    aria-label={`Mash ${b}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      pressButton(b);
                    }}
                    className={`flex-1 font-bold border-4 py-6 text-2xl select-none touch-none active:translate-y-1 disabled:opacity-50 ${
                      showButton && plan?.button === b
                        ? 'bg-pixel-accent border-pixel-accent-dark text-pixel-on-accent'
                        : 'bg-pixel-secondary border-pixel-border text-pixel-text'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      }
    >
      <MinigameArena>
        {/* What a driver needs to play the rep without reading the drawing. */}
        <span
          hidden
          data-testid="sprint-arena"
          data-stage={playing ? stage.kind : rounds.phase}
          data-cue={stage.kind === 'wait' || !plan ? '' : plan.direction}
          data-button={showButton && plan ? plan.button : ''}
          data-presses={presses}
        />
        <ComboBadge streak={rounds.streak} />

        {/* Court: a centre mark and four flat marker discs, drawn round so none of them
            reads as an arrow. */}
        <div
          className="absolute border-2 border-dashed border-pixel-border rounded-full"
          style={{
            left: u(CENTRE.x),
            top: u(CENTRE.y),
            width: u(12),
            height: u(12),
            transform: 'translate(-50%, -50%)',
          }}
        />
        {SPRINT_DIRECTIONS.map((dir) => (
          <div
            key={dir}
            className={`absolute rounded-full border-2 ${
              plan && stage.kind !== 'wait' && plan.direction === dir
                ? 'bg-yellow-300 border-yellow-100'
                : 'bg-pixel-warning/50 border-pixel-warning/70'
            }`}
            style={{
              left: u(CONES[dir].x),
              top: u(CONES[dir].y),
              width: uMin(5, 16),
              height: uMin(2.5, 8),
              transform: 'translate(-50%, -50%)',
            }}
            aria-hidden="true"
          />
        ))}

        {/* The runner: you. */}
        <div
          className="absolute rounded-full bg-pixel-ball border-2 border-pixel-text transition-[left,top] duration-150 ease-out"
          style={{
            left: u(runner.x),
            top: u(runner.y),
            width: uMin(5, 18),
            height: uMin(5, 18),
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* The arrow: the cue to react to, big and in the middle of everything. */}
        {playing && plan && stage.kind === 'react' && (
          <div
            className="absolute font-bold leading-none text-yellow-300 animate-pixel-scale"
            style={{
              left: u(CENTRE.x),
              top: u(CENTRE.y),
              fontSize: uMin(18, 56),
              transform: 'translate(-50%, -50%)',
            }}
          >
            {ARROWS[plan.direction]}
          </div>
        )}

        {/* The button to mash and its meter, by the cone. */}
        {showButton && plan && (
          <div
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: u(CONES[plan.direction].x),
              top: u(plan.direction === 'up' ? CONES.up.y + 12 : CONES[plan.direction].y - 12),
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              className="bg-pixel-accent text-pixel-on-accent font-bold border-2 border-pixel-accent-dark text-center"
              style={{ fontSize: uMin(4, 14), minWidth: uMin(7, 26), padding: uMin(0.6, 2) }}
            >
              {plan.button}
            </span>
            <span
              className="relative bg-pixel-bg border-2 border-pixel-border"
              style={{ width: u(16), height: uMin(2, 8) }}
            >
              <span
                className="absolute inset-y-0 left-0 bg-pixel-success"
                style={{ width: `${(presses / MASH_TARGET) * 100}%` }}
              />
            </span>
          </div>
        )}

        {caption && (
          <div
            className={`absolute inset-x-0 text-center font-bold ${
              stage.kind === 'missed'
                ? 'text-pixel-error'
                : stage.kind === 'passed'
                  ? 'text-pixel-success'
                  : 'text-pixel-text'
            }`}
            style={{ bottom: u(2), fontSize: uMin(2.6, 10) }}
          >
            {caption}
          </div>
        )}

        <Sparks burst={burst} />
      </MinigameArena>
    </MinigameShell>
  );
};

function phaseIsLive(phase: string): boolean {
  return phase === 'playing';
}
