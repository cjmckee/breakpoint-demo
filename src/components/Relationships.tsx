/**
 * Relationships Component
 * Displays all met characters and their relationship status — this is also the
 * hangout menu: characters with a new tier event float to the top with a
 * Hang Out button. Key characters show threshold notches (the next locked
 * notch pulses to mark the goal) and a tier label.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import { CHARACTERS } from '../data/characters';
import { HANGOUT_CHARACTERS, HANGOUT_ENERGY_COST, getHangoutTier, hasUnseenTierEvent } from '../data/hangoutCharacters';
import { UnseenBadge } from './ui/UnseenBadge';
import { TimeSlot } from '../types/game';

export const Relationships: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const relationships = useGameStore((state) => state.relationships);
  const hangoutThresholdsSeen = useGameStore((state) => state.hangoutThresholdsSeen);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const hangoutWithCharacter = useGameStore((state) => state.hangoutWithCharacter);

  if (!player) return null;

  const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;
  const canAffordHangout = currentStatus.energy >= HANGOUT_ENERGY_COST;

  const metCharacterIds = Object.keys(relationships);
  const metCharacters = metCharacterIds
    .map((id) => CHARACTERS[id])
    .filter((c): c is NonNullable<typeof c> => c !== undefined)
    .filter((c) => c.role !== 'Opponent');

  const isHangoutReady = (characterId: string): boolean => {
    const isUnlocked = calendar.currentDay >= 6 && player.flags[`hangoutUnlocked_${characterId}`] === true;
    return isUnlocked && hasUnseenTierEvent(characterId, relationships[characterId] ?? 0, hangoutThresholdsSeen);
  };

  // Sort: hangout-ready first (the actionable ones), then key characters, then others
  const sorted = [...metCharacters].sort((a, b) => {
    const aReady = isHangoutReady(a.id);
    const bReady = isHangoutReady(b.id);
    if (aReady !== bReady) return aReady ? -1 : 1;
    if (a.isKeyCharacter !== b.isKeyCharacter) return a.isKeyCharacter ? -1 : 1;
    return 0;
  });

  const getBarColor = (value: number): string => {
    if (value > 20) return 'bg-green-500';
    if (value < -20) return 'bg-red-500';
    return 'bg-gray-400';
  };

  const getBarWidth = (value: number): string => {
    const normalized = ((value + 100) / 200) * 100;
    return `${normalized}%`;
  };

  const formatValue = (value: number): string => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const getTierLabel = (characterId: string, relValue: number): string => {
    const tier = getHangoutTier(characterId, relValue);
    const labels = ['Acquaintance', 'Friend', 'Close', 'Trusted'];
    return labels[tier] ?? 'Acquaintance';
  };

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h1 className="text-3xl font-bold text-pixel-text mb-4">Relationships</h1>

        {sorted.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-pixel-text mb-2">No Relationships Yet</h2>
              <p className="text-pixel-text-muted">
                As you play the game and complete story events, you'll meet characters and build relationships with them.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sorted.map((character) => {
              const relationshipValue = relationships[character.id] ?? 0;
              const isKey = character.isKeyCharacter === true;
              const hangoutConfig = HANGOUT_CHARACTERS[character.id];
              const currentTier = isKey ? getHangoutTier(character.id, relationshipValue) : 0;
              const hasNewTierEvent = isHangoutReady(character.id);
              const isHangoutDisabled = isNightTime || !canAffordHangout;
              // The first locked threshold is the player's current goal — it pulses
              const nextThreshold = isKey && hangoutConfig
                ? hangoutConfig.thresholds.find((t) => relationshipValue < t)
                : undefined;

              return (
                <Card
                  key={character.id}
                  padding="md"
                  className={hasNewTierEvent ? 'border-pixel-accent' : ''}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">
                      {character.role === 'Coach' ? '👨‍🏫' :
                       character.role === 'Rival' ? '⚔️' :
                       character.role === 'Family' ? '👨‍👩‍👧' :
                       character.role === 'Friend' ? '🤝' :
                       character.role === 'Sponsor' ? '💼' :
                       character.role === 'Career' ? '📈' :
                       character.role === 'Media' ? '📰' :
                       character.role === 'Official' ? '🏆' :
                       character.role === 'Romance' ? '💖' :
                       '🎾'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-pixel-text">{character.name}</h3>
                          {isKey && (
                            <span className="text-xs px-1.5 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold">
                              KEY
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {isKey && (
                            <span className="text-xs text-pixel-text-muted">
                              {getTierLabel(character.id, relationshipValue)} (Tier {currentTier})
                            </span>
                          )}
                          <span className="text-sm text-pixel-text-muted">{character.role}</span>
                        </div>
                      </div>

                      {/* Relationship Bar with threshold notches */}
                      <div className="relative h-6 bg-gray-700 rounded-full overflow-visible mb-1">
                        {/* Fill */}
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full ${getBarColor(relationshipValue)} transition-all duration-300`}
                          style={{ width: getBarWidth(relationshipValue) }}
                        />
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white opacity-50 transform -translate-x-1/2" />
                        {/* Threshold notches for key characters */}
                        {isKey && hangoutConfig && hangoutConfig.thresholds.map((threshold) => {
                          const notchPct = ((threshold + 100) / 200) * 100;
                          const isUnlocked = relationshipValue >= threshold;
                          const isNext = threshold === nextThreshold;
                          return (
                            <div
                              key={threshold}
                              className="absolute top-0 h-full flex flex-col items-center"
                              style={{ left: `${notchPct}%`, transform: 'translateX(-50%)' }}
                              title={isUnlocked ? `Unlocked at ${formatValue(threshold)}` : `Next event at ${formatValue(threshold)}`}
                            >
                              <div
                                className={`h-full ${
                                  isUnlocked
                                    ? 'w-1 bg-yellow-300'
                                    : isNext
                                      ? 'w-1.5 bg-yellow-300 animate-pulse'
                                      : 'w-1 bg-white opacity-60'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-center text-xs mt-1 font-bold text-pixel-text">
                        {formatValue(relationshipValue)}
                      </div>
                    </div>

                    {/* Hang Out button — only shown when a new tier event is available */}
                    {isKey && hasNewTierEvent && (
                      <div className="flex-shrink-0 relative">
                        {!isHangoutDisabled && (
                          <UnseenBadge className="absolute -top-2 -right-2 z-10" />
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isHangoutDisabled}
                          onClick={() => hangoutWithCharacter(character.id)}
                        >
                          {isNightTime
                            ? 'Unavailable'
                            : !canAffordHangout
                              ? 'Low Energy'
                              : '★ Hang Out'}
                        </Button>
                        <div className="text-xs text-center text-pixel-text-muted mt-1">
                          {HANGOUT_ENERGY_COST} energy
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
