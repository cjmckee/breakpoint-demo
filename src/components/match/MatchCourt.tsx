/**
 * Match Court
 * The court centerpiece with a lightweight rally animation.
 *
 * Orientation: we view the court from the side. The net runs vertically down the middle;
 * the player owns the LEFT half, the opponent the RIGHT. A player's lateral movement
 * (deuce/ad side) reads as up/down on screen; depth (baseline ↔ net) reads as
 * horizontal within their half.
 *
 * Each normal point animates the REAL shot-by-shot rally from PointResult.shots: the ball is
 * placed at each shooter's contact point (side from shooter, depth from courtPosition, lateral
 * from the shot type), tokens chase the ball and recover between shots, the serve starts from
 * the baseline, and the point ends where the last shot lands. Key-moment points (whose shots
 * are synthesized) fall back to a simple serve → outcome animation.
 *
 * The players are pixel sprites drawn over the SVG court as HTML, because the court SVG
 * stretches to fit (preserveAspectRatio="none") and would squash them. They run while a
 * rally plays, swing on the frame they strike the ball, and idle between points.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { CourtSurface } from '../../types';
import type { PointResult as SimplePointResult } from '../../types/keyMoments';
import type { Appearance, SpritePose } from '../../types/appearance';
import { useMatchStore } from '../../stores/matchStore';
import { PixelSprite } from '../sprites/PixelSprite';

interface MatchCourtProps {
  courtSurface: CourtSurface;
  playerAppearance: Appearance;
  opponentAppearance: Appearance;
  overlay?: React.ReactNode;
}

const getCourtColors = (surface: CourtSurface): { court: string; lines: string } => {
  switch (surface) {
    case 'clay':
      return { court: '#CD853F', lines: '#FFFFFF' };
    case 'grass':
      return { court: '#228B22', lines: '#FFFFFF' };
    case 'carpet':
      return { court: '#6B46C1', lines: '#FFFFFF' };
    case 'hard':
    default:
      return { court: '#4A90E2', lines: '#FFFFFF' };
  }
};

// SVG viewBox space: x 0..300 (baseline-to-baseline), y 0..150 (lateral). Net at x=150.
const NET = 150;
const MAX_CONTACTS = 5;
type Side = 'player' | 'opponent';
const other = (s: Side): Side => (s === 'player' ? 'opponent' : 'player');
const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const cornerY = (): number => (Math.random() < 0.5 ? rand(24, 46) : rand(104, 126));

interface Pt {
  x: number;
  y: number;
}
interface Frame {
  ball: Pt;
  p: Pt;
  o: Pt;
  dur: number;
  /** Who strikes the ball on this frame, if anyone. */
  hitter?: Side;
}

const IDLE: Frame = {
  ball: { x: NET, y: 75 },
  p: { x: 40, y: 75 },
  o: { x: 260, y: 75 },
  dur: 200,
};

// Viewbox units → percentages of the court box, for the HTML layer over the SVG.
const pctX = (x: number): string => `${(x / 300) * 100}%`;
const pctY = (y: number): string => `${(y / 150) * 100}%`;

// Depth (x) within a player's own half, by court position.
const depthX = (side: Side, cp?: string): number => {
  const pos = cp ?? 'baseline';
  if (side === 'player') {
    if (pos === 'net') return rand(122, 140);
    if (pos === 'defensive') return rand(14, 24);
    return rand(24, 40);
  }
  if (pos === 'net') return rand(160, 178);
  if (pos === 'defensive') return rand(276, 286);
  return rand(260, 276);
};

// Lateral (y) by shot wing: backhand up, forehand down, serve/neutral centered.
const lateralY = (shotType?: string, cp?: string): number => {
  const t = (shotType ?? '').toLowerCase();
  const base = t.includes('backhand') ? 54 : t.includes('forehand') ? 96 : 75;
  const spread = cp === 'defensive' ? 24 : 13;
  return clamp(base + rand(-spread, spread), 22, 128);
};

