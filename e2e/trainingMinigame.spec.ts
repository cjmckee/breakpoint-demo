import { test, expect, type Page } from '@playwright/test';
import { startNewGame, dismissWalkthrough, offerDrill, readGame } from './helpers';
import { DRILL_ORDER, DRILLS, trainingOffer } from '../src/game/TrainingSystem';
import { trainingPayout } from '../src/game/CurrencyIncome';
import type { DrillId } from '../src/minigames/types';

/**
 * Drives the training screen and its minigames end to end.
 *
 * The unit checks cover pure logic and cannot mount a component, so nothing else
 * exercises the path a session actually takes: the slot's roll decides the cards,
 * the registry resolves a drill to a component, the component mounts,
 * useMinigameRounds reports a MinigameScore, and the training screen turns that
 * score into a session payout. Every one of those links is a plain function call
 * that typechecks whether or not it is wired up.
 */

async function freshPlayer(page: Page): Promise<void> {
  await startNewGame(page);
  await dismissWalkthrough(page);
}

/** Opens `drill` from the training screen, on its start gate. */
async function openDrill(page: Page, drill: DrillId): Promise<void> {
  await offerDrill(page, drill);
  await page.getByTestId('action-training').click();
  await page.getByTestId(`training-drill-${drill}`).click();
  await expect(page.getByRole('heading', { name: DRILLS[drill].name })).toBeVisible();
}

test('the slot offers the three drills its roll names, paying what they pay', async ({ page }) => {
  await freshPlayer(page);
  const game = await readGame(page);
  const expected = trainingOffer(
    game.player!.id,
    game.calendar.currentDay,
    game.calendar.currentTimeSlot,
  ).map((o) => o.drill);

  await page.getByTestId('action-training').click();
  const cards = page.locator('[data-testid="training-offer"] [data-drill]');
  await expect(cards).toHaveCount(3);
  expect(await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-drill')))).toEqual(
    expected,
  );
  // Each card shows a clean session's pay, one currency a line, from the game's own payout.
  for (const drill of expected) {
    const pay = page.getByTestId(`training-drill-pay-${drill}`);
    for (const [c, n] of Object.entries(trainingPayout(drill, 3))) {
      await expect(pay.locator(`[data-currency="${c}"]`)).toHaveAttribute('data-amount', String(n));
    }
  }

  // Leaving and coming back in the same slot offers the same three.
  await page.getByTestId('screen-back').click();
  await page.getByTestId('action-training').click();
  expect(await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-drill')))).toEqual(
    expected,
  );
});

test('a training minigame mounts, scores, and pays out a session', async ({ page }) => {
  await freshPlayer(page);
  await openDrill(page, 'toss_and_strike');

  // Quick Sim is only offered until the player passes the start gate, so its
  // disappearance is proof the game reported its start rather than merely rendering.
  const quickSim = page.getByTestId('training-quick-sim');
  await expect(quickSim).toBeVisible();

  // The start gate is the shell's, not the game's — every minigame opens on it.
  await page.getByTestId('minigame-start').click();
  await expect(quickSim).toBeHidden();

  // Space commits an attempt in this game. Whether these land is irrelevant —
  // all three attempts always play out, and a miss scores as legitimately as a hit.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  }

  // Reaching this modal means the score survived the whole chain.
  await expect(page.getByTestId('training-result-currency')).toBeVisible({ timeout: 5000 });
});

test('a clean Split-Step Sprint pays three reps', async ({ page }) => {
  await freshPlayer(page);
  const before = (await readGame(page)).player!.wallet;
  await openDrill(page, 'split_step');
  await page.getByTestId('minigame-start').click();

  // Play each rep the way a player would: wait for the arrow, push it, mash the
  // button that lights. The arena names the cue so the spec need not read the drawing.
  const arena = page.getByTestId('sprint-arena');
  for (let rep = 0; rep < 3; rep++) {
    await expect(arena).toHaveAttribute('data-stage', 'wait');
    await expect(arena).not.toHaveAttribute('data-cue', '', { timeout: 3000 });
    const direction = await arena.getAttribute('data-cue');
    await page.getByTestId(`sprint-dir-${direction}`).dispatchEvent('pointerdown');
    await expect(arena).toHaveAttribute('data-stage', 'mash');
    const button = await arena.getAttribute('data-button');
    for (let i = 0; i < 8; i++) {
      await page.getByTestId(`sprint-button-${button}`).dispatchEvent('pointerdown');
    }
  }

  await expect(page.getByTestId('training-result-currency')).toBeVisible({ timeout: 5000 });
  const last = (await readGame(page)).currentStatus.lastActivity;
  expect(last?.type).toBe('training');
  if (last?.type !== 'training') return;
  expect(last.drill).toBe('split_step');
  expect(last.reps, 'three clean sprints').toBe(3);
  expect(last.currencyGained).toEqual(trainingPayout('split_step', 3));
  const after = (await readGame(page)).player!.wallet;
  expect(after.power - before.power).toBe(last.currencyGained.power);
  expect(after.quickness - before.quickness).toBe(last.currencyGained.quickness);
});

test('every drill resolves to a mountable minigame', async ({ page }) => {
  // The registry is a Record keyed on MinigameId, so a missing entry is a compile
  // error — but an id pointing at the wrong component is not. Each drill should
  // open a game under its own name with the shell's start gate.
  await freshPlayer(page);
  for (const drill of DRILL_ORDER) {
    await openDrill(page, drill);
    await expect(page.getByTestId('minigame-start')).toBeVisible();

    // Backing out returns to the menu's training tile without spending the slot,
    // so all six can be checked in one session's worth of energy.
    await page.getByTestId('screen-back').click();
    await page.getByTestId('screen-back').click();
  }
});
