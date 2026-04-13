/**
 * Key Moment Modal Component
 * Two-phase: decision (pick a tactic) → result (see what happened).
 * The modal stays open through both phases; the result requires explicit Continue.
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { KeyMoment } from '../types/keyMoments';
import { TacticalOption, SecondaryEffect } from '../data/tacticalOptions';
import { ARCHETYPE_DATA, getRelevantTendency } from '../data/archetypes';
import { KeyMomentResolver, KeyMomentResult, AppliedEffect } from '../game/KeyMomentResolver';
import { useMatchStore } from '../stores/matchStore';
import { PlayerStats } from '../types/game';

interface KeyMomentModalProps {
  isOpen: boolean;
  keyMoment: KeyMoment | null;
}

export const KeyMomentModal: React.FC<KeyMomentModalProps> = ({ isOpen, keyMoment }) => {
  const [isHidden, setIsHidden] = useState(false);
  const handleKeyMomentChoice = useMatchStore((state) => state.handleKeyMomentChoice);
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const lastKeyMomentResult = useMatchStore((state) => state.lastKeyMomentResult);
  const keyMomentHistory = useMatchStore((state) => state.keyMomentHistory);
  const hideKeyMomentResult = useMatchStore((state) => state.hideKeyMomentResult);

  const isResultPhase = showKeyMomentResult && !!lastKeyMomentResult;
  const lastHistoryEntry = keyMomentHistory[keyMomentHistory.length - 1];

  // During result phase, currentKeyMoment is null — fall back to history
  const activeKeyMoment = keyMoment ?? lastHistoryEntry?.keyMoment ?? null;

  if (!isOpen || !activeKeyMoment) return null;

  // ── Shared helpers ──────────────────────────────────────────────────────────

  const getMomentTypeIcon = (type: string): string => {
    if (type.includes('match-point')) return '👑';
    if (type.includes('set-point')) return '⭐';
    if (type.includes('break-point')) return '🔥';
    return '💡';
  };

  const getMomentTypeColor = (type: string): string => {
    if (type.includes('match-point')) return 'border-red-500 bg-red-500';
    if (type.includes('set-point')) return 'border-yellow-500 bg-yellow-500';
    if (type.includes('break-point')) return 'border-orange-500 bg-orange-500';
    return 'border-pixel-accent bg-pixel-accent';
  };

  const opponentIsServing = activeKeyMoment.matchContext.server === 'opponent';
  const archetypeData = ARCHETYPE_DATA[activeKeyMoment.opponentArchetype];
  const tendency = getRelevantTendency(activeKeyMoment.opponentArchetype, opponentIsServing);

  // Condition icons with tooltip text
  const ctx = activeKeyMoment.matchContext;
  const modifiers = KeyMomentResolver.getContextModifiers({
    momentum: ctx.momentum,
    energy: ctx.energy,
    mood: ctx.mood,
    pressure: ctx.pressure,
  });

  const conditionIcons: Array<{ icon: string; tooltip: string; positive: boolean }> = [];
  if (Math.abs(modifiers.momentum) >= 1) {
    const positive = modifiers.momentum > 0;
    conditionIcons.push({
      icon: positive ? '📈' : '📉',
      tooltip: positive
        ? 'Momentum with you — riding a hot streak'
        : 'Momentum against you — opponent is on a run',
      positive,
    });
  }
  if (modifiers.energy <= -1) {
    conditionIcons.push({
      icon: '🔋',
      tooltip: `Energy at ${Math.round(ctx.energy)}% — fatigue is a factor`,
      positive: false,
    });
  }
  if (Math.abs(modifiers.mood) >= 1) {
    const positive = modifiers.mood > 0;
    conditionIcons.push({
      icon: positive ? '😊' : '😤',
      tooltip: positive
        ? 'Positive mood — feeling confident out there'
        : 'Frustrated — letting emotions creep in',
      positive,
    });
  }
  if (modifiers.pressure <= -2) {
    conditionIcons.push({
      icon: '😰',
      tooltip:
        modifiers.pressure <= -5
          ? 'High pressure — nerves are a major factor'
          : 'Feeling the pressure — big point nerves',
      positive: false,
    });
  }

  // ── Compact header strip (shared between phases) ────────────────────────────

  const headerStrip = (
    <div className={`border-4 ${getMomentTypeColor(activeKeyMoment.type)} bg-opacity-20 px-5 py-4`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{getMomentTypeIcon(activeKeyMoment.type)}</span>
        <h2 className="text-lg font-bold text-pixel-text">{activeKeyMoment.situation}</h2>
      </div>
      {/* Context: archetype chip + condition icons, then tendency on its own line */}
      <div className="flex items-center gap-2 text-sm">
        <span className="px-2 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold whitespace-nowrap">
          {archetypeData.label}
        </span>
        {conditionIcons.map((cond, i) => (
          <span
            key={i}
            title={cond.tooltip}
            className="text-lg cursor-help"
          >
            {cond.icon}
          </span>
        ))}
      </div>
      <p className="text-sm text-pixel-text-muted italic mt-1">
        "{tendency}"
      </p>
    </div>
  );

  // ── Toggle button to peek at the match behind the modal ─────────────────────
  const peekButton = (
    <button
      onClick={() => setIsHidden((h) => !h)}
      className="w-full py-5 border-4 border-pixel-border bg-pixel-card text-pixel-text font-bold text-lg hover:border-pixel-accent transition-colors"
    >
      {isHidden ? '⚡ Show Decision' : '👁 Peek at Match'}
    </button>
  );

  if (isHidden) {
    return (
      <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
        <button
          onClick={() => setIsHidden(false)}
          className="max-w-2xl w-full py-4 border-4 border-pixel-accent bg-pixel-card text-pixel-accent font-bold text-base hover:bg-pixel-accent hover:bg-opacity-20 transition-colors animate-pulse"
        >
          ⚡ Show Decision
        </button>
      </div>
    );
  }

  // ── Result phase ────────────────────────────────────────────────────────────

  if (isResultPhase && lastHistoryEntry) {
    const result = lastKeyMomentResult!;
    const chosenOption = lastHistoryEntry.chosenOption;

    const getOutcomeStyle = (outcome: KeyMomentResult['outcome']) => {
      switch (outcome) {
        case 'critical-success': return { color: 'border-yellow-500 bg-yellow-500', icon: '🌟', title: 'CRITICAL SUCCESS' };
        case 'success':          return { color: 'border-green-500 bg-green-500',   icon: '✅', title: 'Success' };
        case 'failure':          return { color: 'border-red-500 bg-red-500',       icon: '❌', title: 'Failure' };
        case 'critical-failure': return { color: 'border-red-800 bg-red-800',       icon: '💥', title: 'CRITICAL FAILURE' };
      }
    };

    const style = getOutcomeStyle(result.outcome);
    const isCritical = result.outcome === 'critical-success' || result.outcome === 'critical-failure';

    const getOutcomeMessage = (): string => {
      const shot = result.shotOutcome.outcome.replace(/_/g, ' ');
      switch (result.outcome) {
        case 'critical-success': return `INCREDIBLE ${shot.toUpperCase()}! Point won.`;
        case 'success':          return `${shot} — point won.`;
        case 'failure':          return `${shot} — point lost.`;
        case 'critical-failure': return `DISASTER! ${shot.toUpperCase()}. Point lost.`;
        default: return result.pointWinner === 'player' ? 'Point won.' : 'Point lost.';
      }
    };

    const formatEffect = (effect: AppliedEffect): string => {
      const sign = effect.value > 0 ? '+' : '';
      switch (effect.type) {
        case 'momentum': return `${sign}${effect.value} Momentum`;
        case 'energy':   return `${sign}${effect.value} Energy`;
        case 'pressure': return `${sign}${effect.value} Pressure`;
        case 'mood':     return `${sign}${effect.value} Mood`;
      }
    };

    return (
      <Modal isOpen={isOpen} title="" size="lg" showCloseButton={false} belowContent={peekButton}>
        <div className="space-y-5">
          {headerStrip}

          {/* Outcome */}
          <div className={`border-4 ${style.color} bg-opacity-15 p-6 text-center`}>
            <div className="text-5xl mb-2">{style.icon}</div>
            <h3 className="text-2xl font-bold text-pixel-text">{style.title}</h3>
            <p className="text-base text-pixel-text mt-1">{getOutcomeMessage()}</p>
          </div>

          {/* Chosen tactic */}
          <div className="flex items-center gap-4 p-4 bg-pixel-bg border-2 border-pixel-border">
            <span className="text-3xl">{chosenOption.emoji}</span>
            <div>
              <div className="text-base font-bold text-pixel-text">{chosenOption.name}</div>
              <div className="text-sm text-pixel-text-muted">{chosenOption.description}</div>
            </div>
          </div>

          {/* Counter / weak feedback */}
          {result.isCounter && (
            <div className="text-base px-4 py-3 border-2 border-green-600 bg-green-600 bg-opacity-10 text-green-400">
              🎯 Great read — your tactic countered their style.
            </div>
          )}
          {result.isWeakChoice && (
            <div className="text-base px-4 py-3 border-2 border-red-600 bg-red-600 bg-opacity-10 text-red-400">
              ⚠️ Bad matchup — that tactic played into their strengths.
            </div>
          )}

          {/* Applied effects */}
          {result.appliedEffects.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-pixel-text-muted mb-2 uppercase tracking-wide">
                Effects Applied
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.appliedEffects.map((effect, i) => (
                  <span
                    key={i}
                    className={`text-sm px-2.5 py-1 border border-pixel-border bg-pixel-bg font-bold ${
                      effect.value > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatEffect(effect)}
                    {isCritical && <span className="text-pixel-text-muted ml-1 font-normal">(2×)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Continue */}
          <button
            onClick={hideKeyMomentResult}
            className="w-full py-4 border-4 border-pixel-accent bg-pixel-accent bg-opacity-20 text-pixel-accent font-bold hover:bg-opacity-30 transition-colors text-base"
          >
            Continue →
          </button>
        </div>
      </Modal>
    );
  }

  // ── Decision phase ──────────────────────────────────────────────────────────

  const getMatchupIndicator = (option: TacticalOption): { label: string; color: string } => {
    if (!matchConfig) return { label: 'Even', color: 'text-yellow-500' };
    const matchup = KeyMomentResolver.getStatMatchup(
      matchConfig.playerStats as PlayerStats,
      matchConfig.opponentStats as PlayerStats,
      option
    );
    switch (matchup) {
      case 'advantage':    return { label: 'Advantage',    color: 'text-green-500' };
      case 'disadvantage': return { label: 'Disadvantage', color: 'text-red-500' };
      default:             return { label: 'Even',         color: 'text-yellow-500' };
    }
  };

  const getEffectIcon = (effect: SecondaryEffect): string => {
    switch (effect.type) {
      case 'momentum': return effect.value > 0 ? '📈' : '📉';
      case 'energy':   return effect.value > 0 ? '⚡' : '🔋';
      case 'pressure': return '😰';
      case 'mood':     return effect.value > 0 ? '😊' : '😤';
    }
  };

  const getEffectLabel = (effect: SecondaryEffect): string => {
    const sign = effect.value > 0 ? '+' : '';
    switch (effect.type) {
      case 'momentum': return `${sign}${effect.value} Momentum`;
      case 'energy':   return `${sign}${effect.value} Energy`;
      case 'pressure': return `${sign}${effect.value} Pressure`;
      case 'mood':     return `${sign}${effect.value} Mood`;
    }
  };

  const getConditionLabel = (condition: SecondaryEffect['condition']): string => {
    switch (condition) {
      case 'always':     return '';
      case 'on_success': return 'on win';
      case 'on_failure': return 'on loss';
    }
  };

  return (
    <Modal isOpen={isOpen} title="" size="lg" showCloseButton={false} belowContent={peekButton}>
      <div className="space-y-5">
        {headerStrip}

        {/* Tactical Options */}
        <div>
          <h3 className="text-base font-bold text-pixel-text mb-4">⚔️ Choose Your Tactic</h3>
          <div className="space-y-3">
            {activeKeyMoment.options.map((option, index) => {
              const matchup = getMatchupIndicator(option);
              return (
                <button
                  key={index}
                  onClick={() => handleKeyMomentChoice(option)}
                  className="w-full text-left p-4 border-4 border-pixel-border bg-pixel-card hover:border-pixel-accent hover:scale-[1.01] transition-all"
                >
                  {/* Option name + matchup indicator */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{option.emoji}</span>
                      <h4 className="text-base font-bold text-pixel-text">{option.name}</h4>
                    </div>
                    <span className={`text-sm font-bold ${matchup.color} whitespace-nowrap`}>
                      {matchup.label}
                    </span>
                  </div>

                  <p className="text-sm text-pixel-text-muted mb-2">{option.description}</p>

                  {/* Best against hint + secondary effects */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-pixel-text-muted">{option.bestAgainstHint}</span>
                    {option.secondaryEffects.map((effect, i) => {
                      const condLabel = getConditionLabel(effect.condition);
                      return (
                        <span
                          key={i}
                          className={`text-sm px-2 py-0.5 border border-pixel-border bg-pixel-bg ${
                            effect.value > 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {getEffectIcon(effect)} {getEffectLabel(effect)}
                          {condLabel && <span className="text-pixel-text-muted ml-1">({condLabel})</span>}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
