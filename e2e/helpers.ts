import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
// Type-only: erased at runtime, so importing from src pulls nothing into the
// spec process. Used to derive the store shapes for readGame/readMatch.
import type { useGameStore as useGameStoreType } from '../src/stores/gameStore';
import type { useMatchStore as useMatchStoreType } from '../src/stores/matchStore';
// Imported for its `declare global` block, which is what types `window.__test__`
// inside the page.evaluate callbacks below.
import type { TestHandle } from '../src/debug/testHandle';
// A value import, unlike the two above: the repository is a plain module-level
// array with no app dependencies, so a spec can enumerate the real event list
// instead of keeping its own copy in sync.
import { StoryEventRepository } from '../src/data/storyEvents/index';
import { ALL_ITEMS } from '../src/data/items';

/** Re-exported so a spec can name the handle's shape without reaching into src. */
export type { TestHandle };

/**
 * Shared setup for specs that need a real player past the onboarding gate.
 * Extracted from earlyGameGuidance.spec.ts once a second spec needed it.
 */

/** The walkthrough card. Scoped because "Next" also appears elsewhere on the menu. */
export const callout = (page: Page) => page.getByTestId('tutorial-callout');

/**
 * Third-party hosts the app loads from, answered with an empty body of the right
 * type so no spec depends on reaching them.
 *
 * src/index.css imports the pixel font from Google Fonts on every page load, and the
 * menu's Feedback tab loads the giscus comments widget. Where those hosts are
 * unreachable (offline, a CI runner, a sandbox behind a proxy) the failed load
 * logs a console error, which fails any spec watching for them over something
 * that is not the game. Fulfilled rather than aborted, since an abort logs the
 * same error. The font falls back to the system one, which no spec reads.
 */
const THIRD_PARTY: ReadonlyArray<{ pattern: string; contentType: string }> = [
  { pattern: 'https://fonts.googleapis.com/**', contentType: 'text/css' },
  { pattern: 'https://fonts.gstatic.com/**', contentType: 'font/woff2' },
  { pattern: 'https://giscus.app/**', contentType: 'text/javascript' },
];

/** Stubs every THIRD_PARTY host. Called by both boot helpers, so every spec gets it. */
async function stubThirdParty(page: Page): Promise<void> {
  for (const { pattern, contentType } of THIRD_PARTY) {
    await page.route(pattern, (route) => route.fulfill({ status: 200, contentType, body: '' }));
  }
}

/** Creates a player and clicks through the welcome story event to reach the main menu. */
export async function startNewGame(page: Page, name = 'Testy McTestface'): Promise<void> {
  await stubThirdParty(page);
  await page.goto('/');

  // Demo splash shown over the creation form
  await page.getByRole('button', { name: 'Start Your Journey' }).click();

  await page.locator('#player-name').fill(name);
  await page.getByRole('button', { name: 'Create Player' }).click();

  // welcome_to_tennis_rpg runs dialogue, resolves, then grants two items — so the chain
  // is Continue through the dialogue and result, then Next/Got it through the item
  // popups. Drain every dialog until none remain.
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 30; i++) {
    if ((await dialog.count()) === 0) break;
    const advance = dialog
      .last()
      .getByRole('button')
      .filter({ hasText: /^(Continue|Next|Got it)$/ })
      .first();
    if (!(await advance.isVisible().catch(() => false))) break;
    await advance.click();
    await page.waitForTimeout(120);
  }

  // The walkthrough must wait for a genuinely clear screen: App renders the item
  // popups beside MainMenu with overlay={null}, so this is the regression guard.
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('tutorial-callout')).toBeVisible();
}

/** The walkthrough's steps, in order, ending on the button that closes it. */
export const WALKTHROUGH_ADVANCE = ['Next', 'Next', 'Next', "Let's Train"] as const;