const readyPos = (side: Side): Pt => ({ x: side === 'player' ? 36 : 264, y: 75 });
// A player who isn't hitting drifts back toward their ready position (this also pulls the
// server "in" off the baseline after the serve).
const recover = (pos: Pt, side: Side): Pt => ({
  x: side === 'player' ? 38 : 262,
  y: clamp(75 + (pos.y - 75) * 0.4, 42, 108),
});
const deepCorner = (side: Side): Pt =>
  side === 'player' ? { x: rand(18, 50), y: cornerY() } : { x: rand(250, 282), y: cornerY() };
const netArea = (side: Side): Pt =>
  side === 'player'
    ? { x: rand(126, 146), y: rand(55, 95) }
    : { x: rand(154, 174), y: rand(55, 95) };

const shooterSide = (shooter: 'server' | 'returner', server: Side): Side =>
  shooter === 'server' ? server : other(server);

// Evenly sample a long shot list down to MAX_CONTACTS, always keeping the first and last.
function sampleShots<T>(shots: T[]): T[] {
  if (shots.length <= MAX_CONTACTS) return shots;
  const idx = new Set<number>([0, shots.length - 1]);
  const step = (shots.length - 1) / (MAX_CONTACTS - 1);
  for (let k = 1; k < MAX_CONTACTS - 1; k++) idx.add(Math.round(k * step));
  return [...idx].sort((a, b) => a - b).map((i) => shots[i]);
}

/** Real rally from the shot-by-shot detail. */
function buildFromShots(r: SimplePointResult): Frame[] {
  const server: Side = r.server ?? 'player';
  const shots = r.shots!;
  const picked = sampleShots(shots);

  let p = readyPos('player');
  let o = readyPos('opponent');
  const frames: Frame[] = [];

  picked.forEach((s, k) => {
    const side = shooterSide(s.shooter, server);
    const contact = {
      x: depthX(side, s.context?.courtPosition),
      y: lateralY(s.shotType, s.context?.courtPosition),
    };
    if (side === 'player') {
      p = contact;
      o = recover(o, 'opponent');
    } else {
      o = contact;
      p = recover(p, 'player');
    }
    frames.push({ ball: contact, p, o, dur: k === 0 ? 100 : 72, hitter: side });
  });

  const last = shots[shots.length - 1];
  const lastSide = shooterSide(last.shooter, server);
  const outcome = String(last.outcome ?? r.outcome ?? '').toLowerCase();
  const landing =
    outcome.includes('winner') || outcome.includes('ace')
      ? deepCorner(other(lastSide)) // placed past the receiver
      : netArea(lastSide); // error / fault dumped on the hitter's side
  frames.push({ ball: landing, p, o, dur: 120 });
  return frames;
}

/** Simple fallback when there is no real shot detail (key-moment points). */
function buildFallback(r: SimplePointResult): Frame[] {
  const server: Side = r.server ?? 'player';
  const winner = r.winner;
  const loser: Side = other(winner);
  const returner = other(server);
  const outcome = (r.outcome ?? '').toLowerCase();

  let p = readyPos('player');
  let o = readyPos('opponent');
  const frames: Frame[] = [];
  const hit = (side: Side, cp: string, shotType: string, dur: number): void => {
    const c = { x: depthX(side, cp), y: lateralY(shotType, cp) };
    if (side === 'player') {
      p = c;
      o = recover(o, 'opponent');
    } else {
      o = c;
      p = recover(p, 'player');
    }
    frames.push({ ball: c, p, o, dur, hitter: side });
  };

  hit(server, 'baseline', 'serve', 100);
  if (outcome.includes('ace')) {
    frames.push({ ball: deepCorner(returner), p, o, dur: 120 });
    return frames;
  }
  if (outcome.includes('double_fault') || outcome === 'fault') {
    frames.push({ ball: netArea(server), p, o, dur: 120 });
    return frames;
  }

  const hops = clamp(Math.round((r.rallyLength ?? 4) / 2), 1, 3);
  let side = server;
  for (let i = 0; i < hops; i++) {
    side = other(side);
    hit(side, 'baseline', i % 2 ? 'backhand' : 'forehand', 80);
  }

  const landing = outcome.includes('winner') ? deepCorner(loser) : netArea(loser);
  frames.push({ ball: landing, p, o, dur: 120 });
  return frames;
}

