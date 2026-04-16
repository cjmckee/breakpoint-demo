/**
 * Pre-Match Screen Component
 * Shared screen for previewing opponent and match details before starting a match.
 * Used by both tournament matches and story matches.
 */

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SURFACE_EFFECTS } from '../config/shotThresholds';
import { ARCHETYPE_DATA } from '../data/archetypes';
import type { PlayerStats, PlayStyle, CourtSurface, StatName } from '../types';
import type { ArchetypeType } from '../data/archetypes';
import {
  calculateOverallRating,
  getTierLabel,
  getTierColor,
  getSurfaceEmoji,
  getArchetypeLabel,
  getTopNStats,
  getBottomNStats,
  getLetterGrade,
} from '../utils/playerStats';

interface SurfaceEffectDisplay {
  label: string;
  direction: 'up' | 'down';
}

interface PreMatchScreenProps {
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;

  // Player
  playerName: string;
  playerTier: number;
  playerOverallRating: number;
  playerStats: PlayerStats;
  playerPlayStyle: PlayStyle;
  playerDescription?: string;

  // Opponent
  opponentName: string;
  opponentTier: number;
  opponentDescription?: string;
  opponentStats: PlayerStats;
  opponentPlayStyle: PlayStyle;

  // Match config
  surface: CourtSurface;
  matchFormat: 'best-of-1' | 'best-of-3';
  energyCost: number;
  currentEnergy: number;

  contextContent?: React.ReactNode;

  onStartMatch: () => void;
  onBack: () => void;
}

function getSurfaceEffects(surface: CourtSurface): SurfaceEffectDisplay[] {
  const effects = SURFACE_EFFECTS[surface];
  const result: SurfaceEffectDisplay[] = [];

  if (effects.serveQualityMultiplier !== 1.0) {
    result.push({
      label: 'Serves',
      direction: effects.serveQualityMultiplier > 1.0 ? 'up' : 'down',
    });
  }

  if (effects.netApproachBonus !== 0) {
    result.push({
      label: 'Net Play',
      direction: effects.netApproachBonus > 0 ? 'up' : 'down',
    });
  }

  if (effects.defensiveAdjustmentMultiplier !== 1.0) {
    result.push({
      label: 'Defense',
      direction: effects.defensiveAdjustmentMultiplier > 1.0 ? 'up' : 'down',
    });
  }

  if (effects.returnAdjustmentMultiplier !== 1.0) {
    result.push({
      label: 'Returns',
      direction: effects.returnAdjustmentMultiplier > 1.0 ? 'up' : 'down',
    });
  }

  return result;
}

const getFormatLabel = (format: 'best-of-1' | 'best-of-3'): string => {
  switch (format) {
    case 'best-of-1': return 'Best of 1 Set';
    case 'best-of-3': return 'Best of 3 Sets';
    default: return format;
  }
};

interface PlayerCardProps {
  name: string;
  tier?: number;
  overallRating: number;
  stats: PlayerStats;
  playStyle: PlayStyle;
  isPlayer: boolean;
}

function PlayerCard({ name, tier, overallRating, stats, playStyle, isPlayer }: PlayerCardProps) {
  const topStats = getTopNStats(stats, 5);
  const bottomStats = getBottomNStats(stats, 5);
  const archetypeLabel = getArchetypeLabel(playStyle.type);

  const borderColor = isPlayer ? 'border-blue-500' : getTierColor(tier ?? 1);
  const bgColor = isPlayer ? 'bg-blue-950/30' : 'bg-pixel-card';

  return (
    <div className={`border-4 ${borderColor} p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-pixel-text mb-1">{name}</h3>
          <div className="flex items-center gap-2">
            {tier !== undefined && (
              <span className="text-sm px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase">
                {getTierLabel(tier)}
              </span>
            )}
            <span className="text-sm px-2 py-0.5 bg-pixel-bg border-2 border-pixel-border text-pixel-text">
              Overall: {overallRating}
            </span>
          </div>
        </div>
        <span className="text-3xl">{isPlayer ? '🎾' : '⚔️'}</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">Strengths</div>
          <div className="space-y-1">
            {topStats.map((stat) => {
              const grade = getLetterGrade(stat.value);
              return (
                <div key={stat.name} className="flex justify-between items-center text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="text-green-600">▲</span>
                    {stat.label}
                  </span>
                  <span className="text-green-400 font-bold flex items-center gap-2">
                    <span className="text-green-400/70">{stat.value}</span>
                    <span style={{ color: grade.color }} className="w-6 text-right">{grade.grade}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">Weaknesses</div>
          <div className="space-y-1">
            {bottomStats.map((stat) => {
              const grade = getLetterGrade(stat.value);
              return (
                <div key={stat.name} className="flex justify-between items-center text-sm">
                  <span className="text-orange-400 flex items-center gap-1">
                    <span className="text-orange-600">▼</span>
                    {stat.label}
                  </span>
                  <span className="text-orange-400 font-bold flex items-center gap-2">
                    <span className="text-orange-400/70">{stat.value}</span>
                    <span style={{ color: grade.color }} className="w-6 text-right">{grade.grade}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-pixel-text-muted mb-1 uppercase tracking-wide">Playstyle</div>
          <div className="text-sm">
            <div className="text-pixel-text font-medium">{archetypeLabel}</div>
            <div className="text-pixel-text-muted text-xs">{playStyle.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurfaceEffectsDisplay({ surface }: { surface: CourtSurface }) {
  const effects = getSurfaceEffects(surface);

  if (effects.length === 0) {
    return (
      <span className="text-pixel-text-muted text-sm">No surface effects</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {effects.map((effect) => (
        <span
          key={effect.label}
          className={`px-2 py-1 text-sm font-medium ${
            effect.direction === 'up'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          {effect.label}: {effect.direction === 'up' ? '▲' : '▼'}
        </span>
      ))}
    </div>
  );
}

