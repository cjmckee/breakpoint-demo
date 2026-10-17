/**
 * The five areas of the game as bars, before → after a planned buy. One stat
 * often feeds several areas, so pressing +1 on the Development screen moves every
 * bar it buys into at once. A strip of five across the top on wider screens; five
 * short rows on phones.
 */

import React, { useMemo } from 'react';
import type { PlayerStats } from '../../types';
import { GAME_AREAS, GAME_AREA_LABELS, gameAreaValues } from '../../core/gameAreas';

interface AreaStripProps {
  stats: PlayerStats;
  /** The stats after the planned buys; the same as `stats` with nothing planned. */
  planned: PlayerStats;
}

export const AreaStrip: React.FC<AreaStripProps> = ({ stats, planned }) => {
  const now = useMemo(() => gameAreaValues(stats), [stats]);
  const after = useMemo(() => gameAreaValues(planned), [planned]);
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-5 gap-x-3 gap-y-1"
      data-testid="development-areas"
    >
      {GAME_AREAS.map((area) => {
        const from = Math.round(now[area]);
        const to = Math.round(after[area]);
        const up = to > from;
        return (
          <div
            key={area}
            data-testid={`development-area-${area}`}
            data-value={from}
            data-planned={to}
            className="grid grid-cols-[11ch_minmax(0,1fr)_6ch] sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1"
          >
            <span className="text-[10px] text-pixel-text-muted sm:col-span-2">
              {GAME_AREA_LABELS[area]}
            </span>
            <span
              className="relative h-2.5 bg-pixel-bg border-2 border-pixel-border"
              aria-hidden="true"
            >
              <span
                className="absolute inset-y-0 left-0 bg-pixel-text-muted"
                style={{ width: `${now[area]}%` }}
              />
              {after[area] > now[area] && (
                <span
                  className="absolute inset-y-0 bg-pixel-success"
                  style={{ left: `${now[area]}%`, width: `${after[area] - now[area]}%` }}
                />
              )}
            </span>
            <span
              className={`text-xs text-right tabular-nums whitespace-nowrap ${
                up ? 'text-pixel-success' : 'text-pixel-text'
              }`}
            >
              {up ? `${from}→${to}` : from}
            </span>
          </div>
        );
      })}
    </div>
  );
};