const buildRally = (r: SimplePointResult): Frame[] =>
  r.shots && r.shots.length > 0 ? buildFromShots(r) : buildFallback(r);

export const MatchCourt: React.FC<MatchCourtProps> = ({
  courtSurface,
  playerAppearance,
  opponentAppearance,
  overlay,
}) => {
  const colors = getCourtColors(courtSurface);
  const lastPointResult = useMatchStore((s) => s.lastPointResult);
  const pointSeq = useMatchStore((s) => s.pointSeq);

  const [frame, setFrame] = useState<Frame>(IDLE);
  const [rallying, setRallying] = useState(false);
  const timer = useRef<number | null>(null);
  const seenSeq = useRef(0);

  useEffect(() => {
    if (!lastPointResult || pointSeq === seenSeq.current) return;
    seenSeq.current = pointSeq;

    const frames = buildRally(lastPointResult);
    if (timer.current) window.clearTimeout(timer.current);

    let i = 0;
    setRallying(true);
    const tick = (): void => {
      if (i >= frames.length) {
        timer.current = null;
        setRallying(false);
        return;
      }
      const f = frames[i];
      setFrame(f);
      i += 1;
      timer.current = window.setTimeout(tick, f.dur);
    };
    tick();
  }, [pointSeq, lastPointResult]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const poseFor = (side: Side): SpritePose =>
    frame.hitter === side ? 'swing' : rallying ? 'run' : 'idle';

  return (
    <div
      className="relative rounded-sm overflow-hidden border-2"
      style={{ borderColor: colors.lines }}
    >
      <svg
        viewBox="0 0 300 150"
        className="block w-full h-full"
        preserveAspectRatio="none"
        style={{ minHeight: 150 }}
      >
        <rect x="0" y="0" width="300" height="150" fill={colors.court} />
        <rect
          x="10"
          y="10"
          width="280"
          height="130"
          fill="none"
          stroke={colors.lines}
          strokeWidth="2"
        />
        <line x1="150" y1="6" x2="150" y2="144" stroke={colors.lines} strokeWidth="2" />
        <line x1="70" y1="10" x2="70" y2="140" stroke={colors.lines} strokeWidth="1" />
        <line x1="230" y1="10" x2="230" y2="140" stroke={colors.lines} strokeWidth="1" />
        <line x1="70" y1="75" x2="230" y2="75" stroke={colors.lines} strokeWidth="1" />
      </svg>

      {/* Players and ball, positioned over the court */}
      <div className="absolute inset-0 pointer-events-none">
        <CourtFigure
          side="player"
          at={frame.p}
          dur={frame.dur}
          pose={poseFor('player')}
          appearance={playerAppearance}
        />
        <CourtFigure
          side="opponent"
          at={frame.o}
          dur={frame.dur}
          pose={poseFor('opponent')}
          appearance={opponentAppearance}
        />
        <div
          className="absolute w-[9px] h-[9px] rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: pctX(frame.ball.x),
            top: pctY(frame.ball.y),
            backgroundColor: '#F4E04A',
            border: '1px solid #B59A00',
            transition: `left ${frame.dur}ms linear, top ${frame.dur}ms linear`,
          }}
        />
      </div>
      {overlay}
    </div>
  );
};

interface CourtFigureProps {
  side: Side;
  at: Pt;
  dur: number;
  pose: SpritePose;
  appearance: Appearance;
}

/** A player sprite standing on a court point, feet slightly below it. */
const CourtFigure: React.FC<CourtFigureProps> = ({ side, at, dur, pose, appearance }) => (
  <div
    className="absolute -translate-x-1/2 -translate-y-[60%]"
    style={{
      left: pctX(at.x),
      top: pctY(at.y),
      transition: `left ${dur}ms ease-out, top ${dur}ms ease-out`,
    }}
    data-testid={`court-figure-${side}`}
    data-pose={pose}
  >
    <PixelSprite appearance={appearance} pose={pose} scale={2} fps={8} />
  </div>
);
