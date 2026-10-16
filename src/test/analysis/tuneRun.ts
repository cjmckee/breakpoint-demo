/**
 * Tune Run — play any analysis harness with config values overridden in memory.
 *
 * Tuning candidates can be measured side by side, and in parallel with other
 * runs, without editing shotThresholds.ts: the override lives in this process
 * only. Harnesses read the live config objects, so a nested value set here
 * reaches the engine. Top-level primitive constants (export const X = 5) cannot
 * be overridden this way; only values inside exported objects.
 *
 * Overrides reach shotThresholds, OVR's weights (STAT_CATEGORY_WEIGHTS.core=0.42,
 * STAT_WEIGHTS_WITHIN.core.serve=12) and the economy (ABILITY_LEVEL_PRICE.xpOnlyFrom=1).
 *
 * Run: TUNE='SERVE_CONSISTENCY.serve_second.base=-2.7;MATCH_FORM.variance=12' \
 *      PROBE=serveAndUpsetProbe npx tsx src/test/analysis/tuneRun.ts
 */

import * as thresholds from '../../config/shotThresholds';
import * as overallRating from '../../utils/overallRating';
import * as economy from '../../config/economy';

const root = { ...thresholds, ...overallRating, ...economy } as unknown as Record<string, unknown>;
for (const assignment of (process.env.TUNE ?? '').split(';').filter(Boolean)) {
  const [path, value] = assignment.split('=');
  const keys = path.trim().split('.');
  let target = root;
  for (const key of keys.slice(0, -1)) {
    const next = target[key];
    if (typeof next !== 'object' || next === null) throw new Error(`TUNE: no object at ${path}`);
    target = next as Record<string, unknown>;
  }
  const leaf = keys[keys.length - 1];
  if (typeof target[leaf] !== 'number') throw new Error(`TUNE: ${path} is not a number`);
  target[leaf] = Number(value);
  process.stderr.write(`TUNE ${path} = ${value}\n`);
}

if (!process.env.PROBE) throw new Error('PROBE=<harness name> is required');
void import(`./${process.env.PROBE}`);
