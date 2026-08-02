/**
 * Shared "juice" for the training minigames.
 *
 * Small, fast, non-blocking feedback so every rep feels punchy — these drills are
 * played constantly, so the polish lives in one place and stays consistent across all
 * five games:
 *   - <Sparks>: a one-shot particle burst at a point (green on a clean hit, red on a miss).
 *   - <ComboBadge>: a "×N" pop for trailing consecutive cleans (cosmetic; score stays 0-3).
 *   - useHitstop(): a ~40ms freeze-frame games apply in their rAF loop on clean contact.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface Burst {
  /** Bump this to fire a fresh burst (remounts the particles). */
  id: number;
  /** Position within the parent box, in percent. */
  x: number;
  y: number;
  tone?: 'good' | 'bad';
}

// The theme's pixel-success / pixel-error, inlined because these are SVG-less DOM
// particles styled from JS. Keep in step with tailwind.config.cjs.
const GOOD = '#2ecc71';
const BAD = '#e74c3c';
const PARTICLES = 7;

const Particle: React.FC<{ angle: number; color: string }> = ({ angle, color }) => {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setOut(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const dist = out ? 26 : 0;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;
  return (
    <span
      style={{
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        transform: `translate(${dx}px, ${dy}px)`,
        opacity: out ? 0 : 1,
        transition: 'transform 380ms ease-out, opacity 380ms ease-out',
      }}
    />
  );
};

/** A one-shot burst of particles. Render inside a `relative` box; positioned by percent. */
export const Sparks: React.FC<{ burst: Burst | null }> = ({ burst }) => {
  if (!burst) return null;
  const color = burst.tone === 'bad' ? BAD : GOOD;
  return (
    <div
      key={burst.id}
      className="pointer-events-none absolute"
      style={{ left: `${burst.x}%`, top: `${burst.y}%`, width: 0, height: 0 }}
    >
      {Array.from({ length: PARTICLES }).map((_, i) => (
        <Particle key={i} angle={(i / PARTICLES) * Math.PI * 2} color={color} />
      ))}
    </div>
  );
};

/** "×N" combo pop for trailing consecutive cleans. Renders nothing below 2. */
export const ComboBadge: React.FC<{ streak: number; className?: string }> = ({ streak, className }) => {
  if (streak < 2) return null;
  return (
    <div
      key={streak}
      className={`pointer-events-none absolute animate-pixel-scale ${className ?? 'top-2 right-2'}`}
    >
      <span className="text-lg font-bold text-pixel-warning drop-shadow">×{streak}</span>
    </div>
  );
};

/**
 * ~40ms freeze-frame on clean contact. Games check `frozen.current` in their rAF loop
 * and, while frozen, re-baseline their timestamp and skip advancing so the moment of
 * contact reads as a beat before motion resumes.
 */
export function useHitstop(): { frozen: React.MutableRefObject<boolean>; trigger: (ms?: number) => void } {
  const frozen = useRef(false);
  const timer = useRef<number | null>(null);
  const trigger = useCallback((ms = 40) => {
    frozen.current = true;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      frozen.current = false;
      timer.current = null;
    }, ms);
  }, []);
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);
  return { frozen, trigger };
}
