/**
 * Return Minigame — "Read & Return"
 *
 * A serve crosses from the far side at a random angle and speed, bounces off the court,
 * and kicks up toward your return line. You slide a strike zone UP and DOWN that line
 * and swing as the ball passes through it — one swing per serve.
 *
 * The bounce is the whole game. Before it you read the ball's line and its spin tag and
 * start moving (anticipation); after it you have a fraction of a second to correct and
 * swing (reaction). Kick serves drop in and jump up steeply off a bounce near the line;
 * skidders arrive steep and stay low off a deep bounce; flat balls reflect true. The
 * exact kick is only knowable once the ball actually bounces, so the tag narrows the
 * guess but never answers it.
 *
 * Each set is three serves — one of each spin, in random order — and all three must come
 * back to bank the support. Three sets in all. See docs/training-redesign.md.
 *
 * PLAYTEST: the start screen carries a bounce-model switch. "Spin kicks" is the model
 * above; "True bounce" makes every serve a pure reflection (angle in = angle out), which
 * is solvable the moment the ball is struck. Once one wins, drop the switch and the
 * losing branch.
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
import { useMinigameRounds } from './useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from './minigameJuice';
import { directionFromKey, isActionKey } from '../../utils/gameKeys';

const PER_SET = 3;
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
const ZONE_W = 46; // px — strike zone, kept in px so it doesn't stretch with the box
const ZONE_H = 56;
const ZONE_SPEED = 104; // %/sec the zone slides
const SERVE_GAP = 420; // ms between serves in a set
const SPEED_MIN = 58; // %/sec horizontal
const SPEED_SPAN = 10;
/** Per-round speed ramp — later sets arrive faster, so the read has to be earlier. */
const ROUND_SPEED = [1, 1.1, 1.22];

type Spin = 'flat' | 'topspin' | 'slice';
type BounceModel = 'spin' | 'true';

const SPIN_ORDER: Spin[] = ['flat', 'topspin', 'slice'];

/** Horizontal speed carried through the bounce: a kick drags, a skid runs on. */
const SPIN_VX: Record<Spin, number> = { flat: 1, topspin: 0.9, slice: 1.12 };

/**
 * Where each spin prefers to bounce, as a fraction of the legal bounce range. Kick
 * serves land short (steep jump, less time to react); skidders land deep (low, flat,
 * more time but easy to over-anticipate).
 */
const SPIN_BOUNCE: Record<Spin, [number, number]> = {
  topspin: [0, 0.4],
  flat: [0.2, 0.8],
  slice: [0.6, 1],
};

/** Vertical speed multiplier through the bounce. Flat is a true reflection. */
const kickFor = (spin: Spin): number => {
  if (spin === 'topspin') return 1.35 + Math.random() * 0.45;
  if (spin === 'slice') return 0.35 + Math.random() * 0.25;
  return 1;
};

const SPIN_TAG: Record<Spin, { label: string; ring: string; text: string }> = {
  topspin: { label: 'KICK', ring: 'border-amber-400', text: 'text-amber-400' },
  flat: { label: 'FLAT', ring: 'border-pixel-text', text: 'text-pixel-text-muted' },
  slice: { label: 'SKID', ring: 'border-cyan-400', text: 'text-cyan-400' },
};

interface Serve {
  spin: Spin;
  /** Height the ball enters the right edge at. */
  entryY: number;
  bounceX: number;
  vx: number; // %/sec, magnitude, before the bounce
  vyIn: number; // %/sec downward
  vxOut: number; // %/sec, magnitude, after the bounce
  vyOut: number; // %/sec upward
  /** Height the ball meets the return line at — the answer the player is solving for. */
  crossY: number;
}

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Plans a serve backwards from where it should cross the line, so every serve is both
 * reachable and on screen. Both flight legs are straight (no gravity) — the bounce is
 * the only direction change, which is what keeps the read legible at speed.
 *
 * With entryY = FLOOR - (FLOOR - crossY) * ratio, the feasible crossY band inverts
 * straight out of the entry-height limits, so no rejection sampling on crossY is needed.
 */
