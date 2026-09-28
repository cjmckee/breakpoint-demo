/**
 * Dev-only handle onto the running game, for e2e.
 *
 * Vite bundles every module into a closure, so a Playwright `page.evaluate`
 * has no way to reach the stores. Without this, a spec can only read what the
 * UI happens to render — asserting "energy dropped by 20" means finding the
 * energy pill and parsing its text, which breaks the next time that pill is
 * restyled, and anything the UI does *not* render (accumulated match effects,
 * storyEventTriggerChance, an item's rolled modifiers) is unreachable entirely.
 *
 * Gated on `import.meta.env.DEV`, like the Debug Panel, so it never ships.
 *
 * ## Arrange and assert through this; act through the UI
 *
 * The handle can drive the game as well as read it, and that is the one way to
 * misuse it. A spec that sets up state by calling store actions and then
 * asserts on store state will pass with the UI completely broken — it has
 * stopped being a playtest and become a slow unit test. Use it to reach a
 * scenario and to check the outcome; make the moves themselves with clicks.
 */

import { useGameStore } from '../stores/gameStore';
import { useMatchStore } from '../stores/matchStore';
import { setSeed, clearSeed, getSeed } from '../core/random';

export interface TestHandle {
  /** The persisted game store — player, calendar, inventory, progression. */
  game: typeof useGameStore;
  /** Transient match state — score, key moment history, accumulated effects. */
  match: typeof useMatchStore;
  /**
   * Re-seed mid-session. Seeding fixes the sequence, not which code draws from
   * it, so a session seeded at boot diverges as soon as a run clicks something
   * different. Re-seeding immediately before the match (or roll) you want to
   * reproduce is what makes that piece repeatable.
   */
  seed: { set: typeof setSeed; clear: typeof clearSeed; get: typeof getSeed };
}

declare global {
  interface Window {
    /** Present only in dev builds. See src/debug/testHandle.ts. */
    __test__?: TestHandle;
  }
}

/** Installs the handle. No-op outside dev. */
export function installTestHandle(): void {
  if (!import.meta.env.DEV) return;
  window.__test__ = {
    game: useGameStore,
    match: useMatchStore,
    seed: { set: setSeed, clear: clearSeed, get: getSeed },
  };
}
