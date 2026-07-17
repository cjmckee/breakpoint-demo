/**
 * Stat Tile Component
 * Compact representation of a supporting stat: label + raw value + letter grade, kept
 * in fixed-width columns so grades and numbers line up down each category list. Grade
 * colour (and a glow at 90+) tracks strength. Description reveals on hover / tap.
 */

import React, { useMemo } from 'react';
import { getLetterGrade } from '../utils/playerStats';
import { InfoPopover } from './ui/InfoPopover';

interface StatTileProps {
  label: string;
  value: number;
  boost?: number;
  description?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, boost = 0, description }) => {
  const { grade, color } = useMemo(() => getLetterGrade(value), [value]);

  const tile = (
    <div
      className={`flex items-center justify-between gap-2 border-2 border-pixel-border bg-pixel-card px-3 py-2 h-full transition-all duration-300 ${
        description ? 'hover:border-pixel-accent cursor-pointer' : ''
      }`}
    >
      <span className="text-sm text-pixel-text truncate">{label}</span>
      {/* Grade then number, each centered in a fixed-width column so they line up
          vertically down the category list */}
      <span className="flex items-baseline gap-2.5 shrink-0">
        <span
          className="text-lg font-bold leading-none inline-block w-7 text-center"
          style={{ color, textShadow: value >= 90 ? `0 0 6px ${color}` : undefined }}
        >
          {grade}
        </span>
        <span className="text-xs text-pixel-text-muted font-mono tabular-nums text-left w-10">
          {value}
          {boost > 0 && <span className="text-cyan-400 font-bold ml-0.5">+{boost}</span>}
        </span>
      </span>
    </div>
  );

  if (!description) {
    return tile;
  }

  return (
    <InfoPopover
      ariaLabel={`${label}: ${description}`}
      panelClassName="w-56"
      content={
        <>
          <span className="font-bold text-pixel-text">{label}</span>
          <span className="text-pixel-text-muted"> — {description}</span>
        </>
      }
    >
      {tile}
    </InfoPopover>
  );
};
