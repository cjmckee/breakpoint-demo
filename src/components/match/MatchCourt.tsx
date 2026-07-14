/**
 * Match Court
 * The court centerpiece with a lightweight rally animation. Each point, the ball and the two
 * player tokens play out a synthesized rally derived from the real point result
 * (server, winner, outcome, rally length, decisive shot) — rough, but it follows the match:
 * serve from the correct side, a rally of roughly the right length, ending on the winner's
 * side, with a net finish when the decisive shot is a volley/overhead.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { CourtSurface } from '../../types';
import type { PointResult as SimplePointResult } from '../../types/keyMoments';
import { useMatchStore } from '../../stores/matchStore';

interface MatchCourtProps {
  courtSurface: CourtSurface;
  /** Optional overlay (toasts) rendered over the court. */
  overlay?: React.ReactNode;
}

const getCourtColors = (surface: CourtSurface): { court: string; lines: string } => {
  switch (surface) {
    case 'clay':   return { court: '#CD853F', lines: '#FFFFFF' };
    case 'grass':  return { court: '#228B22', lines: '#FFFFFF' };
    case 'carpet': return { court: '#6B46C1', lines: '#FFFFFF' };
    case 'hard':
    default:       return { court: '#4A90E2', lines: '#FFFFFF' };
  }
};

// Court coordinate space matches the SVG viewBox (0..300 x, 0..150 y). Net at x=150.
const NET = 150;
const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const cornerY = (): number => (Math.random() < 0.5 ? rand(24, 46) : rand(104, 126));

interface Pt { x: number; y: number }
interface Frame { ball: Pt; p: Pt; o: Pt; dur: number }

const IDLE: Frame = { ball: { x: NET, y: 75 }, p: { x: 40, y: 75 }, o: { x: 260, y: 75 }, dur: 200 };

/** Token positions that "chase" the ball on their own half and recover otherwise. */
const followTokens = (ball: Pt): { p: Pt; o: Pt } => {
  const onLeft = ball.x < NET;
  const p = onLeft
    ? { x: clamp(ball.x - 10, 20, 138), y: clamp(ball.y, 20, 130) }
    : { x: 36, y: clamp(75 + (ball.y - 75) * 0.25, 40, 110) };
  const o = !onLeft
    ? { x: clamp(ball.x + 10, 162, 280), y: clamp(ball.y, 20, 130) }
    : { x: 264, y: clamp(75 + (ball.y - 75) * 0.25, 40, 110) };
  return { p, o };
};

const frameFor = (ball: Pt, dur: number): Frame => ({ ball, ...followTokens(ball), dur });

/** Build a rough rally sequence for a completed point. */
const buildRally = (r: SimplePointResult): Frame[] => {
  const server: 'player' | 'opponent' = r.server ?? 'player';
  const winner = r.winner;
  const loser: 'player' | 'opponent' = winner === 'player' ? 'opponent' : 'player';
  const returner: 'player' | 'opponent' = server === 'player' ? 'opponent' : 'player';
  const outcome = (r.outcome ?? '').toLowerCase();
  const netFinish = /volley|overhead|smash|drop/.test((r.shotType ?? '').toLowerCase());

  const frames: Frame[] = [];
  const serveStart: Pt = server === 'player' ? { x: rand(22, 32), y: rand(50, 100) } : { x: rand(268, 278), y: rand(50, 100) };
  frames.push(frameFor(serveStart, 90));

  const deepCorner = (side: 'player' | 'opponent'): Pt =>
    side === 'player' ? { x: rand(20, 52), y: cornerY() } : { x: rand(248, 280), y: cornerY() };
  const netArea = (side: 'player' | 'opponent'): Pt =>
    side === 'player' ? { x: rand(120, 146), y: rand(55, 95) } : { x: rand(154, 180), y: rand(55, 95) };

  if (outcome.includes('ace')) {
    // Untouched serve into the returner's corner.
    frames.push(frameFor(deepCorner(returner), 120));
    return frames;
  }
  if (outcome.includes('double_fault') || outcome === 'fault') {
    // Serve dumped into the net on the server's side.
    frames.push(frameFor(netArea(server), 130));
    return frames;
  }

  // Rally: alternate sides for roughly half the shot count, then finish on the loser's side.
  const hops = clamp(Math.round((r.rallyLength ?? 4) / 2), 1, 4);
  let onLeft = server === 'player'; // ball currently on the server's side
  for (let i = 0; i < hops; i++) {
    onLeft = !onLeft;
    const isLast = i === hops - 1;
    if (!isLast) {
      const mid: Pt = onLeft ? { x: rand(45, 138), y: rand(28, 122) } : { x: rand(162, 255), y: rand(28, 122) };
      frames.push(frameFor(mid, 95));
    } else if (outcome.includes('winner')) {
      // Winner drives it past the loser (into a corner, or a tidy net put-away).
      const end = netFinish ? netArea(loser === 'player' ? 'opponent' : 'player') : deepCorner(loser);
      frames.push(frameFor(end, 120));
    } else {
      // Error: the loser dumps it into the net on their side.
      frames.push(frameFor(netArea(loser), 120));
    }
  }
  return frames;
};