function ScoutingReport({ playStyle }: { playStyle: PlayStyle }) {
  const [isOpen, setIsOpen] = useState(false);
  const archetype = ARCHETYPE_DATA[playStyle.type as ArchetypeType];

  return (
    <div className="bg-pixel-card border-2 border-pixel-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-pixel-bg/50 transition-colors"
      >
        <span className="text-pixel-text font-medium">Scouting Report</span>
        <span className="text-pixel-text-muted">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="p-3 pt-1 space-y-3 border-t border-pixel-border">
          <div>
            <div className="text-xs text-pixel-text-muted mb-1">Serving Style</div>
            <div className="text-sm text-pixel-text">{archetype.servingTendency}</div>
          </div>

          <div>
            <div className="text-xs text-pixel-text-muted mb-1">Returning Style</div>
            <div className="text-sm text-pixel-text">{archetype.returningTendency}</div>
          </div>

          <div>
            <div className="text-xs text-pixel-text-muted mb-1">Rally Behavior</div>
            <div className="text-sm text-pixel-text">{archetype.rallyTendency}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export const PreMatchScreen: React.FC<PreMatchScreenProps> = ({
  title,
  subtitle,
  headerContent,
  playerName,
  playerTier,
  playerOverallRating,
  playerStats,
  playerPlayStyle,
  playerDescription,
  opponentName,
  opponentTier,
  opponentDescription,
  opponentStats,
  opponentPlayStyle,
  surface,
  matchFormat,
  energyCost,
  currentEnergy,
  contextContent,
  onStartMatch,
  onBack,
}) => {
  const canAfford = currentEnergy >= energyCost;

  const opponentOverallRating = calculateOverallRating(opponentStats);

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={onBack}>
            ← Back to Menu
          </Button>
        </div>

        {headerContent ?? (
          <Card title={title} className="mb-6">
            {subtitle && (
              <p className="text-pixel-text-muted mb-4">{subtitle}</p>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <PlayerCard
            name={playerName}
            tier={playerTier}
            overallRating={playerOverallRating}
            stats={playerStats}
            playStyle={playerPlayStyle}
            isPlayer={true}
          />

          <PlayerCard
            name={opponentName}
            tier={opponentTier}
            overallRating={opponentOverallRating}
            stats={opponentStats}
            playStyle={opponentPlayStyle}
            isPlayer={false}
          />
        </div>

        {playerDescription && opponentDescription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-blue-950/30 border-2 border-blue-500">
              <p className="text-sm text-pixel-text-muted">{playerDescription}</p>
            </div>
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <p className="text-sm text-pixel-text-muted">{opponentDescription}</p>
            </div>
          </div>
        ) : playerDescription ? (
          <div className="mb-6">
            <div className="p-3 bg-blue-950/30 border-2 border-blue-500">
              <p className="text-sm text-pixel-text-muted">{playerDescription}</p>
            </div>
          </div>
        ) : opponentDescription ? (
          <div className="mb-6">
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <p className="text-sm text-pixel-text-muted">{opponentDescription}</p>
            </div>
          </div>
        ) : null}

        <Card title="Surface" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-pixel-text font-bold">
              {getSurfaceEmoji(surface)} {surface.toUpperCase()}
            </span>
          </div>
          <SurfaceEffectsDisplay surface={surface} />
        </Card>

        <Card className="mb-6">
          <ScoutingReport playStyle={opponentPlayStyle} />
        </Card>

        <Card title="Match Details" className="mb-6">
          <div className="space-y-3">
            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Energy Cost:</span>
                <span className={`text-xl font-bold ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                  {energyCost} Energy
                </span>
              </div>
              <div className="mt-1 text-xs text-pixel-text-muted">
                You have {currentEnergy} / 100 energy available
              </div>
            </div>

            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Match Format:</span>
                <span className="text-pixel-text font-bold">{getFormatLabel(matchFormat)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onStartMatch}
            disabled={!canAfford}
          >
            {!canAfford ? (
              <>Not Enough Energy (Need {energyCost})</>
            ) : (
              <>🎾 Start Match vs {opponentName}</>
            )}
          </Button>
        </div>

        {contextContent}
      </div>
    </div>
  );
};