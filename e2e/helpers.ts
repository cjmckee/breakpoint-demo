import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * Shared setup for specs that need a real player past the onboarding gate.
 * Extracted from earlyGameGuidance.spec.ts once a second spec needed it.
 */

/** The walkthrough card. Scoped because "Next" also appears elsewhere on the menu. */
export const callout = (page: Page) => page.getByTestId('tutorial-callout');

/** Creates a player and clicks through the welcome story event to reach the main menu. */
export async function startNewGame(page: Page, name = 'Testy McTestface'): Promise<void> {
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
  timeoutMs = 120_000
): Promise<MatchRun> {
  const run: MatchRun = { keyMoments: 0, chosen: [] };
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // Results screen — the match is over.
    if (await page.getByTestId('match-results').isVisible().catch(() => false)) break;

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
