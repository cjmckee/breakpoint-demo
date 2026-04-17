/**
 * Relationships Component
 * Displays all met characters and their relationship status
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CHARACTERS } from '../data/characters';

export const Relationships: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const relationships = useGameStore((state) => state.relationships);
  const navigateTo = useGameStore((state) => state.navigateTo);

  if (!player) return null;

  const metCharacterIds = Object.keys(relationships);
  const metCharacters = metCharacterIds
    .map((id) => CHARACTERS[id])
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

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

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pixel-text">Relationships</h1>
          <Button onClick={() => navigateTo('idle')}>Back to Menu</Button>
        </div>

        {metCharacters.length === 0 ? (
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
            {metCharacters.map((character) => {
              const relationshipValue = relationships[character.id] ?? 0;
              return (
                <Card key={character.id} padding="md">
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
                       '🎾'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xl font-bold text-pixel-text">{character.name}</h3>
                        <span className="text-sm text-pixel-text-muted">{character.role}</span>
                      </div>
                      {/* Relationship Bar */}
                      <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full ${getBarColor(relationshipValue)} transition-all duration-300`}
                          style={{ width: getBarWidth(relationshipValue) }}
                        />
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white opacity-50 transform -translate-x-1/2" />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-red-400">-100</span>
                        <span className="font-bold text-pixel-text">{formatValue(relationshipValue)}</span>
                        <span className="text-green-400">+100</span>
                      </div>
                    </div>
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
