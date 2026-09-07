/**
 * Story minigame check — does a score pick the right branch?
 *
 * A minigame attached to a story option resolves in two passes: the first hands
 * the screen to the game, the second comes back with a score that chooses between
 * the option's outcome (pass) and its failOutcome (miss). getOutcome is where
 * that decision lives, and it is a pure function, so it can be pinned directly.
 *
 * The case worth guarding is the first pass: getOutcome is reachable with no
 * score at all, and "no score" must not read as a pass — that would hand out the
 * reward for a game the player never played.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/storyMinigameCheck.ts
 */

import { StoryEventManager } from '../game/StoryEventManager';
import { StoryEventRepository } from '../data/storyEvents';
import type { StoryEvent, StoryEventOption, StoryEventOutcome } from '../types/storyEvents';
import type { MinigameScore } from '../minigames/types';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

const PASS_OUTCOME: StoryEventOutcome = {
  resultText: ['You pulled it off.'],
  effects: { moodChange: 5 },
};

const FAIL_OUTCOME: StoryEventOutcome = {
  resultText: ['Not your day.'],
  effects: { moodChange: -2 },
};

const DEFAULT_OUTCOME: StoryEventOutcome = {
  resultText: ['Nothing much happens.'],
  effects: {},
};

/** An option gated on landing 3 of 3 reps. */
const checkedOption: StoryEventOption = {
  id: 'try_it',
  text: 'Try it',
  outcome: PASS_OUTCOME,
  minigame: {
    request: { minigame: 'rally_rhythm' },
    passThreshold: 3,
    failOutcome: FAIL_OUTCOME,
  },
};

/** The same option with no skill check on it. */
const plainOption: StoryEventOption = {
  id: 'just_talk',
  text: 'Just talk',
  outcome: PASS_OUTCOME,
};

const event: StoryEvent = {
  id: 'test_event',
  name: 'Test Event',
  tags: ['misc'],
  timeSlotsRequired: 1,
  prerequisites: {},
  skippable: false,
  description: 'A test event.',
  characters: [],
  options: [checkedOption, plainOption],
  defaultOutcome: DEFAULT_OUTCOME,
};

function score(value: number, maxScore = 3): MinigameScore {
  return { minigame: 'rally_rhythm', score: value, maxScore };
}

function main(): void {
  console.log('\n╔══ STORY MINIGAME CHECK — a score picks the branch ══╗\n');

  console.log('── the score decides which outcome lands ──');
  check('meeting the pass line takes the option outcome',
    StoryEventManager.getOutcome(event, checkedOption, score(3)) === PASS_OUTCOME);
  check('exceeding the pass line still passes',
    StoryEventManager.getOutcome(event, checkedOption, score(5, 5)) === PASS_OUTCOME);
  check('falling one short takes the fail outcome',
    StoryEventManager.getOutcome(event, checkedOption, score(2)) === FAIL_OUTCOME);
  check('scoring nothing takes the fail outcome',
    StoryEventManager.getOutcome(event, checkedOption, score(0)) === FAIL_OUTCOME);

  console.log('\n── an unplayed check is not a pass ──');
  // This is the first pass through executeStoryEvent, before the game has run.
  // If it read as a pass, the option would pay out without being played.
  check('no score at all takes the fail outcome, never the pass',
    StoryEventManager.getOutcome(event, checkedOption, undefined) === FAIL_OUTCOME);

  console.log('\n── options without a check are untouched ──');
  check('a plain option takes its outcome with no score',
    StoryEventManager.getOutcome(event, plainOption, undefined) === PASS_OUTCOME);
  check('a plain option ignores a score it never asked for',
    StoryEventManager.getOutcome(event, plainOption, score(0)) === PASS_OUTCOME);
  check('a linear event still falls back to its default outcome',
    StoryEventManager.getOutcome(event, null, undefined) === DEFAULT_OUTCOME);

  console.log('\n── the pass line is read in the game\'s own units ──');
  // maxScore varies by game, so a threshold must not be treated as a fraction.
  const outOfHundred: StoryEventOption = {
    id: 'precise',
    text: 'Precision check',
    outcome: PASS_OUTCOME,
    minigame: {
      request: { minigame: 'corner_paint' },
      passThreshold: 70,
      failOutcome: FAIL_OUTCOME,
    },
  };
  check('70 of 100 passes a line of 70',
    StoryEventManager.getOutcome(event, outOfHundred,
      { minigame: 'corner_paint', score: 70, maxScore: 100 }) === PASS_OUTCOME);
  check('69 of 100 does not',
    StoryEventManager.getOutcome(event, outOfHundred,
      { minigame: 'corner_paint', score: 69, maxScore: 100 }) === FAIL_OUTCOME);

  console.log('\n── authored checks are real checks ──');
  // A check that cannot be failed, or whose branches pay the same, is decoration
  // that costs the player a minigame. These scan every event in the game.
  const checked = StoryEventRepository.getAllEvents().flatMap((e) =>
    e.options
      .filter((o) => o.minigame !== undefined)
      .map((o) => ({ event: e.id, option: o }))
  );

  check('at least one event actually uses a minigame check',
    checked.length > 0);

  check('every pass line needs at least one success',
    checked.every(({ option }) => option.minigame!.passThreshold >= 1),
    'a threshold of 0 passes without playing');

  check('every check has a fail branch distinct from its pass branch',
    checked.every(({ option }) => option.minigame!.failOutcome !== option.outcome));

  check('every check tells the player it is coming, before they pick it',
    checked.every(({ option }) => (option.description ?? '').length > 0),
    'an option that silently launches a minigame is a trap');

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
