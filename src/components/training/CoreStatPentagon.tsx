/**
 * Core Stat Pentagon
 *
 * A radar chart of the player's five core stats. Five cores map exactly onto a
 * pentagon's vertices, so the chart doubles as a picture of the player's build —
 * a spiky serve, a dented backhand — which is the thing a training choice is
 * really about.
 *
 * Purely presentational: it renders the shape and highlights one axis. The
 * training screen drives `highlighted` from whichever shot the player is
 * hovering or focusing.
 */

import React from 'react';
import type { CoreStats } from '../../types';
import { CORE_ANCHORS, CORE_ANCHOR_ORDER, type CoreStat } from '../../game/AnchorTrainingSystem';

interface CoreStatPentagonProps {
  /** Current core stat values (0-100). */
  core: CoreStats;
  /** Axis to emphasise, or null for the resting state. */
  highlighted?: CoreStat | null;
  className?: string;
}

/** Chart geometry. Height leaves room for the labels that sit outside the rings. */
const WIDTH = 340;
const HEIGHT = 222;
const CX = WIDTH / 2;
const CY = 120;
const RADIUS = 74;
/** How far outside the outer ring the axis labels sit. */
const LABEL_OFFSET = 24;
/** Rings drawn as reference gridlines, as a fraction of max (100). */
const RINGS = [0.25, 0.5, 0.75, 1];

/** Vertex position for axis `index` at `radius` from centre, starting at 12 o'clock. */
function vertex(index: number, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / CORE_ANCHOR_ORDER.length;
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius];
}

/** `points` attribute for a regular polygon at the given fraction of the radius. */
function ringPoints(scale: number): string {
  return CORE_ANCHOR_ORDER.map((_, i) => vertex(i, RADIUS * scale).join(',')).join(' ');
}

export const CoreStatPentagon: React.FC<CoreStatPentagonProps> = ({
  core,
  highlighted = null,
  className = '',
}) => {
  const shapePoints = CORE_ANCHOR_ORDER.map((stat, i) =>
    vertex(i, (core[stat] / 100) * RADIUS).join(',')
  ).join(' ');

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`max-w-full ${className}`}
      role="img"
      aria-label={`Core stats: ${CORE_ANCHOR_ORDER.map(
        (stat) => `${CORE_ANCHORS[stat].name} ${core[stat]}`
      ).join(', ')}`}
    >
      {RINGS.map((scale) => (
        <polygon key={scale} points={ringPoints(scale)} fill="none" stroke="#232c46" strokeWidth={1} />
      ))}

      {CORE_ANCHOR_ORDER.map((stat, i) => {
        const [x, y] = vertex(i, RADIUS);
        const hot = highlighted === stat;
        return (
          <line
            key={stat}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke={hot ? '#ccff00' : '#2d3748'}
            strokeWidth={hot ? 2 : 1}
          />
        );
      })}

      <polygon
        points={shapePoints}
        fill="rgba(233, 69, 96, 0.22)"
        stroke="#e94560"
        strokeWidth={2}
        className="transition-all duration-200"
      />

      {CORE_ANCHOR_ORDER.map((stat, i) => {
        const value = core[stat];
        const hot = highlighted === stat;
        const [nx, ny] = vertex(i, (value / 100) * RADIUS);
        const [lx, ly] = vertex(i, RADIUS + LABEL_OFFSET);

        // Nudge side labels away from the chart so they never overlap the rings.
        const textAnchor = Math.abs(lx - CX) < 6 ? 'middle' : lx > CX ? 'start' : 'end';
        const dx = textAnchor === 'middle' ? 0 : textAnchor === 'start' ? -6 : 6;

        return (
          <g key={stat}>
            <circle
              cx={nx}
              cy={ny}
              r={hot ? 5 : 3.5}
              fill={hot ? '#ccff00' : highlighted ? '#4a5473' : '#e94560'}
              className="transition-all duration-150"
            />
            <text
              x={lx + dx}
              y={ly}
              textAnchor={textAnchor}
              className="text-[11px] font-bold"
              fill={hot ? '#ccff00' : '#8891ad'}
            >
              {CORE_ANCHORS[stat].name}
            </text>
            <text
              x={lx + dx}
              y={ly + 14}
              textAnchor={textAnchor}
              className="text-[11px] font-extrabold"
              fill="#eee"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
