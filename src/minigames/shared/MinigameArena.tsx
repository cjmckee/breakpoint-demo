/**
 * The court every minigame plays on.
 *
 * One fixed 16:10 shape on every screen, measured in its own units: the arena is
 * ARENA_W (100) units wide and ARENA_H (62.5) tall, and one unit is 1% of its
 * width. Games keep all their geometry (positions, speeds, target sizes) in these
 * units and render them with `u()`, which turns a unit count into CSS container
 * width units. Both axes use the same unit, so a square target stays square.
 *
 * Because every size scales with the arena, a target covers the same share of the
 * court on a phone as on a monitor. The arena can grow to fill the space it's
 * given without making a game easier or harder: it plays the same, just drawn
 * larger.
 *
 * Nothing inside may be sized in px if it decides a hit. Purely decorative bits
 * (a ball's glyph, a trail dot) may floor at a px size with `uMin` so they stay
 * readable on a small screen.
 */

import React from 'react';

export const ARENA_W = 100;
export const ARENA_H = 62.5;

/** A length in arena units, as CSS. */
export const u = (n: number): string => `${n}cqw`;

/** A length in arena units that never renders smaller than `minPx`. Decoration only. */
export const uMin = (n: number, minPx: number): string => `max(${minPx}px, ${n}cqw)`;

/** A height in arena units as a % of the arena's height — for helpers like <Sparks> that position by %. */
export const pctY = (y: number): number => (y / ARENA_H) * 100;

/**
 * Tallest share of the viewport the arena may take. Keeps the title and the
 * controls below it on screen; the arena narrows to fit rather than overflow.
 */
const MAX_VIEWPORT_HEIGHT = 0.55;

export const MinigameArena: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // The border lives on the outside so the inner box is exactly 16:10: container
  // units measure the content box, and a border inside it would skew the height.
  <div
    className="mx-auto mb-4 border-2 border-pixel-border bg-pixel-bg"
    style={{ width: `min(100%, calc(${MAX_VIEWPORT_HEIGHT * 100}vh * ${ARENA_W / ARENA_H}))` }}
  >
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${ARENA_W} / ${ARENA_H}`, containerType: 'inline-size' }}
    >
      {children}
    </div>
  </div>
);
