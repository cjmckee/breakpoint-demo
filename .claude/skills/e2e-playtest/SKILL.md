---
name: e2e-playtest
description: Write, extend or debug the Playwright e2e specs in e2e/ — a new spec for a feature or a bug, a playtest scenario (walk a player to day N, sweep a data set, soak run), or a failing/hanging spec. Use whenever the user asks for an e2e test, a Playwright test, a playtest, or "check that a player can still ...".
---

# E2E playtest specs

The e2e suite drives the real game in a browser and checks the model underneath
it. This skill is how to add to it without re-deriving the conventions each time.
Read `e2e/helpers.ts` and `e2e/bot.ts` before writing anything — they are short,
and most of what a new spec needs already exists there.

## The one rule: arrange and assert through the handle, act through the UI

`window.__test__` (dev builds only, `src/debug/testHandle.ts`) exposes both
stores and the RNG seed. It can drive the game as well as read it, and that is
the way to misuse it: a spec that makes its moves with store actions and then
asserts on the store passes with the UI completely broken.

- **Arrange**: `loadSave`, `grantItem`, `triggerStoryEvent`, `reseed`, or the bot.
  Fine to do through the handle — it is scenario setup, not the thing under test.
- **Act**: clicks, via `getByTestId`. Always.
- **Assert**: `readGame` / `readMatch` for the model, *and* the screen where the
  UI is supposed to agree (a `data-*` attribute, a caption). Asserting only one
  side misses the class of bug where they diverge.

Where a real game function computes the expected value (e.g.
`ItemManager.getTotalPassiveBoosts`, `calculateOverallRating`), import it rather
than reimplementing it, so the expectation cannot drift. Only import pure modules
with no React/store dependencies — anything else pulls the app into Node.

## Getting to the scenario

Pick the cheapest route that is still honest:

| Need | Use |
| --- | --- |
| A brand-new player on the menu | `startNewGame(page)` then `dismissWalkthrough(page)` |
| A mid-game player, fixed state | `loadSave(page, 'save-day7-1', seed)` — saves in `src/debug/saves/` |
| "Can a player still *reach* X by playing?" | `runBot(page, { untilDay })` from `e2e/bot.ts` |
| A specific story event | `triggerStoryEvent(page, id)` then `drainToIdle(page)` |
| Every event / item / whatever | enumerate the real data (`allStoryEventIds()`, `ALL_ITEMS`) and shard into batches — see `storyEvents.spec.ts` |
| An item in the bag | `grantItem(page, itemId)` |
| A match | `setMatchSpeed(page, 'instant')`, click into it, `playMatch(page)` |
| A reproducible roll | `?seed=N` on load (`loadSave`'s 3rd arg), or `reseed(page, N)` right before the roll |

If a scenario needs setup that none of these cover and a second spec is likely
to want it, add a helper to `e2e/helpers.ts` with a doc comment saying why it
exists — don't inline handle calls in a spec.

A save is a snapshot of a `storeVersion`. If `loadSave` lands on a fresh game
instead of the menu, the save is below the migration floor; see
`src/debug/saves/README.md` rather than patching around it.

## Test ids

Follow the **Test IDs** section of `CLAUDE.md` — it is the contract. In short:
`surface-element`, kebab-case, named for the role not the label; `Button`,
`ActionTile` and `Modal` take a `testId` prop, so use that before a raw
`data-testid`; collections suffix a stable key and carry `data-*` for anything a
driver needs to choose on; two copies of the same action get two ids.

Missing a test id is the normal case for a new spec. Add it to the component in
the same change, and list the ids you added in the commit message. Never select
by visible text or CSS class where a test id could exist — copy changes, and
several buttons are emoji-only.

## Writing the spec

1. **Lead with a doc comment saying what could go wrong that this catches** and
   why it isn't catchable more cheaply. The existing specs all do this; match
   them. Inline comments explain *why* an assertion is there ("an empty shop
   would pass a 'the screen opened' check while being useless"), not what it does.
2. **Enabled is not reachable.** After asserting a button is enabled, click it
   and check the phase changed (`readGame(page).gamePhase.type`). After asserting
   a resource was spent, check it bought something.
3. **Assert the negative too** where it matters: the item left the bag *and*
   arrived in the slot; the gate is shut *and* says so.
4. **Give `expect` a message** on any assertion whose failure would otherwise
   be opaque (`expect(x, 'save should start with a racquet equipped')`).
5. **One walk over many small tests** when the expensive part is getting there
   (bot runs). Many small tests when setup is a cheap `loadSave`.
6. **No balance thresholds.** Soak-style runs print numbers (`formatLog`) and
   fail only on softlocks, unhandled phases and console errors. A threshold
   would fail every deliberate rebalance.

## Timeouts and hangs

The config sets `timeout: 60s`, `actionTimeout: 10s`, `expect.timeout: 10s`.
Keep it tight:

- A spec that genuinely needs longer calls `test.setTimeout(...)` at the top
  with a comment saying why (bot runs usually do — `progression.spec.ts` uses 120s).
- Never probe for an element that may not be on this screen with
  `isEnabled()`/`isVisible()` alone — they auto-wait and swallow the timeout.
  Guard with `count()` first, as `usable()` in `bot.ts` does, or use
  `.isVisible().catch(() => false)` for a presence check.
- A bare timeout with no diagnostic almost always means one of the above. Look at
  `test-results/*/error-context.md` and the screenshot before changing timings.
- A `Failed to load resource` console error from a host that isn't
  `localhost` is a third-party load, not a game bug. Add the host to
  `THIRD_PARTY` in `e2e/helpers.ts` rather than filtering the error in a spec.
- If the bot throws on an **unhandled phase**, add the case to `bot.ts`; don't
  work around it in the spec. If it reports a **softlock**, that is probably a
  real game bug — investigate it, don't raise `maxActions`.

## Running

```bash
npm run typecheck:e2e                                   # always, first — esbuild does not typecheck specs
npx playwright test e2e/<name>.spec.ts --project=chromium   # iterate on one spec
npx playwright test --project=chromium                  # whole suite, before committing
npm test                                                # typecheck + the Node checks
```

In a cloud sandbox where `npx playwright test` says browsers need installing,
**do not run `playwright install`**. Point at the preinstalled Chromium instead:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test ...
```

Run the `mobile` project too when the change touches layout (the menu collapses
hard below `sm`).

A new spec should be run at least twice before committing; a flaky spec is worse
than none. If it depends on randomness, seed it.

## If the spec finds a bug

That is the point of it. Fix the game bug in the same change when it is small
and clearly in scope, describe it in the commit body ("The soak run found ..."),
and keep the assertion that caught it. If it is not small, tell the user what
the spec found and ask before widening the change. Never weaken or skip an
assertion to get a spec green.

## Committing

Type `test:` (or `feat:` if the change is mainly new test ids / a handle
capability). The body explains what the spec protects against and why it is
shaped the way it is, lists test ids added, and names any bug it found — see
`git log --grep '^test:'` for the house style.

## Checklist

- [ ] Read `e2e/helpers.ts` and `e2e/bot.ts`; reused what exists
- [ ] Setup through the handle/saves/bot; every move a click on a test id
- [ ] Asserts both the model and the screen where they should agree
- [ ] New test ids follow CLAUDE.md naming; listed in the commit
- [ ] Doc comment on the spec says what it catches
- [ ] `npm run typecheck:e2e` clean; spec passes twice
- [ ] No arbitrary `waitForTimeout` as a synchronisation mechanism; no bare probes that can hang
