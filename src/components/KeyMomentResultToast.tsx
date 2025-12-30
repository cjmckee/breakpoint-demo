/**
 * Key Moment Result Toast
 * Shows the outcome of a key moment decision
 */

import React, { useEffect } from 'react';
import { useMatchStore } from '../stores/matchStore';
import { KeyMomentResult } from '../game/KeyMomentResolver';

export const KeyMomentResultToast: React.FC = () => {
  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const lastKeyMomentResult = useMatchStore((state) => state.lastKeyMomentResult);
  const hideKeyMomentResult = useMatchStore((state) => state.hideKeyMomentResult);

  useEffect(() => {
    if (showKeyMomentResult) {
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        hideKeyMomentResult();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showKeyMomentResult, hideKeyMomentResult]);

  if (!showKeyMomentResult || !lastKeyMomentResult) return null;

  const getOutcomeColor = (outcome: KeyMomentResult['outcome']): string => {
    switch (outcome) {
      case 'critical-success':
        return 'border-green-500 bg-green-500';
      case 'success':
        return 'border-green-500 bg-green-500';
      case 'failure':
        return 'border-red-500 bg-red-500';
      case 'critical-failure':
        return 'border-red-500 bg-red-500';
      default:
        return 'border-pixel-accent bg-pixel-accent';
    }
  };

  const getOutcomeIcon = (outcome: KeyMomentResult['outcome']): string => {
    switch (outcome) {
      case 'critical-success':
        return '🔥';
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'critical-failure':
        return '💥';
      default:
        return '💡';
    }
  };

  const getOutcomeMessage = (result: KeyMomentResult): string => {
    const won = result.pointWinner === 'player';

    switch (result.outcome) {
      case 'critical-success':
        return `AMAZING! ${result.shotOutcome.outcome.toUpperCase()}! You won the point!`;
      case 'success':
        return `SUCCESS! ${result.shotOutcome.outcome.replace(/_/g, ' ')}. Point won!`;
      case 'failure':
        return `Failed... ${result.shotOutcome.outcome.replace(/_/g, ' ')}. Point lost.`;
      case 'critical-failure':
        return `DISASTER! ${result.shotOutcome.outcome.toUpperCase()}! Point lost.`;
      default:
        return won ? 'Point won!' : 'Point lost.';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`border-4 ${getOutcomeColor(lastKeyMomentResult.outcome)} bg-opacity-95 p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{getOutcomeIcon(lastKeyMomentResult.outcome)}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-pixel-text mb-1">
              Key Moment Result
            </h3>
            <p className="text-pixel-text mb-2">
              {getOutcomeMessage(lastKeyMomentResult)}
            </p>
            <div className="text-xs text-pixel-text-muted">
              <div>Success Chance: {Math.round(lastKeyMomentResult.finalProbability)}%</div>
              <div>Roll: {Math.round(lastKeyMomentResult.roll)}/100</div>
            </div>
          </div>
          <button
            onClick={hideKeyMomentResult}
            className="text-pixel-text hover:text-pixel-accent text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
