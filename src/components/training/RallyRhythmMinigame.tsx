/**
 * Forehand Minigame — "Rally Rhythm"
 *
 * A straight timing/rhythm game: the ball sits on your baseline and a ring closes in
 * on it. Press Enter (or tap) the instant the ring reaches the ball — that's the
 * bounce. Each of three attempts uses a different beat length, so it can't be
 * muscle-memoried. Every clean hit banks a support; all three reps always play out.
 * See docs/training-redesign.md.
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

const MIN_BEAT_MS = 1500;
const MAX_BEAT_MS = 2500;
const HIT_WINDOW_MS = 180; // timing tolerance around the bounce
const RING_START_SCALE = 3;

export const RallyRhythmMinigame: React.FC<MinigameProps> = ({ onComplete, windowBonus = 0, onFirstAttempt }) => {
  const rounds = useMinigameRounds(onComplete, onFirstAttempt);
  const [ringScale, setRingScale] = useState(RING_START_SCALE);
  const [bounced, setBounced] = useState(false);

  const hitWindowMs = HIT_WINDOW_MS * (1 + windowBonus);
  const beatMsRef = useRef(MIN_BEAT_MS);
  const startRef = useRef(0);
  const committedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const playing = rounds.phase === 'playing';

  const hit = useCallback(() => {
    if (rounds.phase !== 'playing' || committedRef.current) return;
    committedRef.current = true;
    const elapsed = performance.now() - startRef.current;
    const diff = Math.abs(elapsed - beatMsRef.current);
    const passed = diff <= hitWindowMs;
    audioManager.playSfx('ui_click');
    rounds.commit(passed);
  }, [rounds, hitWindowMs]);

  // Arm a fresh beat for each playing attempt; pauses entirely between attempts.
  useEffect(() => {
    if (rounds.phase !== 'playing') return;

    const beatMs = MIN_BEAT_MS + Math.random() * (MAX_BEAT_MS - MIN_BEAT_MS);
    beatMsRef.current = beatMs;
    startRef.current = performance.now();
    committedRef.current = false;
    setRingScale(RING_START_SCALE);
    setBounced(false);

    const loop = (now: number): void => {
      const elapsed = now - startRef.current;
      const frac = Math.min(1, elapsed / beatMs);
      setRingScale(RING_START_SCALE - (RING_START_SCALE - 1) * frac);
      if (elapsed >= beatMs) setBounced(true);

      if (elapsed > beatMs + hitWindowMs && !committedRef.current) {
        committedRef.current = true;
        rounds.commit(false); // let the beat pass without pressing
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // rounds.commit has a stable identity for the session; only phase/round should re-arm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        hit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hit]);

  return (
    <MinigameShell title="Rally Rhythm" subtitle="Press Enter (or tap) the instant the ball bounces on your side">
      <div className="relative h-56 w-full bg-pixel-bg border-2 border-pixel-border overflow-hidden mb-4 flex items-center justify-center">
        {/* Closing timing ring — reaches the ball exactly on the beat */}
        {playing && (
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full border-4 border-pixel-accent/70"
            style={{ transform: `translate(-50%, -50%) scale(${ringScale})` }}
          />
        )}

        {/* The ball, centered in the box */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 flex items-center justify-center text-4xl transition-transform duration-100 ${
            playing ? 'bg-pixel-accent border-pixel-text' : 'bg-orange-400 border-orange-200'
          } ${bounced && playing ? 'scale-125' : 'scale-100'}`}
        >
          🎾
        </div>
      </div>

      <div className="mb-4">
        <RoundPips {...rounds} />
      </div>

      {rounds.phase === 'done' ? (
        <SupportResult
          count={rounds.successes}
          note={countNote(
            rounds.successes,
            'Perfect rally!',
            'Two clean shots. Almost!',
            'One great shot. Keep working on it!',
            'Not your best work.'
          )}
        />
      ) : (
        <MinigameActionButton onPress={hit} disabled={!playing}>
          {playing
            ? `Strike!  ·  Rep ${rounds.round + 1} of 3  (Enter)`
            : rounds.lastPass
              ? 'On the beat! Next ball…'
              : 'Off the beat — next ball…'}
        </MinigameActionButton>
      )}
    </MinigameShell>
  );
};
