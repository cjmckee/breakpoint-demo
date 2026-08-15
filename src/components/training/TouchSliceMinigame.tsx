/**
 * Slice Minigame — "Touch & Slice"
 *
 * The ball swings back and forth along a line; slice it while it's inside the zone.
 * Land three clean slices before the round timer to bank the support. Each round
 * re-rolls the zone position, a random tilt (a slice is rarely dead flat), and a steady
 * sweep speed — so it stays fresh across three rounds. See docs/training-redesign.md.
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
import { isActionKey } from '../../utils/gameKeys';

const HITS_NEEDED = 3;
const ROUND_TIME = 4000; // ms
const COOLDOWN = 240; // ms — no mashing
const SWEEP_MIN = 780; // ms period
const SWEEP_MAX = 1150;
const AMP = 44; // % swing amplitude around center
const POP_MS = 400; // ms the struck ball stays on screen

export const TouchSliceMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const { frozen, trigger: hitstop } = useHitstop();
  const zoneHalf = 10 * (1 + windowBonus);

  const runningRef = useRef(false);
  const hitsRef = useRef(0);
  const posRef = useRef(50);
  const phaseRef = useRef(0);
  const lastPressRef = useRef(0);
  const startRef = useRef(0);
  const zoneCenterRef = useRef(50);
  const tiltRef = useRef(0);
  const sweepRef = useRef(SWEEP_MIN);
  const trailRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const popTimerRef = useRef<number | null>(null);

  const [view, setView] = useState({ pos: 50, timeFrac: 0, trail: [] as number[] });
  const [zoneCenter, setZoneCenter] = useState(50);
  const [tilt, setTilt] = useState(0);
  const [hits, setHits] = useState(0);
  const [inZone, setInZone] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  /** The ball left behind where the swing connected — green if it was inside the zone,
   *  red if it wasn't. Clears itself after POP_MS. */
  const [pop, setPop] = useState<{ id: number; x: number; good: boolean } | null>(null);

  const playing = rounds.phase === 'playing';

  useEffect(
    () => () => {
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
    },
    []
  );

  const endRound = useCallback(
    (won: boolean) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      rounds.commit(won);
    },
    [rounds]
  );

  const slice = useCallback(() => {
    if (!runningRef.current) return;
    const now = performance.now();
    if (now - lastPressRef.current < COOLDOWN) return;
    lastPressRef.current = now;
    const good = Math.abs(posRef.current - zoneCenterRef.current) <= zoneHalf;
    setBurst({ id: now, x: posRef.current, y: 50, tone: good ? 'good' : 'bad' });
    setPop({ id: now, x: posRef.current, good });
    if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
    popTimerRef.current = window.setTimeout(() => setPop(null), POP_MS);
    if (good) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
      hitstop();
      audioManager.playSfx('smash');
      if (hitsRef.current >= HITS_NEEDED) endRound(true);
    } else {
      audioManager.playSfx('ui_click');
    }
  }, [zoneHalf, hitstop, endRound]);

  // Arm a fresh round: new zone offset, tilt, and steady speed.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;
    hitsRef.current = 0;
    phaseRef.current = 0;
    lastPressRef.current = 0;
    trailRef.current = [];
    zoneCenterRef.current = 22 + Math.random() * 56;
    tiltRef.current = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 30;
    // Shorter period = faster swing, so the ramp divides into it.
    sweepRef.current = (SWEEP_MIN + Math.random() * (SWEEP_MAX - SWEEP_MIN)) / roundSpeed(rounds.round);
    startRef.current = performance.now();
    runningRef.current = true;
    setHits(0);
    setPop(null);
    setZoneCenter(zoneCenterRef.current);
    setTilt(tiltRef.current);

    let last = performance.now();
    const loop = (now: number): void => {
      if (!runningRef.current) return;
      if (frozen.current) { last = now; rafRef.current = requestAnimationFrame(loop); return; }
      const dt = now - last;
      last = now;
      phaseRef.current += (dt * 2 * Math.PI) / sweepRef.current;
      posRef.current = 50 + AMP * Math.sin(phaseRef.current);
      const trail = [posRef.current, ...trailRef.current].slice(0, 5);
      trailRef.current = trail;
      const timeFrac = (now - startRef.current) / ROUND_TIME;
      setView({ pos: posRef.current, timeFrac, trail });
      setInZone(Math.abs(posRef.current - zoneCenterRef.current) <= zoneHalf);
      if (timeFrac >= 1) { endRound(false); return; }
      rafRef.current = requestAnimationFrame(loop);
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
      if (isActionKey(e)) { e.preventDefault(); slice(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slice]);

  const idle = rounds.phase === 'ready';

  return (
    <MinigameShell
      title="Touch & Slice"
      subtitle="Slice three balls inside the zone before the timer runs out"
      controls="Space | Slice"
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
                'Three clean rounds — pure touch!',
                'Two clean rounds. Nice hands.',
                'One clean round. Keep practicing!',
                "Let's find that touch next time."
              )}
            />
          ) : (
            <MinigameActionButton onPress={slice} disabled={!playing}>
              {idle || playing ? 'Slice!  (Space)' : rounds.lastPass ? 'Sliced it!' : 'Out of time'}
            </MinigameActionButton>
          )}
        </>
      }
    >
      <div className="relative h-64 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4 flex items-center justify-center">
        <ComboBadge streak={rounds.streak} />

        {/* Round timer */}
        <div className="absolute top-0 left-0 h-1 bg-pixel-warning" style={{ width: `${Math.max(0, (1 - view.timeFrac) * 100)}%` }} />

        {/* Tilted swing line */}
        <div
          className="absolute left-6 right-6 h-16 border border-pixel-border rounded bg-pixel-secondary/20 transition-transform duration-300"
          style={{ transform: `rotate(${tilt}deg)` }}
        >
          {/* Zone */}
          <div
            className={`absolute top-[-6px] bottom-[-6px] border-l-2 border-r-2 border-dashed ${inZone ? 'border-pixel-success bg-pixel-success/20' : 'border-pixel-accent bg-pixel-accent/10'}`}
            style={{ left: `${zoneCenter}%`, width: `${zoneHalf * 2}%`, transform: 'translateX(-50%)' }}
          />
          {/* Arc trail */}
          {playing && view.trail.map((p, i) => (
            <div
              key={i}
              className="absolute top-1/2 w-1.5 rounded-full bg-pixel-text"
              style={{ left: `${p}%`, height: 18, transform: 'translate(-50%, -50%)', opacity: (1 - i / view.trail.length) * 0.35 }}
            />
          ))}
          {/* Marker */}
          {playing && (
            <div
              className={`absolute top-[-10px] bottom-[-10px] w-1.5 rounded-full ${inZone ? 'bg-pixel-success' : 'bg-pixel-accent'}`}
              style={{ left: `${view.pos}%`, transform: 'translateX(-50%)', boxShadow: '0 0 10px currentColor' }}
            />
          )}
          {/* The ball left where the swing connected. The outer div owns the centering
              transform because animate-pixel-scale animates transform and would
              otherwise clobber it. */}
          {pop && (
            <div
              className="absolute top-1/2"
              style={{ left: `${pop.x}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                key={pop.id}
                className={`w-10 h-10 rounded-full bg-pixel-ball border-4 flex items-center justify-center text-lg animate-pixel-scale ${
                  pop.good ? 'border-pixel-success' : 'border-pixel-error'
                }`}
              >
                🎾
              </div>
            </div>
          )}
        </div>

        <Sparks burst={burst} />

        {playing && (
          <div className="absolute top-2 left-2 text-xs text-pixel-text-muted">{hits}/{HITS_NEEDED} sliced</div>
        )}
      </div>
    </MinigameShell>
  );
};
