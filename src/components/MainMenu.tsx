/**
 * Main Menu Component
 * Hub for player activities and navigation
 */

import React, { useState, useEffect, JSX } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import { PlayerStatsDisplay } from './PlayerStatsDisplay';
import { RecentActivities } from './RecentActivities';
import { ActiveChallenges } from './ActiveChallenges';
import { TrainingResultModal } from './TrainingResultModal';
import { StoryEventModal } from './StoryEventModal';
import { StoryEventResultModal } from './StoryEventResultModal';
import type { TrainingResult } from '../types/game';
import type { StoryEventResult } from '../types/storyEvents';
import { TimeSlot } from '../types/game';

export const MainMenu: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const setScreen = useGameStore((state) => state.setScreen);
  const rest = useGameStore((state) => state.rest);
  const showTrainingResultModal = useGameStore((state) => state.showTrainingResultModal);
  const clearTrainingResultModal = useGameStore((state) => state.clearTrainingResultModal);

  // Story event state and actions
  const pendingStoryEvent = useGameStore((state) => state.pendingStoryEvent);
  const executeStoryEvent = useGameStore((state) => state.executeStoryEvent);
  const cancelStoryEvent = useGameStore((state) => state.cancelStoryEvent);
  const getAvailableEventOptions = useGameStore((state) => state.getAvailableEventOptions);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showStoryResultModal, setShowStoryResultModal] = useState(false);

  // Check if it's night time - only rest/next day action allowed
  const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;

  // Check if story event is pending
  const isEventPending = pendingStoryEvent !== null;

  // Get training result from last activity if modal should be shown
  const trainingResult = showTrainingResultModal && currentStatus.lastActivity?.type === 'training'
    ? (currentStatus.lastActivity as TrainingResult)
    : null;

  // Get story event result from last activity
  const storyEventResult =
    currentStatus.lastActivity && currentStatus.lastActivity.type === 'story'
      ? (currentStatus.lastActivity as StoryEventResult)
      : null;

  // Open story modal when event becomes pending, but only after training modal is dismissed
  useEffect(() => {
    if (isEventPending && !showTrainingResultModal) {
      setShowStoryModal(true);
    }
  }, [isEventPending, showTrainingResultModal]);

  const handleExecuteEvent = (eventId: string, optionId?: string) => {
    executeStoryEvent(eventId, optionId);
    setShowStoryModal(false);
    setShowStoryResultModal(true);
  };

  const handleCancelEvent = () => {
    cancelStoryEvent();
    setShowStoryModal(false);
  };

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
      id: 'inventory',
      title: 'Inventory',
      emoji: '🎒',
      description: 'Manage your equipment and items',
      energyCost: 0,
      action: () => setScreen('inventory'),
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

    // If there's a pending story event, show it now that training modal is dismissed
    if (isEventPending) {
      setShowStoryModal(true);
    }
  };

  const getTierName = (tier: number): string => {
    const tierNames = ['', 'Club Player', 'Regional Competitor', 'Tour Professional', 'World Champion'];
    return tierNames[tier] || 'Unknown';
  };

  const getTierColor = (tier: number): string => {
    const tierColors = ['', 'text-amber-700', 'text-gray-400', 'text-yellow-400', 'text-purple-400'];
    return tierColors[tier] || 'text-pixel-text-muted';
  };

  const renderMatchRecord = (): JSX.Element => {
    const results = player?.latestMatchResults || [];

    if (results.length === 0) {
      return <span className="text-xs text-pixel-text-muted">No matches yet</span>;
    }

    return (
      <div className="flex gap-0.5">
        {results.map((result, index) => (
          <div
            key={index}
            className={`w-4 h-4 border-2 border-pixel-border ${
              result === 'win' ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={result === 'win' ? 'Win' : 'Loss'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-pixel-bg">
      <StatusBar />

      <div className="max-w-6xl mx-auto p-4">
        {/* Story Event Notification */}
        {isEventPending && pendingStoryEvent && (
          <Card className="mb-6 border-4 border-yellow-400 bg-yellow-600">
            <div className="flex items-center gap-4">
              <span className="text-5xl">📖</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">Story Event Available!</h2>
                <p className="text-lg text-white">{pendingStoryEvent.name}</p>
                <p className="text-sm text-gray-200 mt-1">{pendingStoryEvent.description}</p>
              </div>
              <Button onClick={() => setShowStoryModal(true)} variant="primary" size="lg">
                Begin Event
              </Button>
            </div>
          </Card>
        )}

        {/* Player Header */}
        <Card className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-pixel-text mb-1">
              {player.name}
            </h1>
            <div className="mb-2">
              <span className={`text-lg font-bold ${getTierColor(player.tier)}`}>
                {getTierName(player.tier)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-pixel-text-muted">Recent Matches:</span>
              {renderMatchRecord()}
            </div>
          </div>
        </Card>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {activities.map((activity) => {
            const canAfford = currentStatus.energy >= activity.energyCost;
            const isRestButton = activity.id === 'rest';
            const isInventoryButton = activity.id === 'inventory';

            // Disable all activities when event is pending or during night time (except rest and inventory)
            const isDisabled = isEventPending
              ? !isInventoryButton
              : isNightTime
                ? (!isRestButton && !isInventoryButton)
                : (!canAfford && activity.energyCost > 0);

            // Get button text
            let buttonText = activity.title;
            if (isEventPending) {
              buttonText = 'Event Pending';
            } else if (isNightTime && isRestButton) {
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

          {/* Recent Activities and Challenges - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            <ActiveChallenges />
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

      {/* Story Event Modal */}
      {pendingStoryEvent && (
        <StoryEventModal
          isOpen={showStoryModal}
          onClose={handleCancelEvent}
          event={pendingStoryEvent}
          availableOptions={getAvailableEventOptions()}
          onSelectOption={handleExecuteEvent}
        />
      )}

      {/* Story Event Result Modal */}
      {storyEventResult && (
        <StoryEventResultModal
          isOpen={showStoryResultModal}
          onClose={() => setShowStoryResultModal(false)}
          result={storyEventResult}
        />
      )}
    </div>
  );
};
