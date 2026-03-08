/**
 * Match Setup Component
 * Configure opponent, surface, and match format before starting
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PlayerStats, OpponentTier } from '../types/game';

type CourtSurface = 'hard' | 'clay' | 'grass' | 'carpet';

interface OpponentPreset {
  name: string;
  description: string;
  tier: OpponentTier;
  stats: Partial<PlayerStats>;
}

const OPPONENT_PRESETS: OpponentPreset[] = [
  {
    name: 'Club Player',
    description: 'Local club player, great for practice',
    tier: 1,
    stats: {
      technical: {
        serve: 30,
        forehand: 35,
        backhand: 30,
        volley: 25,
        overhead: 30,
        dropShot: 20,
        slice: 25,
        return: 30,
        spin: 25,
        placement: 30,
      },
      physical: {
        speed: 40,
        stamina: 40,
        strength: 30,
        agility: 35,
        recovery: 35,
      },
      mental: {
        focus: 35,
        anticipation: 30,
        shotVariety: 25,
        offensive: 30,
        defensive: 35,
      },
    },
  },
  {
    name: 'Regional Competitor',
    description: 'Strong regional player with solid fundamentals',
    tier: 2,
    stats: {
      technical: {
        serve: 50,
        forehand: 55,
        backhand: 50,
        volley: 45,
        overhead: 50,
        dropShot: 45,
        slice: 48,
        return: 50,
        spin: 50,
        placement: 52,
      },
      physical: {
        speed: 55,
        stamina: 60,
        strength: 50,
        agility: 55,
        recovery: 55,
      },
      mental: {
        focus: 55,
        anticipation: 52,
        shotVariety: 50,
        offensive: 52,
        defensive: 53,
      },
    },
  },
  {
    name: 'Tour Professional',
    description: 'Professional tour player, very challenging',
    tier: 3,
    stats: {
      technical: {
        serve: 70,
        forehand: 75,
        backhand: 70,
        volley: 65,
        overhead: 70,
        dropShot: 68,
        slice: 70,
        return: 72,
        spin: 73,
        placement: 75,
      },
      physical: {
        speed: 70,
        stamina: 75,
        strength: 70,
        agility: 72,
        recovery: 70,
      },
      mental: {
        focus: 75,
        anticipation: 73,
        shotVariety: 70,
        offensive: 72,
        defensive: 70,
      },
    },
  },
  {
    name: 'Retired World Champion',
    description: 'Elite champion, ultimate challenge. He\'s a little old.',
    tier: 4,
    stats: {
      technical: {
        serve: 90,
        forehand: 95,
        backhand: 90,
        volley: 85,
        overhead: 90,
        dropShot: 88,
        slice: 87,
        return: 92,
        spin: 93,
        placement: 95,
      },
      physical: {
        speed: 88,
        stamina: 92,
        strength: 85,
        agility: 90,
        recovery: 88,
      },
      mental: {
        focus: 95,
        anticipation: 93,
        shotVariety: 90,
        offensive: 92,
        defensive: 88,
      },
    },
  },
];

export const MatchSetup: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const setScreen = useGameStore((state) => state.setScreen);
  const startMatch = useMatchStore((state) => state.startMatch);

  const [selectedOpponent, setSelectedOpponent] = useState<OpponentPreset>(
    OPPONENT_PRESETS[0]
  );
  const [selectedSurface, setSelectedSurface] = useState<CourtSurface>('hard');

  if (!player) {
    return null;
  }

  const handleStartMatch = () => {
    // Fire off match simulation (don't await - it runs until match completes)
    startMatch({
      playerStats: player.stats,
      playerAbilities: player.abilities, // Pass player abilities to apply during match
      opponentStats: selectedOpponent.stats as PlayerStats,
      opponentName: selectedOpponent.name,
      opponentTier: selectedOpponent.tier,
      surface: selectedSurface,
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      keyMomentsPerMatch: 8,
      matchFormat: 'best-of-1',
    });

    // Navigate to match screen
    setScreen('match');
  };

  const matchEnergyCost = 30;
  const canAfford = currentStatus.energy >= matchEnergyCost;
  const canPlayMatch = canAfford && selectedOpponent.tier <= player.tier;

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

  const getTierLabel = (tier: OpponentTier): string => {
    switch (tier) {
      case 1: return 'Club';
      case 2: return 'Regional';
      case 3: return 'Professional';
      case 4: return 'Tournament Champion';
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
          <Button variant="secondary" onClick={() => setScreen('main-menu')}>
            ← Back to Menu
          </Button>
        </div>

        <Card title="Match Setup" className="mb-6">
          <p className="text-pixel-text-muted mb-4">
            Configure your match settings and choose your opponent.
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

          {/* Opponent Selection */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-pixel-text mb-3">
              Choose Your Opponent
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPPONENT_PRESETS.map((opponent) => {
                const isSelected = selectedOpponent.name === opponent.name;
                const isUnlocked = isOpponentUnlocked(opponent.tier);
                return (
                  <button
                    key={opponent.name}
                    onClick={() => isUnlocked && setSelectedOpponent(opponent)}
                    disabled={!isUnlocked}
                    className={`p-4 border-4 text-left transition-all relative ${
                      !isUnlocked
                        ? 'opacity-50 cursor-not-allowed border-pixel-border bg-pixel-bg'
                        : isSelected
                        ? 'border-pixel-accent bg-pixel-accent bg-opacity-20'
                        : getTierColor(opponent.tier)
                    } ${isUnlocked && 'hover:scale-105'}`}
                  >
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2 text-3xl">
                        🔒
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold text-pixel-text">
                        {opponent.name}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-pixel-bg border-2 border-pixel-border text-pixel-text uppercase">
                        {getTierLabel(opponent.tier)}
                      </span>
                    </div>
                    <p className="text-sm text-pixel-text-muted mb-3">
                      {isUnlocked
                        ? opponent.description
                        : `Beat ${OPPONENT_PRESETS[opponent.tier - 2]?.name || 'previous tier'} to unlock!`
                      }
                    </p>
                    {isUnlocked && (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <div className="text-pixel-text-muted">Serve</div>
                          <div className="font-bold text-pixel-text">
                            {opponent.stats.technical?.serve}
                          </div>
                        </div>
                        <div>
                          <div className="text-pixel-text-muted">Forehand</div>
                          <div className="font-bold text-pixel-text">
                            {opponent.stats.technical?.forehand}
                          </div>
                        </div>
                        <div>
                          <div className="text-pixel-text-muted">Speed</div>
                          <div className="font-bold text-pixel-text">
                            {opponent.stats.physical?.speed}
                          </div>
                        </div>
                        <div>
                          <div className="text-pixel-text-muted">Focus</div>
                          <div className="font-bold text-pixel-text">
                            {opponent.stats.mental?.focus}
                          </div>
                        </div>
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
              {!isOpponentUnlocked(selectedOpponent.tier) ? (
                <>🔒 Opponent Locked</>
              ) : !canAfford ? (
                <>Not Enough Energy (Need {matchEnergyCost})</>
              ) : (
                <>🎾 Start Match vs {selectedOpponent.name}</>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
