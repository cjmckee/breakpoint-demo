/**
 * The simulation's source of randomness.
 *
 * Everything that rolls dice — shot outcomes, item drops, story triggers, the
 * minigames — calls `random()` here rather than `Math.random()` directly. That
 * single indirection is what makes a run reproducible: seed the stream and the
 * same inputs produce the same match, the same loot and the same event.
 *
 * Unseeded it *is* `Math.random`, so the shipped game is unchanged. A seed is
 * something a harness or the Debug Panel opts into.
 *
 * Lives in `core/` alongside `trace.ts` and for the same reason: it works
 * unchanged under both Vite and `tsx`, because nothing here touches
 * `import.meta` or `process`.
 *
 * ## Reproducibility is per-stream, not global
 *
 * Seeding fixes the *sequence* of numbers, not which code draws from it. Two
 * runs match only if they also make the same draws in the same order — so a
 * seeded match replays exactly, but a seeded *session* diverges the moment a
 * player clicks something different, because every later draw has shifted by
 * one. Re-seed at the start of the thing you want to reproduce.
 */

/** Active generator. `null` means "unseeded", i.e. delegate to Math.random. */
let generator: (() => number) | null = null;
let activeSeed: number | null = null;

/**
 * mulberry32 — a 32-bit PRNG that is small, fast and well-distributed enough
 * for simulation dice. Not cryptographic, and it does not need to be.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A float in [0, 1). Drop-in replacement for `Math.random`.
 *
 * Call this rather than `Math.random()` anywhere the result affects game state.
 * Cosmetic-only randomness (animation jitter, decorative particles) can use
 * `Math.random` directly — keeping it out of the stream means a replay does not
 * hinge on how many sparkles were drawn.
 */
export function random(): number {
  return generator ? generator() : Math.random();
}

/** Start a deterministic stream. The same seed always yields the same sequence. */
export function setSeed(seed: number): void {
  activeSeed = seed >>> 0;
  generator = mulberry32(activeSeed);
}

/** Return to real randomness. */
export function clearSeed(): void {
  activeSeed = null;
  generator = null;
}

/** The active seed, or null when unseeded. */
export function getSeed(): number | null {
  return activeSeed;
}

/** True while a seed is in force. */
export function isSeeded(): boolean {
  return generator !== null;
}