/** Advances past the walkthrough so the plain menu is reachable. */
export async function dismissWalkthrough(page: Page): Promise<void> {
  await expect(callout(page)).toBeVisible();
  for (const label of WALKTHROUGH_ADVANCE) {
    await callout(page).getByRole('button', { name: label }).click();
  }
  await expect(callout(page)).toBeHidden();
}

// ---------------------------------------------------------------------------
// Save injection
// ---------------------------------------------------------------------------

/** Where zustand's persist middleware keeps the game (see gameStore's persist name). */
const PERSIST_KEY = 'tennis-rpg-game-store';

/**
 * Boots the game from a bundled test save instead of playing up to it.
 *
 * Writes the persist key before the app's first script runs, so rehydration
 * picks it up and runs the same migrations a real load would. Anything the save
 * predates is carried forward; anything below the breaking floor resets, which
 * shows up as a fresh game rather than an error (see src/debug/saves/README.md).
 *
 * @param seed  Fixes the RNG for the session, so the run is reproducible.
 */
export async function loadSave(page: Page, name: string, seed?: number): Promise<void> {
  const save = JSON.parse(
    readFileSync(new URL(`../src/debug/saves/${name}.json`, import.meta.url), 'utf8')
  ) as { storeVersion: number };

  await stubThirdParty(page);
  await page.addInitScript(
    ({ key, state }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({ state, version: (state as { storeVersion: number }).storeVersion })
      );
    },
    { key: PERSIST_KEY, state: save }
  );

  await page.goto(seed === undefined ? '/' : `/?seed=${seed}`);
  await expect(page.getByTestId('action-training')).toBeVisible();
}

// ---------------------------------------------------------------------------
// State handle
// ---------------------------------------------------------------------------

/**
 * Snapshots of the two stores, as plain data.
 *
 * `JSON.parse(JSON.stringify(...))` inside the page drops the actions and
 * leaves the state, which is both what crosses Playwright's boundary cleanly
 * and what a spec wants to assert on. The types are derived from the stores
 * themselves, so they cannot drift; the imports are type-only and erase at
 * runtime, so nothing from src is actually loaded here.
 */
type GameState = ReturnType<typeof useGameStoreType.getState>;
type MatchState = ReturnType<typeof useMatchStoreType.getState>;

/**
 * Reads the persisted game store — player, calendar, inventory, progression.
 *
 * Use this to arrange a scenario and to assert an outcome, never to make the
 * move itself. A spec that acts through the store and then checks the store
 * passes with the UI completely broken, which defeats the point of driving a
 * browser at all.
 *
 * @example
 *   const before = await readGame(page);
 *   await page.getByTestId('action-training').click();
 *   const after = await readGame(page);
 *   expect(after.currentStatus.energy).toBe(before.currentStatus.energy - 20);
 */
export async function readGame(page: Page): Promise<GameState> {
  return page.evaluate(() => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    return JSON.parse(JSON.stringify(handle.game.getState()));
  });
}

/** Same, for transient match state — score, key moment history, accumulated effects. */
export async function readMatch(page: Page): Promise<MatchState> {
  return page.evaluate(() => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    return JSON.parse(JSON.stringify(handle.match.getState()));
  });
}

/**
 * Forces a story event to run now, ignoring its prerequisites.
 *
 * This is the same action the Debug Panel's event list calls, reached through
 * the handle rather than by driving that panel's UI — arranging a scenario, not
 * playing it. Most of the 130-odd events gate on a day and a relationship level
 * no test wants to play its way to, so this is the only practical way to see
 * them all. The options a qualifying player would see are still filtered by
 * their own prerequisites, so what appears is what a real player would get.
 */
export async function triggerStoryEvent(page: Page, eventId: string): Promise<void> {
  await page.evaluate((id) => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    handle.game.getState().debugTriggerStoryEvent(id);
  }, eventId);
}

/** Every story event id the game knows about, for a sweep. */
export function allStoryEventIds(): string[] {
  return StoryEventRepository.getAllEvents().map((event) => event.id);
}

