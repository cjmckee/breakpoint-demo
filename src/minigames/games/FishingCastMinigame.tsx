/**
 * Fishing Minigame — "Cast & Reel"
 *
 * The first minigame that is not a training drill, and the reason round count and
 * score scale became inputs rather than constants: five casts, not three reps.
 *
 * You look into the water from the side, like the glass of an aquarium. A fish swims
 * around in it, holding one heading for a random 0.5–1.5s before turning somewhere
 * new. Steer your lure over the fish in any direction and keep it there until the fish
 * bites. The fish gets faster each cast, and if you take too long it loses interest.
 *
 * Nothing here knows why it is being played. It reports a score out of five and
 * the caller decides what that means. (The shell and the attempt hook still live
 * under components/training, which is where they were built; they are shared, not
 * training-specific.)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import { MinigameShell, RoundPips } from '../../components/training/MinigameShell';
import { useMinigameRounds } from '../../components/training/useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from '../../components/training/minigameJuice';
import { directionFromKey, type Direction } from '../../utils/gameKeys';
import type { MinigameProps } from '../types';

/** Five casts, ramping. Longer than a training drill, so the ramp is gentler. */
const CASTS = 5;
const SPEED_RAMP = [1, 1.06, 1.13, 1.21, 1.3];

const CAST_TIME = 5000; // ms before the fish loses interest
/**
 * How long the fish has to stay under the lure before it bites. Without a hold,
 * you could dash onto the fish and the fish's movement would hardly matter.
 */
const BITE_MS = 600;
const LEG_MIN_MS = 500; // shortest time the fish holds one heading
const LEG_MAX_MS = 1500; // longest
const FISH_SPEED = 95; // px/sec at ramp 1
const LURE_SPEED = 230; // px/sec — has to outrun the fish at the top of the ramp
const LURE_PX = 64; // lure box side
const FISH_MARGIN = 18; // px the fish keeps from the glass
const SPLASH_MS = 420;

interface Vec {
  x: number;
  y: number;
}

interface Fish extends Vec {
  vx: number;
  vy: number;
  /** Elapsed cast time (ms) at which the fish picks a new heading. */
  turnAt: number;
}

/** A fresh heading at the given speed, held for a random 0.5–1.5s from `elapsed`. */
function newLeg(speed: number, elapsed: number): Pick<Fish, 'vx' | 'vy' | 'turnAt'> {
  const angle = Math.random() * Math.PI * 2;
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    turnAt: elapsed + LEG_MIN_MS + Math.random() * (LEG_MAX_MS - LEG_MIN_MS),
  };
}

