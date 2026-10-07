/**
 * Head-to-head comparison for the pre-match screen.
 *
 * The question before a match is "who is ahead, and where?". Two lists of stat
 * names answered it only after the player cross-referenced them; mirrored bars
 * answer it at a glance. Each row is one core skill, your bar growing left from
 * the centre and theirs growing right, and whichever side is ahead is coloured.
 * The biggest gaps across all fourteen stats follow as chips.
 */

import React from 'react';
import type { CoreStats, PlayerStats, StatName } from '../../types';
import { STAT_NAMES, getStat } from '../../game/StatDevelopment';
import { STAT_ICONS, formatStatName } from '../../config/statIcons';

const CORE_ROWS: Array<keyof CoreStats> = ['serve', 'forehand', 'backhand', 'return', 'net'];

/** A gap smaller than this reads as even: the bars stay neutral. */
const EVEN_WITHIN = 2;
/** How many edges to name on each side. */
const EDGES_SHOWN = 2;

interface Edge {
  stat: StatName;
  gap: number;
}

/** The largest gaps in the player's favour and against, biggest first. */
function biggestEdges(
  player: PlayerStats,
  opponent: PlayerStats,
): { ours: Edge[]; theirs: Edge[] } {
  const gaps = STAT_NAMES.map((stat) => ({
    stat,
    gap: getStat(player, stat) - getStat(opponent, stat),
  }));
  return {
    ours: gaps
      .filter((g) => g.gap >= EVEN_WITHIN)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, EDGES_SHOWN),
    theirs: gaps
      .filter((g) => g.gap <= -EVEN_WITHIN)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, EDGES_SHOWN),
  };
}

const Bar: React.FC<{ value: number; side: 'left' | 'right'; tone: string }> = ({
  value,
  side,
  tone,
}) => (
  <div className={`flex-1 h-3 bg-pixel-bg flex ${side === 'left' ? 'justify-end' : ''}`}>
    <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

interface HeadToHeadProps {
  playerName: string;
  playerOverall: number;
  playerStats: PlayerStats;
  opponentName: string;
  opponentOverall: number;
  opponentStats: PlayerStats;
  /** Under the opponent's name: their archetype, typically. */
  opponentTag?: React.ReactNode;
}

export const HeadToHead: React.FC<HeadToHeadProps> = ({
  playerName,
  playerOverall,
  playerStats,
  opponentName,
  opponentOverall,
  opponentStats,
  opponentTag,
}) => {
  const edges = biggestEdges(playerStats, opponentStats);
  const overallGap = playerOverall - opponentOverall;

  return (
    <div className="bg-pixel-card border-4 border-pixel-border p-4" data-testid="head-to-head">
      {/* Names and overall ratings, the headline comparison */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
        <div className="min-w-0">
          <div className="font-bold text-pixel-text truncate">{playerName}</div>
          <div
            className={`text-3xl font-bold tabular-nums ${overallGap >= EVEN_WITHIN ? 'text-pixel-success' : 'text-pixel-text'}`}
          >
            {playerOverall}
          </div>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-pixel-text-muted">
          Overall
        </div>
        <div className="min-w-0 text-right">
          <div className="font-bold text-pixel-text truncate">{opponentName}</div>
          <div
            className={`text-3xl font-bold tabular-nums ${-overallGap >= EVEN_WITHIN ? 'text-pixel-error' : 'text-pixel-text'}`}
          >
            {opponentOverall}
          </div>
          {opponentTag && <div className="mt-1 flex justify-end">{opponentTag}</div>}
        </div>
      </div>

      {/* Core skills, mirrored */}
      <div className="grid gap-2">
        {CORE_ROWS.map((stat) => {
          const ours = playerStats.core[stat];
          const theirs = opponentStats.core[stat];
          const gap = ours - theirs;
          const ahead = gap >= EVEN_WITHIN;
          const behind = gap <= -EVEN_WITHIN;
          return (
            <div
              key={stat}
              className="grid grid-cols-[2rem_1fr_6.5rem_1fr_2rem] items-center gap-2 text-sm"
              data-testid={`head-to-head-${stat}`}
              data-gap={gap}
            >
              <span
                className={`text-right font-bold tabular-nums ${ahead ? 'text-pixel-success' : 'text-pixel-text-muted'}`}
              >
                {ours}
              </span>
              <Bar value={ours} side="left" tone={ahead ? 'bg-pixel-success' : 'bg-gray-500'} />
              <span className="text-center text-pixel-text whitespace-nowrap">
                <span aria-hidden="true">{STAT_ICONS[stat]} </span>
                {formatStatName(stat)}
              </span>
              <Bar value={theirs} side="right" tone={behind ? 'bg-pixel-error' : 'bg-gray-500'} />
              <span
                className={`font-bold tabular-nums ${behind ? 'text-pixel-error' : 'text-pixel-text-muted'}`}
              >
                {theirs}
              </span>
            </div>
          );
        })}
      </div>

      {/* Where the match will be won and lost, across every stat */}
      {(edges.ours.length > 0 || edges.theirs.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t-2 border-pixel-border text-sm">
          {edges.ours.map(({ stat, gap }) => (
            <span
              key={stat}
              className="px-2 py-1 border-2 border-green-700 text-green-400 font-bold"
            >
              {STAT_ICONS[stat]} {formatStatName(stat)} +{gap}
            </span>
          ))}
          {edges.theirs.map(({ stat, gap }) => (
            <span key={stat} className="px-2 py-1 border-2 border-red-800 text-red-400 font-bold">
              {STAT_ICONS[stat]} {formatStatName(stat)} {gap}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
