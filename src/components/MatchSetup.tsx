/**
 * Match Setup Component
 * Configure opponent tier, surface, and match format before starting.
 * A random opponent from the selected tier is assigned when the match starts.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PlayerStats, OpponentTier } from '../types/game';
import { ItemManager } from '../game/ItemManager';
import { getRandomOpponent, OPPONENTS_BY_TIER } from '../data/opponents';
import { getArchetypeLabel } from '../data/archetypes';
import { DEFAULT_MATCH_ENERGY_COST } from '../config/matchRewards';

type CourtSurface = 'hard' | 'clay' | 'grass' | 'carpet';

interface TierInfo {
  tier: OpponentTier;
  name: string;
  description: string;
}

const TIER_INFO: TierInfo[] = [
  { tier: 1, name: 'Club', description: 'Local club players, great for practice' },
  { tier: 2, name: 'Regional', description: 'Strong regional competitors with solid fundamentals' },
  { tier: 3, name: 'Professional', description: 'Professional tour players, very challenging' },
  { tier: 4, name: 'Champion', description: 'Elite champions, the ultimate challenge' },
];

export const MatchSetup: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const beginMatch = useGameStore((state) => state.beginMatch);

  const [selectedTier, setSelectedTier] = useState<OpponentTier>(1);
  const [selectedSurface, setSelectedSurface] = useState<CourtSurface>('hard');

  if (!player) {
    return null;
  }

  const handleStartMatch = () => {
    const opponent = getRandomOpponent(selectedTier);

    const config = {
      playerStats: player.stats,
      playerName: player.name,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: opponent.stats as PlayerStats,
      opponentName: opponent.name,
      opponentTier: opponent.tier,
      surface: selectedSurface,
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      matchFormat: 'best-of-1' as const,
    };

    beginMatch(config, 'regular');
    useMatchStore.getState().startMatch(config, (data) => {
      useGameStore.getState().onMatchComplete(data);
    });
  };

  const matchEnergyCost = DEFAULT_MATCH_ENERGY_COST;
  const canAfford = currentStatus.energy >= matchEnergyCost;
  const canPlayMatch = canAfford && selectedTier <= player.tier;

  const getTierColor = (tier: OpponentTier) => {
    switch (tier) {
      case 1:
        return 'border-green-500 bg-green-500 bg-opacity-10';
      case 2:
        return 'border-yellow-500 bg-yellow-500 bg-opacity-10';
      case 3:
        return 'border-orange-500 bg-orange-500 bg-opacity-10';
      case 4:
        return 'border-red-500 bg-red-500 bg-opacity-10';
      default:
        return 'border-pixel-border';
    }
  };

  const isOpponentUnlocked = (tier: OpponentTier): boolean => {
    return tier <= player.tier;
  };

  const getSurfaceEmoji = (surface: CourtSurface) => {
    switch (surface) {
      case 'hard':
        return '🏟️';
      case 'clay':
        return '🧱';
      case 'grass':
        return '🌱';
      case 'carpet':
        return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => navigateTo('idle')}>
            ← Back to Menu
          </Button>
        </div>

        <Card title="Match Setup" className="mb-6">
          <p className="text-pixel-text-muted mb-4">
            Choose a tier and surface. A random opponent will be selected from the tier.
          </p>

          {/* Energy Cost Warning */}
          <div className="mb-6 p-4 bg-pixel-card border-2 border-pixel-border">
            <div className="flex justify-between items-center">
              <span className="text-pixel-text font-bold">Energy Cost:</span>
              <span
                className={`text-xl font-bold ${canAfford ? 'text-green-500' : 'text-red-500'}`}
              >
                {matchEnergyCost} Energy
              </span>
            </div>
            <div className="mt-2 text-sm text-pixel-text-muted">
              You have {currentStatus.energy} / 100 energy available
            </div>
          </div>

          {/* Tier Selection */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-pixel-text mb-3">
              Choose Opponent Tier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TIER_INFO.map((info) => {
                const isSelected = selectedTier === info.tier;
                const isUnlocked = isOpponentUnlocked(info.tier);
                const opponents = OPPONENTS_BY_TIER[info.tier];
                return (
                  <button
                    key={info.tier}
                    onClick={() => isUnlocked && setSelectedTier(info.tier)}
                    disabled={!isUnlocked}
                    className={`p-4 border-4 text-left transition-all relative ${
                      !isUnlocked
                        ? 'opacity-50 cursor-not-allowed border-pixel-border bg-pixel-bg'
                        : isSelected
                        ? 'border-pixel-accent bg-pixel-accent bg-opacity-20'
                        : getTierColor(info.tier)
                    } ${isUnlocked && 'hover:scale-105'}`}
                  >
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2 text-3xl">
                        🔒
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold text-pixel-text">
                        {info.name}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase">
                        Tier {info.tier}
                      </span>
                    </div>
                    <p className="text-sm text-pixel-text-muted mb-3">
                      {isUnlocked
                        ? info.description
                        : 'Beat the previous tier to unlock!'
                      }
                    </p>
                    {isUnlocked && (
                      <div className="flex flex-wrap gap-1">
                        {opponents.map((opp) => (
                          <span
                            key={opp.name}
                            className="text-xs px-2 py-0.5 bg-pixel-bg border border-pixel-border text-pixel-text-muted"
                          >
                            {getArchetypeLabel(opp.archetype)}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surface Selection */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-pixel-text mb-3">
              Choose Court Surface
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['hard', 'clay', 'grass', 'carpet'] as CourtSurface[]).map((surface) => {
                const isSelected = selectedSurface === surface;
                return (
                  <button
                    key={surface}
                    onClick={() => setSelectedSurface(surface)}
                    className={`p-4 border-4 text-center transition-all ${
                      isSelected
                        ? 'border-pixel-accent bg-pixel-accent bg-opacity-20'
                        : 'border-pixel-border bg-pixel-card'
                    } hover:scale-105`}
                  >
                    <div className="text-4xl mb-2">{getSurfaceEmoji(surface)}</div>
                    <div className="font-bold text-pixel-text capitalize">
                      {surface}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Match Button */}
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartMatch}
              disabled={!canPlayMatch}
            >
              {!isOpponentUnlocked(selectedTier) ? (
                <>🔒 Tier Locked</>
              ) : !canAfford ? (
                <>Not Enough Energy (Need {matchEnergyCost})</>
              ) : (
                <>🎾 Start Match — Tier {selectedTier}</>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
