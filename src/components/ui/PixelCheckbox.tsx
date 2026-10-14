/**
 * A checkbox drawn on a pixel grid, so a selection reads as part of the pixel art rather
 * than a browser control. Decorative: the button around it carries the checked state.
 */

import React from 'react';

// 12×12 cells: a two-cell frame around an 8×8 well, with the tick drawn in the well.
const SIZE = 12;
const FRAME = 2;
const TICK = [
  '........',
  '.......#',
  '......##',
  '.#...##.',
  '.##.##..',
  '..###...',
  '...#....',
  '........',
];

const TICK_CELLS = TICK.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (cell === '#' ? [{ x: x + FRAME, y: y + FRAME }] : [])),
);

interface PixelCheckboxProps {
  checked: boolean;
  /** Frame and fill when checked. Defaults to the accent. */
  color?: string;
  /** The tick. Defaults to the text colour that reads on the accent. */
  tickColor?: string;
  className?: string;
}

export function PixelCheckbox({
  checked,
  color = 'rgb(var(--pixel-accent))',
  tickColor = 'rgb(var(--pixel-on-accent))',
  className = 'w-6 h-6',
}: PixelCheckboxProps): React.JSX.Element {
  const frame = checked ? color : '#2d3748';
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      data-checked={checked}
    >
      {/* Frame with the corners knocked out, the usual pixel-art rounding. */}
      <rect x={1} y={0} width={SIZE - 2} height={FRAME} fill={frame} />
      <rect x={1} y={SIZE - FRAME} width={SIZE - 2} height={FRAME} fill={frame} />
      <rect x={0} y={1} width={FRAME} height={SIZE - 2} fill={frame} />
      <rect x={SIZE - FRAME} y={1} width={FRAME} height={SIZE - 2} fill={frame} />
      {checked && (
        <>
          <rect
            x={FRAME}
            y={FRAME}
            width={SIZE - FRAME * 2}
            height={SIZE - FRAME * 2}
            fill={color}
          />
          {TICK_CELLS.map(({ x, y }) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={tickColor} />
          ))}
        </>
      )}
    </svg>
  );
}
