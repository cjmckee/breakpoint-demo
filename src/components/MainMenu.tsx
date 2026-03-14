/**
 * Main Menu Component
 * Hub for player activities and navigation
 */

import React, { useEffect, JSX } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import { PlayerStatsDisplay } from './PlayerStatsDisplay';
import { RecentActivities } from './RecentActivities';
import { ActiveChallenges } from './ActiveChallenges';
import { ActiveTournamentCard } from './ActiveTournamentCard';
import { TrainingResultModal } from './TrainingResultModal';
import { StoryEventModal } from './StoryEventModal';
import { StoryEventResultModal } from './StoryEventResultModal';
import type { StoryMatchMetadata } from '../types/game';
import { ItemManager } from '../game/ItemManager';
import type {
  StoryEventModalData,
  TrainingResultModalData,
  StoryEventResultModalData,
} from '../types/ui';
import { TimeSlot } from '../types/game';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentManager } from '../game/TournamentManager';
import { StoryMatchManager } from '../game/StoryMatchManager';

export const MainMenu: React.FC = () => {
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const setScreen = useGameStore((state) => state.setScreen);
  const rest = useGameStore((state) => state.rest);

  // Tournament state
  const activeTournament = useGameStore((state) => state.calendar.activeTournament);
  const getScheduledTournamentMatch = useGameStore((state) => state.getScheduledTournamentMatch);

  // Story match state
  const getScheduledStoryMatch = useGameStore((state) => state.getScheduledStoryMatch);

  // Story event actions
  const executeStoryEvent = useGameStore((state) => state.executeStoryEvent);
  const cancelStoryEvent = useGameStore((state) => state.cancelStoryEvent);
  const getAvailableEventOptions = useGameStore((state) => state.getAvailableEventOptions);

  // Modal queue state and actions
  const currentModal = useGameStore((state) => state.currentModal);
  const dismissCurrentModal = useGameStore((state) => state.dismissCurrentModal);
  const hasModalOfType = useGameStore((state) => state.hasModalOfType);

  // Check if it's night time - only rest/next day action allowed
  const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;

  // Check if a story event modal is active
  const isEventPending = hasModalOfType('story_event');

  // Check if tournament match is scheduled for current time
  const scheduledTournamentMatch = getScheduledTournamentMatch();
  const isTournamentMatchScheduled = scheduledTournamentMatch !== null;

  // Check if story match is scheduled for current time
  const scheduledStoryMatch = getScheduledStoryMatch();
  const isStoryMatchScheduled = scheduledStoryMatch !== null;
  const storyMatchMetadata = scheduledStoryMatch
    ? StoryMatchManager.getStoryMatchMetadata(scheduledStoryMatch)
    : null;

  // Trigger pre-match event when tournament match is scheduled
  // checkForStoryEventById already skips completed events, so no modal guard needed
  useEffect(() => {
    if (isTournamentMatchScheduled && scheduledTournamentMatch && activeTournament) {
      const tournamentId = activeTournament.tournamentId;
      const config = TournamentRegistry.getTournament(tournamentId);
      if (config) {
        const prematchEventId = TournamentManager.getPrematchEventId(
          config,
          activeTournament.currentRound,
          activeTournament.currentBracket
        );
        if (prematchEventId) {
          console.log('Tournament match scheduled - triggering pre-match event:', prematchEventId);
          useGameStore.getState().checkForStoryEventById(prematchEventId);
        }
      }
    }
  }, [isTournamentMatchScheduled, scheduledTournamentMatch, activeTournament]);

  // Trigger pre-match event when story match is scheduled
  // checkForStoryEventById already skips completed events, so no modal guard needed
  useEffect(() => {
    if (isStoryMatchScheduled && storyMatchMetadata) {
      if (storyMatchMetadata.prematchEventId) {
        console.log('Story match scheduled - triggering pre-match event:', storyMatchMetadata.prematchEventId);
        useGameStore.getState().checkForStoryEventById(storyMatchMetadata.prematchEventId);
      }
    }
  }, [isStoryMatchScheduled, storyMatchMetadata]);

  const handleExecuteEvent = (eventId: string, optionId?: string) => {
    executeStoryEvent(eventId, optionId);
    // Modal dismissal and result queuing now handled by executeStoryEvent
  };

  const handleCancelEvent = () => {
    cancelStoryEvent();
    // Modal dismissal now handled by cancelStoryEvent
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
      id: 'tournaments',
      title: 'Tournaments',
      emoji: '🏆',
      description: 'Enter competitive tournaments and compete for glory',
      energyCost: 0,
      action: () => setScreen('tournaments'),
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
      title: isNightTime ? 'Next Day' : 'Rest',
      emoji: '😴',
      description: isNightTime ? 
        'Rest and advance to the next day' 
        : 'Rest and advance to next action',
      energyCost: isNightTime ? -50 : -20,
      action: () => rest(),
    },
  ];

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

  // Handle starting a story match
  const handleStartStoryMatch = () => {
    if (!storyMatchMetadata) return;

    const startMatch = useMatchStore.getState().startMatch;

    // Fire off match simulation (don't await - it runs until match completes)
    startMatch({
      playerStats: player.stats,
      playerAbilities: player.abilities,
      itemBoosts: ItemManager.getTotalPassiveBoosts(player),
      opponentStats: storyMatchMetadata.opponentStats,
      opponentName: storyMatchMetadata.opponentName,
      opponentTier: storyMatchMetadata.opponentTier,
      surface: storyMatchMetadata.surface || 'hard',
      mood: currentStatus.mood,
      energy: currentStatus.energy,
      enableKeyMoments: true,
      keyMomentsPerMatch: 8,
      matchFormat: storyMatchMetadata.matchFormat || 'best-of-1',
      isStoryMatch: true,
    });

    setScreen('match');
  };

  // Get current story event from modal (if showing)
  const currentStoryEvent = currentModal?.type === 'story_event'
    ? (currentModal.data as StoryEventModalData).event
    : null;

  // Render modal based on currentModal from queue
  const renderModal = () => {
    if (!currentModal) return null;

    switch (currentModal.type) {
      case 'training_result': {
        const data = currentModal.data as TrainingResultModalData;
        return (
          <TrainingResultModal
            isOpen={true}
            onClose={dismissCurrentModal}
            result={data.result}
          />
        );
      }
      case 'story_event': {
        const data = currentModal.data as StoryEventModalData;
        return (
          <StoryEventModal
            isOpen={true}
            onClose={handleCancelEvent}
            event={data.event}
            availableOptions={getAvailableEventOptions()}
            onSelectOption={handleExecuteEvent}
          />
        );
      }
      case 'story_event_result': {
        const data = currentModal.data as StoryEventResultModalData;
        return (
          <StoryEventResultModal
            isOpen={true}
            onClose={dismissCurrentModal}
            result={data.result}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-pixel-bg ${isNightTime ? 'night-mode' : ''}`}>
      <StatusBar />

      <div className="px-4 md:px-8 lg:px-12">
        {/* Tournament Match Banner */}
        {isTournamentMatchScheduled && scheduledTournamentMatch && (
          <Card className="mb-6 border-4 border-yellow-400 bg-yellow-600 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🎾</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">Tournament Match Scheduled!</h2>
                <p className="text-lg text-white">
                  Your tournament match is ready to play
                </p>
                <p className="text-sm text-gray-200 mt-1">
                  {activeTournament?.tournamentName} - Round {(activeTournament?.currentRound || 0) + 1}
                </p>
              </div>
              <Button onClick={() => setScreen('tournament-match')} variant="primary" size="lg">
                Play Match
              </Button>
            </div>
          </Card>
        )}

        {/* Story Match Banner */}
        {isStoryMatchScheduled && storyMatchMetadata && (
          <Card className="mb-6 border-4 border-purple-400 bg-purple-600 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🎾</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {storyMatchMetadata.matchTitle || 'Story Match Scheduled!'}
                </h2>
                <p className="text-lg text-white">
                  vs {storyMatchMetadata.opponentName}
                </p>
                {storyMatchMetadata.matchDescription && (
                  <p className="text-sm text-gray-200 mt-1">{storyMatchMetadata.matchDescription}</p>
                )}
              </div>
              <Button onClick={handleStartStoryMatch} variant="primary" size="lg">
                Play Match
              </Button>
            </div>
          </Card>
        )}

        {/* Story Event Notification */}
        {isEventPending && currentStoryEvent && (
          <Card className="mb-6 border-4 border-yellow-400 bg-yellow-600">
            <div className="flex items-center gap-4">
              <span className="text-5xl">📖</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">Story Event Available!</h2>
                <p className="text-lg text-white">{currentStoryEvent.name}</p>
                <p className="text-sm text-gray-200 mt-1">{currentStoryEvent.description}</p>
              </div>
              {/* Modal is already showing via renderModal - no button needed if modal is open */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {activities.map((activity) => {
            const canAfford = currentStatus.energy >= activity.energyCost;
            const isRestButton = activity.id === 'rest';
            const isInventoryButton = activity.id === 'inventory';

            // Disable all activities when event is pending, match scheduled, or during night time (except rest and inventory)
            const isMatchScheduled = isTournamentMatchScheduled || isStoryMatchScheduled;
            const isDisabled = isEventPending
              ? !isInventoryButton
              : isMatchScheduled
                ? !isRestButton && !isInventoryButton
                : isNightTime
                  ? (!isRestButton && !isInventoryButton)
                  : (!canAfford && activity.energyCost > 0);

            // Get button text
            let buttonText = activity.title;
            if (isEventPending) {
              buttonText = 'Event Pending';
            } else if (isMatchScheduled && !isRestButton && !isInventoryButton) {
              buttonText = 'Match Scheduled';
            } else if (isNightTime && isRestButton) {
              buttonText = 'Next Day';
            } else if (!canAfford && activity.energyCost > 0) {
              buttonText = 'Not Enough Energy';
            }

            // Get button variant - use success for "Next Day" button
            const buttonVariant = (isNightTime && isRestButton) ? 'success' : 'primary';

            return (
              <Card key={activity.id} padding="md" className={`flex flex-col ${isNightTime && (isRestButton || isInventoryButton) ? 'night-exempt' : ''}`}>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{activity.emoji}</div>
                  <h2 className="text-lg lg:text-2xl font-bold text-pixel-text mb-2 truncate">
                    {activity.title}
                  </h2>
                  <p className="text-sm text-pixel-text-muted mb-3">
                    {activity.description}
                  </p>
                  {activity.energyCost > 0 && (
                    <div className="text-sm text-red-400">
                      Energy Cost: <span className="font-bold">{activity.energyCost}</span>
                    </div>
                  )}
                  {activity.energyCost < 0 && (
                    <div className="text-sm text-green-400">
                      Energy Restored: <span className="font-bold">{Math.abs(activity.energyCost)}</span>
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

          {/* Recent Activities, Challenges, and Tournament - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            <ActiveTournamentCard />
            <ActiveChallenges />
            <RecentActivities />
          </div>
        </div>
      </div>

      {/* Modal Renderer - Single source of truth for all modals */}
      {renderModal()}
    </div>
  );
};
