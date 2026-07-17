/**
 * Main Menu Component
 * Hub for player activities and navigation.
 *
 * Layout follows the cockpit philosophy: a hero header that defines the player at
 * a glance (name, OVR, archetype, core grades, recent matches), an action hub where the
 * daily actions (Training / Play Match / Rest) are the biggest targets with their
 * cost/state baked in, challenges surfaced right below the actions, and detail
 * panels (full stats, tournament, activity log) below the fold.
 */

import React, { JSX } from 'react';
import { useGameStore, defaultRestEnergy, defaultSleepBonus } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { EffectAggregator } from '../core/EffectAggregator';
import { Card } from './ui/Card';
import { ActionTile } from './ui/ActionTile';
import { UnseenBadge } from './ui/UnseenBadge';
import { StatusBar } from './StatusBar';
import { PlayerStatsDisplay } from './PlayerStatsDisplay';
import { ActiveTournamentCard } from './ActiveTournamentCard';
import { UpcomingTeamMatchCard } from './UpcomingTeamMatchCard';
import { TrainingResultModal } from './TrainingResultModal';
import { StoryEventModal } from './StoryEventModal';
import { StoryEventResultModal } from './StoryEventResultModal';
import { HangoutUnlockedModal } from './HangoutUnlockedModal';
import { BROAD_ARCHETYPE_LABELS, DEFAULT_ARCHETYPE_LABEL } from '../data/archetypeTree';
import { calculateOverallRating } from '../core/PlayerProfile';
import { getLetterGrade } from '../utils/playerStats';
import type { OverlayState } from '../types/gamePhase';
import { EffectKey, TimeSlot } from '../types/game';
import { HANGOUT_CHARACTERS, hasUnseenTierEvent } from '../data/hangoutCharacters';

interface MainMenuProps {
  overlay: OverlayState | null;
}

const MATCH_ENERGY_COST = 50;

