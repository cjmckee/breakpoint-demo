/**
 * Status Bar Component
 * Displays energy, mood, and time information
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { TimeManager } from '../game/TimeManager';

export const StatusBar: React.FC = () => {
  const { calendar, currentStatus, player } = useGameStore();

  const getMoodColor = (mood: number): string => {
    if (mood >= 50) return 'text-green-500';
    if (mood >= 0) return 'text-yellow-500';
    if (mood >= -50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getMoodLabel = (mood: number): string => {
    if (mood >= 75) return 'Excellent';
    if (mood >= 50) return 'Great';
    if (mood >= 25) return 'Good';
    if (mood >= 0) return 'Okay';
    if (mood >= -25) return 'Tired';
    if (mood >= -50) return 'Frustrated';
    if (mood >= -75) return 'Angry';
    return 'Furious';
  };

  const getEnergyColor = (energy: number): string => {
    if (energy >= 75) return 'bg-green-500';
    if (energy >= 50) return 'bg-yellow-500';
    if (energy >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const timeSlotNames = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return (
    <div className="bg-pixel-card border-b-4 border-pixel-border p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Player Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pixel-accent border-4 border-pixel-border flex items-center justify-center text-2xl">
              🎾
            </div>
            <div>
              <div className="text-sm text-pixel-text-muted">Player</div>
              <div className="font-bold text-pixel-text">{player?.name || 'Unknown'}</div>
            </div>
          </div>

          {/* Energy & Mood */}
          <div className="space-y-2">
            {/* Energy Bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-pixel-text">Energy</span>
                <span className="text-sm text-pixel-text-muted">
                  {currentStatus.energy}/100
                </span>
              </div>
              <div className="h-4 bg-pixel-bg border-2 border-pixel-border">
                <div
                  className={`h-full ${getEnergyColor(currentStatus.energy)} transition-all`}
                  style={{ width: `${currentStatus.energy}%` }}
                />
              </div>
            </div>

            {/* Mood */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-pixel-text">Mood</span>
              <span className={`text-sm font-bold ${getMoodColor(currentStatus.mood)}`}>
                {getMoodLabel(currentStatus.mood)} ({currentStatus.mood > 0 ? '+' : ''}
                {currentStatus.mood})
              </span>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pixel-secondary border-4 border-pixel-border flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <div className="text-sm text-pixel-text-muted">
                Season {calendar.currentSeason} - Day {calendar.currentDay}
              </div>
              <div className="font-bold text-pixel-text">
                {timeSlotNames[calendar.currentTimeSlot]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
