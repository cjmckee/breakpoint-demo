/**
 * Player Stats Display Component
 * Comprehensive display of all 22 player stats organized by category
 */

import React, { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { StatCard } from './StatCard';
import { StatBar } from './StatBar';
import { AbilityDisplay } from './AbilityDisplay';
import { EffectAggregator } from '../core/EffectAggregator';
import type { StatBoosts } from '../types/game';

interface PlayerStatsDisplayProps {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
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
      <Card title="Player Statistics" collapsible={collapsible} defaultCollapsed={defaultCollapsed}>
        <div className="text-center py-8 text-pixel-text-muted">
          No player data available
        </div>
      </Card>
    );
  }

  const stats = player.stats;

  const statCategories = [
    {
      name: 'Core Skills',
      stats: [
        { key: 'serve', label: 'Serve', value: stats.core.serve },
        { key: 'forehand', label: 'Forehand', value: stats.core.forehand },
        { key: 'backhand', label: 'Backhand', value: stats.core.backhand },
        { key: 'return', label: 'Return', value: stats.core.return },
        { key: 'slice', label: 'Slice', value: stats.core.slice },
      ],
    },
    {
      name: 'Technical Skills',
      stats: [
        { key: 'volley', label: 'Volley', value: stats.technical.volley },
        { key: 'overhead', label: 'Overhead', value: stats.technical.overhead },
        { key: 'dropShot', label: 'Drop Shot', value: stats.technical.dropShot },
        { key: 'spin', label: 'Spin', value: stats.technical.spin },
        { key: 'placement', label: 'Placement', value: stats.technical.placement },
      ],
    },
    {
      name: 'Physical Stats',
      stats: [
        { key: 'speed', label: 'Speed', value: stats.physical.speed },
        { key: 'stamina', label: 'Stamina', value: stats.physical.stamina },
        { key: 'strength', label: 'Strength', value: stats.physical.strength },
        { key: 'agility', label: 'Agility', value: stats.physical.agility },
        { key: 'recovery', label: 'Recovery', value: stats.physical.recovery },
      ],
    },
    {
      name: 'Mental Stats',
      stats: [
        { key: 'focus', label: 'Focus', value: stats.mental.focus },
        { key: 'anticipation', label: 'Anticipation', value: stats.mental.anticipation },
        { key: 'shotVariety', label: 'Shot Variety', value: stats.mental.shotVariety },
        { key: 'offensive', label: 'Offensive', value: stats.mental.offensive },
        { key: 'defensive', label: 'Defensive', value: stats.mental.defensive },
      ],
    },
  ];

  return (
    <Card title="Player Statistics" collapsible={collapsible} defaultCollapsed={defaultCollapsed}>
      {/* Stat Categories */}
      <div className="space-y-6 mb-6">
        {statCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h4 className="font-semibold text-pixel-text-muted text-sm pb-2 border-b-2 border-pixel-border">
              {category.name}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {category.stats.map((stat) =>
                'isExperience' in stat && stat.isExperience ? (
                  <div
                    key={stat.key}
                    className="col-span-2 sm:col-span-3 md:col-span-5"
                  >
                    <StatBar
                      label={stat.label}
                      value={stat.value}
                      max={1000}
                      isExperience={true}
                    />
                  </div>
                ) : (
                  <StatCard
                    key={stat.key}
                    label={stat.label}
                    value={stat.value}
                    boost={boosts[stat.key as keyof StatBoosts] || 0}
                  />
                )
              )}
            </div>
          </div>
        ))}
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
    </Card>
  );
};
