/**
 * Status Bar Component
 * Compact game-progression strip: calendar/day, time-slot pips, energy, and mood.
 * The player's name lives in the MainMenu hero header, not here.
 *
 * Subpages (training, shop, ...) pass `onBack` to get a consistent back control
 * plus the energy/time context right where spending decisions happen.
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMenuStore } from '../hooks/useMenuModal';
import { audioManager } from '../audio/AudioManager';
import { UnseenBadge } from './ui/UnseenBadge';

const TIME_SLOTS = [
  { name: 'Morning', emoji: '🌅' },
  { name: 'Afternoon', emoji: '☀️' },
  { name: 'Evening', emoji: '🌇' },
  { name: 'Night', emoji: '🌙' },
];

const getMoodDisplay = (mood: number): { label: string; emoji: string; color: string } => {
  if (mood >= 75) return { label: 'Excellent', emoji: '😄', color: 'text-green-500' };
  if (mood >= 50) return { label: 'Great', emoji: '😊', color: 'text-green-500' };
  if (mood >= 25) return { label: 'Good', emoji: '🙂', color: 'text-yellow-500' };
  if (mood >= 0) return { label: 'Okay', emoji: '😐', color: 'text-yellow-500' };
  if (mood >= -25) return { label: 'Tired', emoji: '😕', color: 'text-orange-500' };
  if (mood >= -50) return { label: 'Frustrated', emoji: '😖', color: 'text-orange-500' };
  if (mood >= -75) return { label: 'Angry', emoji: '😠', color: 'text-red-500' };
  return { label: 'Furious', emoji: '😡', color: 'text-red-500' };
};

const getEnergyColor = (energy: number): string => {
  if (energy >= 75) return 'bg-green-500';
  if (energy >= 50) return 'bg-yellow-500';
  if (energy >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

interface StatusBarProps {
  /** When set, renders a back button on the left (subpage mode) */
  onBack?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ onBack }) => {
  const { calendar, currentStatus, player } = useGameStore();
  const clearIndicator = useGameStore((state) => state.clearIndicator);
  const openCalendar = useMenuStore((state) => state.openCalendar);

  const hasUnseenEvents = (player?.activeIndicators ?? []).includes('calendar');
  const mood = getMoodDisplay(currentStatus.mood);
  const currentSlot = calendar.currentTimeSlot;

  return (
    <div className="bg-pixel-card border-b-4 border-pixel-border px-4 py-2.5 mb-6">
      <div className="max-w-7xl mx-auto flex items-center gap-x-3 sm:gap-x-5">
        {/* Back (subpage mode) */}
        {onBack && (
          <button
            onClick={() => {
              audioManager.playSfx('ui_click');
              onBack();
            }}
            className="flex items-center gap-1.5 text-sm font-bold text-pixel-text border-2 border-pixel-border bg-pixel-secondary px-2.5 py-1 hover:bg-pixel-secondary-light transition-colors whitespace-nowrap"
            title="Back to menu"
          >
            ← Back
          </button>
        )}

        {/* Calendar / day */}
        <button
          onClick={() => {
            openCalendar();
            clearIndicator('calendar');
          }}
          className="flex items-center gap-2 cursor-pointer hover:bg-pixel-secondary/50 rounded px-1.5 py-1 -my-1 -ml-1.5 transition-colors"
          title="Open calendar"
        >
          <span className="relative text-xl leading-none">
            📅
            {hasUnseenEvents && <UnseenBadge size="sm" className="absolute -top-2 -right-3" />}
          </span>
          <span className="hidden sm:inline text-sm font-bold text-pixel-text whitespace-nowrap">
            S{calendar.currentSeason} · Day {calendar.currentDay}
          </span>
        </button>

        {/* Time-slot pips: past slots dimmed, current highlighted */}
        <div className="flex items-center gap-1.5" aria-label={`Current time: ${TIME_SLOTS[currentSlot]?.name ?? 'Unknown'}`}>
          {TIME_SLOTS.map((slot, i) => (
            <span
              key={slot.name}
              title={slot.name}
              className={`flex items-center justify-center w-7 h-7 rounded border-2 text-sm leading-none transition-all ${
                i === currentSlot
                  ? 'border-pixel-accent bg-pixel-secondary scale-110'
                  : i < currentSlot
                    ? 'border-transparent opacity-30 grayscale'
                    : 'border-pixel-border opacity-70'
              }`}
            >
              {slot.emoji}
            </span>
          ))}
          <span className="hidden sm:inline text-sm font-bold text-pixel-text ml-1 whitespace-nowrap">
            {TIME_SLOTS[currentSlot]?.name}
          </span>
        </div>

        {/* Energy */}
        <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[150px]">
          <span className="text-sm leading-none" title="Energy">⚡</span>
          <div className="flex-1 h-3.5 bg-pixel-bg border-2 border-pixel-border">
            <div
              className={`h-full ${getEnergyColor(currentStatus.energy)} transition-all`}
              style={{ width: `${currentStatus.energy}%` }}
            />
          </div>
          <span className="text-sm font-bold text-pixel-text whitespace-nowrap">
            {currentStatus.energy}<span className="hidden sm:inline text-pixel-text-muted font-normal">/100</span>
          </span>
        </div>

        {/* Mood */}
        <div className="flex items-center gap-1.5" title={`Mood: ${currentStatus.mood}`}>
          <span className="text-base leading-none">{mood.emoji}</span>
          <span className={`hidden sm:inline text-sm font-bold ${mood.color} whitespace-nowrap`}>{mood.label}</span>
        </div>
      </div>
    </div>
  );
};
