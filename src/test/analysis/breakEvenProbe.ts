/**
 * Break-Even Probe — tests the "rating tax" hypothesis.
 *
 * Raising a stat raises overallRating, which raises matchLevel (the average of
 * both players' ratings), which raises every quality threshold in the match.
 * So a stat pays off only if the quality it adds to the shots you actually hit
 * exceeds the threshold rise it inflicts on ALL your shots.
 *
 *   threshold rise (per +10 stat) = 10 × bucketWeight/5 / 2 × scale
 *     core      → 10 × 0.09 / 2 × 1.0 = +0.45
 *     technical → 10 × 0.03 / 2 × 1.0 = +0.15
 *   quality gain (per +10 stat)   = shotFrequency × primaryWeight × 10
 *
 * Break-even frequency: core ≈ 6%, technical ≈ 2.1%.
 *
 * Falsifiable prediction: `slice` is net-NEGATIVE for a player who never
 * slices (0.35% of shots) and clearly POSITIVE for a slice specialist
 * (~10% of shots) — same stat, same magnitude, opposite sign.
 *
 * Run: npm run build:node && node dist/src/test/analysis/breakEvenProbe.js
 * Env: N=150 (BO3 per row)
 * Env: N=150 (BO3 per row)
 */

import type { PlayerStats } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { playMatch } from './simMatch';

const N = Number(process.env.N ?? 150);

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function bump(base: number, bucket: keyof PlayerStats, key: string, v: number): PlayerStats {
  const s = uniformStats(base);
  (s[bucket] as unknown as Record<string, number>)[key] = v;
  return s;
}

function profileOf(
  phases: Partial<Record<GamePhase, PhaseSpec>>,
  broad: ArchetypeProfile['broad'] = null,
): ArchetypeProfile {
  return { broad, phases, specializationPoints: 0, respecTokens: 0 };
}

function runMatch(p: PlayerProfile, o: PlayerProfile): [number, number] {
  const { points } = playMatch(p, o);
  return [points.filter((pt) => pt.winner === 'player').length, points.length];
}

function trial(bucket: keyof PlayerStats, key: string, prof: ArchetypeProfile): number {
  let won = 0,
    tot = 0;
  for (let i = 0; i < N; i++) {
    const p = new PlayerProfile('p', 'P', bump(50, bucket, key, 90), prof);
    const o = new PlayerProfile('o', 'O', uniformStats(50), prof);
    const [w, t] = runMatch(p, o);
    won += w;
    tot += t;
  }
  return (won / tot) * 100 - 50;
}

const SAMURAI = profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner');
const DOWNHILL = profileOf({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker');
const NONE = profileOf({});

function f(x: number): string {
  return (x >= 0 ? '+' : '') + x.toFixed(2);
}

function main(): void {
  console.log(
    `\n╔══ BREAK-EVEN PROBE — point-win-% from taking one stat 50 → 90 (${N} BO3 each) ══╗\n`,
  );
  const rows: Array<[string, string, number, string]> = [];

  rows.push([
    'slice (technical)',
    'never slices (0.3% of shots)',
    trial('technical', 'slice', NONE),
    'predict NEGATIVE',
  ]);
  rows.push([
    'slice (technical)',
    'slice specialist (~10% of shots)',
    trial('technical', 'slice', SAMURAI),
    'predict POSITIVE',
  ]);
  rows.push([
    'net (core)',
    'unspecialized (1.3%)',
    trial('core', 'net', NONE),
    'predict ~0 / negative',
  ]);
  rows.push(['net (core)', 'net specialist (2.0%)', trial('core', 'net', DOWNHILL), 'predict ~0']);
  rows.push([
    'return (core)',
    'unspecialized (44%)',
    trial('core', 'return', NONE),
    'control: far above break-even',
  ]);

  const w = 20;
  console.log(
    ['stat'.padEnd(w), 'context'.padEnd(34), 'Δ pt-win%'.padStart(10), '  expectation'].join(''),
  );
  console.log('-'.repeat(w + 34 + 10 + 30));
  for (const [s, c, v, e] of rows) {
    console.log([s.padEnd(w), c.padEnd(34), f(v).padStart(10), '  ' + e].join(''));
  }
  console.log('\nIf the two slice rows have opposite signs, the rating tax is real:');
  console.log('the same +40 investment helps or hurts purely as a function of how');
  console.log('often the build actually hits that shot.\n');
}

main();
