/**
 * A bot that plays the game through the UI.
 *
 * Built on the phase machine rather than on the DOM. `App.tsx` switches
 * exhaustively on `gamePhase.type`, and that phase is readable from the store,
 * so the bot asks the game where it is instead of guessing from what happens to
 * be on screen. Two things follow from that:
 *
 *   - it cannot get confused by a modal it did not expect. Anything the game can
 *     put up is a phase or an idle overlay, so it is either a case the bot
 *     handles or one it reports as unhandled — never a silent hang;
 *   - a softlock is detectable. If the phase stops changing while the bot is
 *     still clicking, the game has parked somewhere with no exit, which is
 *     exactly the bug a soak run exists to find.
 *
 * It reads state through the test handle and acts only through the UI. Reading
 * the phase to decide what to click is not the same as calling store actions to
 * move the game along — the clicks are real, which is the point.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { readGame, playMatch, type TacticPolicy } from './helpers';
// The real rating function, not a reimplementation — it is a pure stats->number
// util with no app dependencies, so the report cannot drift from the game's own
// idea of how good the player is.
import { calculateOverallRating } from '../src/utils/overallRating';
import { TimeSlot } from '../src/types/game';
import { ANCHOR_TRAINING_ENERGY_COST } from '../src/game/AnchorTrainingSystem';
import { canBuyAny } from '../src/game/StatDevelopment';

/**
 * True when the element is on screen and clickable.
 *
 * `locator.isEnabled()` auto-waits for its element, so probing for a button that
 * this particular screen does not render blocks for the whole action timeout.
 * The bot probes constantly — the pre-match screen for a story match has no tier
 * picker, night has no Training — so every probe goes through here, where the
 * `count()` short-circuit makes a miss instant.
 */
async function usable(locator: Locator): Promise<boolean> {
  if ((await locator.count()) === 0) return false;
  return locator
    .first()
    .isEnabled({ timeout: 2_000 })
    .catch(() => false);
}

/** What the bot did, for the run report. */
export interface BotLog {
  /** In-game day it finished on. */
  day: number;
  trainingSessions: number;
  matchesPlayed: number;
  matchesWon: number;
  keyMomentsAnswered: number;
  storyEventsSeen: number;
  /** Story event ids and the option taken, in order. */
  storyChoices: Array<{ event: string; option: string }>;
  itemsAcquired: number;
  /** Stat points bought on the Development screen. */
  statPointsBought: number;
  /** Phases the bot had no handler for — each one is a gap, not a pass. */
  unhandledPhases: string[];
  /** Snapshots of the headline numbers, one per in-game day. */
  daily: Array<{ day: number; energy: number; overall: number; xp: number }>;
}

function emptyLog(): BotLog {
  return {
    day: 0,
    trainingSessions: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    keyMomentsAnswered: 0,
    storyEventsSeen: 0,
    storyChoices: [],
    itemsAcquired: 0,
    statPointsBought: 0,
    unhandledPhases: [],
    daily: [],
  };
}

export interface BotOptions {
  /** Stop once the calendar reaches this day. */
  untilDay: number;
  /** How the bot picks a tactic at a key moment. */
  tactics?: TacticPolicy;
  /**
   * Play matches when they are available. Off means a training-only run, which
   * is the cleaner way to look at the training economy on its own.
   */
  playMatches?: boolean;
  /** Safety valve: give up after this many actions rather than hanging. */
  maxActions?: number;
}

/** Which of the five core anchors to train, cycled so the build stays even. */
const ANCHORS = ['serve', 'forehand', 'backhand', 'return', 'net'] as const;

/**
 * Plays until `untilDay`, then returns what happened.
 *
 * Throws on a softlock or an unhandled phase — those are bugs in the game, not
 * in the run, and a soak run that swallowed them would be worthless.
 */
