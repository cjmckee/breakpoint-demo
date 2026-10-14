/**
 * Pixel Sprite
 * Draws a composed character as crisp SVG pixels, cycling the pose's frames.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Appearance, SpritePose } from '../../types/appearance';
import { composeSprite, spriteFrameCount } from '../../core/spriteComposer';
import { SPRITE_HEIGHT, SPRITE_WIDTH } from '../../data/sprites/layers';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * What part of the grid to show. A portrait is head and shoulders: columns 1-14 keep a
 * ponytail in frame, rows 0-11 stop above the racquet.
 */
const FRAMINGS = {
  full: { x: 0, y: 0, w: SPRITE_WIDTH, h: SPRITE_HEIGHT },
  portrait: { x: 1, y: 0, w: 14, h: 12 },
} as const;

export type SpriteFraming = keyof typeof FRAMINGS;

interface PixelSpriteProps {
  appearance: Appearance;
  pose?: SpritePose;
  /** On-screen size of one sprite pixel, in CSS pixels. */
  scale?: number;
  /** Frames per second for multi-frame poses. */
  fps?: number;
  framing?: SpriteFraming;
  /** False holds the first frame — for sprites that are rendered but not on show. */
  animate?: boolean;
  /** Whether they hold a racquet. Only people who play — see `holdsRacquet`. */
  racquet?: boolean;
  /** Side-on, facing this way, instead of front-facing. */
  facing?: 'left' | 'right';
  className?: string;
  testId?: string;
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({
  appearance,
  pose = 'idle',
  scale = 4,
  fps = 6,
  framing = 'full',
  animate = true,
  racquet = true,
  facing,
  className,
  testId,
}) => {
  const [tick, setTick] = useState(0);
  const frameCount = spriteFrameCount(pose);
  const reducedMotion = usePrefersReducedMotion();
  const cycling = animate && !reducedMotion && frameCount > 1;

  useEffect(() => {
    setTick(0);
    if (!cycling) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000 / fps);
    return () => window.clearInterval(id);
  }, [pose, fps, cycling]);

  const runs = useMemo(
    () => composeSprite(appearance, pose, tick, { racquet, facing }),
    [appearance, pose, tick, racquet, facing],
  );
  const view = FRAMINGS[framing];

  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      width={view.w * scale}
      height={view.h * scale}
      shapeRendering="crispEdges"
      className={className}
      data-testid={testId}
      aria-hidden="true"
    >
      {runs.map((run) => (
        <rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.w}
          height={1}
          fill={run.color}
        />
      ))}
    </svg>
  );
};