/**
 * Puts a catalogue item in the player's bag.
 *
 * Scenario setup, not a thing under test — the bundled saves carry an empty bag,
 * and buying one through the shop would make every equipment spec depend on
 * that day's stock and the player's balance. The item is looked up from the real
 * catalogue here in Node and handed across as plain data, so nothing has to
 * mirror the item list.
 */
export async function grantItem(page: Page, itemId: string): Promise<void> {
  const item = ALL_ITEMS.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`no such item "${itemId}" in the catalogue`);

  await page.evaluate((plain) => {
    const handle = window.__test__;
    if (!handle) throw new Error('window.__test__ missing — is this a dev build?');
    handle.game.getState().addItem(plain);
  }, JSON.parse(JSON.stringify(item)) as typeof item);
}

/**
 * Re-seeds the RNG mid-session, so the *next* thing that happens is
 * reproducible regardless of what the run did to get here.
 */
export async function reseed(page: Page, seed: number): Promise<void> {
  await page.evaluate((s) => {
    const handle = window.__test__;
    if (!handle) throw new Error('__test__ missing — is this a dev build?');
    handle.seed.set(s);
  }, seed);
}

// ---------------------------------------------------------------------------
// Match driving
// ---------------------------------------------------------------------------

/**
 * Sets match speed from the settings menu.
 *
 * 'instant' drops the between-point delay to zero, which is the difference
 * between a driven match taking seconds and taking the best part of a minute.
 */
export async function setMatchSpeed(
  page: Page,
  speed: 'slow' | 'normal' | 'fast' | 'instant'
): Promise<void> {
  await page.getByTitle(/Open Menu/).click();
  const button = page.getByTestId(`match-speed-${speed}`);
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId(`match-speed-${speed}`)).toBeHidden();
}

/** How a driver picks a tactic when a key moment stops play. */
export type TacticPolicy = 'first' | 'last';

export interface MatchRun {
  /** Key moments answered before the match resolved. */
  keyMoments: number;
  /** Tactic ids chosen, in order — the decision trail for a reproducible run. */
  chosen: string[];
  /** Tutorial spotlight steps advanced. Non-zero only on a tutorial match. */
  tutorialSteps: number;
}

/**
 * Plays an in-progress match to its end, answering every key moment.
 *
 * The simulation blocks on each key moment until a tactic is committed, so a
 * driver cannot miss one by polling too slowly — but it also means the match
 * never finishes on its own. Returns the decision trail so a seeded run can be
 * compared against another.
 */
export async function playMatch(
  page: Page,
  policy: TacticPolicy = 'first',
  timeoutMs = 45_000
): Promise<MatchRun> {
  const run: MatchRun = { keyMoments: 0, chosen: [], tutorialSteps: 0 };
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // Results screen — the match is over.
    if (await page.getByTestId('match-results').isVisible().catch(() => false)) break;

    // A tutorial match opens on a spotlight that *pauses the simulation*
    // (matchStore.isTutorialPaused) and, on the key moment screens, disables the
    // commit button until it is dismissed. So this has to come first: while a
    // callout is up, nothing else on screen will respond and the match cannot
    // advance on its own.
    const tutorial = page.getByTestId('tutorial-next');
    if (await tutorial.first().isVisible().catch(() => false)) {
      await tutorial.first().click();
      run.tutorialSteps++;
      continue;
    }

    const choice = page.getByTestId('km-choice');
    if (await choice.isVisible().catch(() => false)) {
      const tactics = choice.getByTestId(/^km-tactic-\d+$/);
      const count = await tactics.count();
      if (count > 0) {
        const tactic = tactics.nth(policy === 'first' ? 0 : count - 1);
        run.chosen.push((await tactic.getAttribute('data-tactic-id')) ?? '?');
        await tactic.click();
        await page.getByTestId('km-commit').click();
        run.keyMoments++;
        continue;
      }
    }

    const result = page.getByTestId('km-result-continue');
    if (await result.isVisible().catch(() => false)) {
      await result.click();
      continue;
    }

    await page.waitForTimeout(100);
  }

  return run;
}
