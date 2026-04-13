/**
 * Pre-Match Screen Component
 * Shared screen for previewing opponent and match details before starting a match.
 * Used by both tournament matches and story matches.
 */

import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { PlayerStats } from '../types/game';

interface PreMatchScreenProps {
  // Header — use headerContent for a fully custom header, or title/subtitle for the default
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;

  // Opponent
  opponentName: string;
  opponentTier: number;
  opponentDescription?: string;
  opponentStats: PlayerStats;

  // Match config
  surface: string;
  matchFormat: 'best-of-1' | 'best-of-3';
  energyCost: number;
  currentEnergy: number;

  // Optional extra context rendered below the start button
  contextContent?: React.ReactNode;

  // Actions
  onStartMatch: () => void;
  onBack: () => void;
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

const getFormatLabel = (format: 'best-of-1' | 'best-of-3'): string => {
  switch (format) {
    case 'best-of-1': return 'Best of 1 Set';
    case 'best-of-3': return 'Best of 3 Sets';
    default: return format;
  }
};

export const PreMatchScreen: React.FC<PreMatchScreenProps> = ({
  title,
  subtitle,
  headerContent,
  opponentName,
  opponentTier,
  opponentDescription,
  opponentStats,
  surface,
  matchFormat,
  energyCost,
  currentEnergy,
  contextContent,
  onStartMatch,
  onBack,
}) => {
  const canAfford = currentEnergy >= energyCost;

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={onBack}>
            ← Back to Menu
          </Button>
        </div>

        {/* Match Header */}
        {headerContent ?? (
          <Card title={title} className="mb-6">
            {subtitle && (
              <p className="text-pixel-text-muted mb-4">{subtitle}</p>
            )}
            <div className="p-3 bg-pixel-bg border-2 border-pixel-border">
              <div className="flex items-center justify-between">
                <span className="text-pixel-text-muted">Surface:</span>
                <span className="text-pixel-text font-bold">
                  {getSurfaceEmoji(surface)} {surface.toUpperCase()}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Opponent Card */}
        <Card title="Your Opponent" className="mb-6">
          <div className={`border-4 ${getTierColor(opponentTier)} p-4 bg-pixel-card`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-2xl font-bold text-pixel-text mb-1">
                  {opponentName}
                </h3>
                <span className="text-sm px-2 py-1 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase">
                  {getTierLabel(opponentTier)}
                </span>
              </div>
              <span className="text-4xl">🎾</span>
            </div>

            {opponentDescription && (
              <p className="text-pixel-text-muted mb-4 text-sm">
                {opponentDescription}
              </p>
            )}

            {/* Opponent Stats Preview */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Core</div>
                <div className="text-lg font-bold text-amber-500">
                  {Math.round(
                    (opponentStats.core.serve + opponentStats.core.forehand +
                      opponentStats.core.backhand + opponentStats.core.return +
                      opponentStats.core.slice) / 5
                  )}
                </div>
              </div>
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Technical</div>
                <div className="text-lg font-bold text-green-500">
                  {opponentStats.core.forehand}
                </div>
              </div>
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Physical</div>
                <div className="text-lg font-bold text-blue-500">
                  {opponentStats.physical.speed}
                </div>
              </div>
              <div className="p-2 bg-pixel-bg border-2 border-pixel-border">
                <div className="text-xs text-pixel-text-muted mb-1">Mental</div>
                <div className="text-lg font-bold text-purple-500">
                  {opponentStats.mental.focus}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Match Details */}
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

            <div className="p-3 bg-pixel-card border-2 border-pixel-border">
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Key Moments:</span>
                <span className="text-pixel-text font-bold">Interactive</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Start Match Button */}
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

        {/* Optional Context Content */}
        {contextContent}
      </div>
    </div>
  );
};
