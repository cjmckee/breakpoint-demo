/**
 * Return Minigame — "Read & Return"
 *
 * A serve crosses from the far side at a random angle and speed, bounces off the court,
 * and kicks up toward your return line. You slide a strike zone UP and DOWN that line
 * and swing as the ball passes through it — one swing per serve.
 *
 * The bounce is the whole game. Every serve bounces true — angle in = angle out — so the
 * crossing height is there to be read the moment the ball is struck. Project the line,
 * mirror it off the floor, and get moving (anticipation); the bounce point and speed both
 * vary, so a lazy read still leaves you scrambling on the short leg (reaction).
 *
 * Three serves, one per attempt, each faster than the last. Every clean return banks a
 * support. See docs/training-redesign.md.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import {
  MinigameShell,
  SupportResult,
  RoundPips,
  MinigameActionButton,
  countNote,
  type MinigameProps,
} from './MinigameShell';
import { useMinigameRounds, roundSpeed } from './useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from './minigameJuice';
import { directionFromKey, isActionKey } from '../../utils/gameKeys';

const LINE_X = 16; // % — the return line the strike zone rides
const ENTRY_X = 104; // % — just off the right edge
const FLOOR = 90; // % — where the serve bounces
const BOUNCE_MIN = 40; // % — nearest the bounce is ever allowed to the line
const BOUNCE_MAX = 70;
const ENTRY_Y_MIN = 6; // % — keeps the serve on screen when it enters
const ENTRY_Y_MAX = 76;
const CROSS_MIN = 18; // % — band the ball can cross the line in (must be reachable)
const CROSS_MAX = 76;
const MIN_REACTION = 0.34; // s — floor on the bounce→line reaction budget
const ZONE_W = 56; // px — strike zone, kept in px so it doesn't stretch with the box
const ZONE_H = 66;
const ZONE_SPEED = 124; // %/sec the zone slides
const SPEED_MIN = 52; // %/sec horizontal
const SPEED_SPAN = 9;

interface Serve {
  /** Height the ball enters the right edge at. */
  entryY: number;
  bounceX: number;
  vx: number; // %/sec, magnitude — unchanged through the bounce
  vy: number; // %/sec, down before the bounce and up after it
  /** Height the ball meets the return line at — the answer the player is solving for. */
  crossY: number;
}

/**
 * Plans a serve backwards from where it should cross the line, so every serve is both
 * reachable and on screen. Both flight legs are straight (no gravity) and the bounce is a
 * true reflection, which is what keeps the read legible at speed: mirror the incoming
 * line off the floor and that's the crossing height.
 *
 * With entryY = FLOOR - (FLOOR - crossY) * ratio, the feasible crossY band inverts
 * straight out of the entry-height limits — and across the whole bounce range that band
 * is never narrower than ~17%, so a single roll always lands a valid serve.
 */
function planServe(speed: number): Serve {
  // Never bounce so close to the line that there's no time to react to the rise.
  const nearest = Math.min(BOUNCE_MAX - 8, Math.max(BOUNCE_MIN, LINE_X + MIN_REACTION * speed));
  const bounceX = nearest + Math.random() * (BOUNCE_MAX - nearest);
  const ratio = (ENTRY_X - bounceX) / (bounceX - LINE_X);
  const lo = Math.max(CROSS_MIN, FLOOR - (FLOOR - ENTRY_Y_MIN) / ratio);
  const hi = Math.min(CROSS_MAX, FLOOR - (FLOOR - ENTRY_Y_MAX) / ratio);
  const crossY = lo + Math.random() * (hi - lo);
  return {
    entryY: FLOOR - (FLOOR - crossY) * ratio,
    bounceX,
    vx: speed,
    vy: (FLOOR - crossY) / ((bounceX - LINE_X) / speed),
    crossY,
  };
}

