/**
 * Season check — does the calendar count seasons the way content expects?
 *
 * Each tier is one season, and its story is written on season days ("day 15:
 * the first team match"). That only works if three things hold, and each of
 * them is easy to break without any screen looking wrong:
 *
 *   - the career day never resets, so scheduled events and unlock gates keep
 *     counting (it used to reset at day 90, which would have broken the Tour);
 *   - a promotion starts the next season the following morning, with its beats
 *     on the right calendar days, while the promotion day stays in the old one;
 *   - story `minDay`/`maxDay` read the season day, not the career day.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/seasonCheck.ts
 */

import type { GameCalendar, SeasonSchedule } from '../types/game';
import { DEFAULT_CALENDAR, TimeSlot } from '../types/game';
import { TimeManager } from '../game/TimeManager';
import { SeasonManager } from '../game/SeasonManager';
import { PrerequisiteChecker } from '../game/PrerequisiteChecker';
import { CLUB_SEASON } from '../data/seasons/club';
import { SEASON_SCHEDULES } from '../data/seasons';
import { StoryEventRepository } from '../data/storyEvents';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

function onDay(day: number, overrides: Partial<GameCalendar> = {}): GameCalendar {
  return { ...DEFAULT_CALENDAR, currentDay: day, ...overrides };
}

function nextMorning(calendar: GameCalendar): GameCalendar {
  return TimeManager.advanceDay({ ...calendar, currentTimeSlot: TimeSlot.NIGHT });
}

console.log('── the career day never resets ──');
{
  const day91 = nextMorning(onDay(90));
  check(
    'day 90 is followed by day 91 in the same season',
    day91.currentDay === 91 && day91.currentSeason === 1,
    JSON.stringify({ day: day91.currentDay, season: day91.currentSeason }),
  );
  check('a new career is on season day 1', TimeManager.seasonDay(DEFAULT_CALENDAR) === 1);
}

console.log('\n── the Club season ──');
{
  check(
    'every beat names a story event that exists',
    CLUB_SEASON.beats.every((b) => StoryEventRepository.getEventById(b.storyEventId)),
    CLUB_SEASON.beats
      .filter((b) => !StoryEventRepository.getEventById(b.storyEventId))
      .map((b) => b.storyEventId)
      .join(', '),
  );
  const events = SeasonManager.scheduleSeason(CLUB_SEASON, 1);
  const prep = events.find(
    (e) =>
      e.metadata !== undefined &&
      'storyEventId' in e.metadata &&
      e.metadata.storyEventId === 'riverside_open_prep',
  );
  check(
    'a season starting on day 1 puts its day-33 beat on day 33',
    prep?.scheduledDay === 33 && prep.scheduledTimeSlot === TimeSlot.MORNING,
  );
}

console.log('\n── promotion starts the next season the next morning ──');
{
  const promotionDay = onDay(42, { currentTimeSlot: TimeSlot.AFTERNOON });
  const { calendar: queued, events } = SeasonManager.promote(promotionDay, 2);
  check(
    'the promotion day still belongs to the old season',
    queued.currentSeason === 1 && TimeManager.seasonDay(queued) === 42,
  );
  check('the next morning reads as tomorrow, day 1', TimeManager.seasonDayOf(queued, 43) === 1);

  const morning = nextMorning(queued);
  check(
    'the next morning is season 2, day 1',
    morning.currentSeason === 2 &&
      TimeManager.seasonDay(morning) === 1 &&
      morning.currentDay === 43,
    JSON.stringify({ season: morning.currentSeason, day: morning.currentDay }),
  );
  check('the queued season is cleared once it begins', morning.upcomingSeason === null);
  check(
    'a tier with no written season adds no events',
    SEASON_SCHEDULES[2] !== undefined || events.length === 0,
  );

  const regional: SeasonSchedule = {
    tier: 2,
    beats: [{ day: 15, slot: TimeSlot.AFTERNOON, storyEventId: 'some_team_match' }],
  };
  const placed = SeasonManager.scheduleSeason(regional, 43)[0];
  check(
    "a season that starts on day 43 puts its day-15 beat on the career's day 57",
    placed.scheduledDay === 57 && placed.scheduledTimeSlot === TimeSlot.AFTERNOON,
    String(placed.scheduledDay),
  );

  const later = nextMorning(nextMorning(morning));
  check(
    'season days keep counting after the start',
    TimeManager.seasonDay(later) === 3 && later.currentDay === 45,
  );
}

console.log('\n── story days are season days ──');
{
  const season2day10 = onDay(52, { currentSeason: 2, seasonStartDay: 43 });
  check(
    'minDay 10 is met on season 2, day 10 (career day 52)',
    PrerequisiteChecker.checkTimePrerequisites(season2day10, { minDay: 10 }),
  );
  check(
    'minDay 11 is not met on season 2, day 10',
    !PrerequisiteChecker.checkTimePrerequisites(season2day10, { minDay: 11 }),
  );
  check(
    'maxDay 1 is met again on the first day of a season',
    PrerequisiteChecker.checkTimePrerequisites(onDay(43, { seasonStartDay: 43 }), { maxDay: 1 }),
  );
}

if (failures > 0) {
  console.log(`\n❌ ${failures} season check(s) failed`);
  process.exit(1);
}
console.log('\n✅ all season checks passed');
