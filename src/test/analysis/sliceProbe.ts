/**
 * Slice Probe — why is `slice` the weakest stat, and which lever moves it?
 *
 * `populationProbe` rules out the obvious explanation. Slice is not rare: it is
 * 10% of rally shots and 4.8% of the shot-quality budget, more exposure than
 * `net`, which measures higher. It is paid and it does not decide much.
 *
 * `shotCurve` locates the problem, and it is narrower than "the defensive slice
 * is a bad shot". Against a same-level opponent, across the whole 20-85 range:
 *
 *   shot              p(in)            p(win)
 *   defensive slice   69.4% -> 99.6%   0.9% -> 4.0%
 *   slice             67.9% -> 99.3%   1.9% -> 9.2%
 *   forehand          67.5% -> 95.1%   4.5% -> 19.9%
 *
 * Reliability is not the issue — the defensive slice gains as much in-play
 * probability as a forehand does. The issue is that it cannot convert any of
 * that into ENDING points: 3 points of winner probability across the entire
 * scale against the forehand's 15. And 73% of all slice usage is that shot, so
 * the stat's average outcome is "the ball comes back, from a losing position".
 *
 * Three candidate levers, measured here against the shipped config:
 *
 *   REQ    raise RELATIVE_QUALITY_REQUIREMENTS for the defensive slice off 0.25,
 *          so reliability stops saturating and the stat keeps buying something.
 *   FLOOR  lower MINIMUM_WINNER_THRESHOLDS for the defensive slice off 105, so a
 *          very good scramble can occasionally end the point. The audit put that
 *          floor there deliberately — at 44.6% winners the defensive slice was
 *          an expert's second-best point-ender — so this is the risky one.
 *   BAND   give slice a STAT_MODIFIER_BANDS entry, paying it on defensive shots
 *          and from a defensive court position. This is the only lever that pays
 *          the stat somewhere other than the shot that shares its name, and the
 *          only one that reads live context rather than shot family.
 *
 * Each cell is the same one-at-a-time design statInContext uses, with a
 * same-versus-same CONTROL so the noise floor is visible.
 *
 * The 'no …' and 'pre-fix' levers switch the parts of SLICE_TUNING and the chip
 * return back off; see docs/research/slice-at-tier-1.md for every lever tried
 * at tier 1, including the ones that did not help and were removed.
 *
 * Run: npx tsx src/test/analysis/sliceProbe.ts
 * Env: N=800 (BO3 per cell)  BASE=50  BUMP=75  TIER=3  LEVERS=<regex over labels>
 *      Tier-1 question: BASE=30 BUMP=50 TIER=1
 */

import type { PlayerStats } from '../../types';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import {
  RELATIVE_QUALITY_REQUIREMENTS,
  MINIMUM_WINNER_THRESHOLDS,
  STAT_MODIFIER_BANDS,
  SLICE_TUNING,
  RETURN_COMPOSITE_WEIGHTS,
  SHOT_COMPOSITE_WEIGHTS,
} from '../../config/shotThresholds';
import type { SpecialtyTier } from '../../types/archetype';
import { playMatch } from './simMatch';

const profileOf = (
  phases: Partial<Record<GamePhase, PhaseSpec>>,
  broad: ArchetypeProfile['broad'] = null,
): ArchetypeProfile => ({ broad, phases, specializationPoints: 0, respecTokens: 0 });

/**
 * Specialty tier for the slice builds. 3 reproduces stat-channels §10; 1 is the
 * most a tier-1 player can hold, since gameStore blocks upgrades below tier 2.
 */
const TIER = Number(process.env.TIER ?? 3) as SpecialtyTier;

const NONE = profileOf({});
const SAMURAI = profileOf({ backhand: { path: 'bh_samurai', tier: TIER } }, 'baseliner');
/** The most slice a build can reach: fs_curveball carries the only forehand slice. */
const SLICER = profileOf(
  {
    backhand: { path: 'bh_samurai', tier: TIER },
    first_serve: { path: 'fs_curveball', tier: TIER },
  },
  'baseliner',
);

