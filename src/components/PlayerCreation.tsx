/**
 * Player Creation Component
 * UI for creating a new player with name and playstyle selection
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { WelcomeOverlay } from './WelcomeOverlay';

export const PlayerCreation: React.FC = () => {
  const [name, setName] = useState('');
  const [playstyle, setPlaystyle] = useState<'offensive' | 'defensive' | 'balanced'>(
    'balanced'
  );
  const [showWelcome, setShowWelcome] = useState(true);
  const createPlayer = useGameStore((state) => state.createPlayer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createPlayer(name.trim(), playstyle);
    }
  };

  const playstyleDescriptions = {
    offensive: {
      title: 'Offensive',
      emoji: '⚔️',
      description: 'Aggressive baseline play with powerful groundstrokes.',
      bonuses: '+5 Forehand, +5 Backhand, +3 Strength',
    },
    defensive: {
      title: 'Defensive',
      emoji: '🛡️',
      description: 'Consistent retrieval and court coverage.',
      bonuses: '+5 Speed, +5 Stamina, +3 Defensive',
    },
    balanced: {
      title: 'Balanced',
      emoji: '⚖️',
      description: 'Well-rounded game with no major weaknesses.',
      bonuses: '+1 all stats',
    },
  };

  return (
    <>
      <WelcomeOverlay isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pixel-text mb-2">
            Create Your Tennis Player
          </h1>
          <p className="text-pixel-text-muted">
            Begin your journey to becoming a tennis champion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label
              htmlFor="player-name"
              className="block text-lg font-bold text-pixel-text mb-2"
            >
              Player Name
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 bg-pixel-bg border-4 border-pixel-border text-pixel-text text-lg focus:border-pixel-accent focus:outline-none"
              maxLength={20}
              autoComplete="off"
              required
            />
          </div>

          {/* Playstyle Selection */}
          <div>
            <label className="block text-lg font-bold text-pixel-text mb-3">
              Choose Your Playstyle
            </label>
            <div className="grid grid-cols-1 gap-4">
              {(Object.keys(playstyleDescriptions) as Array<keyof typeof playstyleDescriptions>).map(
                (style) => {
                  const info = playstyleDescriptions[style];
                  const isSelected = playstyle === style;

                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setPlaystyle(style)}
                      className={`p-4 border-4 text-left transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-500 bg-opacity-20'
                          : 'border-pixel-border bg-pixel-card hover:border-pixel-secondary'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{info.emoji}</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-pixel-text mb-1">
                            {info.title}
                          </h3>
                          <p className="text-pixel-text-muted mb-2">{info.description}</p>
                          <p className="text-sm text-pixel-accent font-bold">
                            {info.bonuses}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!name.trim()}
            >
              Create Player
            </Button>
          </div>
        </form>
      </Card>
    </div>
    </>
  );
};
