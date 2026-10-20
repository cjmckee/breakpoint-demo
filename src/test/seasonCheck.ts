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
 * It also pins the two story gates seasons need: a tier range, so Club events
 * stop at Regional (every event written so far is the Club season's), and repeatable events, so a promotion playoff can be lost
 * and come round again. And the playoff itself: each loss schedules the same
 * match again a few days on, with that attempt's loss event, and every playoff
 * a tier-final names exists, with the events it plays more than once repeatable.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/seasonCheck.ts
 */

import type { GameCalendar, PlayoffConfig, SeasonSchedule } from '../types/game';
import { DEFAULT_CALENDAR, TimeSlot } from '../types/game';
import { TimeManager } from '../game/TimeManager';
import { SeasonManager } from '../game/SeasonManager';
import { PrerequisiteChecker } from '../game/PrerequisiteChecker';
import { StoryEventManager } from '../game/StoryEventManager';
import { CLUB_SEASON } from '../data/seasons/club';
import { DRAFT_SEASONS, SEASON_SCHEDULES } from '../data/seasons';
import { StoryEventRepository } from '../data/storyEvents';
import { hasUnseenTierEvent } from '../data/hangoutCharacters';
import { PlayoffManager } from '../game/PlayoffManager';
import { PLAYOFFS, getPlayoff } from '../data/playoffs';
import { TEAM_MATCH_1 } from '../data/teamMatches';
import { TournamentRegistry } from '../data/tournaments';

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

const unwritten = (schedule: SeasonSchedule): string[] =>
  schedule.beats.map((b) => b.storyEventId).filter((id) => !StoryEventRepository.getEventById(id));

console.log('\n── every season that is scheduled is written ──');
for (const schedule of Object.values(SEASON_SCHEDULES)) {
  check(
    `tier ${schedule.tier}: every beat names a story event that exists`,
    unwritten(schedule).length === 0,
    unwritten(schedule).join(', '),
  );
  check(
    `tier ${schedule.tier}: beats are in season-day order`,
    schedule.beats.every((b, i) => i === 0 || schedule.beats[i - 1].day <= b.day),
  );
}
for (const schedule of Object.values(DRAFT_SEASONS)) {
  check(
    `tier ${schedule.tier} is drafted, not scheduled`,
    SEASON_SCHEDULES[schedule.tier] === undefined,
  );
  const todo = unwritten(schedule);
  console.log(
    `  info  tier ${schedule.tier} draft: ${schedule.beats.length - todo.length} of ` +
      `${schedule.beats.length} beats written${todo.length ? `; to write: ${todo.join(', ')}` : ''}`,
  );
}

console.log('\n── the Club season ──');
{
  const events = SeasonManager.scheduleSeason(CLUB_SEASON, 1);
  const prep = events.find(
    (e) =>
      e.metadata !== undefined &&
      'storyEventId' in e.metadata &&
      e.metadata.storyEventId === 'riverside_open_prep',
  );
  check(
    'a season starting on day 1 puts its day-28 beat on day 28',
    prep?.scheduledDay === 28 && prep.scheduledTimeSlot === TimeSlot.MORNING,
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

console.log('\n── tier gating and repeatable events ──');
{
  check('no tier range admits any tier', PrerequisiteChecker.checkTierPrerequisites(3, undefined));
  check(
    'a Club-only event still fires at Club',
    PrerequisiteChecker.checkTierPrerequisites(1, { max: 1 }),
  );
  check(
    'a Club-only event stops at Regional',
    !PrerequisiteChecker.checkTierPrerequisites(2, { max: 1 }),
  );
  check(
    'a Tour event waits for the Tour',
    !PrerequisiteChecker.checkTierPrerequisites(2, { min: 3 }) &&
      PrerequisiteChecker.checkTierPrerequisites(3, { min: 3 }),
  );

  const anyEvent = StoryEventRepository.getAllEvents()[0];
  const completed = [anyEvent.id];
  check(
    'an ordinary event is used up once it has run',
    StoryEventManager.isUsedUp({ ...anyEvent, repeatable: undefined }, completed),
  );
  check(
    'a repeatable event can run again',
    !StoryEventManager.isUsedUp({ ...anyEvent, repeatable: true }, completed),
  );
  check('an event that has never run is not used up', !StoryEventManager.isUsedUp(anyEvent, []));
}

console.log('\n── Club content stays in the Club season ──');
{
  const ungated = StoryEventRepository.getAllEvents().filter((e) => !e.prerequisites.tier);
  check(
    'every written event names a tier, except the end card after promotion',
    ungated.every((e) => e.id === 'thanks_for_playing'),
    ungated.map((e) => e.id).join(', '),
  );
  const clubOnly = StoryEventRepository.getAllEvents().filter(
    (e) => e.prerequisites.tier?.max === 1,
  );
  check(
    'none of the Club events can fire at Regional',
    clubOnly.length > 0 &&
      clubOnly.every((e) => !PrerequisiteChecker.checkTierPrerequisites(2, e.prerequisites.tier)),
  );
  check(
    'a Club hangout is ready at Club and not at Regional, so it is not spent there',
    hasUnseenTierEvent('keith', 0, {}, 1) && !hasUnseenTierEvent('keith', 0, {}, 2),
  );
}

console.log('\n── a lost playoff comes round again ──');
{
  const { lossEventId: _single, ...match } = TEAM_MATCH_1;
  const playoff: PlayoffConfig = {
    ...match,
    id: 'test_playoff',
    lossEventIds: ['loss_once', 'loss_twice', 'loss_again'],
    retryDays: 6,
  };
  check(
    'each attempt plays its own loss event, and the last one repeats',
    [1, 2, 3, 4, 9].map((a) => PlayoffManager.lossEventFor(playoff, a)).join() ===
      'loss_once,loss_twice,loss_again,loss_again,loss_again',
  );

  const second = PlayoffManager.metadataFor(playoff, 2);
  check(
    'an attempt is the same match, marked with its playoff and attempt',
    second.playoff?.id === 'test_playoff' &&
      second.playoff.attempt === 2 &&
      second.lossEventId === 'loss_twice' &&
      second.winEventId === playoff.winEventId &&
      second.prematchEventId === playoff.prematchEventId &&
      JSON.stringify(second.opponentStats) === JSON.stringify(playoff.opponent.stats),
  );

  const [scheduled] = PlayoffManager.scheduleAttempt([], playoff, 2, 50);
  check(
    'the next attempt is retryDays on, in the afternoon',
    scheduled.eventType === 'story_match' &&
      scheduled.scheduledDay === 56 &&
      scheduled.scheduledTimeSlot === TimeSlot.AFTERNOON,
    JSON.stringify({ day: scheduled.scheduledDay, slot: scheduled.scheduledTimeSlot }),
  );
  const crowded = PlayoffManager.scheduleAttempt([scheduled], playoff, 3, 50);
  check(
    'and moves to the next free slot if that one is taken',
    crowded.length === 2 &&
      !(crowded[1].scheduledDay === 56 && crowded[1].scheduledTimeSlot === TimeSlot.AFTERNOON),
  );

  const named = TournamentRegistry.getAllTournaments()
    .map((t) => t.playoffId)
    .filter((id): id is string => id !== undefined);
  check(
    'every playoff a tournament names exists',
    named.every((id) => getPlayoff(id) !== undefined),
    named.join(', '),
  );
  for (const p of Object.values(PLAYOFFS)) {
    const event = (id: string | undefined): ReturnType<typeof StoryEventRepository.getEventById> =>
      id === undefined ? undefined : StoryEventRepository.getEventById(id);
    const last = p.lossEventIds[p.lossEventIds.length - 1];
    check(`${p.id}: filed under its own id`, PLAYOFFS[p.id] === p);
    check(`${p.id}: has a loss event`, p.lossEventIds.length > 0);
    check(
      `${p.id}: its events exist`,
      [p.prematchEventId, p.winEventId, ...p.lossEventIds].every((id) => event(id)),
      [p.prematchEventId, p.winEventId, ...p.lossEventIds].filter((id) => !event(id)).join(', '),
    );
    check(
      `${p.id}: its prematch and last loss events are repeatable`,
      event(p.prematchEventId)?.repeatable === true && event(last)?.repeatable === true,
    );
    check(`${p.id}: comes round again after some days`, p.retryDays >= 1);
  }
}

if (failures > 0) {
  console.log(`\n❌ ${failures} season check(s) failed`);
  process.exit(1);
}
console.log('\n✅ all season checks passed');
