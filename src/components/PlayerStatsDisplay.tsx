/**
 * Player Stats Display Component
 * Comprehensive display of all 22 player stats organized by category
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { StatCard } from './StatCard';
import { StatBar } from './StatBar';

export const PlayerStatsDisplay: React.FC = () => {
  const player = useGameStore((state) => state.player);

  if (!player) {
    return (
      <Card title="Player Statistics">
        <div className="text-center py-8 text-pixel-text-muted">
          No player data available
        </div>
      </Card>
    );
  }

  const stats = player.stats;

  const statCategories = [
    {
      name: 'Technical Skills',
      stats: [
        { key: 'serve', label: 'Serve', value: stats.technical.serve },
        { key: 'forehand', label: 'Forehand', value: stats.technical.forehand },
        { key: 'backhand', label: 'Backhand', value: stats.technical.backhand },
        { key: 'volley', label: 'Volley', value: stats.technical.volley },
        { key: 'overhead', label: 'Overhead', value: stats.technical.overhead },
        { key: 'dropShot', label: 'Drop Shot', value: stats.technical.dropShot },
        { key: 'slice', label: 'Slice', value: stats.technical.slice },
        { key: 'return', label: 'Return', value: stats.technical.return },
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
    <Card title="Player Statistics">
      {/* Stat Categories */}
      <div className="space-y-6 mb-6">
        {statCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h4 className="font-semibold text-pixel-text-muted text-sm pb-2 border-b-2 border-pixel-border">
              {category.name}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {player.abilities.map((ability, idx) => {
              const rarityColors = {
                common: 'border-blue-500 bg-blue-500 bg-opacity-10',
                uncommon: 'border-green-500 bg-green-500 bg-opacity-10',
                rare: 'border-purple-500 bg-purple-500 bg-opacity-10',
                legendary: 'border-orange-500 bg-orange-500 bg-opacity-10',
              };

              const rarityColor =
                rarityColors[ability.rarity as keyof typeof rarityColors] ||
                rarityColors.common;

              return (
                <div
                  key={idx}
                  className={`border-4 ${rarityColor} p-3 transition-all hover:scale-105`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-pixel-text text-sm">
                      {ability.name}
                    </h5>
                    <span className="text-xs px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text">
                      Lv.{ability.level}
                    </span>
                  </div>
                  <div className="text-xs text-pixel-text-muted mb-2 capitalize">
                    {ability.rarity} rarity
                  </div>
                  {ability.description && (
                    <p className="text-xs text-pixel-text leading-relaxed">
                      {ability.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