export async function runBot(page: Page, options: BotOptions): Promise<BotLog> {
  const { untilDay, tactics = 'first', playMatches = true, maxActions = 600 } = options;
  const log = emptyLog();

  let anchorIndex = 0;
  let actions = 0;
  let lastDaySnapshotted = -1;
  // Softlock detection, in two shapes. A phase that never changes is the easy
  // one; the harder one is a *cycle* — phases changing forever while the
  // calendar stands still — which the repeat counter alone cannot see.
  let lastPhaseKey = '';
  let repeats = 0;
  let dayStalledFor = 0;
  let lastDay = -1;
  /** Recent phases, for the error message. Guessing at a cycle is no fun. */
  const trail: string[] = [];

  while (actions < maxActions) {
    const state = await readGame(page);
    const phase = state.gamePhase;
    const day = state.calendar.currentDay;
    log.day = day;

    if (day > lastDaySnapshotted) {
      lastDaySnapshotted = day;
      log.daily.push({
        day,
        energy: state.currentStatus.energy,
        overall: state.player ? calculateOverallRating(state.player.stats) : 0,
        // Experience doubles as the shop's currency, so it is the closest thing
        // the game has to a wallet.
        xp: state.player?.experience ?? 0,
      });
    }

    if (day >= untilDay && phase.type === 'idle' && !phase.overlay) break;

    const overlay = phase.type === 'idle' ? (phase.overlay?.type ?? 'none') : '';
    const slot = state.calendar.currentTimeSlot;
    const phaseKey = `${phase.type}:${overlay}`;

    trail.push(`d${day}s${slot} ${phaseKey}`);
    if (trail.length > 40) trail.shift();
    const describe = () =>
      `\n  energy=${state.currentStatus.energy} mood=${state.currentStatus.mood} slot=${slot}` +
      `\n  recent phases (oldest first):\n    ${trail.join('\n    ')}`;

    if (phaseKey === lastPhaseKey) {
      repeats++;
      if (repeats > 60) {
        throw new Error(
          `softlock: stuck in phase "${phaseKey}" for ${repeats} actions on day ${day}.` +
            describe(),
        );
      }
    } else {
      repeats = 0;
      lastPhaseKey = phaseKey;
    }

    // A cycle: the bot is busy, the screens keep changing, and the calendar has
    // not moved. Four in-game slots is a handful of actions, so hundreds without
    // a day boundary means nothing is making progress.
    if (day === lastDay) {
      dayStalledFor++;
      // A day is four slots, and the busiest slot is a handful of actions, so
      // ~150 without a day boundary is already far past anything legitimate.
      if (dayStalledFor > 150) {
        throw new Error(
          `softlock: ${dayStalledFor} actions on day ${day} without the calendar advancing — ` +
            `the bot is going round in circles.` +
            describe(),
        );
      }
    } else {
      dayStalledFor = 0;
      lastDay = day;
    }

    actions++;
    await step(
      page,
      state,
      phase,
      log,
      { tactics, playMatches },
      () => ANCHORS[anchorIndex++ % ANCHORS.length],
    );
  }

  if (actions >= maxActions) {
    throw new Error(
      `bot gave up after ${maxActions} actions on day ${log.day} — likely a slow softlock`,
    );
  }
  if (log.unhandledPhases.length > 0) {
    throw new Error(
      `bot hit phases it has no handler for: ${[...new Set(log.unhandledPhases)].join(', ')}`,
    );
  }

  return log;
}

/**
 * Clicks through whatever is on screen until the game is back on a plain menu.
 *
 * Reuses the bot's own handlers, so an event that grants an item, unlocks a
 * hangout, starts a minigame or kicks off a match is driven exactly as it would
 * be mid-run. Returns the log so a caller can see what the detour produced.
 *
 * Throws if it cannot get back to idle, which for a story event sweep is the
 * whole point: an event that leaves the game somewhere with no exit is a
 * softlock, and this is what catches it.
 */
export async function drainToIdle(
  page: Page,
  opts: { maxActions?: number; tactics?: TacticPolicy } = {},
): Promise<BotLog> {
  const { maxActions = 60, tactics = 'first' } = opts;
  const log = emptyLog();
  let anchorIndex = 0;

  for (let i = 0; i < maxActions; i++) {
    const state = await readGame(page);
    const phase = state.gamePhase;
    log.day = state.calendar.currentDay;

    if (phase.type === 'idle' && !phase.overlay) {
      if (log.unhandledPhases.length > 0) {
        throw new Error(
          `unhandled phases while draining: ${[...new Set(log.unhandledPhases)].join(', ')}`,
        );
      }
      return log;
    }

    await step(
      page,
      state,
      phase,
      log,
      { tactics, playMatches: true },
      () => ANCHORS[anchorIndex++ % ANCHORS.length],
    );
  }

  const where = (await readGame(page)).gamePhase;
  throw new Error(
    `could not get back to the menu after ${maxActions} actions — stuck on phase "${where.type}". ` +
      `Something here has no exit.`,
  );
}