export const ReadReturnMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();

  const boxRef = useRef<HTMLDivElement | null>(null);
  // Zone half-extents as % of the box, derived from the px size so it stays a fixed shape.
  const halfRef = useRef({ x: 6, y: 11 });
  const [half, setHalf] = useState(halfRef.current);

  const ballRef = useRef({ x: ENTRY_X, y: 0, vx: 0, vy: 0 });
  const bouncedRef = useRef(false);
  const zoneRef = useRef(50);
  const moveRef = useRef(0);
  const swungRef = useRef(false);
  const liveRef = useRef(false);
  const tokenRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [ball, setBall] = useState({ x: ENTRY_X, y: 0, visible: false });
  const [zone, setZone] = useState(50);
  const [inZone, setInZone] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  /** Where the live serve WILL bounce — shown from the moment it's struck, so the read
   *  can start before the ball gets there. Flips to `struck` on contact. */
  const [bounceSpot, setBounceSpot] = useState<{ x: number; struck: boolean } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);

  const playing = rounds.phase === 'playing';

  // Measure the box so the zone's px size can be expressed in the ball's % space.
  // Re-runs on phase change because the court only mounts once the start gate clears.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const next = {
        x: ((ZONE_W * (1 + windowBonus)) / 2 / rect.width) * 100,
        y: ((ZONE_H * (1 + windowBonus)) / 2 / rect.height) * 100,
      };
      halfRef.current = next;
      setHalf(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [windowBonus, rounds.phase]);

  /** One serve per attempt: whatever happens to it settles the attempt. */
  const resolve = useCallback(
    (good: boolean) => {
      if (!liveRef.current) return;
      liveRef.current = false;
      const b = ballRef.current;
      setBurst({ id: performance.now(), x: b.x, y: b.y, tone: good ? 'good' : 'bad' });
      if (good) {
        hitstop();
        audioManager.playSfx('hit_volley');
      }
      setBall((prev) => ({ ...prev, visible: false }));
      setBounceSpot(null); // the mark belongs to this serve only
      rounds.commit(good);
    },
    [hitstop, rounds]
  );

  const launchServe = useCallback(() => {
    const token = ++tokenRef.current;
    const speed = (SPEED_MIN + Math.random() * SPEED_SPAN) * roundSpeed(rounds.round);
    const serve = planServe(speed);

    ballRef.current = { x: ENTRY_X, y: serve.entryY, vx: -serve.vx, vy: serve.vy };
    bouncedRef.current = false;
    swungRef.current = false;
    liveRef.current = true;
    setTrail([]);
    setBounceSpot({ x: serve.bounceX, struck: false });
    setBall({ x: ENTRY_X, y: serve.entryY, visible: true });
    audioManager.playSfx('serve');

    let last = performance.now();
    const loop = (now: number): void => {
      if (token !== tokenRef.current || !liveRef.current) return;
      if (frozen.current) {
        last = now;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const b = ballRef.current;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (!bouncedRef.current && b.y >= FLOOR) {
        b.y = FLOOR;
        b.vy = -serve.vy; // true reflection — horizontal speed rides through untouched
        bouncedRef.current = true;
        setBounceSpot({ x: serve.bounceX, struck: true });
        audioManager.playSfx('hit_ground');
      }

      const h = halfRef.current;
      zoneRef.current = Math.max(h.y, Math.min(100 - h.y, zoneRef.current + moveRef.current * ZONE_SPEED * dt));
      setZone(zoneRef.current);
      setBall({ x: b.x, y: b.y, visible: true });
      setTrail((prev) => [{ x: b.x, y: b.y }, ...prev].slice(0, 6));
      setInZone(Math.abs(b.y - zoneRef.current) <= h.y && Math.abs(b.x - LINE_X) <= h.x);

      if (b.x < LINE_X - h.x) {
        resolve(false); // through the zone untouched
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [rounds.round, resolve, frozen]);

  const swing = useCallback(() => {
    if (!liveRef.current || swungRef.current) return;
    swungRef.current = true;
    const b = ballRef.current;
    const h = halfRef.current;
    const good = Math.abs(b.y - zoneRef.current) <= h.y && Math.abs(b.x - LINE_X) <= h.x;
    if (!good) audioManager.playSfx('ui_click');
    resolve(good);
  }, [resolve]);

  // Arm a fresh serve for each playing attempt.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    zoneRef.current = 50;
    setZone(50);
    launchServe();
    return () => {
      liveRef.current = false;
      tokenRef.current += 1;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  // Keyboard: ↑ / ↓ or W / S slide the zone (held via keydown + keyup), Space swings.
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      if (dir === 'up') { e.preventDefault(); moveRef.current = -1; }
      else if (dir === 'down') { e.preventDefault(); moveRef.current = 1; }
      else if (isActionKey(e)) { e.preventDefault(); swing(); }
    };
    const up = (e: KeyboardEvent): void => {
      const dir = directionFromKey(e);
      if ((dir === 'up' && moveRef.current === -1) || (dir === 'down' && moveRef.current === 1)) {
        moveRef.current = 0;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [swing]);

  const hold = (dir: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); moveRef.current = dir; },
    onPointerUp: () => { moveRef.current = 0; },
    onPointerLeave: () => { moveRef.current = 0; },
  });

  return (
    <MinigameShell
      title="Read & Return"
      subtitle="Read the bounce, slide the zone, time the return"
      controls="↑ ↓ or W S | Move · Space | Return"
      phase={rounds.phase}
      onStart={rounds.begin}
    >
      <div ref={boxRef} className="relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
        <ComboBadge streak={rounds.streak} />

        {/* Court floor */}
        <div className="absolute inset-x-0 bg-pixel-secondary/25" style={{ top: `${FLOOR}%`, bottom: 0 }} />
        <div className="absolute inset-x-0 h-0.5 bg-pixel-border" style={{ top: `${FLOOR}%` }} />

        {/* The return line the zone rides */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-pixel-border"
          style={{ left: `${LINE_X}%` }}
        />

        {/* Where this serve lands: a dashed target while it's in the air, a solid pop on
            contact. Visible from the strike so the mirror can be projected early. */}
        {playing && bounceSpot && (
          <div
            className="absolute"
            style={{ left: `${bounceSpot.x}%`, top: `${FLOOR}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div
              key={`${bounceSpot.x}-${bounceSpot.struck}`}
              className={`w-5 h-5 rounded-full border-2 ${
                bounceSpot.struck
                  ? 'border-pixel-warning bg-pixel-warning/40 animate-pixel-scale'
                  : 'border-dashed border-pixel-warning/70'
              }`}
            />
          </div>
        )}

        {/* Strike zone */}
        <div
          className={`absolute border-4 ${inZone ? 'border-pixel-success bg-pixel-success/20' : 'border-pixel-accent/70'}`}
          style={{
            left: `${LINE_X}%`,
            top: `${zone}%`,
            width: `${half.x * 2}%`,
            height: `${half.y * 2}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Flight trail — the angle is the read, so it needs to be legible at speed */}
        {playing && ball.visible && trail.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-pixel-text pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity: (1 - i / trail.length) * 0.3,
            }}
          />
        ))}

        {/* The serve */}
        {playing && ball.visible && (
          <div
            className="absolute w-9 h-9 rounded-full bg-pixel-ball border-2 border-pixel-text flex items-center justify-center text-base pointer-events-none"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            🎾
          </div>
        )}

        <Sparks burst={burst} />
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Three serves read, three returned!',
            'Two clean returns. Reading it well.',
            'One clean return. Watch the bounce!',
            'Aced — pick the line up earlier.'
          )}
        />
      ) : (
        <div className="space-y-2">
          {/* Movement gets its own full-width row — held constantly, so it needs the
              biggest targets on screen. */}
          <div className="flex gap-2">
            <button
              type="button"
              {...hold(-1)}
              className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1"
            >
              ▲
            </button>
            <button
              type="button"
              {...hold(1)}
              className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1"
            >
              ▼
            </button>
          </div>
          <MinigameActionButton onPress={swing} disabled={!playing}>
            {playing ? 'Return!  (Space)' : rounds.lastPass ? 'Cleaned it!' : 'Missed'}
          </MinigameActionButton>
        </div>
      )}
    </MinigameShell>
  );
};