export const MainMenu: React.FC<MainMenuProps> = ({ overlay }) => {
  const isMobile = useIsMobile();
  const player = useGameStore((state) => state.player);
  const currentStatus = useGameStore((state) => state.currentStatus);
  const calendar = useGameStore((state) => state.calendar);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const rest = useGameStore((state) => state.rest);
  const relationships = useGameStore((state) => state.relationships);
  const hangoutThresholdsSeen = useGameStore((state) => state.hangoutThresholdsSeen);
  const activeChallenges = useGameStore((state) => state.activeChallenges);

  // Tournament state
  const getScheduledTournamentMatch = useGameStore((state) => state.getScheduledTournamentMatch);

  // Story match state
  const getScheduledStoryMatch = useGameStore((state) => state.getScheduledStoryMatch);

  // Story event actions
  const executeStoryEvent = useGameStore((state) => state.executeStoryEvent);
  const cancelStoryEvent = useGameStore((state) => state.cancelStoryEvent);
  const getAvailableEventOptions = useGameStore((state) => state.getAvailableEventOptions);
  const dismissOverlay = useGameStore((state) => state.dismissOverlay);
  const dismissStoryEventResult = useGameStore((state) => state.dismissStoryEventResult);
  const dismissHangoutUnlock = useGameStore((state) => state.dismissHangoutUnlock);
  const clearIndicator = useGameStore((state) => state.clearIndicator);

  // Unseen-content indicators
  const hasUnseenTraining = (player?.activeIndicators ?? []).includes('training');
  const hasUnseenMatch = (player?.activeIndicators ?? []).includes('match');
  const hasUnseenShop = (player?.activeIndicators ?? []).includes('shop');
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
  const isMatchUnlocked = useGameStore((state) => state.isMatchUnlocked);
  const matchUnlocked = isMatchUnlocked();

  // Check if a story event overlay is active
  const isEventPending = overlay?.type === 'story_event';

  // Check if tournament match is scheduled for current time
  const scheduledTournamentMatch = getScheduledTournamentMatch();
  const isTournamentMatchScheduled = scheduledTournamentMatch !== null;

  // Check if story match is scheduled for current time
  const scheduledStoryMatch = getScheduledStoryMatch();
  const isStoryMatchScheduled = scheduledStoryMatch !== null;

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

  const overallRating = calculateOverallRating(player.stats);
  const archetypeLabel = player.archetypeProfile.broad
    ? BROAD_ARCHETYPE_LABELS[player.archetypeProfile.broad]
    : DEFAULT_ARCHETYPE_LABEL;

  // Key characters that the player has met, has hangout unlocked, AND have a new unseen tier event
  const hangoutsAvailable = calendar.currentDay >= 6;
  const metHangoutCharacters = hangoutsAvailable ? Object.keys(HANGOUT_CHARACTERS).filter(
    (id) =>
      id in relationships &&
      player.flags[`hangoutUnlocked_${id}`] === true &&
      hasUnseenTierEvent(id, relationships[id] ?? 0, hangoutThresholdsSeen)
  ) : [];

  const hasNewHangouts = metHangoutCharacters.length > 0;

  // Challenge summary for the menu strip — the full list lives on its own screen.
  const challengeCount = activeChallenges.length;
  const claimableCount = activeChallenges.filter((c) => c.status === 'completed').length;
  const hasUnseenChallenge = activeChallenges.some(
    (c) => !(player.seenChallengeIds ?? []).includes(c.id)
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

  // Core skills do the majority of the lifting in sim — they define the player at
  // a glance, so they live in the hero header as letter grades.
  const coreGlance = [
    { label: 'SRV', name: 'Serve', value: player.stats.core.serve },
    { label: 'FH', name: 'Forehand', value: player.stats.core.forehand },
    { label: 'BH', name: 'Backhand', value: player.stats.core.backhand },
    { label: 'RET', name: 'Return', value: player.stats.core.return },
    { label: 'SLC', name: 'Slice', value: player.stats.core.slice },
  ];

  // Action-hub state
  const isMatchScheduled = isTournamentMatchScheduled || isStoryMatchScheduled;
  const isBlocked = isEventPending || isMatchScheduled;
  const blockedReason = isEventPending ? 'Event pending' : 'Match scheduled';
  const canAffordMatch = currentStatus.energy >= MATCH_ENERGY_COST;
  const isEnergyFull = currentStatus.energy >= 100;
  const energyGainBonus = EffectAggregator.getEffect(
    EffectAggregator.getActiveEffects(player).effects,
    EffectKey.ENERGY_GAIN_BONUS
  );
  const restEnergyGain = defaultRestEnergy + energyGainBonus;
  const sleepEnergyGain = defaultRestEnergy + defaultSleepBonus + energyGainBonus;

  const trainingCaption = isBlocked ? blockedReason : isNightTime ? 'Asleep' : undefined;
  const matchCaption = !matchUnlocked
    ? 'Unlocks Day 5'
    : isBlocked
      ? blockedReason
      : isNightTime
        ? 'Asleep'
        : !canAffordMatch
          ? `Needs ${MATCH_ENERGY_COST} energy`
          : `${MATCH_ENERGY_COST} energy`;

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
      case 'hangout_unlock': {
        return (
          <HangoutUnlockedModal
            isOpen={true}
            characterId={overlay.characterId}
            hasMore={overlay.remaining.length > 0}
            onClose={dismissHangoutUnlock}
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

      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-8">
        {/* Hero Header: who the player is, at a glance */}
        <Card className="mb-6" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            {/* Identity */}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-pixel-text leading-tight truncate">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`text-sm font-bold ${getTierColor(player.tier)}`}>
                  {getTierName(player.tier)}
                </span>
                {player.archetypeProfile.broad ? (
                  <span className="relative inline-block">
                    {player.archetypeProfile.specializationPoints > 0 && (
                      <UnseenBadge size="sm" className="absolute -top-2 -right-2 z-10" />
                    )}
                    <button
                      onClick={() => navigateTo('archetype')}
                      className="text-sm px-2.5 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold hover:bg-opacity-40 transition-colors"
                      title="Open archetype tree"
                    >
                      {archetypeLabel} ▸
                    </button>
                  </span>
                ) : (
                  <span className="text-sm px-2.5 py-0.5 bg-pixel-accent bg-opacity-20 border border-pixel-accent text-pixel-accent font-bold">
                    {archetypeLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-pixel-text-muted">Matches:</span>
                {renderMatchRecord()}
              </div>
            </div>

            {/* Rating + core grades — ml-auto keeps this right-justified when it wraps
                to its own line on narrow viewports */}
            <div className="flex items-center gap-4 sm:gap-5 ml-auto">
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-5xl font-bold text-pixel-accent leading-none">
                  {overallRating}
                </span>
                <span className="text-[10px] text-pixel-text-muted uppercase tracking-wide mt-1">
                  Overall
                </span>
              </div>
              <div className="flex gap-2">
                {coreGlance.map(({ label, name, value }) => {
                  const { grade, color } = getLetterGrade(value);
                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center bg-pixel-bg border-2 border-pixel-border rounded px-1 py-1.5 w-10 sm:w-11"
                      title={`${name}: ${value}`}
                    >
                      <span className="text-base sm:text-lg font-bold leading-none" style={{ color }}>
                        {grade}
                      </span>
                      <span className="text-[8px] text-pixel-text-muted mt-1">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Hub — daily actions get the biggest targets */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <ActionTile
            icon="🏋️"
            label="Training"
            caption={trainingCaption}
            disabled={isBlocked || isNightTime}
            badge={hasUnseenTraining}
            onClick={() => navigateTo('training')}
          />
          <ActionTile
            icon="🎾"
            label="Play Match"
            caption={matchCaption}
            disabled={isBlocked || isNightTime || !matchUnlocked || !canAffordMatch}
            badge={hasUnseenMatch && matchUnlocked && !isBlocked && !isNightTime && canAffordMatch}
            onClick={() => navigateTo('match_setup')}
          />
          <ActionTile
            icon={isNightTime ? '🌙' : '😴'}
            label={isNightTime ? 'Sleep' : 'Rest'}
            caption={
              isNightTime
                ? `Next day · +${sleepEnergyGain} energy`
                : isEnergyFull
                  ? 'Energy full'
                  : `+${restEnergyGain} energy`
            }
            disabled={!isNightTime && isEnergyFull}
            variant={isNightTime ? 'success' : 'primary'}
            className={isNightTime ? 'night-exempt' : ''}
            onClick={() => rest()}
          />
        </div>
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 ${isNightTime ? 'night-exempt' : ''}`}>
          {/* "Relationships" is too wide for a third-width tile in the pixel font,
              so it takes the full first row on phones */}
          <ActionTile
            size="sm"
            variant="secondary"
            icon="🤝"
            label="Relationships"
            caption={hasNewHangouts ? 'New hangout!' : undefined}
            badge={hasNewHangouts}
            onClick={() => navigateTo('relationships')}
            className="col-span-2 sm:col-span-1"
          />
          <ActionTile
            size="sm"
            variant="secondary"
            icon="🎒"
            label="Inventory"
            badge={hasUnseenInventory || hasUnseenItems}
            onClick={() => { clearIndicator('inventory'); navigateTo('inventory'); }}
          />
          <ActionTile
            size="sm"
            variant="secondary"
            icon="🛒"
            label="Shop"
            caption={calendar.currentDay < 7 ? 'Unlocks Day 7' : undefined}
            disabled={calendar.currentDay < 7}
            badge={hasUnseenShop && calendar.currentDay >= 7}
            onClick={() => { clearIndicator('shop'); navigateTo('shop'); }}
          />
        </div>

        {/* Challenges — compact summary strip; the full list lives on its own screen */}
        <button
          onClick={() => navigateTo('challenges')}
          className="w-full mb-6 flex items-center gap-3 bg-pixel-card border-4 border-pixel-border hover:border-pixel-accent px-4 py-3 transition-colors text-left"
        >
          <span className="text-2xl relative shrink-0">
            📋
            {hasUnseenChallenge && (
              <UnseenBadge size="sm" className="absolute -top-2 -right-2" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-pixel-text">Challenges</div>
            <div className="text-xs text-pixel-text-muted">
              {challengeCount === 0
                ? 'No active challenges — new quests appear as you play'
                : `${challengeCount} active${claimableCount > 0 ? '' : ' · in progress'}`}
            </div>
          </div>
          {claimableCount > 0 && (
            <span className="shrink-0 text-xs font-bold px-2 py-1 bg-green-500 bg-opacity-20 border border-green-500 text-green-500">
              {claimableCount} ready to collect
            </span>
          )}
          <span className="text-pixel-text-muted shrink-0">▸</span>
        </button>

        {/* Active tournament / upcoming team match — self-hide when inactive, so the
            wrapper collapses (empty:hidden) rather than leaving a gap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 empty:hidden">
          <ActiveTournamentCard />
          <UpcomingTeamMatchCard />
        </div>

        {/* Full-width player stats */}
        <PlayerStatsDisplay collapsible={true} defaultCollapsed={isMobile} />
      </div>

      {/* Overlay Renderer */}
      {renderOverlay()}
    </div>
  );
};