/** One action. Split out so the main loop stays readable. */
async function step(
  page: Page,
  state: Awaited<ReturnType<typeof readGame>>,
  phase: Awaited<ReturnType<typeof readGame>>['gamePhase'],
  log: BotLog,
  policy: { tactics: TacticPolicy; playMatches: boolean },
  nextAnchor: () => string,
): Promise<void> {
  switch (phase.type) {
    case 'idle': {
      // Overlays first — the menu is behind them and its buttons are not usable.
      switch (phase.overlay?.type) {
        case 'training_result':
          await page.getByTestId('training-result-dismiss').click();
          return;
        case 'item_acquired':
          log.itemsAcquired++;
          await page.getByTestId('item-acquired-dismiss').click();
          return;
        case 'hangout_unlock':
          await page.getByTestId('hangout-unlocked-dismiss').click();
          return;
        case 'story_event':
        case 'story_event_result':
          // Rendered by MainMenu's overlay, but driven by the same modals as the
          // standalone phases, so reuse those handlers.
          await handleStory(page, log);
          return;
        default:
          break;
      }

      // Training pays currency, not stats, so a run that never spends never
      // improves. Spend at night, once the day's earnings are in.
      const isNight = state.calendar.currentTimeSlot === TimeSlot.NIGHT;
      if (isNight && state.player && canBuyAny(state.player)) {
        await page.getByTestId('action-development').click();
        return;
      }

      // Night has exactly one legal action, and it rolls the day over.
      if (isNight) {
        await page.getByTestId('action-rest').click();
        return;
      }

      const matchTile = page.getByTestId('action-match');
      const canMatch = policy.playMatches && (await usable(matchTile));
      if (canMatch) {
        log.matchesPlayed++;
        await matchTile.click();
        return;
      }

      // Check the cost here rather than trusting the tile: the bot used to walk
      // into Training on fumes, find every anchor disabled, back out, and walk
      // straight back in — a loop that burned a whole run without the calendar
      // moving. The menu now disables the tile too, so this is belt and braces.
      const trainTile = page.getByTestId('action-training');
      if (state.currentStatus.energy >= ANCHOR_TRAINING_ENERGY_COST && (await usable(trainTile))) {
        await trainTile.click();
        return;
      }

      // Nothing affordable — rest to recover the slot.
      await page.getByTestId('action-rest').click();
      return;
    }

    case 'training': {
      // Quick Sim rather than the minigame: it banks a guaranteed support without
      // depending on reflexes, which is what a soak run wants. The minigames
      // themselves are covered by trainingMinigame.spec.ts.
      const anchor = nextAnchor();
      const tile = page.getByTestId(`training-anchor-${anchor}`);
      if (!(await usable(tile))) {
        await page.getByTestId('screen-back').click();
        return;
      }
      await tile.click();
      await page.getByTestId('training-quick-sim').click();
      log.trainingSessions++;
      return;
    }

    case 'development': {
      // Plan up to a dozen points on whatever is affordable, top to bottom, then
      // confirm. Each visit buys at least one point (the bot only comes here when
      // canBuyAny), so repeated visits always make progress.
      const plus = page.locator('[data-testid^="development-plus-"]:enabled');
      let planned = 0;
      while (planned < 12 && (await plus.count()) > 0) {
        await plus.first().click();
        planned++;
      }
      if (planned > 0) {
        await page.getByTestId('development-confirm').click();
        await expect(page.getByTestId('development-message')).toBeVisible();
        log.statPointsBought += planned;
      }
      await page.getByTestId('screen-back').click();
      return;
    }

    case 'match_setup': {
      // `isEnabled`, not `isVisible`: the tier picker's button stays on screen
      // when the player cannot afford the match or the tier is locked, so a
      // visibility check would sit here clicking a dead button forever.
      const preview = page.getByTestId('preview-match');
      if (await usable(preview)) {
        await preview.click();
        return;
      }
      const start = page.getByTestId('start-match-footer');
      if (await usable(start)) {
        await start.click();
        return;
      }
      // Neither is usable, which should not happen: a practice match's tile is
      // already disabled when unaffordable, and scheduled story and tournament
      // matches clamp their cost to whatever energy the player has
      // (StoryMatchManager.calculateMatchEnergyCost), so those are always
      // playable and correctly have no back button. Getting here means a
      // pre-match screen is offering nothing at all.
      const back = page.getByTestId('screen-back');
      if ((await back.count()) === 0) {
        throw new Error(
          'pre-match screen with nothing usable: Start is disabled and there is ' +
            'no Back button, so a player here cannot proceed or leave.',
        );
      }
      await back.first().click({ timeout: 5_000 });
      return;
    }

    case 'match_active': {
      const run = await playMatch(page, policy.tactics);
      log.keyMomentsAnswered += run.keyMoments;
      return;
    }

    case 'match_results': {
      if (phase.finalScore?.winner === 'player') log.matchesWon++;
      await page.getByTestId('match-results-continue').click();
      return;
    }

    case 'story_event':
    case 'story_event_result':
      await handleStory(page, log);
      return;

    case 'minigame_active': {
      // An event sent the bot into a minigame. Start it and let it run its clock
      // out — every game resolves either way, and a miss scores as legitimately
      // as a hit.
      const start = page.getByTestId('minigame-start');
      if (await start.isVisible().catch(() => false)) {
        await start.click();
        return;
      }
      await page.waitForTimeout(1000);
      return;
    }

    default:
      log.unhandledPhases.push(phase.type);
      return;
  }
}

