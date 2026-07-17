/**
 * Upcoming Team Match Card Component
 * Flat banner strip on the main menu — mirrors the challenges strip's shape so it
 * stays short and doesn't push the stats section down.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { StoryMatchManager } from '../game/StoryMatchManager';

export const UpcomingTeamMatchCard: React.FC = () => {
  const calendar = useGameStore((state) => state.calendar);
  const scheduledEvents = calendar.scheduledEvents;

  // Find the next upcoming story_match (not necessarily today)
  const nextTeamMatch = scheduledEvents.find(
    (event) =>
      event.eventType === 'story_match' &&
      (event.scheduledDay > calendar.currentDay ||
        (event.scheduledDay === calendar.currentDay &&
          event.scheduledTimeSlot >= calendar.currentTimeSlot))
  );

  if (!nextTeamMatch) {
    return null;
  }

  const metadata = StoryMatchManager.getStoryMatchMetadata(nextTeamMatch);
  if (!metadata) {
    return null;
  }

  const daysUntil = nextTeamMatch.scheduledDay - calendar.currentDay;

  const getTimeSlotLabel = (slot: number): string => {
    switch (slot) {
      case 0: return 'Morning';
      case 1: return 'Afternoon';
      case 2: return 'Evening';
      default: return 'Unknown';
    }
  };

  const getSurfaceEmoji = (surface?: string): string => {
    switch (surface) {
      case 'hard': return '🏟️';
      case 'clay': return '🧱';
      case 'grass': return '🌱';
      case 'carpet': return '📋';
      default: return '🎾';
    }
  };

  const scheduleLabel =
    daysUntil === 0
      ? `${getTimeSlotLabel(nextTeamMatch.scheduledTimeSlot)} session`
      : daysUntil === 1
        ? `Tomorrow — ${getTimeSlotLabel(nextTeamMatch.scheduledTimeSlot)}`
        : `In ${daysUntil} days — ${getTimeSlotLabel(nextTeamMatch.scheduledTimeSlot)}`;

  // One-line detail: surface, format, and when the match happens
  const detailParts = [
    `${getSurfaceEmoji(metadata.surface)} ${metadata.surface?.toUpperCase() || 'TBD'}`,
    metadata.matchFormat,
    scheduleLabel,
  ].filter(Boolean);

  return (
    <div className="w-full flex items-center gap-3 border-4 border-purple-400 bg-purple-500 bg-opacity-10 px-4 py-3">
      <span className="text-2xl shrink-0">{getSurfaceEmoji(metadata.surface)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-pixel-text truncate">
          {metadata.matchTitle || 'Team Match'}
          <span className="ml-2 text-xs font-normal text-purple-400">
            vs {metadata.opponentName}
          </span>
        </div>
        <div className="text-xs text-pixel-text-muted truncate">
          {detailParts.join(' · ')}
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold px-2 py-1 bg-purple-500 bg-opacity-20 border border-purple-400 text-purple-400">
        {daysUntil === 0 ? '⚡ Today' : `${daysUntil}d`}
      </span>
    </div>
  );
};
