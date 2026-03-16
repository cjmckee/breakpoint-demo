/**
 * Key Moment Result Toast
 * Shows the outcome of a key moment decision with secondary effects applied.
 */

import React, { useEffect } from 'react';
import { useMatchStore } from '../stores/matchStore';
import { KeyMomentResult, AppliedEffect } from '../game/KeyMomentResolver';

export const KeyMomentResultToast: React.FC = () => {
  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const lastKeyMomentResult = useMatchStore((state) => state.lastKeyMomentResult);
  const hideKeyMomentResult = useMatchStore((state) => state.hideKeyMomentResult);

  useEffect(() => {
    if (showKeyMomentResult) {
      const timer = setTimeout(() => {
        hideKeyMomentResult();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [showKeyMomentResult, hideKeyMomentResult]);

  if (!showKeyMomentResult || !lastKeyMomentResult) return null;

  const getOutcomeColor = (outcome: KeyMomentResult['outcome']): string => {
    switch (outcome) {
      case 'critical-success':
        return 'border-yellow-500 bg-yellow-500';
      case 'success':
        return 'border-green-500 bg-green-500';
      case 'failure':
        return 'border-red-500 bg-red-500';
      case 'critical-failure':
        return 'border-red-800 bg-red-800';
      default:
        return 'border-pixel-accent bg-pixel-accent';
    }
  };

  const getOutcomeIcon = (outcome: KeyMomentResult['outcome']): string => {
    switch (outcome) {
      case 'critical-success':
        return '🌟';
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
    switch (result.outcome) {
      case 'critical-success':
        return `INCREDIBLE! ${result.shotOutcome.outcome.replace(/_/g, ' ').toUpperCase()}! Point won!`;
      case 'success':
        return `SUCCESS! ${result.shotOutcome.outcome.replace(/_/g, ' ')}. Point won!`;
      case 'failure':
        return `Failed... ${result.shotOutcome.outcome.replace(/_/g, ' ')}. Point lost.`;
      case 'critical-failure':
        return `DISASTER! ${result.shotOutcome.outcome.replace(/_/g, ' ').toUpperCase()}! Point lost.`;
      default:
        return result.pointWinner === 'player' ? 'Point won!' : 'Point lost.';
    }
  };

  const getCounterMessage = (result: KeyMomentResult): string | null => {
    if (result.isCounter) return '🎯 Great read! Your tactic countered their style.';
    if (result.isWeakChoice) return '⚠️ Bad matchup — that tactic plays into their strengths.';
    return null;
  };

  const formatEffect = (effect: AppliedEffect): string => {
    const sign = effect.value > 0 ? '+' : '';
    switch (effect.type) {
      case 'momentum': return `${sign}${effect.value} Momentum`;
      case 'energy': return `${sign}${effect.value} Energy`;
      case 'pressure': return `${sign}${effect.value} Pressure`;
      case 'mood': return `${sign}${effect.value} Mood`;
    }
  };

  const isCritical = lastKeyMomentResult.outcome === 'critical-success' || lastKeyMomentResult.outcome === 'critical-failure';
  const counterMessage = getCounterMessage(lastKeyMomentResult);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`border-4 ${getOutcomeColor(lastKeyMomentResult.outcome)} bg-opacity-95 p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{getOutcomeIcon(lastKeyMomentResult.outcome)}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-pixel-text mb-1">
              Key Moment Result
              {isCritical && <span className="text-xs ml-2 text-yellow-400">(CRITICAL!)</span>}
            </h3>
            <p className="text-pixel-text mb-2">
              {getOutcomeMessage(lastKeyMomentResult)}
            </p>

            {/* Counter feedback */}
            {counterMessage && (
              <p className="text-xs text-pixel-text-muted mb-2">{counterMessage}</p>
            )}

            {/* Applied effects */}
            {lastKeyMomentResult.appliedEffects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {lastKeyMomentResult.appliedEffects.map((effect, i) => (
                  <span
                    key={i}
                    className={`text-xs px-1.5 py-0.5 border border-pixel-border ${
                      effect.value > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatEffect(effect)}
                    {isCritical && ' (2x)'}
                  </span>
                ))}
              </div>
            )}
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
