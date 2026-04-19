/**
 * Training Result Modal
 * Shows detailed feedback after completing a training session
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { StatBoostList } from './ui/StatBoostList';
import { TrainingResult } from '../types/game';

interface TrainingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TrainingResult | null;
}

export const TrainingResultModal: React.FC<TrainingResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!result) return null;

  const hasStatBoosts = Object.values(result.statBoosts).some((v) => v > 0);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Training Complete!" size="md">
      <div className="space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <div className="text-6xl mb-4">💪</div>
          <p className="text-xl font-bold text-pixel-text mb-2">{result.message}</p>
          {result.tier && (
            <div
              className={`inline-block px-4 py-2 border-4 ${getTierColor(result.tier)} font-bold text-lg`}
            >
              {result.tier.toUpperCase()} TIER
            </div>
          )}
        </div>

        {/* Stat Improvements */}
        {hasStatBoosts && (
          <div className="bg-pixel-card border-4 border-pixel-border p-4">
            <h3 className="text-lg font-bold text-pixel-text mb-3">
              💫 Stat Improvements
            </h3>
            <StatBoostList statBoosts={result.statBoosts} variant="result" />
          </div>
        )}

        {/* Ability Roll (Diamond Tier) */}
        {result.tier === 'diamond' && result.roll !== undefined && result.threshold !== undefined && (
          <div className={`border-4 p-4 ${result.abilityGained ? 'bg-orange-500 bg-opacity-20 border-orange-500' : 'bg-pixel-card border-pixel-border'}`}>
            <h3 className={`text-lg font-bold mb-3 ${result.abilityGained ? 'text-orange-500' : 'text-pixel-text'}`}>
              {result.abilityGained ? '🌟 NEW ABILITY UNLOCKED!' : '🎲 Ability Roll'}
            </h3>

            {/* Roll Visualization */}
            <div className="bg-pixel-bg border-2 border-pixel-border p-4 mb-3">
              <div className="text-center mb-2">
                <div className="text-sm text-pixel-text-muted mb-1">Your Roll</div>
                <div className="text-4xl font-bold text-cyan-400 mb-3">
                  {result.roll.toFixed(1)}
                </div>
              </div>

              {/* Roll Bar */}
              <div className="relative h-8 bg-gray-700 border-2 border-pixel-border mb-2">
                {/* Success Zone */}
                <div
                  className="absolute top-0 left-0 h-full bg-green-500 bg-opacity-30 border-r-2 border-green-500"
                  style={{ width: `${result.threshold}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1">
                    <span className="text-xs font-bold text-green-500">
                      {result.threshold.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Roll Indicator */}
                <div
                  className="absolute top-0 h-full w-1 bg-cyan-400 shadow-lg"
                  style={{ left: `${Math.min(result.roll, 100)}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-cyan-400 text-xl">
                    ▼
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-pixel-text-muted">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Result */}
            {result.abilityGained ? (
              <>
                <div className="text-2xl font-bold text-pixel-text text-center py-3 mb-2">
                  {result.abilityGained}
                </div>
                <p className="text-pixel-text-muted text-center text-sm mb-2">
                  This ability will boost your performance in matches!
                </p>
                <div className="text-center text-sm text-green-500 font-bold">
                  Success! Rolled {result.roll.toFixed(1)} ≤ {result.threshold.toFixed(1)}%
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-pixel-text-muted text-sm mb-2">
                  You didn't gain an ability this time, but great training session!
                </p>
                <div className="text-sm text-red-500 font-bold">
                  Failed - Rolled {result.roll.toFixed(1)} {'>'} {result.threshold.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ability Gained (Non-Diamond or legacy support) */}
        {result.abilityGained && result.tier !== 'diamond' && (
          <div className="bg-orange-500 bg-opacity-20 border-4 border-orange-500 p-4">
            <h3 className="text-lg font-bold text-orange-500 mb-2">
              🌟 NEW ABILITY UNLOCKED!
            </h3>
            <div className="text-2xl font-bold text-pixel-text text-center py-4">
              {result.abilityGained}
            </div>
            <p className="text-pixel-text-muted text-center text-sm">
              This ability will boost your performance in matches!
            </p>
          </div>
        )}

        {/* Energy & Mood Changes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-pixel-card border-2 border-pixel-border p-3">
            <div className="text-sm text-pixel-text-muted mb-1">Energy Cost</div>
            <div className="text-xl font-bold text-red-500">-{result.energyCost}</div>
          </div>
          <div className="bg-pixel-card border-2 border-pixel-border p-3">
            <div className="text-sm text-pixel-text-muted mb-1">Mood Change</div>
            <div
              className={`text-xl font-bold ${result.moodChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {result.moodChange >= 0 ? '+' : ''}
              {result.moodChange}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <Button variant="primary" fullWidth size="lg" onClick={onClose}>
            Continue Training
          </Button>
        </div>
      </div>
    </Modal>
  );
};
