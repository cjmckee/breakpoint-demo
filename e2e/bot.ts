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
import { TRAINING_ENERGY_COST } from '../src/game/TrainingSystem';
import {
  canAfford,
  canBuyAny,
  getStat,
  priceOf,
  unspentSpecPoints,
  STAT_NAMES,
} from '../src/game/StatDevelopment';
import { SeasonManager } from '../src/game/SeasonManager';
import type { GamePhase as CourtPhase } from '../src/types/archetype';

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
  /** Every match finished, in order. */
  matches: Array<{
    day: number;
    type: string;
    opponent: string;
    score: string;
    won: boolean;
  }>;
  /** Specialties taken on the Specialties tab, as `phase:path`. */
  specialties: string[];
  itemsAcquired: number;
  /** Stat points bought on the Development screen. */
  statPointsBought: number;
  /** Phases the bot had no handler for — each one is a gap, not a pass. */
  unhandledPhases: string[];
  /** The run stopped at the end of the written story, before `untilDay`. */
  contentEnded: boolean;
  /** Snapshots of the headline numbers, one per in-game day. */
  daily: Array<{ day: number; energy: number; overall: number; xp: number }>;
}

export function emptyLog(): BotLog {
  return {
    day: 0,
    trainingSessions: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    keyMomentsAnswered: 0,
    storyEventsSeen: 0,
    storyChoices: [],
    matches: [],
    specialties: [],
    itemsAcquired: 0,
    statPointsBought: 0,
    unhandledPhases: [],
    contentEnded: false,
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
  /** How the bot answers story choices. Default: the first open option. */
  stories?: StoryPolicy;
  /** How the bot spends on the Development screen. Default: top to bottom, no specialties. */
  spend?: SpendPolicy;
  /** Randomness for the bot's own choices, so a seeded run picks the same way twice. */
  rng?: () => number;
  /** Practice matches at most every this many days (story and team matches always play). */
  matchEvery?: number;
  /** Log to fill in place, so a caller keeps what a run did even when it throws. */
  log?: BotLog;
}

type StatName = (typeof STAT_NAMES)[number];

export interface StoryPolicy {
  /** Option ids taken whenever one is open (an archetype, say), before `pick` applies. */
  prefer?: string[];
  pick: 'first' | 'random';
}

export interface SpendPolicy {
  /**
   * Relative appetite per stat: each +1 goes to an affordable stat, drawn by weight.
   * Stats below a fifth of the top weight are never bought, so the player saves for its
   * build instead of spending whatever happens to be affordable.
   */
  weights?: Partial<Record<StatName, number>>;
  /** Specialty path per court phase, taken in this order as points arrive. */
  specialties?: Partial<Record<CourtPhase, string>>;
}

interface Policy {
  tactics: TacticPolicy;
  playMatches: boolean;
  matchEvery?: number;
  /** Day of the last practice match the bot started. */
  lastPractice?: number;
  stories: StoryPolicy;
  spend: SpendPolicy;
  rng: () => number;
}

/** The stats a weighted policy will buy at all; every stat without weights. */
function wantedStats(spend: SpendPolicy): StatName[] {
  const w = spend.weights;
  if (!w) return [...STAT_NAMES];
  const top = Math.max(...STAT_NAMES.map((k) => w[k] ?? 0));
  return STAT_NAMES.filter((k) => (w[k] ?? 0) >= top / 5);
}

/** Whether a stat the policy wants is affordable now. */
function canBuyWanted(
  player: NonNullable<Awaited<ReturnType<typeof readGame>>['player']>,
  spend: SpendPolicy,
): boolean {
  if (!spend.weights) return canBuyAny(player);
  return wantedStats(spend).some((k) => {
    const v = getStat(player.stats, k);
    return v < 100 && canAfford(player.wallet, priceOf(k, v));
  });
}

/** The first court phase in the plan with no specialty yet, when a point is there to spend it. */
function nextSpecialty(
  player: NonNullable<Awaited<ReturnType<typeof readGame>>['player']>,
  spend: SpendPolicy,
): CourtPhase | undefined {
  if (!spend.specialties || unspentSpecPoints(player) < 1) return undefined;
  return (Object.keys(spend.specialties) as CourtPhase[]).find(
    (phase) => !player.archetypeProfile.phases[phase],
  );
}

/**
 * Plays until `untilDay`, then returns what happened.
 *
 * Throws on a softlock or an unhandled phase — those are bugs in the game, not
 * in the run, and a soak run that swallowed them would be worthless.
 */
export async function runBot(page: Page, options: BotOptions): Promise<BotLog> {
  const { untilDay, tactics = 'first', playMatches = true, maxActions = 600 } = options;
  const policy: Policy = {
    tactics,
    playMatches,
    matchEvery: options.matchEvery,
    stories: options.stories ?? { pick: 'first' },
    spend: options.spend ?? {},
    rng: options.rng ?? Math.random,
  };
  const log = options.log ?? emptyLog();

  let pickIndex = 0;
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
    // The end of the written story has no menu to act on: the run is over.
    if (
      phase.type === 'idle' &&
      !phase.overlay &&
      state.player &&
      SeasonManager.contentEnded(state.player.tier, state.completedStoryEvents)
    ) {
      await expect(page.getByTestId('content-end')).toBeVisible();
      log.contentEnded = true;
      break;
    }

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
    await step(page, state, phase, log, policy, () => pickIndex++);
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
  let pickIndex = 0;

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
      { tactics, playMatches: true, stories: { pick: 'first' }, spend: {}, rng: Math.random },
      () => pickIndex++,
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
  policy: Policy,
  nextPick: () => number,
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
          await handleStory(page, log, policy, phase.overlay);
          return;
        default:
          break;
      }

      // Training pays currency, not stats, so a run that never spends never
      // improves. Spend at night, once the day's earnings are in.
      const isNight = state.calendar.currentTimeSlot === TimeSlot.NIGHT;
      if (isNight && state.player && nextSpecialty(state.player, policy.spend)) {
        await page.getByTestId('action-development').click();
        await page.getByTestId('development-tab-specialties').click();
        return;
      }
      if (isNight && state.player && canBuyWanted(state.player, policy.spend)) {
        await page.getByTestId('action-development').click();
        return;
      }

      // Night has exactly one legal action, and it rolls the day over.
      if (isNight) {
        await page.getByTestId('action-rest').click();
        return;
      }

      const matchTile = page.getByTestId('action-match');
      const day = state.calendar.currentDay;
      const due =
        !policy.matchEvery ||
        policy.lastPractice === undefined ||
        day - policy.lastPractice >= policy.matchEvery;
      const canMatch = policy.playMatches && due && (await usable(matchTile));
      if (canMatch) {
        policy.lastPractice = day;
        log.matchesPlayed++;
        await matchTile.click();
        return;
      }

      // Check the cost here rather than trusting the tile: the bot used to walk
      // into Training on fumes, find every drill disabled, back out, and walk
      // straight back in — a loop that burned a whole run without the calendar
      // moving. The menu now disables the tile too, so this is belt and braces.
      const trainTile = page.getByTestId('action-training');
      if (state.currentStatus.energy >= TRAINING_ENERGY_COST && (await usable(trainTile))) {
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
      // The slot offers four drills; take them in turn so the pay stays mixed.
      const cards = page.locator('[data-testid="training-offer"] [data-drill]');
      const offered = await cards.count();
      const tile = cards.nth(nextPick() % Math.max(1, offered));
      if (offered === 0 || !(await usable(tile))) {
        await page.getByTestId('screen-back').click();
        return;
      }
      await tile.click();
      await page.getByTestId('training-quick-sim').click();
      log.trainingSessions++;
      return;
    }

    case 'development': {
      if (phase.tab === 'specialties') {
        // One specialty per visit, on the plan's next open phase; the night loop
        // comes back while points and open phases remain.
        const court = state.player && nextSpecialty(state.player, policy.spend);
        if (court) {
          await page.getByTestId(`archetype-phase-${court}`).click();
          const wanted = page.getByTestId(
            `archetype-specialize-${policy.spend.specialties![court]}`,
          );
          const any = page.locator('[data-testid^="archetype-specialize-"]:enabled');
          const pick = (await usable(wanted)) ? wanted : any.first();
          const id = (await pick.getAttribute('data-testid')) ?? '?';
          await pick.click();
          log.specialties.push(`${court}:${id.replace('archetype-specialize-', '')}`);
        }
        await page.getByTestId('screen-back').click();
        return;
      }
      // Plan up to a dozen points on whatever is affordable, then confirm: top to
      // bottom, or drawn by the policy's weights. Each visit buys at least one point
      // (the bot only comes here when canBuyAny), so repeated visits always make progress.
      const plus = page.locator('[data-testid^="development-plus-"]:enabled');
      const weights = policy.spend.weights;
      let planned = 0;
      while (planned < 12 && (await plus.count()) > 0) {
        if (!weights) {
          await plus.first().click();
        } else {
          const ids = await plus.evaluateAll((els) =>
            els.map((el) =>
              (el.getAttribute('data-testid') ?? '').replace('development-plus-', ''),
            ),
          );
          const w = ids.map((id) => weights[id as StatName] ?? 0.05);
          let roll = policy.rng() * w.reduce((a, b) => a + b, 0);
          const at = Math.max(
            0,
            w.findIndex((x) => (roll -= x) < 0),
          );
          await page.getByTestId(`development-plus-${ids[at]}`).click();
        }
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
      const run = await playMatch(page, policy.tactics, undefined, policy.rng);
      log.keyMomentsAnswered += run.keyMoments;
      return;
    }

    case 'match_results': {
      if (phase.finalScore?.winner === 'player') log.matchesWon++;
      log.matches.push({
        day: state.calendar.currentDay,
        type: phase.matchType,
        opponent: phase.matchConfig.opponentName ?? '?',
        score: phase.finalScore.sets.map((s) => `${s.player}-${s.opponent}`).join(' '),
        won: phase.finalScore.winner === 'player',
      });
      await page.getByTestId('match-results-continue').click();
      return;
    }

    case 'story_event':
    case 'story_event_result':
      await handleStory(page, log, policy, phase);
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

/** Advances a story event: dialogue, then an available option by the policy. */
async function handleStory(
  page: Page,
  log: BotLog,
  policy: Policy,
  source: { type: string; event?: { id: string } },
): Promise<void> {
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

  // A real choice: a preferred option if one is open, else first or random.
  const options = page.getByTestId(/^story-option-/).and(page.locator('[data-available="true"]'));
  const count = await options.count();
  if (count > 0) {
    const ids = await options.evaluateAll((els) =>
      els.map((el) => (el.getAttribute('data-testid') ?? '').replace('story-option-', '')),
    );
    const preferred = ids.findIndex((id) => policy.stories.prefer?.includes(id));
    const at =
      preferred >= 0
        ? preferred
        : policy.stories.pick === 'random'
          ? Math.floor(policy.rng() * count)
          : 0;
    const first = options.nth(at);
    log.storyChoices.push({ event: source.event?.id ?? 'unknown', option: ids[at] });
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
