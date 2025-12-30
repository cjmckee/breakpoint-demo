/**
 * Main Menu Component
 * Hub for player activities and navigation
 */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import { PlayerStatsDisplay } from './PlayerStatsDisplay';
import { RecentActivities } from './RecentActivities';
import { TrainingResultModal } from './TrainingResultModal';
import type { TrainingResult } from '../types/game';
import { TimeSlot } from '../types/game';

export const MainMenu: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const setScreen = useGameStore((state) => state.setScreen);
  const rest = useGameStore((state) => state.rest);
  const showTrainingResultModal = useGameStore((state) => state.showTrainingResultModal);
  const clearTrainingResultModal = useGameStore((state) => state.clearTrainingResultModal);

  // Check if it's night time - only rest/next day action allowed
  const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;

  // Get training result from last activity if modal should be shown
  const trainingResult = showTrainingResultModal && currentStatus.lastActivity?.type === 'training'
    ? (currentStatus.lastActivity as TrainingResult)
    : null;

  if (!player) {
    return null;
  }

  const activities = [
    {
      id: 'training',
      title: 'Training',
      emoji: '🏋️',
      description: 'Improve your skills with focused practice sessions',
      energyCost: 15,
      action: () => setScreen('training'),
    },
    {
      id: 'match',
      title: 'Play Match',
      emoji: '🎾',
      description: 'Test your skills in a competitive match',
      energyCost: 30,
      action: () => setScreen('match'),
    },
    {
      id: 'rest',
      title: 'Rest',
      emoji: '😴',
      description: 'Restore your energy and pass the time',
      energyCost: 0,
      action: () => rest(),
    },
  ];

  const handleCloseTrainingModal = () => {
    clearTrainingResultModal();
  };

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar />

      <div className="max-w-6xl mx-auto p-4">
        {/* Welcome Message */}
        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-pixel-text mb-2">
            Welcome, {player.name}!
          </h1>
          <p className="text-pixel-text-muted">
            What would you like to do today?
          </p>
        </Card>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {activities.map((activity) => {
            const canAfford = currentStatus.energy >= activity.energyCost;
            const isRestButton = activity.id === 'rest';

            // During night time, disable all activities except rest
            const isDisabled = isNightTime
              ? !isRestButton
              : (!canAfford && activity.energyCost > 0);

            // Get button text
            let buttonText = activity.title;
            if (isNightTime && isRestButton) {
              buttonText = 'Next Day';
            } else if (!canAfford && activity.energyCost > 0) {
              buttonText = 'Not Enough Energy';
            }

            // Get button variant - use success for "Next Day" button
            const buttonVariant = (isNightTime && isRestButton) ? 'success' : 'primary';

            return (
              <Card key={activity.id} padding="md" className="flex flex-col">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{activity.emoji}</div>
                  <h2 className="text-2xl font-bold text-pixel-text mb-2">
                    {isNightTime && isRestButton ? 'Next Day' : activity.title}
                  </h2>
                  <p className="text-sm text-pixel-text-muted mb-3">
                    {isNightTime && isRestButton
                      ? 'Rest and advance to the next day'
                      : activity.description}
                  </p>
                  {activity.energyCost > 0 && (
                    <div className="text-sm text-pixel-text-muted">
                      Energy Cost: <span className="font-bold">{activity.energyCost}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <Button
                    variant={buttonVariant}
                    fullWidth
                    onClick={activity.action}
                    disabled={isDisabled}
                  >
                    {buttonText}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Two Column Layout for Stats and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Full Player Stats - 2 columns */}
          <div className="lg:col-span-2">
            <PlayerStatsDisplay />
          </div>

          {/* Recent Activities - 1 column */}
          <div className="lg:col-span-1">
            <RecentActivities />
          </div>
        </div>
      </div>

      {/* Training Result Modal */}
      <TrainingResultModal
        isOpen={showTrainingResultModal}
        onClose={handleCloseTrainingModal}
        result={trainingResult}
      />
    </div>
  );
};