/** Advances a story event: dialogue, then the first available option. */
async function handleStory(page: Page, log: BotLog): Promise<void> {
  const advance = page.getByTestId('story-advance');
  if (await advance.isVisible().catch(() => false)) {
    await advance.click();
    return;
  }

  const resolve = page.getByTestId('story-resolve');
  if (await resolve.isVisible().catch(() => false)) {
    log.storyEventsSeen++;
    await resolve.click();
    return;
  }

  // A real choice: take the first option that is actually open.
  const options = page.getByTestId(/^story-option-/).and(page.locator('[data-available="true"]'));
  if ((await options.count()) > 0) {
    const first = options.first();
    const id = (await first.getAttribute('data-testid')) ?? '?';
    log.storyChoices.push({ event: 'unknown', option: id.replace('story-option-', '') });
    await first.click();
    await page.getByTestId('story-confirm').click();
    log.storyEventsSeen++;
    return;
  }

  const dismiss = page.getByTestId('story-result-dismiss');
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
    return;
  }

  // Nothing recognised on a story phase is a gap worth failing on.
  throw new Error('story event with no advance, option, or dismiss the bot can use');
}

/** Formats a run for stdout. */
export function formatLog(log: BotLog): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(`── soak run: ${log.day} in-game days ─────────────────────────`);
  lines.push(`  training sessions : ${log.trainingSessions}`);
  lines.push(`  matches           : ${log.matchesPlayed} played, ${log.matchesWon} won`);
  lines.push(`  key moments       : ${log.keyMomentsAnswered}`);
  lines.push(`  story events      : ${log.storyEventsSeen}`);
  lines.push(`  items acquired    : ${log.itemsAcquired}`);
  lines.push(`  stat points bought: ${log.statPointsBought}`);
  lines.push('');
  lines.push('  day   energy  overall     xp');
  for (const d of log.daily) {
    lines.push(
      `  ${String(d.day).padStart(3)}   ${String(d.energy).padStart(6)}  ${String(d.overall).padStart(7)}  ${String(d.xp).padStart(5)}`,
    );
  }
  return lines.join('\n');
}

/** Asserts the run actually did something, so a no-op cannot pass. */
export function expectProductiveRun(log: BotLog, untilDay: number): void {
  expect(log.day).toBeGreaterThanOrEqual(untilDay);
  expect(log.trainingSessions).toBeGreaterThan(0);
  expect(log.unhandledPhases).toEqual([]);
}
