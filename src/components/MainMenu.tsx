/**
 * Main Menu Component
 * Hub for player activities and navigation
 */

import React, { JSX, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBar } from './StatusBar';
import { PlayerStatsDisplay } from './PlayerStatsDisplay';
import { RecentActivities } from './RecentActivities';
import { ActiveChallenges } from './ActiveChallenges';
import { ActiveTournamentCard } from './ActiveTournamentCard';
import { UpcomingTeamMatchCard } from './UpcomingTeamMatchCard';
import { TrainingResultModal } from './TrainingResultModal';
import { StoryEventModal } from './StoryEventModal';
import { StoryEventResultModal } from './StoryEventResultModal';
import { SettingsModal } from './SettingsModal';
import { FeedbackModal } from './FeedbackModal';
import { derivePlayStyle } from '../core/PlayerProfile';
import { getArchetypeLabel } from '../data/archetypes';
import type { OverlayState } from '../types/gamePhase';
import { TimeSlot, PlayerFlag } from '../types/game';
import { StoryMatchManager } from '../game/StoryMatchManager';

interface MainMenuProps {
  overlay: OverlayState | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({ overlay }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isMobile = useIsMobile();
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const navigateToScheduledMatch = useGameStore((state) => state.navigateToScheduledMatch);
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
  const dismissOverlay = useGameStore((state) => state.dismissOverlay);
  const dismissStoryEventResult = useGameStore((state) => state.dismissStoryEventResult);

  // Check for unseen training
  const hasUnseenTraining = (player?.activeIndicators ?? []).includes('training');

  // Check for unseen items in inventory
  const hasUnseenItems = player ? [
    ...player.inventory,
    ...Object.values(player.equippedItems).filter((i): i is NonNullable<typeof i> => i !== null),
    ...player.storyItems,
  ].some((item) => !(player.seenItemIds ?? []).includes(item.id)) : false;

  // Check if it's night time - only rest/next day action allowed
  const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;

  // Progression flags
  const matchUnlocked = player?.flags?.[PlayerFlag.MATCH_UNLOCKED] === true;

  // Check if a story event overlay is active
  const isEventPending = overlay?.type === 'story_event';

  // Check if tournament match is scheduled for current time
  const scheduledTournamentMatch = getScheduledTournamentMatch();
  const isTournamentMatchScheduled = scheduledTournamentMatch !== null;

  // Check if story match is scheduled for current time
  const scheduledStoryMatch = getScheduledStoryMatch();
  const isStoryMatchScheduled = scheduledStoryMatch !== null;
  const storyMatchMetadata = scheduledStoryMatch
    ? StoryMatchManager.getStoryMatchMetadata(scheduledStoryMatch)
    : null;

  // Pre-match events are now triggered by navigateTo('idle') in gameStore — no useEffects needed.

  const handleExecuteEvent = (eventId: string, optionId?: string) => {
    executeStoryEvent(eventId, optionId);
  };

  const handleCancelEvent = () => {
    cancelStoryEvent();
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
      energyCost: 0,
      action: () => navigateTo('training'),
    },
    {
      id: 'match',
      title: 'Play Match',
      emoji: '🎾',
      description: 'Test your skills in a practice match with another Academy player',
      energyCost: 50,
      action: () => navigateTo('match_setup'),
    },
    {
      id: 'inventory',
      title: 'Inventory',
      emoji: '🎒',
      description: 'Manage your equipment and items',
      energyCost: 0,
      action: () => navigateTo('inventory'),
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

  // Get current story event from overlay (if showing)
  const currentStoryEvent = overlay?.type === 'story_event' ? overlay.event : null;

  // Render overlay modal based on overlay state
  const renderOverlay = () => {
    if (!overlay) return null;

    switch (overlay.type) {
      case 'training_result': {
        return (
          <TrainingResultModal
            isOpen={true}
            onClose={dismissOverlay}
            result={overlay.result}
          />
        );
      }
      case 'story_event': {
        return (
          <StoryEventModal
            isOpen={true}
            onClose={handleCancelEvent}
            event={overlay.event}
            availableOptions={getAvailableEventOptions()}
            onSelectOption={handleExecuteEvent}
          />
        );
      }
      case 'story_event_result': {
        return (
          <StoryEventResultModal
            isOpen={true}
            onClose={dismissStoryEventResult}
            result={overlay.result}
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
              <Button onClick={() => navigateToScheduledMatch('tournament')} variant="primary" size="lg">
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
              <Button onClick={() => navigateToScheduledMatch('story')} variant="primary" size="lg">
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
            </div>
          </Card>
        )}

        {/* Player Header */}
        <Card className="mb-6">
          <div>
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold text-pixel-text mb-1">
                {player.name}
              </h1>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="text-pixel-text-muted hover:text-pixel-text text-sm px-2 py-1 border border-pixel-border"
                  title="Leave feedback"
                >
                  💬 Feedback
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="text-pixel-text-muted hover:text-pixel-text text-sm px-2 py-1 border border-pixel-border"
                  title="Settings"
                >
                  ⚙ Settings
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-lg font-bold ${getTierColor(player.tier)}`}>
                {getTierName(player.tier)}
              </span>
              <span className="text-sm px-2 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold">
                {getArchetypeLabel(derivePlayStyle(player.stats).type)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-pixel-text-muted">Recent Matches:</span>
              {renderMatchRecord()}
            </div>
          </div>
        </Card>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {activities.map((activity) => {
            const canAfford = currentStatus.energy >= activity.energyCost;
            const isRestButton = activity.id === 'rest';
            const isInventoryButton = activity.id === 'inventory';
            const isMatchButton = activity.id === 'match';

            // Check progression locks
            const isLocked = (isMatchButton && !matchUnlocked);

            // Disable all activities when event is pending, match scheduled, or during night time (except rest and inventory)
            const isMatchScheduled = isTournamentMatchScheduled || isStoryMatchScheduled;
            const isDisabled = isLocked
              ? true
              : isEventPending
                ? !isInventoryButton
                : isMatchScheduled
                  ? !isRestButton && !isInventoryButton
                  : isNightTime
                    ? (!isRestButton && !isInventoryButton)
                    : (!canAfford && activity.energyCost > 0);

            // Get button text
            let buttonText = activity.title;
            if (isLocked) {
              buttonText = `Unlocks Day 5`;
            } else if (isEventPending) {
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
                  <div className="text-6xl mb-3 relative inline-block">
                    {activity.emoji}
                    {activity.id === 'inventory' && hasUnseenItems && (
                      <span className="absolute -top-2 -right-4 w-6 h-6 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-bounce">
                        !
                      </span>
                    )}
                    {activity.id === 'training' && hasUnseenTraining && (
                      <span className="absolute -top-2 -right-4 w-6 h-6 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-bounce">
                        !
                      </span>
                    )}
                  </div>
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
          {/* Full Player Stats - 2 columns, shown second on mobile */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <PlayerStatsDisplay collapsible={true} defaultCollapsed={isMobile} />
          </div>

          {/* Tournament, Challenges, Recent Activities - shown first on mobile */}
          <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
            <ActiveTournamentCard />
            <UpcomingTeamMatchCard />
            <ActiveChallenges />
            <RecentActivities collapsible={true} defaultCollapsed={isMobile} />
          </div>
        </div>
      </div>

      {/* Overlay Renderer */}
      {renderOverlay()}

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
};
