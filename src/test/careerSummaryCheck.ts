/**
 * Career summary checks — the end screen's numbers come from the save as it is.
 *
 * Run with: npx tsx src/test/careerSummaryCheck.ts
 */

import { careerSummary } from '../game/CareerSummary';
import { PlayerManager } from '../game/PlayerManager';
import { TimeManager } from '../game/TimeManager';

let failures = 0;
function check(label: string, condition: boolean, detail?: string): void {
  console.log(
    `  ${condition ? 'ok  ' : 'FAIL'}  ${label}${!condition && detail ? ` — ${detail}` : ''}`,
  );
  if (!condition) failures++;
}

const player = {
  ...PlayerManager.createPlayer('Sam'),
  matchesPlayed: 12,
  matchesWon: 9,
  latestMatchResults: ['win', 'loss', 'win'] as Array<'win' | 'loss'>,
};
const summary = careerSummary(player, {
  calendar: {
    ...TimeManager.createCalendar(),
    currentDay: 40,
    completedTournaments: [
      { tournamentId: 'riverside_open', won: true, completedAt: '2026-01-01T00:00:00Z' },
    ],
  },
  completedStoryEvents: ['first_team_match_win', 'second_team_match_loss', 'club_team_intro'],
  completedChallenges: ['a', 'b'],
  relationships: { keith: 12, jen: 30, coach_gonzalez: 0, jordan: 5, alex: 8 },
});

console.log('── record ──');
check(
  'wins, losses and the rate come from the player',
  summary.matches.won === 9 && summary.matches.lost === 3 && summary.matches.winRate === 75,
  JSON.stringify(summary.matches),
);
check(
  'a team match is won or lost by which result event played, unplayed otherwise',
  summary.teamMatches[0].result === 'win' &&
    summary.teamMatches[1].result === 'loss' &&
    summary.teamMatches[2].result === null,
  JSON.stringify(summary.teamMatches),
);
check(
  'a won tournament reads as won, by its name',
  summary.tournaments.length === 1 &&
    summary.tournaments[0].name === 'Riverside Open' &&
    summary.tournaments[0].won,
  JSON.stringify(summary.tournaments),
);
check('the day is the career day', summary.days === 40);

console.log('\n── the rest ──');
check(
  'the closest friends are the three strongest relationships, strongest first',
  summary.friends.length === 3 && summary.friends[0].value === 30 && summary.friends[2].value === 8,
  JSON.stringify(summary.friends),
);
check(
  'story events and challenges are counted',
  summary.highlights.storyEvents === 3 && summary.highlights.challenges === 2,
);
check('five area ratings', Object.keys(summary.areas).length === 5);

if (failures > 0) {
  console.log(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\n✅ all career summary checks passed');
