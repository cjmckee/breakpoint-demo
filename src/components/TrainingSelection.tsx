/**
 * Training Selection Component
 * Shows available training sessions and allows player to choose one.
 * Each session card is itself the button: stat gains lead, cost is shown as an
 * affordability-colored energy chip, and unaffordable cards are dimmed with the
 * shortfall spelled out on the card.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { TrainingSystem } from '../game/TrainingSystem';
import { TrainingSession } from '../types/game';
import { EffectAggregator } from '../core/EffectAggregator';
import { audioManager } from '../audio/AudioManager';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import { StatChangeIndicator, useStatChanges } from './StatChangeIndicator';
import { StatBoostList } from './ui/StatBoostList';

const defaultAbilityChance = 0.3;

export const TrainingSelection: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const getAvailableTrainingSessions = useGameStore((state) => state.getAvailableTrainingSessions);

  const { statChanges, addStatChange } = useStatChanges();

  if (!player) {
    return null;
  }

  // Get training sessions for this time slot (will be cached until time slot changes)
  const availableSessions = getAvailableTrainingSessions();

  const handleSelectSession = (session: TrainingSession) => {
    audioManager.playSfx('ui_click');
    const { effects: activeEffects } = EffectAggregator.getActiveEffects(player);
    const result = TrainingSystem.executeTraining(
      player,
      session,
      currentStatus.energy,
      activeEffects
    );

    // Show stat changes with indicators
    Object.entries(result.statBoosts).forEach(([stat, value]) => {
      if (value > 0) {
        addStatChange(stat, value);
      }
    });

    // Apply the training result to the store (this updates player stats, energy, mood
    // and transitions to idle with training_result overlay)
    useGameStore.getState().applyTrainingResult(result);

    // Advance time after training
    useGameStore.getState().advanceTime();
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
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <h1 className="text-3xl font-bold text-pixel-text mb-4">Training</h1>

        {availableSessions.length === 0 && (
          <div className="text-center py-8 bg-pixel-card border-4 border-pixel-border">
            <p className="text-pixel-text-muted text-lg">
              No training sessions available. You may need more energy.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigateTo('idle')}
              className="mt-4"
            >
              Rest to Restore Energy
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableSessions.map((session) => {
            const canAfford = currentStatus.energy >= session.energyCost;

            return (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                disabled={!canAfford}
                className={`border-4 ${getTierColor(session.tier)} p-4 bg-pixel-card flex flex-col text-left cursor-pointer transition-all duration-150 hover:brightness-110 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100`}
              >
                {/* Header: name + tier, energy cost chip on the right */}
                <div className="flex items-start justify-between gap-3 mb-3 w-full">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-pixel-text leading-tight mb-1">
                      <span className="mr-1.5">
                        {session.category === 'technical' && '🎾'}
                        {session.category === 'physical' && '💪'}
                        {session.category === 'mental' && '🧠'}
                      </span>
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold border-2 ${getTierColor(session.tier)}`}
                      >
                        {getTierLabel(session.tier)}
                      </span>
                      <span className="text-xs font-bold text-green-500">
                        x{session.statMultiplier}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 px-2 py-1 bg-pixel-bg border-2 border-pixel-border text-sm font-bold whitespace-nowrap ${
                      !canAfford
                        ? 'text-pixel-error'
                        : session.tier === 'silver'
                          ? 'text-green-500'
                          : 'text-pixel-text'
                    }`}
                    title={`Energy cost: ${session.energyCost}`}
                  >
                    ⚡ {session.energyCost}
                  </div>
                </div>

                {/* Stat gains lead — the reason you're picking this session */}
                <div className="w-full p-2 bg-pixel-bg border-2 border-pixel-border">
                  <StatBoostList statBoosts={session.statBoosts} variant="grid" />
                </div>

                {session.tier === 'diamond' && session.ability && (
                  <div className="text-xs font-bold text-cyan-400 mt-2">
                    ✨ {defaultAbilityChance * 100}% chance to learn an ability
                  </div>
                )}

                <p className="text-xs text-pixel-text-muted mt-2 flex-1">
                  {session.description}
                </p>

                {!canAfford && (
                  <div className="text-xs font-bold text-pixel-error mt-2">
                    Needs {session.energyCost} energy — you have {currentStatus.energy}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stat Change Indicators */}
        <StatChangeIndicator changes={statChanges} />
      </div>
    </div>
  );
};
