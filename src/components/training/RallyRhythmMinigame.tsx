/**
 * Forehand Minigame — "Rally Rhythm"
 *
 * A three-track rhythm game. Each round fires a SET of three balls down random tracks
 * on a beat; tap that track's button the instant its ball crosses the strike line. Land
 * all three in the set to bank the support — three sets, nine balls. Fixed track
 * buttons (no moving), a dashed target ball on each track, and a pulsing strike line
 * keep the timing readable. See docs/training-redesign.md.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import {
  MinigameShell,
  SupportResult,
  RoundPips,
  countNote,
  type MinigameProps,
} from './MinigameShell';
import { useMinigameRounds, roundSpeed } from './useMinigameRounds';
import { Sparks, ComboBadge, useHitstop, type Burst } from './minigameJuice';
import { directionFromKey } from '../../utils/gameKeys';

const LANES = 3;
const PER_SET = 3;
const TRAVEL = 750; // ms a ball takes to fall to the line, at speed 1
const INTERVAL = 420; // ms between the set's beats, at speed 1
/** ms of empty court before the first ball of a set is released. */
const LEAD_IN = 300;
/** Per-set tempo wobble, on top of the round ramp — no two sets feel identical. */
const TEMPO_SPAN = 0.1;
const TOP_Y = -6; // %
const STRIKE_Y = 80; // %

interface Note {
  id: number;
  track: number;
  time: number; // perf ms it should reach the line
  judged: boolean;
  hit: boolean;
}

const laneC = (i: number): number => ((i + 0.5) / LANES) * 100;
const LANE_GLYPH = ['◀', '●', '▶'];

