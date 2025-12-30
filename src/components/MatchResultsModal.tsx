/**
 * Match Results Modal Component
 * Displays detailed match summary after completion
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { MatchResult } from '../types/game';

interface MatchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: MatchResult | null;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!result) return null;

  const isWinner = result.result === 'win';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        {/* Result Header */}
        <div
          className={`border-4 ${isWinner ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'} bg-opacity-20 p-6 text-center`}
        >
          <div className="text-6xl mb-4">{isWinner ? '🏆' : '😔'}</div>
          <h2 className="text-3xl font-bold text-pixel-text mb-2">
            {isWinner ? 'VICTORY!' : 'DEFEAT'}
          </h2>
          <p className="text-xl text-pixel-text-muted">
            {isWinner ? 'You won the match!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Final Score */}
        <div className="bg-pixel-card border-4 border-pixel-border p-4">
          <h3 className="text-lg font-bold text-pixel-text mb-3 text-center">
            📊 Final Score
          </h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-pixel-text mb-2">
              {result.score}
            </div>
            <div className="text-sm text-pixel-text-muted">
              vs {result.opponent} • {result.courtSurface}
            </div>
            <div className="text-sm text-pixel-text-muted mt-1">
              Duration: {result.duration} minutes
            </div>
          </div>
        </div>

        {/* Highlights */}
        {result.highlights && result.highlights.length > 0 && (
          <div className="bg-pixel-card border-2 border-pixel-border p-4">
            <h3 className="text-lg font-bold text-pixel-text mb-3">
              ⭐ Match Highlights
            </h3>
            <div className="space-y-2">
              {result.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="bg-pixel-bg border-l-4 border-pixel-accent p-2 text-sm text-pixel-text"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="bg-pixel-card border-2 border-pixel-border p-4">
          <h3 className="text-lg font-bold text-pixel-text mb-4 text-center">
            🎁 Match Rewards
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Experience Gained */}
            <div className="bg-blue-500 bg-opacity-20 border-2 border-blue-500 p-3 text-center">
              <div className="text-xs text-pixel-text-muted mb-1">Experience</div>
              <div className="text-2xl font-bold text-blue-500">
                +{result.experienceGained}
              </div>
            </div>

            {/* Stat Improvements */}
            {result.statChanges && Object.keys(result.statChanges).length > 0 && (
              <div className="pt-2">
                <h4 className="text-sm font-bold text-pixel-text mb-2 text-center">
                  💪 Stat Improvements
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.statChanges)
                    .filter(([_, value]) => value > 0)
                    .map(([stat, value]) => (
                      <div
                        key={stat}
                        className="bg-green-500 bg-opacity-20 border border-green-500 p-2 text-center"
                      >
                        <div className="text-lg font-bold text-green-500">+{value}</div>
                        <div className="text-xs text-pixel-text capitalize">
                          {stat.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <Button variant="primary" fullWidth size="lg" onClick={onClose}>
            {isWinner ? 'Continue Training 💪' : 'Train Harder 🔥'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
