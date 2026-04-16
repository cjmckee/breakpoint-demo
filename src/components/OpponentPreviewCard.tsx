/**
 * Opponent Preview Card Component
 * Compact preview card for showing opponent info in calendar view
 */

import React from 'react';
import type { PlayerStats, PlayStyle, CourtSurface } from '../types';
import { calculateOverallRating, getTierLabel, getTierColor, getSurfaceEmoji, getArchetypeLabel, getArchetypeData, STAT_LABELS, flattenStats, getTopNStats, getBottomNStats } from '../utils/playerStats';
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
  const archetypeLabel = getArchetypeLabel(opponentPlayStyle.type);
  const archetype = getArchetypeData(opponentPlayStyle.type);

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
          {archetype && (
            <div className="text-xs text-pixel-text-muted mt-1 italic">
              "{archetype.servingTendency}"
            </div>
          )}
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
