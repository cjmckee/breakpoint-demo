/**
 * Training Selection Component
 * Shows available training sessions and allows player to choose one
 */

import React, { useState, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { TrainingSystem } from '../game/TrainingSystem';
import { TrainingSession, TrainingResult } from '../types/game';
import { PlayerManager } from '../game/PlayerManager';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TrainingResultModal } from './TrainingResultModal';
import { StatChangeIndicator, useStatChanges } from './StatChangeIndicator';

export const TrainingSelection: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const setScreen = useGameStore((state) => state.setScreen);

  const [lastTrainingResult, setLastTrainingResult] = useState<TrainingResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const { statChanges, addStatChange } = useStatChanges();

  if (!player) {
    return null;
  }

  const availableSessions = useMemo(
    () => TrainingSystem.getAvailableTrainingSessions(player, currentStatus.mood),
    [player, currentStatus.mood]
  );

  const handleSelectSession = (session: TrainingSession) => {
    const result = TrainingSystem.executeTraining(
      player,
      session,
      currentStatus.energy
    );

    // Show stat changes with indicators
    Object.entries(result.statBoosts).forEach(([stat, value]) => {
      if (value > 0) {
        addStatChange(stat, value);
      }
    });

    // Store result and show modal
    setLastTrainingResult(result);
    setShowResultModal(true);

    // Execute training in store (this updates the actual player stats)
    useGameStore.getState().executeTraining();
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setLastTrainingResult(null);
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'diamond':
        return 'text-cyan-400 border-cyan-400';
      case 'gold':
        return 'text-yellow-400 border-yellow-400';
      case 'silver':
        return 'text-gray-400 border-gray-400';
      case 'bronze':
        return 'text-orange-600 border-orange-600';
      default:
        return 'text-pixel-text border-pixel-border';
    }
  };

  const getTierLabel = (tier: string): string => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="secondary" onClick={() => setScreen('main-menu')}>
            ← Back to Menu
          </Button>
        </div>

        <Card title="Training Sessions" className="mb-6">
          <p className="text-pixel-text-muted mb-4">
            Choose a training session to improve your skills. Higher tier sessions give
            better rewards but cost more energy.
          </p>

          {availableSessions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-pixel-text-muted text-lg">
                No training sessions available. You may need more energy.
              </p>
              <Button
                variant="secondary"
                onClick={() => setScreen('main-menu')}
                className="mt-4"
              >
                Rest to Restore Energy
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSessions.map((session) => (
              <div
                key={session.id}
                className={`border-4 ${getTierColor(session.tier)} p-4 bg-pixel-card`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-pixel-text mb-1">
                      {session.name}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 text-sm font-bold border-2 ${getTierColor(
                        session.tier
                      )}`}
                    >
                      {getTierLabel(session.tier)} Tier
                    </span>
                  </div>
                  <span className="text-2xl">
                    {session.category === 'technical' && '🎾'}
                    {session.category === 'physical' && '💪'}
                    {session.category === 'mental' && '🧠'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-pixel-text-muted mb-3 text-sm">
                  {session.description}
                </p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-pixel-text-muted">Energy Cost:</span>
                    <span className="font-bold text-pixel-text">
                      {session.energyCost}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-pixel-text-muted">Stat Multiplier:</span>
                    <span className="font-bold text-green-500">
                      x{session.statMultiplier}
                    </span>
                  </div>
                  {session.ability && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pixel-text-muted">Ability Chance:</span>
                      <span className="font-bold text-cyan-400">30%</span>
                    </div>
                  )}
                </div>

                {/* Stat Boosts Preview */}
                <div className="mb-4 p-2 bg-pixel-bg border-2 border-pixel-border">
                  <div className="text-xs text-pixel-text-muted mb-1">Stat Boosts:</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(session.statBoosts)
                      .filter(([_, value]) => value > 0)
                      .map(([stat, value]) => (
                        <span
                          key={stat}
                          className="text-green-500 font-bold"
                        >
                          +{value} {stat}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleSelectSession(session)}
                  disabled={currentStatus.energy < session.energyCost}
                >
                  {currentStatus.energy < session.energyCost
                    ? 'Not Enough Energy'
                    : 'Start Training'}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Training Result Modal */}
        <TrainingResultModal
          isOpen={showResultModal}
          onClose={handleCloseResultModal}
          result={lastTrainingResult}
        />

        {/* Stat Change Indicators */}
        <StatChangeIndicator changes={statChanges} />
      </div>
    </div>
  );
};
