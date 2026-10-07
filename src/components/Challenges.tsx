/**
 * Challenges Screen
 * Dedicated full-screen home for active challenges (quests + rewards). Reached from
 * the main-menu challenges strip via navigateTo('challenges').
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { ScreenFrame } from './ui/ScreenFrame';
import { ActiveChallenges } from './ActiveChallenges';
import { CompletedChallenges } from './CompletedChallenges';

export const Challenges: React.FC = () => {
  const navigateTo = useGameStore((state) => state.navigateTo);

  return (
    <ScreenFrame title="Challenges" onBack={() => navigateTo('idle')}>
      <ActiveChallenges />
      <CompletedChallenges />
    </ScreenFrame>
  );
};