const DIRECTION_VECTORS: Record<Direction, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export const FishingCastMinigame: React.FC<MinigameProps> = ({
  onComplete,
  windowBonus = 0,
  onFirstAttempt,
  config,
}) => {
  // The game's own shape first, then whatever the caller asked for — so an event
  // can make it longer or shorter without the game losing its defaults.
  const rounds = useMinigameRounds(
    { minigame: 'fishing_cast', config: { rounds: CASTS, speedRamp: SPEED_RAMP, ...config } },
    onComplete,
    onFirstAttempt
  );
  const { frozen, trigger: hitstop } = useHitstop();
  const lureHalf = (LURE_PX * (1 + windowBonus)) / 2;

  const tankRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(false);
  const fishRef = useRef<Fish>({ x: 0, y: 0, vx: 0, vy: 0, turnAt: 0 });
  const lureRef = useRef<Vec>({ x: 0, y: 0 });
  /** Directions currently held, from keys and the on-screen pad alike. */
  const heldRef = useRef<Set<Direction>>(new Set());
  const rafRef = useRef<number | null>(null);
  const splashTimerRef = useRef<number | null>(null);

  const [view, setView] = useState({
    fish: { x: 0, y: 0 },
    facingRight: false,
    lure: { x: 0, y: 0 },
    timeFrac: 0,
    biteFrac: 0,
  });
  const [burst, setBurst] = useState<Burst | null>(null);
  /** Where the cast ended, kept on screen briefly so a miss is legible. */
  const [splash, setSplash] = useState<{ id: number; x: number; y: number; caught: boolean } | null>(null);

  const playing = rounds.phase === 'playing';
  const onFish = view.biteFrac > 0;

  useEffect(
    () => () => {
      if (splashTimerRef.current !== null) window.clearTimeout(splashTimerRef.current);
    },
    []
  );

  const settle = useCallback(
    (caught: boolean) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      const tank = tankRef.current;
      const w = tank?.clientWidth || 1;
      const h = tank?.clientHeight || 1;
      const at = caught ? fishRef.current : lureRef.current;
      // Sparks and the splash sit on a % grid, so convert out of tank pixels.
      const x = (at.x / w) * 100;
      const y = (at.y / h) * 100;
      const now = performance.now();
      setBurst({ id: now, x, y, tone: caught ? 'good' : 'bad' });
      setSplash({ id: now, x, y, caught });
      if (splashTimerRef.current !== null) window.clearTimeout(splashTimerRef.current);
      splashTimerRef.current = window.setTimeout(() => setSplash(null), SPLASH_MS);
      if (caught) {
        hitstop();
        audioManager.playSfx('smash');
      } else {
        audioManager.playSfx('ui_click');
      }
      rounds.commit(caught);
    },
    [rounds, hitstop]
  );

  // Arm a fresh cast: the lure starts in the middle, and the fish starts somewhere
  // far enough away that you have to go and get it.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    const tank = tankRef.current;
    const w = tank?.clientWidth || 600;
    const h = tank?.clientHeight || 256;
    const speed = FISH_SPEED * rounds.speed;

    lureRef.current = { x: w / 2, y: h / 2 };
    let spawn: Vec = { x: FISH_MARGIN, y: FISH_MARGIN };
    for (let i = 0; i < 12; i++) {
      spawn = {
        x: FISH_MARGIN + Math.random() * (w - FISH_MARGIN * 2),
        y: FISH_MARGIN + Math.random() * (h - FISH_MARGIN * 2),
      };
      if (Math.hypot(spawn.x - w / 2, spawn.y - h / 2) > Math.min(w, h) * 0.45) break;
    }
    fishRef.current = { ...spawn, ...newLeg(speed, 0) };
    heldRef.current.clear();
    runningRef.current = true;
    setSplash(null);

    let elapsed = 0;
    let bite = 0;
    let last = performance.now();
    const loop = (now: number): void => {
      if (!runningRef.current) return;
      if (frozen.current) {
        last = now;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dtMs = now - last;
      const dt = dtMs / 1000;
      last = now;
      elapsed += dtMs;

      // Re-read the tank every frame so a resize mid-cast can't strand either one outside it.
      const tw = tankRef.current?.clientWidth || w;
      const th = tankRef.current?.clientHeight || h;

      const fish = fishRef.current;
      if (elapsed >= fish.turnAt) Object.assign(fish, newLeg(speed, elapsed));
      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      // Bounce off the glass so the fish never leaves the tank.
      if (fish.x < FISH_MARGIN) { fish.x = FISH_MARGIN; fish.vx = Math.abs(fish.vx); }
      if (fish.x > tw - FISH_MARGIN) { fish.x = tw - FISH_MARGIN; fish.vx = -Math.abs(fish.vx); }
      if (fish.y < FISH_MARGIN) { fish.y = FISH_MARGIN; fish.vy = Math.abs(fish.vy); }
      if (fish.y > th - FISH_MARGIN) { fish.y = th - FISH_MARGIN; fish.vy = -Math.abs(fish.vy); }

      // Diagonals are normalized so they are no faster than a straight line.
      let mx = 0;
      let my = 0;
      heldRef.current.forEach((d) => {
        mx += DIRECTION_VECTORS[d].x;
        my += DIRECTION_VECTORS[d].y;
      });
      const mag = Math.hypot(mx, my);
      const lure = lureRef.current;
      if (mag > 0) {
        lure.x = clamp(lure.x + (mx / mag) * LURE_SPEED * dt, lureHalf, tw - lureHalf);
        lure.y = clamp(lure.y + (my / mag) * LURE_SPEED * dt, lureHalf, th - lureHalf);
      }

      const covered = Math.abs(fish.x - lure.x) <= lureHalf && Math.abs(fish.y - lure.y) <= lureHalf;
      // If the fish slips out from under the lure, the bite starts over.
      bite = covered ? bite + dtMs : 0;

      const timeFrac = elapsed / CAST_TIME;
      setView({
        fish: { x: fish.x, y: fish.y },
        facingRight: fish.vx > 0,
        lure: { x: lure.x, y: lure.y },
        timeFrac,
        biteFrac: Math.min(1, bite / BITE_MS),
      });
      if (bite >= BITE_MS) {
        settle(true);
        return;
      }
      if (timeFrac >= 1) {
        settle(false);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  // Keyboard: arrows or WASD, held. Holding two of them at once moves diagonally.
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      if (!dir) return;
      e.preventDefault();
      heldRef.current.add(dir);
    };
    const up = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      if (dir) heldRef.current.delete(dir);
    };
    // A key released while the window is unfocused never sends keyup.
    const blur = (): void => heldRef.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const hold = (dir: Direction) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      heldRef.current.add(dir);
    },
    onPointerUp: () => heldRef.current.delete(dir),
    onPointerLeave: () => heldRef.current.delete(dir),
    onPointerCancel: () => heldRef.current.delete(dir),
  });

  const padButton = (dir: Direction, glyph: string, label: string): React.ReactElement => (
    <button
      type="button"
      aria-label={label}
      disabled={!playing}
      {...hold(dir)}
      className="font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-3 text-2xl select-none touch-none active:translate-y-1 disabled:opacity-50"
    >
      {glyph}
    </button>
  );

  return (
    <MinigameShell
      title="Cast & Reel"
      subtitle="Steer the lure onto the fish and hold it there until it bites. Five casts."
      controls="Arrows or WASD | Move the lure"
      phase={rounds.phase}
      onStart={rounds.begin}
      footer={
        <>
          <div className="mb-4">
            <RoundPips {...rounds} />
          </div>

          {rounds.phase === 'done' ? (
            <div className="text-center">
              <div
                className={`text-5xl font-bold mb-1 ${
                  rounds.score > 0 ? 'text-pixel-success' : 'text-pixel-text-muted'
                }`}
              >
                {rounds.score}
              </div>
              <div className="text-sm text-pixel-text-muted">
                {rounds.score >= 5
                  ? 'Every single cast. Nobody will believe you.'
                  : rounds.score >= 3
                    ? 'A respectable haul.'
                    : rounds.score >= 1
                      ? 'Well. You caught something.'
                      : 'The fish are fine. You are not.'}
              </div>
              {/* "fish" is its own plural, so this needs no count agreement. */}
              <div className="text-xs text-pixel-text-muted mt-2">fish caught</div>
            </div>
          ) : (
            // Movement is held constantly, so it gets the biggest targets on screen.
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div />
              {padButton('up', '▲', 'Move lure up')}
              <div />
              {padButton('left', '◀', 'Move lure left')}
              {padButton('down', '▼', 'Move lure down')}
              {padButton('right', '▶', 'Move lure right')}
            </div>
          )}
        </>
      }
    >
      <div className="relative w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4 p-3">
        <ComboBadge streak={rounds.streak} />

        {/* How long until the fish loses interest */}
        <div
          className="absolute top-0 left-0 h-1 bg-pixel-warning z-10"
          style={{ width: `${Math.max(0, (1 - view.timeFrac) * 100)}%` }}
        />

        {/* The tank. Everything inside is positioned in its own pixels. */}
        <div
          ref={tankRef}
          className="relative h-64 w-full border-2 border-pixel-border rounded bg-pixel-secondary/20 overflow-hidden"
        >
          {playing && (
            <>
              {/* The lure */}
              <div
                className={`absolute border-2 border-dashed rounded ${
                  onFish ? 'border-pixel-success bg-pixel-success/20' : 'border-pixel-accent bg-pixel-accent/10'
                }`}
                style={{
                  left: view.lure.x,
                  top: view.lure.y,
                  width: lureHalf * 2,
                  height: lureHalf * 2,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* How close the fish is to biting */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-pixel-success"
                  style={{ width: `${view.biteFrac * 100}%` }}
                />
              </div>

              {/* The fish. The emoji faces left, so mirror it when it swims right. */}
              <div
                className="absolute text-2xl select-none pointer-events-none"
                style={{
                  left: view.fish.x,
                  top: view.fish.y,
                  transform: `translate(-50%, -50%) scaleX(${view.facingRight ? -1 : 1})`,
                }}
              >
                🐟
              </div>
            </>
          )}

          {/* Where the cast ended. The outer div owns the centering transform because
              animate-pixel-scale animates transform and would clobber it. */}
          {splash && (
            <div
              className="absolute"
              style={{ left: `${splash.x}%`, top: `${splash.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                key={splash.id}
                className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-lg animate-pixel-scale ${
                  splash.caught
                    ? 'bg-pixel-success/30 border-pixel-success'
                    : 'bg-pixel-bg border-pixel-error'
                }`}
              >
                {splash.caught ? '🐟' : '💧'}
              </div>
            </div>
          )}

          <Sparks burst={burst} />
        </div>

        {playing && (
          <div className="absolute top-2 left-2 text-xs text-pixel-text-muted z-10">
            Cast {rounds.round + 1}/{rounds.total}
          </div>
        )}
      </div>
    </MinigameShell>
  );
};
