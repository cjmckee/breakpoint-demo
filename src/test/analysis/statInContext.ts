/**
 * Stat In Context — what is a stat worth to the player who actually uses it?
 *
 * statSensitivity randomises builds, which is the right way to ask "what is this
 * stat worth on average" but the wrong way to judge a conditional stat. `net`
 * and `slice` only pay off for builds that go to the net or slice, and most
 * randomly generated builds do neither, so both read near the bottom of that
 * table by construction.
 *
 * This measures each stat inside the archetype built around it, against the same
 * stat in a build that ignores it, with the unconditional cores as controls. If
 * `net` is worth a core slot, the number that has to hold up is its value to a
 * net player — not its average across players who never come forward.
 *
 * Run: npm run build:node && node dist/src/test/analysis/statInContext.js
 * Env: N=120 (BO3 per cell)  BASE=50  BUMP=75
 */

import type { PlayerStats } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { playMatch } from './simMatch';

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

function withStat(
  base: number,
  bucket: keyof PlayerStats,
  key: string,
  value: number,
): PlayerStats {
  const s = uniform(base);
  (s[bucket] as unknown as Record<string, number>)[key] = value;
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

/**
 * Both players carry the same archetype so the only difference is the stat.
 * Returns the bumped player's point-win% minus 50.
 */
function trial(
  bucket: keyof PlayerStats,
  key: string,
  prof: ArchetypeProfile,
  base: number,
  bump: number,
  n: number,
): number {
  let won = 0,
    tot = 0;
  for (let i = 0; i < n; i++) {
    const p = new PlayerProfile('p', 'P', withStat(base, bucket, key, bump), prof);
    const o = new PlayerProfile('o', 'O', uniform(base), prof);
    const [w, t] = runMatch(p, o);
    won += w;
    tot += t;
  }
  return (won / tot) * 100 - 50;
}

const NONE = profileOf({});
const NET = profileOf({ net: { path: 'net_downhill', tier: 3 } }, 'net_attacker');
const SAMURAI = profileOf({ backhand: { path: 'bh_samurai', tier: 3 } }, 'baseliner');
/**
 * The most slice a build can reach. `fs_curveball` carries the game's only
 * SLICE_PREFERENCE_FOREHAND, so without it slice is a backhand-only stat.
 */
const SLICER = profileOf(
  {
    backhand: { path: 'bh_samurai', tier: 3 },
    first_serve: { path: 'fs_curveball', tier: 3 },
  },
  'baseliner',
);

const f = (x: number): string => (x >= 0 ? '+' : '') + x.toFixed(2);

function main(): void {
  const N = Number(process.env.N ?? 1000);
  const BASE = Number(process.env.BASE ?? 50);
  const BUMP = Number(process.env.BUMP ?? 75);

  console.log(`\n╔══ STAT IN CONTEXT — ${BASE} → ${BUMP} on one stat, ${N} BO3 per cell ══╗`);
  console.log('\nBoth players carry the same archetype, so the only difference is the stat.');
  console.log('A conditional stat should be near zero in the build that ignores it and');
  console.log('clearly positive in the build made for it.\n');

  // ONLY=net,forehand narrows the table when only one row is in question.
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
  const specs: Array<[string, string, keyof PlayerStats, string, ArchetypeProfile]> = [
    ['net', 'no specialization', 'core', 'net', NONE],
    ['net', 'net_downhill T3', 'core', 'net', NET],
    ['slice', 'no specialization', 'technical', 'slice', NONE],
    ['slice', 'bh_samurai T3', 'technical', 'slice', SAMURAI],
    ['slice', 'max slice build', 'technical', 'slice', SLICER],
    ['strength', 'no specialization', 'physical', 'strength', NONE],
    ['placement', 'no specialization', 'technical', 'placement', NONE],
    ['tactics', 'no specialization', 'mental', 'tactics', NONE],
    ['serve', 'no specialization', 'core', 'serve', NONE],
    ['return', 'no specialization', 'core', 'return', NONE],
    ['forehand', 'no specialization', 'core', 'forehand', NONE],
    ['backhand', 'no specialization', 'core', 'backhand', NONE],
    ['spin', 'no specialization', 'technical', 'spin', NONE],
  ];

  // Same stat on both sides: the honest zero for this sample size.
  const control = trial('core', 'serve', NONE, BASE, BASE, N);

  const rows: Array<[string, string, number]> = specs
    .filter(([stat]) => !only || only.has(stat))
    .map(([stat, build, bucket, key, prof]) => [
      stat,
      build,
      trial(bucket, key, prof, BASE, BUMP, N),
    ]);

  console.log(['stat'.padEnd(12), 'build'.padEnd(22), 'Δ pt-win%'.padStart(10)].join(''));
  console.log('-'.repeat(44));
  console.log(
    ['CONTROL'.padEnd(12), `${BASE} v ${BASE}, no bump`.padEnd(22), f(control).padStart(10)].join(
      '',
    ),
  );
  console.log('-'.repeat(44));
  for (const [stat, build, v] of rows) {
    console.log([stat.padEnd(12), build.padEnd(22), f(v).padStart(10)].join(''));
  }
  console.log('\nThe unconditional cores are the bar a core stat has to clear for the');
  console.log('players who use it. Nothing within the CONTROL row of zero is a result.\n');
}

main();
