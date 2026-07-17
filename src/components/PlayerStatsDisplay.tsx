/**
 * Player Stats Display Component
 * Option A layout: the 5 Core Skills are the personality showcase (big animated
 * grade cards), while the 15 supporting stats live below as a compact tile matrix
 * grouped by category — each group headed by its average grade for an at-a-glance
 * read. Every card and tile reveals its description on hover (desktop) / tap (mobile).
 */

import React, { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { StatCard } from './StatCard';
import { StatTile } from './StatTile';
import { AbilityDisplay } from './AbilityDisplay';
import { getLetterGrade } from '../utils/playerStats';
import { EffectAggregator } from '../core/EffectAggregator';
import { STAT_DESCRIPTIONS } from '../data/glossary';
import type { StatBoosts } from '../types/game';

interface PlayerStatsDisplayProps {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface StatEntry {
  key: string;
  label: string;
  value: number;
}

export const PlayerStatsDisplay: React.FC<PlayerStatsDisplayProps> = ({
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const player = useGameStore((state) => state.player);

  // Compute total passive boosts from items and abilities
  const boosts = useMemo<StatBoosts>(() => {
    if (!player) return {};
    return EffectAggregator.getActiveEffects(player).statBoosts;
  }, [player]);

  if (!player) {
    return (
      <Card title="Player Stats" collapsible={collapsible} defaultCollapsed={defaultCollapsed}>
        <div className="text-center py-8 text-pixel-text-muted">
          No player data available
        </div>
      </Card>
    );
  }

  const stats = player.stats;

  const coreStats: StatEntry[] = [
    { key: 'serve', label: 'Serve', value: stats.core.serve },
    { key: 'forehand', label: 'Forehand', value: stats.core.forehand },
    { key: 'backhand', label: 'Backhand', value: stats.core.backhand },
    { key: 'return', label: 'Return', value: stats.core.return },
    { key: 'slice', label: 'Slice', value: stats.core.slice },
  ];

  // The 15 supporting skills — still important, so grouped and always visible, just
  // compact. Each group surfaces its average grade for the quick read.
  const supportingGroups: { name: string; stats: StatEntry[] }[] = [
    {
      name: 'Technical',
      stats: [
        { key: 'volley', label: 'Volley', value: stats.technical.volley },
        { key: 'overhead', label: 'Overhead', value: stats.technical.overhead },
        { key: 'dropShot', label: 'Drop Shot', value: stats.technical.dropShot },
        { key: 'spin', label: 'Spin', value: stats.technical.spin },
        { key: 'placement', label: 'Placement', value: stats.technical.placement },
      ],
    },
    {
      name: 'Physical',
      stats: [
        { key: 'speed', label: 'Speed', value: stats.physical.speed },
        { key: 'stamina', label: 'Stamina', value: stats.physical.stamina },
        { key: 'strength', label: 'Strength', value: stats.physical.strength },
        { key: 'agility', label: 'Agility', value: stats.physical.agility },
        { key: 'recovery', label: 'Recovery', value: stats.physical.recovery },
      ],
    },
    {
      name: 'Mental',
      stats: [
        { key: 'focus', label: 'Focus', value: stats.mental.focus },
        { key: 'anticipation', label: 'Anticipation', value: stats.mental.anticipation },
        { key: 'shotVariety', label: 'Shot Variety', value: stats.mental.shotVariety },
        { key: 'offensive', label: 'Offensive', value: stats.mental.offensive },
        { key: 'defensive', label: 'Defensive', value: stats.mental.defensive },
      ],
    },
  ];

  const groupAverage = (entries: StatEntry[]): number =>
    Math.round(entries.reduce((sum, s) => sum + s.value, 0) / entries.length);

  return (
    <Card title="Player Stats" collapsible={collapsible} defaultCollapsed={defaultCollapsed}>
      {/* Core Skills — the personality showcase */}
      <div className="p-3 border-2 border-pixel-accent border-opacity-40 bg-pixel-accent bg-opacity-5 rounded mb-6">
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-pixel-accent border-opacity-40">
          <h4 className="font-semibold text-sm text-pixel-accent">★ Core Skills</h4>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {coreStats.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              boost={boosts[stat.key as keyof StatBoosts] || 0}
              description={STAT_DESCRIPTIONS[stat.label]}
            />
          ))}
        </div>
      </div>

      {/* Supporting Skills — compact tile matrix grouped by category */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-5">
        {supportingGroups.map((group) => {
          const avg = groupAverage(group.stats);
          const { grade, color } = getLetterGrade(avg);
          return (
            <div key={group.name}>
              <div className="flex items-baseline justify-between border-b-2 border-pixel-border pb-1.5 mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-pixel-text-muted">
                  {group.name}
                </span>
                <span
                  className="text-base font-bold leading-none"
                  style={{ color }}
                  title={`Average: ${avg}`}
                >
                  {grade}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.stats.map((stat) => (
                  <StatTile
                    key={stat.key}
                    label={stat.label}
                    value={stat.value}
                    boost={boosts[stat.key as keyof StatBoosts] || 0}
                    description={STAT_DESCRIPTIONS[stat.label]}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Abilities Section */}
      {player.abilities && player.abilities.length > 0 && (
        <div className="mt-6 pt-6 border-t-4 border-pixel-border">
          <h4 className="font-semibold text-pixel-text-muted text-sm pb-2 mb-3">
            Abilities
          </h4>
          <AbilityDisplay abilities={player.abilities} />
        </div>
      )}

      {/* Career Stats — progress tracking, kept to one quiet line */}
      <div className="mt-6 pt-4 border-t-2 border-pixel-border flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-pixel-text-muted">
        <span className="font-semibold uppercase tracking-wide">Career</span>
        <span>
          <span className="font-bold text-pixel-text">{player.matchesWon ?? 0}</span> W
          {' – '}
          <span className="font-bold text-pixel-text">{(player.matchesPlayed ?? 0) - (player.matchesWon ?? 0)}</span> L
        </span>
        <span>
          <span className="font-bold text-yellow-400">{player.totalExperienceEarned ?? 0}</span> XP earned
        </span>
      </div>
    </Card>
  );
};
