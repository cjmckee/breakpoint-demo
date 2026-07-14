/**
 * Match Stats Compare
 * One merged table (you | stat | them) instead of two stacked cards. The leader on each
 * stat is highlighted, and a row flashes with a delta chip when a value changes — coloured
 * by whether the change is good or bad *for the player* (a +1 to the opponent's double
 * faults is good for you; a +1 to your unforced errors is bad).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/Card';

export interface MatchStatsShape {
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  firstServePercentage: number;
  pointsWon: number;
}

interface StatRow {
  key: keyof MatchStatsShape;
  label: string;
  /** true = higher is better for the owner; false = higher is worse (errors, double faults) */
  good: boolean;
  pct?: boolean;
}

const ROWS: StatRow[] = [
  { key: 'aces', label: 'Aces', good: true },
  { key: 'winners', label: 'Winners', good: true },
  { key: 'unforcedErrors', label: 'Unforced Errors', good: false },
  { key: 'doubleFaults', label: 'Double Faults', good: false },
  { key: 'firstServePercentage', label: '1st Serve %', good: true, pct: true },
  { key: 'pointsWon', label: 'Points Won', good: true },
];

interface Flash {
  delta: number;
  /** true = the change is good for the player (green), false = bad (red) */
  benefit: boolean;
}

interface MatchStatsCompareProps {
  player: MatchStatsShape;
  opponent: MatchStatsShape;
  playerName: string;
  opponentName: string;
}

const DeltaChip: React.FC<{ flash: Flash; pct?: boolean }> = ({ flash, pct }) => (
  <span
    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
      flash.benefit
        ? 'text-pixel-success bg-green-500 bg-opacity-20'
        : 'text-pixel-error bg-red-500 bg-opacity-20'
    }`}
  >
    {flash.delta > 0 ? '+' : ''}
    {flash.delta}
    {pct ? '%' : ''}
  </span>
);

export const MatchStatsCompare: React.FC<MatchStatsCompareProps> = ({
  player,
  opponent,
  playerName,
  opponentName,
}) => {
  // Keyed by `${statKey}:${side}` so each cell can flash independently.
  const [flashes, setFlashes] = useState<Record<string, Flash>>({});
  const prev = useRef<{ player: MatchStatsShape; opponent: MatchStatsShape } | null>(null);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    const p = prev.current;
    if (p) {
      const next: Record<string, Flash> = {};
      for (const row of ROWS) {
        (['player', 'opponent'] as const).forEach((side) => {
          const cur = (side === 'player' ? player : opponent)[row.key];
          const was = (side === 'player' ? p.player : p.opponent)[row.key];
          if (cur === was) return;
          const delta = cur - was;
          // Beneficial to the owner of the stat, then flip for the opponent's cell.
          const ownerBenefit = row.good ? delta > 0 : delta < 0;
          const benefit = side === 'player' ? ownerBenefit : !ownerBenefit;
          const fkey = `${row.key}:${side}`;
          next[fkey] = { delta, benefit };
          if (timers.current[fkey]) window.clearTimeout(timers.current[fkey]);
          timers.current[fkey] = window.setTimeout(() => {
            setFlashes((f) => {
              const copy = { ...f };
              delete copy[fkey];
              return copy;
            });
          }, 1400);
        });
      }
      if (Object.keys(next).length > 0) setFlashes((f) => ({ ...f, ...next }));
    }
    prev.current = { player: { ...player }, opponent: { ...opponent } };
  }, [player, opponent]);

  // Clean up any pending timers on unmount.
  useEffect(() => () => Object.values(timers.current).forEach((id) => window.clearTimeout(id)), []);

  const leaderOf = (row: StatRow): 'player' | 'opponent' | null => {
    const pv = player[row.key];
    const ov = opponent[row.key];
    if (pv === ov) return null;
    const higher: 'player' | 'opponent' = pv > ov ? 'player' : 'opponent';
    const lower: 'player' | 'opponent' = pv > ov ? 'opponent' : 'player';
    return row.good ? higher : lower;
  };

  const fmt = (row: StatRow, v: number): string => (row.pct ? `${v}%` : `${v}`);

  return (
    <Card title="Live Stats">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-2 mb-1 border-b-2 border-pixel-border text-xs uppercase tracking-wide">
        <span className="text-pixel-success">{playerName}</span>
        <span className="text-center px-3 text-pixel-text-muted">Stat</span>
        <span className="text-right text-pixel-error">{opponentName}</span>
      </div>

      {ROWS.map((row) => {
        const leader = leaderOf(row);
        const pf = flashes[`${row.key}:player`];
        const of = flashes[`${row.key}:opponent`];
        const rowFlash = pf ?? of;
        return (
          <div
            key={row.key}
            className={`grid grid-cols-[1fr_auto_1fr] items-center py-2 border-b border-pixel-border last:border-0 transition-colors duration-150 ${
              rowFlash
                ? rowFlash.benefit
                  ? 'bg-green-500 bg-opacity-10'
                  : 'bg-red-500 bg-opacity-10'
                : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-bold ${leader === 'player' ? 'text-pixel-success' : 'text-pixel-text'}`}>
                {fmt(row, player[row.key])}
              </span>
              {pf && <DeltaChip flash={pf} pct={row.pct} />}
            </div>
            <span className="text-center px-3 text-xs text-pixel-text-muted">{row.label}</span>
            <div className="flex items-center gap-2 justify-end">
              {of && <DeltaChip flash={of} pct={row.pct} />}
              <span className={`font-bold ${leader === 'opponent' ? 'text-pixel-error' : 'text-pixel-text'}`}>
                {fmt(row, opponent[row.key])}
              </span>
            </div>
          </div>
        );
      })}
    </Card>
  );
};
