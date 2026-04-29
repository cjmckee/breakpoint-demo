/**
 * Main Menu Component
 * Hub for player activities and navigation
 */

import React, { JSX, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { UnseenBadge } from './ui/UnseenBadge';
import { StatusBar } from './StatusBar';
import { PlayerStatsDisplay } from './PlayerStatsDisplay';
import { RecentActivities } from './RecentActivities';
import { ActiveChallenges } from './ActiveChallenges';
import { ActiveTournamentCard } from './ActiveTournamentCard';
import { UpcomingTeamMatchCard } from './UpcomingTeamMatchCard';
import { TrainingResultModal } from './TrainingResultModal';
import { StoryEventModal } from './StoryEventModal';
import { StoryEventResultModal } from './StoryEventResultModal';
import { derivePlayStyle } from '../core/PlayerProfile';
import { getArchetypeLabel } from '../data/archetypes';
import type { OverlayState } from '../types/gamePhase';
import { TimeSlot, PlayerFlag } from '../types/game';
import { StoryMatchManager } from '../game/StoryMatchManager';
import { CHARACTERS } from '../data/characters';
import { HANGOUT_CHARACTERS, HANGOUT_ENERGY_COST } from '../data/hangoutCharacters';
import { Modal } from './ui/Modal';

interface MainMenuProps {
  overlay: OverlayState | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({ overlay }) => {
  const isMobile = useIsMobile();
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const navigateToScheduledMatch = useGameStore((state) => state.navigateToScheduledMatch);
  const rest = useGameStore((state) => state.rest);
  const relationships = useGameStore((state) => state.relationships);
  const hangoutWithCharacter = useGameStore((state) => state.hangoutWithCharacter);
  const [showHangoutModal, setShowHangoutModal] = useState(false);

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
  const clearIndicator = useGameStore((state) => state.clearIndicator);

  // Check for unseen training
  const hasUnseenTraining = (player?.activeIndicators ?? []).includes('training');

  // Check for unseen shop
  const hasUnseenShop = (player?.activeIndicators ?? []).includes('shop');

  // Check for unseen inventory indicator
  const hasUnseenInventory = (player?.activeIndicators ?? []).includes('inventory');

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

  // Key characters that the player has met, for the hang out modal
  const metHangoutCharacters = Object.keys(HANGOUT_CHARACTERS).filter(
    (id) => id in relationships
  );

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

        {/* Activities Grid — 3 cards */}
        {(() => {
          const isMatchScheduled = isTournamentMatchScheduled || isStoryMatchScheduled;
          const isBlocked = isEventPending || isMatchScheduled;
          const canAffordMatch = currentStatus.energy >= 50;
          const canAffordHangout = currentStatus.energy >= HANGOUT_ENERGY_COST;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

              {/* Card 1: Play */}
              <Card padding="md" className="flex flex-col">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3 relative inline-block">
                    🎾
                    {hasUnseenTraining && (
                      <UnseenBadge className="absolute -top-2 -right-4" />
                    )}
                  </div>
                  <h2 className="text-lg lg:text-2xl font-bold text-pixel-text mb-2">Play</h2>
                  <p className="text-sm text-pixel-text-muted mb-3">Train your skills or compete in a match</p>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isBlocked || isNightTime}
                    onClick={() => navigateTo('training')}
                  >
                    {isBlocked ? (isEventPending ? 'Event Pending' : 'Match Scheduled') : isNightTime ? 'Night Time' : 'Training'}
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isBlocked || isNightTime || !matchUnlocked || !canAffordMatch}
                    onClick={() => navigateTo('match_setup')}
                  >
                    {!matchUnlocked
                      ? 'Unlocks Day 5'
                      : isBlocked
                        ? (isEventPending ? 'Event Pending' : 'Match Scheduled')
                        : isNightTime
                          ? 'Night Time'
                          : !canAffordMatch
                            ? 'Not Enough Energy'
                            : 'Play Match'}
                  </Button>
                </div>
              </Card>

              {/* Card 2: Rest & Social */}
              <Card padding="md" className={`flex flex-col ${isNightTime ? 'night-exempt' : ''}`}>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">😴</div>
                  <h2 className="text-lg lg:text-2xl font-bold text-pixel-text mb-2">Rest & Social</h2>
                  <p className="text-sm text-pixel-text-muted mb-3">Recover energy or spend time with someone</p>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <Button
                    variant={isNightTime ? 'success' : 'primary'}
                    fullWidth
                    onClick={() => rest()}
                  >
                    {isNightTime ? 'Next Day' : 'Rest'}
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isBlocked || isNightTime || !canAffordHangout || metHangoutCharacters.length === 0}
                    onClick={() => setShowHangoutModal(true)}
                  >
                    {metHangoutCharacters.length === 0
                      ? 'No One to Hang Out With'
                      : isBlocked
                        ? (isEventPending ? 'Event Pending' : 'Match Scheduled')
                        : isNightTime
                          ? 'Night Time'
                          : !canAffordHangout
                            ? 'Not Enough Energy'
                            : 'Hang Out'}
                  </Button>
                </div>
              </Card>

              {/* Card 3: Gear */}
              <Card padding="md" className={`flex flex-col ${isNightTime ? 'night-exempt' : ''}`}>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">🎒</div>
                  <h2 className="text-lg lg:text-2xl font-bold text-pixel-text mb-2">Gear</h2>
                  <p className="text-sm text-pixel-text-muted mb-3">Manage your items, relationships, and shop</p>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <div className="relative">
                    {(hasUnseenInventory || hasUnseenItems) && (
                      <UnseenBadge className="absolute -top-2 -right-2 z-10" />
                    )}
                    <Button variant="primary" fullWidth onClick={() => { clearIndicator('inventory'); navigateTo('inventory'); }}>
                      Inventory
                    </Button>
                  </div>
                  <Button variant="primary" fullWidth onClick={() => navigateTo('relationships')}>
                    Relationships
                  </Button>
                  {calendar.currentDay >= 7 ? (
                    <div className="relative">
                      {hasUnseenShop && (
                        <UnseenBadge className="absolute -top-2 -right-2 z-10" />
                      )}
                      <Button variant="primary" fullWidth onClick={() => { clearIndicator('shop'); navigateTo('shop'); }}>
                        Shop
                      </Button>
                    </div>
                  ) : (
                    <Button variant="primary" fullWidth disabled>
                      Unlocks Day 7
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Hang Out Modal */}
        <Modal
          isOpen={showHangoutModal}
          onClose={() => setShowHangoutModal(false)}
          title="Hang Out With..."
          size="sm"
        >
          <div className="space-y-3">
            {metHangoutCharacters.map((characterId) => {
              const character = CHARACTERS[characterId];
              if (!character) return null;
              const relValue = relationships[characterId] ?? 0;
              const emoji =
                character.role === 'Coach' ? '👨‍🏫' :
                character.role === 'Rival' ? '⚔️' :
                character.role === 'Romance' ? '💖' :
                '🤝';
              return (
                <div key={characterId} className="flex items-center justify-between gap-3 p-3 bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <div className="font-bold text-pixel-text">{character.name}</div>
                      <div className="text-xs text-pixel-text-muted">
                        {relValue >= 0 ? '+' : ''}{relValue} relationship
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowHangoutModal(false);
                      hangoutWithCharacter(characterId);
                    }}
                  >
                    Go
                  </Button>
                </div>
              );
            })}
            <p className="text-xs text-pixel-text-muted text-center pt-1">
              Costs {HANGOUT_ENERGY_COST} energy · 1 timeslot
            </p>
          </div>
        </Modal>

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
    </div>
  );
};