function planServe(spin: Spin, speed: number): Serve {
  const vxOut = speed * SPIN_VX[spin];
  // Never bounce so close to the line that there's no time to react to the kick.
  const nearest = Math.min(BOUNCE_MAX - 8, Math.max(BOUNCE_MIN, LINE_X + MIN_REACTION * vxOut));
  const [f0, f1] = SPIN_BOUNCE[spin];
  const span = BOUNCE_MAX - nearest;

  for (let attempt = 0; attempt < 24; attempt++) {
    const bounceX = nearest + span * (f0 + Math.random() * (f1 - f0));
    const kick = kickFor(spin);
    const ratio = (ENTRY_X - bounceX) / ((bounceX - LINE_X) * kick);
    const lo = Math.max(CROSS_MIN, FLOOR - (FLOOR - ENTRY_Y_MIN) / ratio);
    const hi = Math.min(CROSS_MAX, FLOOR - (FLOOR - ENTRY_Y_MAX) / ratio);
    if (hi - lo < 10) continue; // degenerate band — re-roll the bounce and the kick
    const crossY = lo + Math.random() * (hi - lo);
    const tPost = (bounceX - LINE_X) / vxOut;
    const vyOut = (FLOOR - crossY) / tPost;
    return {
      spin,
      entryY: FLOOR - (FLOOR - crossY) * ratio,
      bounceX,
      vx: speed,
      vyIn: vyOut / kick,
      vxOut,
      vyOut,
      crossY,
    };
  }

  // Deterministic flat serve — only reachable if 24 rolls all landed degenerate.
  const bounceX = 58;
  const crossY = 48;
  const tPost = (bounceX - LINE_X) / speed;
  const vyOut = (FLOOR - crossY) / tPost;
  return {
    spin,
    entryY: FLOOR - (FLOOR - crossY) * ((ENTRY_X - bounceX) / (bounceX - LINE_X)),
    bounceX,
    vx: speed,
    vyIn: vyOut,
    vxOut: speed,
    vyOut,
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

  // Locked in on the start screen so a whole session runs one model — that's the compare.
  const modeRef = useRef<BounceModel>('spin');
  const [mode, setMode] = useState<BounceModel>('spin');

  const orderRef = useRef<Spin[]>(SPIN_ORDER);
  const ballRef = useRef({ x: ENTRY_X, y: 0, vx: 0, vy: 0 });
  const bouncedRef = useRef(false);
  const zoneRef = useRef(50);
  const moveRef = useRef(0);
  const swungRef = useRef(false);
  const liveRef = useRef(false);
  const runningRef = useRef(false);
  const idxRef = useRef(0);
  const returnedRef = useRef(0);
  const tokenRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const serveNextRef = useRef<() => void>(() => {});

  const [ball, setBall] = useState({ x: ENTRY_X, y: 0, visible: false });
  const [spin, setSpin] = useState<Spin>('flat');
  const [zone, setZone] = useState(50);
  const [inZone, setInZone] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  const [bounceMark, setBounceMark] = useState<{ id: number; x: number } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [returned, setReturned] = useState(0);
  const [soClose, setSoClose] = useState(false);

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

  const finishSet = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    liveRef.current = false;
    setSoClose(returnedRef.current === PER_SET - 1);
    rounds.commit(returnedRef.current === PER_SET);
  }, [rounds]);

  const resolve = useCallback(
    (good: boolean) => {
      if (!liveRef.current) return;
      liveRef.current = false;
      const b = ballRef.current;
      setBurst({ id: performance.now(), x: b.x, y: b.y, tone: good ? 'good' : 'bad' });
      if (good) {
        returnedRef.current += 1;
        setReturned(returnedRef.current);
        hitstop();
        audioManager.playSfx('hit_volley');
      }
      setBall((prev) => ({ ...prev, visible: false }));
      idxRef.current += 1;
      timerRef.current = window.setTimeout(() => serveNextRef.current(), SERVE_GAP);
    },
    [hitstop]
  );

  const serveNext = useCallback(() => {
    if (!runningRef.current) return;
    if (idxRef.current >= PER_SET) {
      finishSet();
      return;
    }
    const token = ++tokenRef.current;
    const pick = modeRef.current === 'true' ? 'flat' : orderRef.current[idxRef.current];
    const speed = (SPEED_MIN + Math.random() * SPEED_SPAN) * ROUND_SPEED[Math.min(rounds.round, 2)];
    const serve = planServe(pick, speed);

    ballRef.current = { x: ENTRY_X, y: serve.entryY, vx: -serve.vx, vy: serve.vyIn };
    bouncedRef.current = false;
    swungRef.current = false;
    liveRef.current = true;
    setSpin(pick);
    setTrail([]);
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
        b.vx = -serve.vxOut;
        b.vy = -serve.vyOut;
        bouncedRef.current = true;
        setBounceMark({ id: now, x: b.x });
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
  }, [rounds.round, finishSet, resolve, frozen]);

  useEffect(() => {
    serveNextRef.current = serveNext;
  }, [serveNext]);

  const swing = useCallback(() => {
    if (!liveRef.current || swungRef.current) return;
    swungRef.current = true;
    const b = ballRef.current;
    const h = halfRef.current;
    const good = Math.abs(b.y - zoneRef.current) <= h.y && Math.abs(b.x - LINE_X) <= h.x;
    if (!good) audioManager.playSfx('ui_click');
    resolve(good);
  }, [resolve]);

  // Arm a fresh set for each playing round: one serve of each spin, in random order.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    idxRef.current = 0;
    returnedRef.current = 0;
    runningRef.current = true;
    orderRef.current = shuffle(SPIN_ORDER);
    zoneRef.current = 50;
    setZone(50);
    setReturned(0);
    setSoClose(false);
    serveNext();
    return () => {
      runningRef.current = false;
      liveRef.current = false;
      tokenRef.current += 1;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
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

  const tag = SPIN_TAG[spin];
  const showTag = mode === 'spin';

  return (
    <MinigameShell
      title="Read & Return"
      subtitle="Read the bounce, slide the zone, block it back"
      controls="↑ ↓ or W S move · Space return"
      phase={rounds.phase}
      onStart={rounds.begin}
      startAside={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-pixel-text-muted uppercase tracking-wide">Bounce</span>
          {(['spin', 'true'] as BounceModel[]).map((m) => (
            <button
              key={m}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); modeRef.current = m; setMode(m); }}
              className={`border-2 px-2 py-1 select-none touch-none ${
                mode === m ? 'border-pixel-accent text-pixel-text' : 'border-pixel-border text-pixel-text-muted'
              }`}
            >
              {m === 'spin' ? 'Spin kicks' : 'True bounce'}
            </button>
          ))}
        </div>
      }
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

        {/* Bounce flash */}
        {bounceMark && (
          <div
            key={bounceMark.id}
            className="absolute w-5 h-5 rounded-full border-2 border-pixel-warning/80 animate-pixel-scale"
            style={{ left: `${bounceMark.x}%`, top: `${FLOOR}%`, transform: 'translate(-50%, -50%)' }}
          />
        )}

        {/* Strike zone */}
        <div
          className={`absolute border-4 rounded ${inZone ? 'border-green-500 bg-green-500/20' : 'border-pixel-accent/70'}`}
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
            className="absolute pointer-events-none"
            style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className={`w-8 h-8 rounded-full bg-pixel-accent border-2 flex items-center justify-center text-sm ${
                showTag ? tag.ring : 'border-pixel-text'
              }`}
            >
              🎾
            </div>
            {showTag && (
              <span
                className={`absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] font-bold tracking-wide ${tag.text}`}
              >
                {tag.label}
              </span>
            )}
          </div>
        )}

        {/* Waiting on the next serve */}
        {playing && !ball.visible && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-pixel-text-muted animate-pulse">◀</div>
        )}

        <Sparks burst={burst} />

        {playing && (
          <div className="absolute top-2 left-2 text-xs text-pixel-text-muted">
            {returned}/{PER_SET} returned
          </div>
        )}
        {rounds.phase === 'transition' && soClose && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-pixel-warning">2/3 — so close!</span>
          </div>
        )}
      </div>

      {showTag && rounds.phase !== 'done' && (
        <p className="text-[10px] text-pixel-text-muted text-center mb-3">
          <span className="text-amber-400">KICK</span> jumps up ·{' '}
          <span className="text-pixel-text">FLAT</span> bounces true ·{' '}
          <span className="text-cyan-400">SKID</span> stays low
        </p>
      )}

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Nine serves read, nine returned!',
            'Two clean sets. Reading it well.',
            'One clean set. Watch the bounce!',
            'Aced — pick the kick up earlier.'
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
