/**
 * Training Result Modal
 * Shows detailed feedback after completing a training session
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
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

  const statChanges = Object.entries(result.statBoosts).filter(
    ([_, value]) => value > 0
  );

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
        {statChanges.length > 0 && (
          <div className="bg-pixel-card border-4 border-pixel-border p-4">
            <h3 className="text-lg font-bold text-pixel-text mb-3">
              💫 Stat Improvements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {statChanges.map(([stat, value]) => (
                <div
                  key={stat}
                  className="bg-green-500 bg-opacity-20 border-2 border-green-500 p-3 text-center"
                >
                  <div className="text-2xl font-bold text-green-500">+{value}</div>
                  <div className="text-sm text-pixel-text mt-1 capitalize">
                    {stat.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ability Gained */}
        {result.abilityGained && (
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
