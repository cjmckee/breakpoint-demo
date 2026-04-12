/**
 * Calendar View Component
 * 7-day lookahead modal showing scheduled events across time slots
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { CalendarService } from '../game/CalendarService';
import { TimeSlot } from '../types/game';
import type { ScheduledEvent } from '../types/game';
import type { TournamentMatchMetadata } from '../types/tournaments';
import { Modal } from './ui/Modal';

interface CalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventDisplay {
  icon: string;
  label: string;
  colorClass: string;
}

const TIME_SLOT_LABELS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const TIME_SLOT_SHORT = ['AM', 'PM', 'Eve', 'Night'];

function getEventDisplay(event: ScheduledEvent): EventDisplay {
  switch (event.eventType) {
    case 'tournament_match': {
      const meta = event.metadata as TournamentMatchMetadata | undefined;
      const label = meta?.roundNumber != null
        ? `Tournament R${meta.roundNumber + 1}`
        : 'Tournament';
      return { icon: '🏆', label, colorClass: 'bg-yellow-500/20 border-yellow-400' };
    }
    case 'story_match': {
      const meta = event.metadata as { opponentName?: string } | undefined;
      const label = meta?.opponentName
        ? `vs ${meta.opponentName}`
        : 'Team Match';
      return { icon: '⚔️', label, colorClass: 'bg-purple-500/20 border-purple-400' };
    }
    case 'story':
      return { icon: '📖', label: 'Story Event', colorClass: 'bg-blue-500/20 border-blue-400' };
    case 'training':
      return { icon: '🏋️', label: 'Training', colorClass: 'bg-green-500/20 border-green-400' };
    case 'rest':
      return { icon: '😴', label: 'Rest', colorClass: 'bg-gray-500/20 border-gray-400' };
  }
}

function getDayLabel(day: number, currentDay: number): string {
  if (day === currentDay) return 'Today';
  if (day === currentDay + 1) return 'Tomorrow';
  return `Day ${day}`;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ isOpen, onClose }) => {
  const calendar = useGameStore((state) => state.calendar);

  const days = Array.from({ length: 7 }, (_, i) => calendar.currentDay + i);
  const slots = [TimeSlot.MORNING, TimeSlot.AFTERNOON, TimeSlot.EVENING, TimeSlot.NIGHT];

  // Build a lookup: day -> slot -> event
  const eventMap = new Map<string, ScheduledEvent>();
  for (const day of days) {
    const events = CalendarService.getEventsForDay(calendar, day);
    for (const event of events) {
      eventMap.set(`${day}-${event.scheduledTimeSlot}`, event);
    }
  }

  const isPast = (day: number, slot: TimeSlot): boolean => {
    if (day < calendar.currentDay) return true;
    if (day === calendar.currentDay && slot < calendar.currentTimeSlot) return true;
    return false;
  };

  const isCurrent = (day: number, slot: TimeSlot): boolean => {
    return day === calendar.currentDay && slot === calendar.currentTimeSlot;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule" size="lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-bold text-pixel-text-muted w-24" />
              {slots.map((slot) => (
                <th
                  key={slot}
                  className="p-2 text-center text-sm font-bold text-pixel-text-muted"
                >
                  <span className="hidden sm:inline">{TIME_SLOT_LABELS[slot]}</span>
                  <span className="sm:hidden">{TIME_SLOT_SHORT[slot]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isToday = day === calendar.currentDay;
              return (
                <tr
                  key={day}
                  className={isToday ? 'bg-pixel-secondary/30' : ''}
                >
                  <td className="p-2 text-sm font-bold text-pixel-text whitespace-nowrap">
                    {getDayLabel(day, calendar.currentDay)}
                  </td>
                  {slots.map((slot) => {
                    const event = eventMap.get(`${day}-${slot}`);
                    const past = isPast(day, slot);
                    const current = isCurrent(day, slot);
                    const isNight = slot === TimeSlot.NIGHT;

                    return (
                      <td key={slot} className="p-1">
                        <div
                          className={`
                            h-14 border-2 flex items-center justify-center text-xs p-1 transition-all
                            ${current
                              ? 'border-pixel-accent bg-pixel-accent/10 ring-2 ring-pixel-accent/40'
                              : event
                                ? `border-l-4 ${getEventDisplay(event).colorClass} border`
                                : isNight
                                  ? 'border-dashed border-pixel-border/30 bg-pixel-bg/50'
                                  : 'border-dashed border-pixel-border/50'
                            }
                            ${past ? 'opacity-40' : ''}
                          `}
                        >
                          {current && !event && (
                            <span className="text-pixel-accent font-bold text-xs">NOW</span>
                          )}
                          {event && (
                            <div className="flex flex-col items-center gap-0.5 text-center">
                              <span className="text-base leading-none">{getEventDisplay(event).icon}</span>
                              <span className="text-pixel-text font-medium leading-tight line-clamp-2">
                                {getEventDisplay(event).label}
                              </span>
                            </div>
                          )}
                          {!event && isNight && !current && (
                            <span className="text-pixel-text-muted text-xs">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-pixel-border/30 flex flex-wrap gap-3 text-xs text-pixel-text-muted">
        <span>🏆 Tournament</span>
        <span>⚔️ Team Match</span>
        <span>📖 Story</span>
        <span>🏋️ Training</span>
        <span>😴 Rest</span>
      </div>
    </Modal>
  );
};
