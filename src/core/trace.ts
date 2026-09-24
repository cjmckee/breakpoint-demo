/**
 * Shot-by-shot simulation tracing.
 *
 * The simulation narrates everything it computes — the primary stat, each
 * modifier, the sigmoid midpoints and the outcome cascade for every shot. That
 * trace is the whole point of a transparent simulation when you are debugging a
 * single point, and unusable noise the rest of the time: one match emits tens of
 * thousands of lines, which is why every analysis harness in `src/test` reassigns
 * `console.log` to a no-op before it runs one.
 *
 * Off by default, so the shipped game does not narrate matches to the console.
 * Turn it on from the dev Debug Panel in the browser, or with `setTracing(true)`
 * from a harness that wants to read one point in detail.
 *
 * Lives in `core/` so it works unchanged under both Vite and `tsx` — nothing here
 * touches `import.meta` or `process`.
 */

let tracing = false;

/** True while simulation tracing is on. Guard blocks that build expensive arguments. */
export function isTracing(): boolean {
  return tracing;
}

export function setTracing(on: boolean): void {
  tracing = on;
}

/** Write one trace line. A no-op unless tracing is on. */
export function trace(...args: unknown[]): void {
  if (tracing) {
    console.log(...args);
  }
}
