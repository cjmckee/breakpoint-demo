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
import { MinigameShell, RoundPips, MinigameActionButton } from '../shared/MinigameShell';
import { SupportResult, countNote } from '../shared/trainingReadout';
import type { MinigameProps } from '../types';
import { useMinigameRounds } from '../shared/useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from '../shared/minigameJuice';
import { MinigameArena, ARENA_H, u, uMin, pctY } from '../shared/MinigameArena';
import { directionFromKey, isActionKey } from '../../utils/gameKeys';

// Everything is in arena units (see MinigameArena). The court is anchored to the
// bottom of the arena and COURT_H tall; the space above it is headroom the serve
// never uses and the zone can't reach.
const COURT_H = 43.8;
const COURT_TOP = ARENA_H - COURT_H;
const LINE_X = 16; // the return line the strike zone rides
const ENTRY_X = 104; // just off the right edge
const FLOOR = COURT_TOP + 39.5; // where the serve bounces
const BOUNCE_MIN = 40; // nearest the bounce is ever allowed to the line
const BOUNCE_MAX = 70;
const ENTRY_Y_MIN = COURT_TOP + 2.6; // keeps the serve on screen when it enters
const ENTRY_Y_MAX = COURT_TOP + 33.3;
const CROSS_MIN = COURT_TOP + 7.9; // band the ball can cross the line in (must be reachable)
const CROSS_MAX = COURT_TOP + 33.3;
const MIN_REACTION = 0.34; // s — floor on the bounce→line reaction budget
const ZONE_W = 9.6; // strike zone
const ZONE_H = 11.3;
const ZONE_START = COURT_TOP + 21.9; // where the zone waits for each serve
const ZONE_SPEED = 54.4; // units/sec the zone slides
const SPEED_MIN = 52; // units/sec horizontal
const SPEED_SPAN = 9;

interface Serve {
  /** Height the ball enters the right edge at. */
  entryY: number;
  bounceX: number;
  vx: number; // units/sec, magnitude — unchanged through the bounce
  vy: number; // units/sec, down before the bounce and up after it
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
 * is never narrower than ~7 units, so a single roll always lands a valid serve.
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

export const ReadReturnMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt, config }) => {
  const rounds = useMinigameRounds({ minigame: 'read_return', config }, onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();

  const half = { x: (ZONE_W * (1 + windowBonus)) / 2, y: (ZONE_H * (1 + windowBonus)) / 2 };
  const halfRef = useRef(half);
  halfRef.current = half;

  const ballRef = useRef({ x: ENTRY_X, y: 0, vx: 0, vy: 0 });
  const bouncedRef = useRef(false);
  const zoneRef = useRef(ZONE_START);
  const moveRef = useRef(0);
  const swungRef = useRef(false);
  const liveRef = useRef(false);
  const tokenRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [ball, setBall] = useState({ x: ENTRY_X, y: 0, visible: false });
  const [zone, setZone] = useState(ZONE_START);
  const [inZone, setInZone] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  /** Where the live serve WILL bounce — shown from the moment it's struck, so the read
   *  can start before the ball gets there. Flips to `struck` on contact. */
  const [bounceSpot, setBounceSpot] = useState<{ x: number; struck: boolean } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);

  const playing = rounds.phase === 'playing';

  /** One serve per attempt: whatever happens to it settles the attempt. */
  const resolve = useCallback(
    (good: boolean) => {
      if (!liveRef.current) return;
      liveRef.current = false;
      const b = ballRef.current;
      setBurst({ id: performance.now(), x: b.x, y: pctY(b.y), tone: good ? 'good' : 'bad' });
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
    const speed = (SPEED_MIN + Math.random() * SPEED_SPAN) * rounds.speed;
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
      zoneRef.current = Math.max(COURT_TOP + h.y, Math.min(ARENA_H - h.y, zoneRef.current + moveRef.current * ZONE_SPEED * dt));
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
    if (!liveRef.current || swungRef.current || frozen.current) return;
    swungRef.current = true;
    const b = ballRef.current;
    const h = halfRef.current;
    const good = Math.abs(b.y - zoneRef.current) <= h.y && Math.abs(b.x - LINE_X) <= h.x;
    if (!good) audioManager.playSfx('ui_click');
    resolve(good);
  }, [resolve, frozen]);

  // Arm a fresh serve for each playing attempt.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    zoneRef.current = ZONE_START;
    setZone(ZONE_START);
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

  const idle = rounds.phase === 'ready';

  return (
    <MinigameShell
      title="Read & Return"
      subtitle="Read the bounce, slide the zone, time the return"
      controls="↑ ↓ or W S | Move · Space | Return"
      phase={rounds.phase}
      onStart={rounds.begin}
      footer={
        <>
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
                  disabled={!playing}
                  {...hold(-1)}
                  className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1 disabled:opacity-50"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={!playing}
                  {...hold(1)}
                  className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text py-4 text-2xl select-none touch-none active:translate-y-1 disabled:opacity-50"
                >
                  ▼
                </button>
              </div>
              <MinigameActionButton onPress={swing} disabled={!playing}>
                {idle || playing ? 'Return!  (Space)' : rounds.lastPass ? 'Cleaned it!' : 'Missed'}
              </MinigameActionButton>
            </div>
          )}
        </>
      }
    >
      <MinigameArena>
        <ComboBadge streak={rounds.streak} />

        {/* Court floor */}
        <div className="absolute inset-x-0 bg-pixel-secondary/25" style={{ top: u(FLOOR), bottom: 0 }} />
        <div className="absolute inset-x-0 h-0.5 bg-pixel-border" style={{ top: u(FLOOR) }} />

        {/* The return line the zone rides */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-pixel-border"
          style={{ left: u(LINE_X) }}
        />

        {/* Where this serve lands: a dashed target while it's in the air, a solid pop on
            contact. Visible from the strike so the mirror can be projected early. */}
        {playing && bounceSpot && (
          <div
            className="absolute"
            style={{ left: u(bounceSpot.x), top: u(FLOOR), transform: 'translate(-50%, -50%)' }}
          >
            <div
              key={`${bounceSpot.x}-${bounceSpot.struck}`}
              style={{ width: uMin(3.4, 14), height: uMin(3.4, 14) }}
              className={`rounded-full border-2 ${
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
            left: u(LINE_X),
            top: u(zone),
            width: u(half.x * 2),
            height: u(half.y * 2),
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Flight trail — the angle is the read, so it needs to be legible at speed */}
        {playing && ball.visible && trail.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-pixel-text pointer-events-none"
            style={{
              left: u(p.x),
              top: u(p.y),
              transform: 'translate(-50%, -50%)',
              opacity: (1 - i / trail.length) * 0.3,
            }}
          />
        ))}

        {/* The serve */}
        {playing && ball.visible && (
          <div
            className="absolute rounded-full bg-pixel-ball border-2 border-pixel-text flex items-center justify-center pointer-events-none"
            style={{
              left: u(ball.x),
              top: u(ball.y),
              width: uMin(6.2, 24),
              height: uMin(6.2, 24),
              fontSize: uMin(2.7, 11),
              transform: 'translate(-50%, -50%)',
            }}
          >
            🎾
          </div>
        )}

        <Sparks burst={burst} />
      </MinigameArena>
    </MinigameShell>
  );
};