function uniform(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function withSlice(base: number, slice: number): PlayerStats {
  const s = uniform(base);
  s.technical.slice = slice;
  return s;
}

function runMatch(p: PlayerProfile, o: PlayerProfile): [number, number] {
  const { points } = playMatch(p, o);
  return [points.filter((pt) => pt.winner === 'player').length, points.length];
}

function trial(prof: ArchetypeProfile, base: number, bump: number, n: number): number {
  let won = 0,
    tot = 0;
  for (let i = 0; i < n; i++) {
    const [w, t] = runMatch(
      new PlayerProfile('p', 'P', withSlice(base, bump), prof),
      new PlayerProfile('o', 'O', uniform(base), prof),
    );
    won += w;
    tot += t;
  }
  return (won / tot) * 100 - 50;
}

// ─── Config levers ───────────────────────────────────────────

const DEF_SLICE = ['defensive_slice_forehand', 'defensive_slice_backhand'] as const;
const SHIPPED = {
  req: RELATIVE_QUALITY_REQUIREMENTS.defensive_slice_backhand,
  floor: MINIMUM_WINNER_THRESHOLDS.defensive_slice_backhand,
  sliceTuning: { ...SLICE_TUNING },
  returnWeights: { ...RETURN_COMPOSITE_WEIGHTS },
  groundstroke: { ...SHOT_COMPOSITE_WEIGHTS.groundstroke },
};

type Lever = { label: string; apply: () => void };

function restore(): void {
  for (const s of DEF_SLICE) {
    RELATIVE_QUALITY_REQUIREMENTS[s] = SHIPPED.req;
    MINIMUM_WINNER_THRESHOLDS[s] = SHIPPED.floor;
  }
  delete (STAT_MODIFIER_BANDS as unknown as Record<string, number>).sliceDefense;
  Object.assign(SLICE_TUNING, SHIPPED.sliceTuning);
  const ret = RETURN_COMPOSITE_WEIGHTS;
  for (const k of Object.keys(ret)) delete ret[k];
  Object.assign(ret, SHIPPED.returnWeights);
  SHOT_COMPOSITE_WEIGHTS.groundstroke = { ...SHIPPED.groundstroke };
}

const levers: Lever[] = [
  { label: 'shipped', apply: () => {} },
  {
    label: `REQ ${SHIPPED.req} -> 0.40`,
    apply: () => {
      for (const s of DEF_SLICE) RELATIVE_QUALITY_REQUIREMENTS[s] = 0.4;
    },
  },
  {
    label: `REQ ${SHIPPED.req} -> 0.55`,
    apply: () => {
      for (const s of DEF_SLICE) RELATIVE_QUALITY_REQUIREMENTS[s] = 0.55;
    },
  },
  {
    label: `FLOOR ${SHIPPED.floor} -> 85`,
    apply: () => {
      for (const s of DEF_SLICE) MINIMUM_WINNER_THRESHOLDS[s] = 85;
    },
  },
  {
    label: `FLOOR ${SHIPPED.floor} -> 70`,
    apply: () => {
      for (const s of DEF_SLICE) MINIMUM_WINNER_THRESHOLDS[s] = 70;
    },
  },
  // The three parts of SLICE_TUNING, switched back off one at a time and all
  // together. 'pre-fix' is the shipped config before slice-at-tier-1.md.
  {
    label: 'no chip return',
    apply: () => {
      const ret = RETURN_COMPOSITE_WEIGHTS;
      ret.return = SHIPPED.returnWeights.return + SHIPPED.returnWeights.slice;
      delete ret.slice;
    },
  },
  { label: 'no band floor', apply: () => (SLICE_TUNING.supportFloor = null) },
  { label: 'no selection', apply: () => (SLICE_TUNING.selectionPerStatPoint = 0) },
  {
    label: 'pre-fix',
    apply: () => {
      const ret = RETURN_COMPOSITE_WEIGHTS;
      ret.return = SHIPPED.returnWeights.return + SHIPPED.returnWeights.slice;
      delete ret.slice;
      SLICE_TUNING.supportFloor = null;
      SLICE_TUNING.selectionPerStatPoint = 0;
    },
  },
  // Slice as a share of the groundstroke composite instead: helps the
  // bh_samurai build, not the unspecialized one (slice-at-tier-1.md §4).
  {
    label: 'COMP groundstroke 0.1',
    apply: () => {
      SHOT_COMPOSITE_WEIGHTS.groundstroke = {
        ...SHIPPED.groundstroke,
        primary: SHIPPED.groundstroke.primary - 0.1,
        slice: 0.1,
      };
    },
  },
];

const f = (x: number): string => (x >= 0 ? '+' : '') + x.toFixed(2);

function main(): void {
  const N = Number(process.env.N ?? 800);
  const BASE = Number(process.env.BASE ?? 50);
  const BUMP = Number(process.env.BUMP ?? 75);

  console.log(`\n╔══ SLICE PROBE — which lever makes the slice stat pay? ══╗`);
  console.log(`\n   slice ${BASE} -> ${BUMP}, everything else uniform ${BASE}, ${N} BO3 per cell.`);
  console.log(`   Both players carry the same archetype, so only the stat differs.`);
  console.log(`   The BAND lever is not simulated here — it needs a code change in`);
  console.log(`   ShotCalculator, not just a constant. See the header.`);
  console.log(`   Specialty tier ${TIER}.\n`);

  const builds: Array<[string, ArchetypeProfile]> = [
    ['no specialization', NONE],
    [`bh_samurai T${TIER}`, SAMURAI],
    ['max slice build', SLICER],
  ];
  const only = process.env.LEVERS ? new RegExp(process.env.LEVERS) : null;

  const head = [
    'lever'.padEnd(20),
    'CONTROL'.padStart(10),
    ...builds.map(([n]) => n.slice(0, 16).padStart(18)),
  ].join('');
  console.log(head);
  console.log('-'.repeat(head.length));

  for (const lever of levers.filter((l) => !only || only.test(l.label))) {
    restore();
    lever.apply();
    const control = trial(NONE, BASE, BASE, N);
    const cells = builds.map(([, prof]) => trial(prof, BASE, BUMP, N));
    console.log(
      [
        lever.label.padEnd(20),
        f(control).padStart(10),
        ...cells.map((c) => f(c).padStart(18)),
      ].join(''),
    );
  }
  restore();

  console.log('\nCONTROL is the same build on both sides at this lever setting — the noise');
  console.log('floor for its row. A lever earns its place by moving the build columns');
  console.log('further than the control column moves.\n');
}

main();