export const RallyRhythmMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();
  const hitWin = 155 * (1 + windowBonus);

  const notesRef = useRef<Note[]>([]);
  const runningRef = useRef(false);
  const hitsRef = useRef(0);
  const judgedRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [render, setRender] = useState<Array<{ id: number; track: number; y: number }>>([]);
  const [pulse, setPulse] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [setHits, setSetHits] = useState(0);
  const [soClose, setSoClose] = useState(false);

  const playing = rounds.phase === 'playing';

  const finishSet = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    const hits = hitsRef.current;
    setSoClose(hits === PER_SET - 1);
    rounds.commit(hits === PER_SET);
  }, [rounds]);

  const judgeNote = useCallback(
    (note: Note, hit: boolean) => {
      if (note.judged) return;
      note.judged = true;
      note.hit = hit;
      judgedRef.current += 1;
      if (hit) {
        hitsRef.current += 1;
        setSetHits(hitsRef.current);
        hitstop();
        audioManager.playSfx('hit_ground');
      }
      setBurst({ id: performance.now() + note.id, x: laneC(note.track), y: STRIKE_Y, tone: hit ? 'good' : 'bad' });
      if (judgedRef.current >= PER_SET) finishSet();
    },
    [hitstop, finishSet]
  );

  const pressTrack = useCallback(
    (track: number) => {
      if (!runningRef.current) return;
      const now = performance.now();
      let best: Note | null = null;
      let bestDt = Infinity;
      for (const n of notesRef.current) {
        if (n.track === track && !n.judged) {
          const dt = Math.abs(now - n.time);
          if (dt < bestDt) { bestDt = dt; best = n; }
        }
      }
      if (!best || bestDt > hitWin * 1.8) return; // stray tap on an empty track — ignore
      judgeNote(best, bestDt <= hitWin);
    },
    [hitWin, judgeNote]
  );

  // Arm a fresh set for each playing round. The tempo is rolled once per set, so the
  // beat stays dead even inside a set while every set runs at its own speed.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    const tempo = (1 - TEMPO_SPAN / 2 + Math.random() * TEMPO_SPAN) * roundSpeed(rounds.round);
    const travel = TRAVEL / tempo;
    const interval = INTERVAL / tempo;
    const base = performance.now() + travel + LEAD_IN;
    notesRef.current = Array.from({ length: PER_SET }, (_, k) => ({
      id: rounds.round * 10 + k,
      track: Math.floor(Math.random() * LANES),
      time: base + k * interval,
      judged: false,
      hit: false,
    }));
    hitsRef.current = 0;
    judgedRef.current = 0;
    runningRef.current = true;
    setSetHits(0);
    setSoClose(false);

    const loop = (now: number): void => {
      if (!runningRef.current) return;
      if (frozen.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      let nearBeat = false;
      const vis: Array<{ id: number; track: number; y: number }> = [];
      for (const n of notesRef.current) {
        if (!n.judged && Math.abs(now - n.time) < 90) nearBeat = true;
        if (!n.judged && now > n.time + hitWin * 1.8) { judgeNote(n, false); continue; }
        if (n.judged) continue;
        const p = (now - (n.time - travel)) / travel;
        if (p < 0) continue;
        vis.push({ id: n.id, track: n.track, y: TOP_Y + p * (STRIKE_Y - TOP_Y) });
      }
      setRender(vis);
      setPulse(nearBeat);
      if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // Center takes both the down and up keys — S sits under the resting hand on WASD,
      // W is where the thumb reaches on the arrows.
      const dir = directionFromKey(e);
      if (dir === 'left') { e.preventDefault(); pressTrack(0); }
      else if (dir === 'down' || dir === 'up') { e.preventDefault(); pressTrack(1); }
      else if (dir === 'right') { e.preventDefault(); pressTrack(2); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressTrack]);

  return (
    <MinigameShell
      title="Rally Rhythm"
      subtitle="Tap each ball's track right as it crosses the line"
      controls="left ← A · center ↓ ↑ S W · right → D"
      phase={rounds.phase}
      onStart={rounds.begin}
    >
      <div className="relative h-56 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4">
        <ComboBadge streak={rounds.streak} />

        {/* Track dividers + dashed target balls on the strike line */}
        {Array.from({ length: LANES }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="absolute top-0 bottom-0 border-l border-dashed border-pixel-border/60" style={{ left: `${(i / LANES) * 100}%` }} />
            )}
            <div
              className="absolute w-8 h-8 rounded-full border-2 border-dashed border-pixel-text-muted/50"
              style={{ left: `${laneC(i)}%`, top: `${STRIKE_Y}%`, transform: 'translate(-50%, -50%)' }}
            />
          </React.Fragment>
        ))}

        {/* Strike line (pulses on the beat) */}
        <div
          className={`absolute inset-x-0 h-1 transition-all duration-75 ${pulse ? 'bg-pixel-accent shadow-[0_0_10px_2px_rgba(233,69,96,0.7)]' : 'bg-pixel-accent/50'}`}
          style={{ top: `${STRIKE_Y}%` }}
        />

        {/* Falling balls */}
        {render.map((n) => (
          <div
            key={n.id}
            className="absolute w-8 h-8 rounded-full bg-pixel-accent border-2 border-pixel-text flex items-center justify-center text-sm"
            style={{ left: `${laneC(n.track)}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            🎾
          </div>
        ))}

        <Sparks burst={burst} />

        {/* In-set progress / so-close cue */}
        {playing && (
          <div className="absolute top-2 left-2 text-xs text-pixel-text-muted">
            {setHits}/{PER_SET} clean
          </div>
        )}
        {rounds.phase === 'transition' && soClose && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-pixel-warning">2/3 — so close!</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Perfect rhythm — nine for nine!',
            'Two clean sets. Nearly flawless!',
            'One clean set. Keep the beat!',
            'Lost the rhythm — try again!'
          )}
        />
      ) : (
        <div className="flex gap-2">
          {Array.from({ length: LANES }).map((_, i) => (
            <button
              key={i}
              type="button"
              disabled={!playing}
              onPointerDown={(e) => { e.preventDefault(); pressTrack(i); }}
              className="flex-1 font-bold border-4 border-pixel-border bg-pixel-card text-pixel-text-muted px-4 py-4 text-xl select-none touch-none active:translate-y-1 disabled:opacity-50 border-t-pixel-accent/60"
            >
              {LANE_GLYPH[i]}
            </button>
          ))}
        </div>
      )}
    </MinigameShell>
  );
};
