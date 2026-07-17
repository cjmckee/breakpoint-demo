/**
 * Challenges Screen
 * Dedicated full-screen home for active challenges (quests + rewards). Reached from
 * the main-menu challenges strip via navigateTo('challenges').
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { StatusBar } from './StatusBar';
import { ActiveChallenges } from './ActiveChallenges';

export const Challenges: React.FC = () => {
  const navigateTo = useGameStore((state) => state.navigateTo);

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar onBack={() => navigateTo('idle')} />

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h1 className="text-3xl font-bold text-pixel-text mb-1">Challenges</h1>
        <p className="text-sm text-pixel-text-muted mb-4">
          Complete quests to earn stats, abilities, items, and XP. Tap a challenge to see its requirements and rewards.
        </p>
        <ActiveChallenges />
      </div>
    </div>
  );
};
