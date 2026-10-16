/**
 * Draws a pixel grid (src/data/pixelIcons.ts) as a crisp SVG in one colour.
 * Decorative: whatever it sits beside names the thing.
 */

import React from 'react';
import type { PixelGrid } from '../../data/pixelIcons';

interface PixelIconProps {
  grid: PixelGrid;
  /** Screen pixels per grid pixel. */
  scale?: number;
  /** Any CSS colour; defaults to the surrounding text colour. */
  color?: string;
  className?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({
  grid,
  scale = 2,
  color = 'currentColor',
  className = '',
}) => {
  const width = grid[0]?.length ?? 0;
  const height = grid.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      fill={color}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {grid.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null,
        ),
      )}
    </svg>
  );
};
