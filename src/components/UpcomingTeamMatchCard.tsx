/**
 * Upcoming Team Match Card Component
 * Shows an upcoming story_match (team match) with opponent info on the main menu
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { StoryMatchManager } from '../game/StoryMatchManager';
import { Card } from './ui/Card';

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

  return (
    <Card title="Team Match" className="border-4 border-purple-400 bg-purple-500 bg-opacity-10">
      <div className="space-y-3">
        {/* Match Header */}
        <div>
          <div className="text-2xl font-bold text-pixel-text mb-1">
            {metadata.matchTitle || 'Team Match'}
          </div>
          {metadata.matchDescription && (
            <div className="text-sm text-pixel-text-muted">
              {metadata.matchDescription}
            </div>
          )}
        </div>

        {/* Opponent */}
        <div className="p-3 bg-pixel-card border-2 border-purple-400">
          <div className="text-xs text-pixel-text-muted mb-1">Opponent:</div>
          <div className="text-lg font-bold text-pixel-text">
            {metadata.opponentName}
          </div>
          {metadata.opponentDescription && (
            <div className="text-xs text-pixel-text-muted">
              {metadata.opponentDescription}
            </div>
          )}
        </div>

        {/* Match Details */}
        <div className="p-3 bg-pixel-bg border-2 border-pixel-border">
          <div className="flex justify-between items-center">
            <span className="text-pixel-text-muted text-sm">Surface:</span>
            <span className="text-pixel-text font-bold">
              {getSurfaceEmoji(metadata.surface)} {metadata.surface?.toUpperCase() || 'TBD'}
            </span>
          </div>
          {metadata.matchFormat && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-pixel-text-muted text-sm">Format:</span>
              <span className="text-pixel-text font-bold text-sm">{metadata.matchFormat}</span>
            </div>
          )}
        </div>

        {/* Schedule Info */}
        <div className="p-3 bg-purple-500 bg-opacity-10 border-2 border-purple-400">
          <div className="text-xs text-purple-400 font-bold mb-1">
            {daysUntil === 0 ? '⚡ Match Today!' : '📅 Match Scheduled'}
          </div>
          <div className="text-sm text-pixel-text">
            {daysUntil === 0
              ? `${getTimeSlotLabel(nextTeamMatch.scheduledTimeSlot)} session`
              : daysUntil === 1
                ? `Tomorrow — ${getTimeSlotLabel(nextTeamMatch.scheduledTimeSlot)}`
                : `In ${daysUntil} days — ${getTimeSlotLabel(nextTeamMatch.scheduledTimeSlot)}`}
          </div>
        </div>
      </div>
    </Card>
  );
};
