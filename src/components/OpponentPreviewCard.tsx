/**
 * Opponent Preview Card Component
 * Compact preview card for showing opponent info in calendar view
 */

import React from 'react';
import type { PlayerStats, PlayStyle, CourtSurface } from '../types';
import { SURFACE_EFFECTS } from '../config/shotThresholds';
import { ARCHETYPE_DATA, getArchetypeLabel } from '../data/archetypes';
import type { ArchetypeType } from '../data/archetypes';
import type { StatName } from '../types';

interface OpponentPreviewCardProps {
  opponentName: string;
  opponentTier: number;
  opponentDescription?: string;
  opponentStats: PlayerStats;
  opponentPlayStyle: PlayStyle;
  surface: CourtSurface;
}

const STAT_LABELS: Record<StatName, string> = {
  serve: 'Serve',
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  slice: 'Slice',
  volley: 'Volley',
  overhead: 'Overhead',
  dropShot: 'Drop Shot',
  spin: 'Spin',
  placement: 'Placement',
  speed: 'Speed',
  stamina: 'Stamina',
  strength: 'Strength',
  agility: 'Agility',
  recovery: 'Recovery',
  focus: 'Focus',
  anticipation: 'Anticipation',
  shotVariety: 'Shot Variety',
  offensive: 'Offensive',
  defensive: 'Defensive',
};

interface StatDisplay {
  name: StatName;
  value: number;
  label: string;
}

function flattenStats(stats: PlayerStats): StatDisplay[] {
  const entries: StatDisplay[] = [];

  (Object.entries(stats.core) as [keyof typeof stats.core, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });
  (Object.entries(stats.technical) as [keyof typeof stats.technical, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });
  (Object.entries(stats.physical) as [keyof typeof stats.physical, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });
  (Object.entries(stats.mental) as [keyof typeof stats.mental, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });

  return entries;
}

function getTopNStats(stats: PlayerStats, n: number): StatDisplay[] {
  return flattenStats(stats)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

function getBottomNStats(stats: PlayerStats, n: number): StatDisplay[] {
  return flattenStats(stats)
    .sort((a, b) => a.value - b.value)
    .slice(0, n);
}

function calculateOverallRating(stats: PlayerStats): number {
  const coreAvg = (stats.core.serve + stats.core.forehand + stats.core.backhand + stats.core.return + stats.core.slice) / 5;
  const technicalAvg = (stats.technical.volley + stats.technical.overhead + stats.technical.dropShot + stats.technical.spin + stats.technical.placement) / 5;
  const physicalAvg = (stats.physical.speed + stats.physical.stamina + stats.physical.strength + stats.physical.agility + stats.physical.recovery) / 5;
  const mentalAvg = (stats.mental.focus + stats.mental.anticipation + stats.mental.shotVariety + stats.mental.offensive + stats.mental.defensive) / 5;

  return Math.round(
    coreAvg * 0.45 +
    technicalAvg * 0.15 +
    physicalAvg * 0.25 +
    mentalAvg * 0.15
  );
}

const getTierLabel = (tier: number): string => {
  switch (tier) {
    case 1: return 'Club';
    case 2: return 'Regional';
    case 3: return 'Professional';
    case 4: return 'Elite';
    default: return 'Unknown';
  }
};

const getTierColor = (tier: number): string => {
  switch (tier) {
    case 1: return 'border-green-500';
    case 2: return 'border-yellow-500';
    case 3: return 'border-orange-500';
    case 4: return 'border-red-500';
    default: return 'border-pixel-border';
  }
};

const getSurfaceEmoji = (surface: string): string => {
  switch (surface) {
    case 'hard': return '🏟️';
    case 'clay': return '🧱';
    case 'grass': return '🌱';
    case 'carpet': return '📋';
    default: return '🎾';
  }
};

export const OpponentPreviewCard: React.FC<OpponentPreviewCardProps> = ({
  opponentName,
  opponentTier,
  opponentDescription,
  opponentStats,
  opponentPlayStyle,
  surface,
}) => {
  const topStats = getTopNStats(opponentStats, 5);
  const bottomStats = getBottomNStats(opponentStats, 5);
  const overallRating = calculateOverallRating(opponentStats);
  const archetypeLabel = getArchetypeLabel(opponentPlayStyle.type as ArchetypeType);
  const archetype = ARCHETYPE_DATA[opponentPlayStyle.type as ArchetypeType];

  return (
    <div className={`border-4 ${getTierColor(opponentTier)} bg-gray-900 p-4 w-96 shadow-xl opacity-95`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-xl font-bold text-pixel-text">{opponentName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase font-medium">
              {getTierLabel(opponentTier)}
            </span>
            <span className="text-sm px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text font-medium">
              Overall: {overallRating}
            </span>
          </div>
        </div>
        <span className="text-3xl">⚔️</span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-pixel-text-muted mb-2 uppercase tracking-wide font-bold">Strengths</div>
          <div className="grid grid-cols-2 gap-1">
            {topStats.map((stat) => (
              <div key={stat.name} className="flex justify-between items-center px-2 py-0.5 bg-green-900/30 border border-green-800/50 rounded text-xs">
                <span className="text-green-400 font-medium">{stat.label}</span>
                <span className="text-green-400 font-bold ml-2">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-pixel-text-muted mb-2 uppercase tracking-wide font-bold">Weaknesses</div>
          <div className="grid grid-cols-2 gap-1">
            {bottomStats.map((stat) => (
              <div key={stat.name} className="flex justify-between items-center px-2 py-0.5 bg-orange-900/30 border border-orange-800/50 rounded text-xs">
                <span className="text-orange-400 font-medium">{stat.label}</span>
                <span className="text-orange-400 font-bold ml-2">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-pixel-text-muted mb-1 uppercase tracking-wide font-bold">Playstyle</div>
          <div className="text-pixel-text font-medium">{archetypeLabel}</div>
          <div className="text-xs text-pixel-text-muted mt-1 italic">
            "{archetype.servingTendency}"
          </div>
        </div>

        <div className="pt-2 border-t border-pixel-border">
          <div className="flex items-center justify-between">
            <span className="text-pixel-text-muted font-medium">Surface:</span>
            <span className="text-pixel-text font-bold">
              {getSurfaceEmoji(surface)} {surface.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
