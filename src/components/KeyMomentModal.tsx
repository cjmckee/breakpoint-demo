/**
 * Key Moment Modal Component
 * Displays tactical decision options during critical match moments.
 * Shows opponent archetype/tendency and qualitative stat matchups (no percentages).
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { KeyMoment } from '../types/keyMoments';
import { TacticalOption, SecondaryEffect } from '../data/tacticalOptions';
import { ARCHETYPE_DATA, getRelevantTendency } from '../data/archetypes';
import { KeyMomentResolver } from '../game/KeyMomentResolver';
import { useMatchStore } from '../stores/matchStore';
import { PlayerStats } from '../types/game';

interface KeyMomentModalProps {
  isOpen: boolean;
  keyMoment: KeyMoment | null;
}

export const KeyMomentModal: React.FC<KeyMomentModalProps> = ({ isOpen, keyMoment }) => {
  const handleKeyMomentChoice = useMatchStore((state) => state.handleKeyMomentChoice);
  const matchConfig = useMatchStore((state) => state.matchConfig);

  if (!keyMoment) return null;

  const handleChoice = (option: TacticalOption) => {
    handleKeyMomentChoice(option);
  };

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

  // Determine if opponent is serving in this moment
  const opponentIsServing = keyMoment.matchContext.server === 'opponent';
  const archetypeData = ARCHETYPE_DATA[keyMoment.opponentArchetype];
  const tendency = getRelevantTendency(keyMoment.opponentArchetype, opponentIsServing);

  // Get stat matchup for an option (qualitative)
  const getMatchupIndicator = (option: TacticalOption): { label: string; color: string } => {
    if (!matchConfig) return { label: 'Even', color: 'text-yellow-500' };
    const matchup = KeyMomentResolver.getStatMatchup(
      matchConfig.playerStats as PlayerStats,
      matchConfig.opponentStats as PlayerStats,
      option
    );
    switch (matchup) {
      case 'advantage':
        return { label: 'Advantage', color: 'text-green-500' };
      case 'disadvantage':
        return { label: 'Disadvantage', color: 'text-red-500' };
      default:
        return { label: 'Even', color: 'text-yellow-500' };
    }
  };

  const getEffectIcon = (effect: SecondaryEffect): string => {
    switch (effect.type) {
      case 'momentum': return effect.value > 0 ? '📈' : '📉';
      case 'energy': return effect.value > 0 ? '⚡' : '🔋';
      case 'pressure': return '😰';
      case 'mood': return effect.value > 0 ? '😊' : '😤';
    }
  };

  const getEffectLabel = (effect: SecondaryEffect): string => {
    const sign = effect.value > 0 ? '+' : '';
    switch (effect.type) {
      case 'momentum': return `${sign}${effect.value} Momentum`;
      case 'energy': return `${sign}${effect.value} Energy`;
      case 'pressure': return `${sign}${effect.value} Pressure`;
      case 'mood': return `${sign}${effect.value} Mood`;
    }
  };

  const getConditionLabel = (condition: SecondaryEffect['condition']): string => {
    switch (condition) {
      case 'always': return '';
      case 'on_success': return 'on win';
      case 'on_failure': return 'on loss';
    }
  };

  return (
    <Modal isOpen={isOpen} title="" size="lg" showCloseButton={false}>
      <div className="space-y-5">
        {/* Moment Header */}
        <div className={`border-4 ${getMomentTypeColor(keyMoment.type)} bg-opacity-20 p-5 text-center`}>
          <div className="text-5xl mb-2">{getMomentTypeIcon(keyMoment.type)}</div>
          <h2 className="text-xl font-bold text-pixel-text mb-1">
            {keyMoment.situation}
          </h2>
          <p className="text-sm text-pixel-text-muted">{keyMoment.description}</p>
        </div>

        {/* Opponent Read */}
        <div className="bg-pixel-bg border-2 border-pixel-border p-4">
          <h3 className="text-sm font-bold text-pixel-text mb-2">🔍 Opponent Read</h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs px-2 py-1 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold">
              {archetypeData.label}
            </span>
          </div>
          <p className="text-sm text-pixel-text-muted italic">
            "{tendency}"
          </p>
        </div>

        {/* Match Conditions */}
        {(() => {
          const ctx = keyMoment.matchContext;
          const modifiers = KeyMomentResolver.getContextModifiers({
            momentum: ctx.momentum,
            energy: ctx.energy,
            mood: ctx.mood,
            pressure: ctx.pressure,
          });

          // Only show modifiers that are significant (|value| >= 1)
          const conditions: Array<{ icon: string; label: string; value: number; detail: string }> = [];

          if (Math.abs(modifiers.momentum) >= 1) {
            const positive = modifiers.momentum > 0;
            conditions.push({
              icon: positive ? '📈' : '📉',
              label: positive ? 'Momentum with you' : 'Momentum against you',
              value: modifiers.momentum,
              detail: positive ? 'Riding a hot streak' : 'Opponent has been on a run',
            });
          }

          if (modifiers.energy <= -1) {
            conditions.push({
              icon: '🔋',
              label: 'Low energy',
              value: modifiers.energy,
              detail: `Energy at ${Math.round(ctx.energy)}%`,
            });
          }

          if (Math.abs(modifiers.mood) >= 1) {
            const positive = modifiers.mood > 0;
            conditions.push({
              icon: positive ? '😊' : '😤',
              label: positive ? 'Positive mood' : 'Frustrated',
              value: modifiers.mood,
              detail: positive ? 'Feeling confident out there' : 'Letting frustration creep in',
            });
          }

          if (modifiers.pressure <= -2) {
            conditions.push({
              icon: '😰',
              label: modifiers.pressure <= -5 ? 'Pressure is high!' : 'Feeling the pressure',
              value: modifiers.pressure,
              detail: 'Big point — nerves are a factor',
            });
          }

          if (conditions.length === 0) return null;

          return (
            <div className="bg-pixel-bg border-2 border-pixel-border p-3">
              <h3 className="text-sm font-bold text-pixel-text mb-2">📊 Match Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {conditions.map((cond, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 border ${
                      cond.value > 0
                        ? 'border-green-600 bg-green-600 bg-opacity-15 text-green-400'
                        : 'border-red-600 bg-red-600 bg-opacity-15 text-red-400'
                    }`}
                    title={cond.detail}
                  >
                    <span>{cond.icon}</span>
                    <span className="font-bold">{cond.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tactical Options */}
        <div>
          <h3 className="text-base font-bold text-pixel-text mb-3">
            ⚔️ Choose Your Tactic
          </h3>
          <div className="space-y-3">
            {keyMoment.options.map((option, index) => {
              const matchup = getMatchupIndicator(option);
              return (
                <button
                  key={index}
                  onClick={() => handleChoice(option)}
                  className="w-full text-left p-4 border-4 border-pixel-border bg-pixel-card hover:border-pixel-accent hover:scale-[1.02] transition-all"
                >
                  {/* Option Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{option.emoji}</span>
                    <h4 className="text-base font-bold text-pixel-text">{option.name}</h4>
                  </div>
                  <p className="text-sm text-pixel-text-muted mb-3">{option.description}</p>

                  {/* Stat Matchup + Best Against */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-2">
                    <div>
                      <span className="text-pixel-text-muted">Stat matchup: </span>
                      <span className={`font-bold ${matchup.color}`}>{matchup.label}</span>
                    </div>
                    <div className="text-pixel-text-muted">
                      {option.bestAgainstHint}
                    </div>
                  </div>

                  {/* Secondary Effects */}
                  <div className="flex flex-wrap gap-2">
                    {option.secondaryEffects.map((effect, i) => {
                      const condLabel = getConditionLabel(effect.condition);
                      return (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 border border-pixel-border bg-pixel-bg ${
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

        {/* Help Text */}
        <div className="text-center text-xs text-pixel-text-muted">
          💡 Read your opponent's tendency to pick the best tactic
        </div>
      </div>
    </Modal>
  );
};
