/**
 * Key Moment Modal Component
 * Displays tactical decision options during critical match moments
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { KeyMoment } from '../types/keyMoments';
import { TacticalOption } from '../data/tacticalOptions';
import { useMatchStore } from '../stores/matchStore';

interface KeyMomentModalProps {
  isOpen: boolean;
  keyMoment: KeyMoment | null;
}

export const KeyMomentModal: React.FC<KeyMomentModalProps> = ({ isOpen, keyMoment }) => {
  const handleKeyMomentChoice = useMatchStore((state) => state.handleKeyMomentChoice);

  if (!keyMoment) return null;

  const handleChoice = (option: TacticalOption) => {
    handleKeyMomentChoice(option);
  };

  const getMomentTypeIcon = (type: string): string => {
    switch (type) {
      case 'break_point':
        return '🔥';
      case 'set_point':
        return '⭐';
      case 'match_point':
        return '👑';
      case 'momentum_shift':
        return '⚡';
      case 'crucial_game':
        return '🎯';
      default:
        return '💡';
    }
  };

  const getMomentTypeColor = (type: string): string => {
    switch (type) {
      case 'break_point':
        return 'border-orange-500 bg-orange-500';
      case 'set_point':
        return 'border-yellow-500 bg-yellow-500';
      case 'match_point':
        return 'border-red-500 bg-red-500';
      case 'momentum_shift':
        return 'border-purple-500 bg-purple-500';
      case 'crucial_game':
        return 'border-blue-500 bg-blue-500';
      default:
        return 'border-pixel-accent bg-pixel-accent';
    }
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-500';
    if (rate >= 50) return 'text-yellow-500';
    if (rate >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Modal isOpen={isOpen} title="" size="lg" showCloseButton={false}>
      <div className="space-y-6">
        {/* Moment Header */}
        <div className={`border-4 ${getMomentTypeColor(keyMoment.type)} bg-opacity-20 p-6 text-center`}>
          <div className="text-6xl mb-3">{getMomentTypeIcon(keyMoment.type)}</div>
          <h2 className="text-2xl font-bold text-pixel-text mb-2">
            {keyMoment.type.replace(/_/g, ' ').toUpperCase()}
          </h2>
          <p className="text-lg text-pixel-text-muted">{keyMoment.description}</p>
        </div>

        {/* Match Context */}
        <div className="bg-pixel-card border-2 border-pixel-border p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-pixel-text-muted mb-1">Score</div>
              <div className="font-bold text-pixel-text">
                {keyMoment.matchContext.score}
              </div>
            </div>
            <div>
              <div className="text-xs text-pixel-text-muted mb-1">Server</div>
              <div className="font-bold text-pixel-text capitalize">
                {keyMoment.matchContext.server}
              </div>
            </div>
          </div>
        </div>

        {/* Situation Analysis */}
        <div className="bg-pixel-bg border-2 border-pixel-border p-4">
          <h3 className="text-sm font-bold text-pixel-text mb-2">📊 Situation</h3>
          <p className="text-sm text-pixel-text-muted">{keyMoment.situation}</p>
        </div>

        {/* Tactical Options */}
        <div>
          <h3 className="text-lg font-bold text-pixel-text mb-4">
            ⚔️ Choose Your Tactic
          </h3>
          <div className="space-y-3">
            {keyMoment.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleChoice(option)}
                className="w-full text-left p-4 border-4 border-pixel-border bg-pixel-card hover:border-pixel-accent hover:scale-105 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.emoji}</span>
                    <h4 className="text-lg font-bold text-pixel-text">{option.name}</h4>
                  </div>
                  {option.successProbability !== undefined && (
                    <span className={`text-xl font-bold ${getSuccessRateColor(option.successProbability)}`}>
                      {Math.round(option.successProbability)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-pixel-text-muted mb-3">{option.description}</p>

                {/* Risk Level Indicator */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-pixel-text-muted">Risk:</span>
                  <span className={`font-bold px-2 py-1 border-2 ${
                    option.riskLevel === 'high' ? 'text-red-500 border-red-500 bg-red-500' :
                    option.riskLevel === 'medium' ? 'text-yellow-500 border-yellow-500 bg-yellow-500' :
                    'text-green-500 border-green-500 bg-green-500'
                  } bg-opacity-20`}>
                    {option.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-pixel-text-muted ml-4">Primary Stat:</span>
                  <span className="font-bold text-pixel-accent capitalize">
                    {option.playerStatWeights.primary}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-pixel-text-muted">
          💡 Your choice will affect the outcome of this critical moment
        </div>
      </div>
    </Modal>
  );
};
