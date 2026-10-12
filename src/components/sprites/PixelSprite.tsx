/**
 * Pixel Sprite
 * Draws a composed character as crisp SVG pixels, cycling the pose's frames.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Appearance, SpritePose } from '../../types/appearance';
import { composeSprite, spriteFrameCount } from '../../core/spriteComposer';
import { SPRITE_HEIGHT, SPRITE_WIDTH } from '../../data/sprites/layers';

interface PixelSpriteProps {
  appearance: Appearance;
  pose?: SpritePose;
  /** On-screen size of one sprite pixel, in CSS pixels. */
  scale?: number;
  /** Frames per second for multi-frame poses. */
  fps?: number;
  className?: string;
  testId?: string;
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({
  appearance,
  pose = 'idle',
  scale = 4,
  fps = 6,
  className,
  testId,
}) => {
  const [tick, setTick] = useState(0);
  const frameCount = spriteFrameCount(pose);

  useEffect(() => {
    setTick(0);
    if (frameCount <= 1) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000 / fps);
    return () => window.clearInterval(id);
  }, [pose, fps, frameCount]);

  const runs = useMemo(() => composeSprite(appearance, pose, tick), [appearance, pose, tick]);

  return (
    <svg
      viewBox={`0 0 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`}
      width={SPRITE_WIDTH * scale}
      height={SPRITE_HEIGHT * scale}
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
