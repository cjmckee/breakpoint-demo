/**
 * Random story events: when the roll may fire one.
 *
 * - Nothing random fires until the tutorial week is over (RANDOM_EVENTS_AFTER).
 * - After it, an event that takes time fires in any free slot it fits in, even on a
 *   day with a match or a beat scheduled later; only a tournament holds them off.
 * - No story event takes more than one slot, so every one fits beside a schedule.
 *
 * Run: npx tsx src/test/randomEventCheck.ts
 */

import type { GameCalendar } from '../types/game';
import { DEFAULT_CALENDAR, TimeSlot } from '../types/game';
import { RANDOM_EVENTS_AFTER, StoryEventManager } from '../game/StoryEventManager';
import { PlayerManager } from '../game/PlayerManager';
import { StoryEventRepository } from '../data/storyEvents';
import { TEAM_MATCH_1, buildStoryMatchMetadata } from '../data/teamMatches';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

const quiet = console.log;
const silently = <T>(fn: () => T): T => {
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = quiet;
  }
};

const player = { ...PlayerManager.createPlayer('Check'), level: 5 };
/** Day 9 morning, a team match scheduled for the afternoon. */
const busyMorning: GameCalendar = {
  ...DEFAULT_CALENDAR,
  currentDay: 9,
  currentTimeSlot: TimeSlot.MORNING,
  scheduledEvents: [
    {
      eventType: 'story_match',
      scheduledDay: 9,
      scheduledTimeSlot: TimeSlot.AFTERNOON,
      metadata: buildStoryMatchMetadata(TEAM_MATCH_1),
    },
  ],
};
const pool = (completed: string[], calendar: GameCalendar, tournament = false) =>
  silently(() =>
    StoryEventManager.getAllEligibleEvents(player, {
      completedStoryEvents: completed,
      completedStoryEventChoices: {},
      relationships: {},
      calendar,
      activeTournament: tournament
        ? { tournamentId: 'riverside_open', currentRound: 0, currentBracket: 'main' }
        : null,
    } as Parameters<typeof StoryEventManager.getAllEligibleEvents>[1]),
  );
const takesTime = (events: { timeSlotsRequired: number }[]) =>
  events.filter((e) => e.timeSlotsRequired > 0).length;

console.log('── the tutorial week ──');
check(
  `nothing random fires before ${RANDOM_EVENTS_AFTER}`,
  pool([], { ...DEFAULT_CALENDAR, currentDay: 9 }).length === 0,
);

console.log('\n── busy days ──');
{
  const done = [RANDOM_EVENTS_AFTER];
  const free = takesTime(pool(done, { ...busyMorning, scheduledEvents: [] }));
  const busy = takesTime(pool(done, busyMorning));
  check('events that take time are in the pool on a free morning', free > 0, `${free}`);
  check('and still are on the morning of a team match', busy === free, `${busy} of ${free}`);
  check(
    'a tournament holds back events that take time',
    takesTime(pool(done, busyMorning, true)) === 0,
  );
}

console.log('\n── every event fits one slot ──');
{
  const long = StoryEventRepository.getAllEvents().filter((e) => e.timeSlotsRequired > 1);
  check(
    'no story event takes more than one slot',
    long.length === 0,
    long.map((e) => e.id).join(', '),
  );
}

console.log(failures === 0 ? '\n✅ all random event checks passed' : `\n❌ ${failures} failed`);
if (failures > 0) process.exit(1);
