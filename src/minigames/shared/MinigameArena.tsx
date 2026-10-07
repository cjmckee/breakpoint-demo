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
 * Room the page needs around the arena: the status bar and title row above, the
 * shell's heading, and the round pips and control buttons below. The arena takes
 * whatever height is left, so the controls stay on screen; it narrows to fit rather
 * than overflow, down to a floor where the game is still readable.
 */
const CHROME_PX = 400;
const MIN_ARENA_HEIGHT_PX = 220;

/**
 * The arena's width cap. MinigameShell applies it to the box that holds both the
 * arena and its start overlay, so the overlay covers the arena exactly.
 */
export const ARENA_MAX_WIDTH = `calc(max(${MIN_ARENA_HEIGHT_PX}px, 100dvh - ${CHROME_PX}px) * ${ARENA_W / ARENA_H})`;

export const MinigameArena: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // The border lives on the outside so the inner box is exactly 16:10: container
  // units measure the content box, and a border inside it would skew the height.
  <div
    className="mx-auto mb-4 border-2 border-pixel-border bg-pixel-bg"
    style={{ width: `min(100%, ${ARENA_MAX_WIDTH})` }}
  >
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${ARENA_W} / ${ARENA_H}`, containerType: 'inline-size' }}
    >
      {children}
    </div>
  </div>
);
