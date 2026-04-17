/**
 * Shop Component
 * Allows spending experience on stat increases, items, and abilities
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const Shop: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const navigateTo = useGameStore((state) => state.navigateTo);

  if (!player) return null;

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-pixel-text">Shop</h1>
          <Button onClick={() => navigateTo('idle')}>Back to Menu</Button>
        </div>

        {/* Experience Display */}
        <Card className="mb-6 bg-yellow-900 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-yellow-400">Experience</h2>
              <p className="text-sm text-yellow-200">Spend experience to improve your character</p>
            </div>
            <div className="text-4xl font-bold text-yellow-400">
              {player.experience} XP
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold text-pixel-text mb-2">Shop Coming Soon</h2>
            <p className="text-pixel-text-muted">
              The shop system is under development. Check back soon!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