export const MatchCourt: React.FC<MatchCourtProps> = ({ courtSurface, overlay }) => {
  const colors = getCourtColors(courtSurface);
  const lastPointResult = useMatchStore((s) => s.lastPointResult);
  const pointSeq = useMatchStore((s) => s.pointSeq);

  const [frame, setFrame] = useState<Frame>(IDLE);
  const timer = useRef<number | null>(null);
  const seenSeq = useRef(0);

  useEffect(() => {
    if (!lastPointResult || pointSeq === seenSeq.current) return;
    seenSeq.current = pointSeq;

    const frames = buildRally(lastPointResult);
    if (timer.current) window.clearTimeout(timer.current);

    let i = 0;
    const tick = (): void => {
      if (i >= frames.length) {
        timer.current = null;
        return;
      }
      setFrame(frames[i]);
      const dur = frames[i].dur;
      i += 1;
      timer.current = window.setTimeout(tick, dur);
    };
    tick();
  }, [pointSeq, lastPointResult]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return (
    <div className="relative rounded-sm overflow-hidden border-2" style={{ borderColor: colors.lines }}>
      <svg viewBox="0 0 300 150" className="block w-full h-full" preserveAspectRatio="none" style={{ minHeight: 150 }}>
        <rect x="0" y="0" width="300" height="150" fill={colors.court} />
        <rect x="10" y="10" width="280" height="130" fill="none" stroke={colors.lines} strokeWidth="2" />
        <line x1="150" y1="6" x2="150" y2="144" stroke={colors.lines} strokeWidth="2" />
        <line x1="70" y1="10" x2="70" y2="140" stroke={colors.lines} strokeWidth="1" />
        <line x1="230" y1="10" x2="230" y2="140" stroke={colors.lines} strokeWidth="1" />
        <line x1="70" y1="75" x2="230" y2="75" stroke={colors.lines} strokeWidth="1" />

        {/* Player token */}
        <g style={{ transform: `translate(${frame.p.x}px, ${frame.p.y}px)`, transition: 'transform 200ms ease-out' }}>
          <circle r="12" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" className="fill-white" style={{ fontSize: 11 }}>P</text>
        </g>

        {/* Opponent token */}
        <g style={{ transform: `translate(${frame.o.x}px, ${frame.o.y}px)`, transition: 'transform 200ms ease-out' }}>
          <circle r="12" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" className="fill-white" style={{ fontSize: 11 }}>O</text>
        </g>

        {/* Ball */}
        <g style={{ transform: `translate(${frame.ball.x}px, ${frame.ball.y}px)`, transition: 'transform 90ms linear' }}>
          <circle r="4.5" fill="#F4E04A" stroke="#B59A00" strokeWidth="1" />
        </g>
      </svg>
      {overlay}
    </div>
  );
};
