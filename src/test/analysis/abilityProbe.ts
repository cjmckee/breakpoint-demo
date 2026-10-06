/**
 * Ability Probe — what is an ability worth, in stat points?
 *
 * Layer 1 of the ability plan (stat-currency-progression.md §9.12): price each
 * match ability against the stat points it competes with for Mind, on a fixed
 * build, so the career sim can use a table instead of noisy live estimates.
 *
 * Paired design: match i of every condition starts from the same seed
 * (core/random setSeed), so a condition and the baseline share their luck until
 * the condition's effect first changes a shot. The difference is read per
 * match, which is what makes ±0.2-point effects measurable at a few hundred
 * matches.
 *
 * Conditions: the baseline build; the build holding one ability (effects ×
 * LEVEL, as the ability data intends — the engine does not scale by level yet);
 * and the build with +CAL points in one stat, for each stat an ability is
 * converted into. An ability's worth is its point-win gain over the calibration
 * slope of its mapped stat, then the units those stat points cost at the build's
 * current value (statEconomy priceOf).
 *
 * "fires" is the share of points in which the player hit at least one shot the
 * ability applies to, and "won|fires" the point-win % on those points, so an
 * ability that matters a lot in a narrow spot shows up even when its overall
 * gain is small. Court coverage changes position, not a shot, so it has none.
 *
 * Builds: each identity's mean day-23 currency build from
 * `STATS=1 N=1 RUNS=30 DAYS=23 CHECK=23 careerSim.ts`, with its tier-1 profile.
 *
 * Run: npx tsx src/test/analysis/abilityProbe.ts
 * Env: N=400 (BO3 per condition)  ID=baseliner  TEAM=4 (team match opponent, 1-5)
 *      LEVEL=1  CAL=5  SEED=1
 *      ONLY=heavy_hitter,cal:forehand  (subset of conditions; the baseline always runs)
 */

import type { PlayerStats, ShotDetail } from '../../types';
import { AbilityName } from '../../types/game';

type AbilityId = (typeof AbilityName)[keyof typeof AbilityName];
import type {
  ArchetypeProfile,
  BroadArchetype,
  GamePhase,
  PhasePathId,
} from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed } from '../../core/random';
import { ABILITY_DEFINITIONS } from '../../data/abilities';
import { profileForArchetype } from '../../data/archetypeTree';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch, type Rates } from './matchTally';
import { BO3, playMatch } from './simMatch';
import { priceOf, unitsOf } from './statEconomy';

type StatName =
  | keyof PlayerStats['core']
  | keyof PlayerStats['technical']
  | keyof PlayerStats['physical']
  | keyof PlayerStats['mental'];

const N = Number(process.env.N ?? 400);
const ID = process.env.ID ?? 'baseliner';
const TEAM = [TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5][
  Number(process.env.TEAM ?? 4) - 1
];
const LEVEL = Number(process.env.LEVEL ?? 1);
const CAL = Number(process.env.CAL ?? 5);
const SEED = Number(process.env.SEED ?? 1);
const ONLY = process.env.ONLY?.toLowerCase().split(',');

// ─── Builds ──────────────────────────────────────────────────

const tier1 = (
  broad: BroadArchetype,
  paths: Partial<Record<GamePhase, PhasePathId>>,
): ArchetypeProfile => ({
  broad,
  phases: Object.fromEntries(
    Object.entries(paths).map(([phase, path]) => [phase, { path, tier: 1 }]),
  ),
  specializationPoints: 0,
  respecTokens: 0,
});

const build = (v: number[]): PlayerStats => ({
  core: { serve: v[0], forehand: v[1], backhand: v[2], return: v[3], net: v[4] },
  technical: { slice: v[5], spin: v[6], placement: v[7] },
  physical: { speed: v[8], stamina: v[9], strength: v[10] },
  mental: { focus: v[11], anticipation: v[12], tactics: v[13] },
});

/** Day-23 mean builds, in the order serve … tactics. */
const IDENTITIES: Record<string, { stats: PlayerStats; profile: ArchetypeProfile }> = {
  bigServer: {
    stats: build([40, 41, 29, 28, 28, 29, 40, 41, 30, 31, 42, 49, 37, 29]),
    profile: tier1('all_courter', {
      first_serve: 'fs_bomber',
      second_serve: 'ss_kicker',
      forehand: 'fh_laserbeam',
      net: 'net_opportunist',
    }),
  },
  counter: {
    stats: build([28, 27, 39, 40, 28, 34, 28, 34, 40, 40, 28, 36, 43, 44]),
    profile: tier1('baseliner', {
      return: 'rt_extinguisher',
      forehand: 'fh_survivor',
      backhand: 'bh_samurai',
      net: 'net_apologist',
    }),
  },
  netRusher: {
    stats: build([40, 29, 29, 28, 42, 30, 28, 41, 41, 30, 31, 37, 46, 41]),
    profile: tier1('net_attacker', {
      net: 'net_downhill',
      first_serve: 'fs_bomber',
      return: 'rt_sneaky_beaky',
      second_serve: 'ss_kicker',
    }),
  },
  baseliner: {
    stats: build([29, 41, 41, 28, 29, 44, 40, 30, 28, 41, 40, 36, 35, 31]),
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  },
};

const statOf = (s: PlayerStats, k: StatName): number => {
  for (const group of Object.values(s) as Array<Record<string, number>>) {
    if (k in group) return group[k];
  }
  throw new Error(`no stat ${k}`);
};

const withStat = (s: PlayerStats, k: StatName, add: number): PlayerStats => {
  const out = structuredClone(s);
  for (const group of Object.values(out) as Array<Record<string, number>>) {
    if (k in group) group[k] = Math.min(100, group[k] + add);
  }
  return out;
};

// ─── Abilities under test ────────────────────────────────────

interface Probe {
  /** The stat this ability is priced against. */
  stat: StatName;
  /** Shots the ability applies to; null when it acts on position, not a shot. */
  applies: ((shot: ShotDetail) => boolean) | null;
}

/**
 * The buyable abilities whose effects reach MatchSimulator. Left out: Clutch,
 * Mental Fortitude and Iron Will act through key moments and momentum, which
 * only the live MatchOrchestrator runs; the rest act outside matches.
 */
const PROBES: Partial<Record<AbilityId, Probe>> = {
  [AbilityName.HEAVY_HITTER]: { stat: 'forehand', applies: (s) => s.shotType.includes('power') },
  [AbilityName.SPIN_MASTER]: { stat: 'spin', applies: (s) => s.modifiers.spinModifier > 1 },
  [AbilityName.SOFT_HANDS]: {
    stat: 'net',
    applies: (s) => s.shotType.includes('drop_shot') || s.shotType.includes('volley'),
  },
  [AbilityName.OVERHEAD_SMASH]: { stat: 'net', applies: (s) => s.shotType.includes('overhead') },
  [AbilityName.RANGY_RETURN]: {
    stat: 'speed',
    applies: (s) => s.context.courtPosition === 'defensive',
  },
  [AbilityName.BASELINER]: { stat: 'forehand', applies: (s) => s.context.rallyLength > 4 },
  [AbilityName.SLIDER]: { stat: 'speed', applies: null },
  [AbilityName.NETCRASHER]: { stat: 'net', applies: (s) => s.context.courtPosition === 'net' },
  // Uncommon
  [AbilityName.SPEED_DEMON]: { stat: 'speed', applies: null },
  [AbilityName.IRON_LEGS]: { stat: 'speed', applies: null },
  [AbilityName.SERVE_CANNON]: {
    stat: 'forehand',
    applies: (s) => s.shotType.includes('power') || s.shotType.includes('overhead'),
  },
  // Rare
  [AbilityName.PRESSURE_COOKER]: {
    stat: 'focus',
    applies: (s) => s.modifiers.pressureModifier < 1,
  },
  [AbilityName.ALL_COURT_MAESTRO]: {
    stat: 'speed',
    applies: (s) => s.context.courtPosition === 'defensive',
  },
};

/** The ability's effects at LEVEL, scaled value × level as the ability data describes. */
const effectsAt = (name: AbilityId): Record<string, number> =>
  Object.fromEntries(
    Object.entries(ABILITY_DEFINITIONS[name].modifiers.additional ?? {}).map(([k, v]) => [
      k,
      v * LEVEL,
    ]),
  );

// ─── Running ─────────────────────────────────────────────────

interface Condition {
  label: string;
  stats: PlayerStats;
  effects: Record<string, number>;
  applies: Probe['applies'];
}

interface Result {
  rates: Rates;
  /** Per-match point-win share, indexed by match, for pairing. */
  perMatch: number[];
  firedPoints: number;
  firedWon: number;
}

function run(c: Condition, profile: ArchetypeProfile): Result {
  const r: Result = { rates: emptyRates(), perMatch: [], firedPoints: 0, firedWon: 0 };
  const oppProfile = profileForArchetype(TEAM.opponent.archetype);
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const { points } = playMatch(
      new PlayerProfile('p', 'P', c.stats, profile),
      new PlayerProfile('o', 'O', TEAM.opponent.stats, oppProfile),
      {
        format: BO3,
        surface: TEAM.surface,
        initialServer: i % 2 === 0 ? 'player' : 'opponent',
        playerEffects: c.effects,
      },
    );
    tallyMatch(points, BO3, r.rates);
    r.perMatch.push(points.filter((p) => p.winner === 'player').length / points.length);
    if (!c.applies) continue;
    for (const pt of points) {
      const role = pt.server === 'player' ? 'server' : 'returner';
      if (pt.shots.some((s) => s.shooter === role && c.applies?.(s))) {
        r.firedPoints++;
        if (pt.winner === 'player') r.firedWon++;
      }
    }
  }
  process.stderr.write(`  done: ${c.label}\n`);
  return r;
}

/** Mean and standard error of the per-match point-win difference, in points of %. */
function paired(a: number[], base: number[]): { mean: number; se: number } {
  const d = a.map((x, i) => (x - base[i]) * 100);
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
  return { mean, se: sd / Math.sqrt(d.length) };
}

const pointWin = (r: Rates): number => (r.pointsWon / r.points) * 100;

function main(): void {
  const id = IDENTITIES[ID];
  const log = console.log;
  const quiet = <T>(fn: () => T): T => {
    console.log = (): void => {};
    try {
      return fn();
    } finally {
      console.log = log;
    }
  };

  const abilityNames = (Object.keys(PROBES) as AbilityId[]).filter(
    (a) => !ONLY || ONLY.includes(a),
  );
  const calStats = [...new Set(Object.values(PROBES).flatMap((p) => (p ? [p.stat] : [])))].filter(
    (s) => !ONLY || ONLY.includes(`cal:${s}`),
  );

  log(
    `abilityProbe  N=${N} BO3 paired  ${ID} day-23 build v ${TEAM.opponent.name} (${TEAM.surface})  ` +
      `LEVEL=${LEVEL} CAL=+${CAL} SEED=${SEED}`,
  );

  const base = quiet(() =>
    run({ label: 'baseline', stats: id.stats, effects: {}, applies: null }, id.profile),
  );
  const slopes = new Map<StatName, { perPoint: number; se: number }>();
  const rows: string[][] = [];
  const row = (label: string, r: Result, extra: string[]): void => {
    const d = paired(r.perMatch, base.perMatch);
    rows.push([
      label,
      ...formatRates(r.rates),
      `${d.mean >= 0 ? '+' : ''}${d.mean.toFixed(2)} ± ${d.se.toFixed(2)}`,
      ...extra,
    ]);
  };
  rows.push(['baseline', ...formatRates(base.rates), '', '', '', '', '']);

  for (const stat of calStats) {
    const r = quiet(() =>
      run(
        {
          label: `+${CAL} ${stat}`,
          stats: withStat(id.stats, stat, CAL),
          effects: {},
          applies: null,
        },
        id.profile,
      ),
    );
    const d = paired(r.perMatch, base.perMatch);
    slopes.set(stat, { perPoint: d.mean / CAL, se: d.se / CAL });
    row(`+${CAL} ${stat} (${statOf(id.stats, stat)}→${statOf(id.stats, stat) + CAL})`, r, [
      '',
      '',
      '',
      '',
    ]);
  }

  for (const name of abilityNames) {
    const probe = PROBES[name];
    if (!probe) continue;
    const r = quiet(() =>
      run(
        { label: name, stats: id.stats, effects: effectsAt(name), applies: probe.applies },
        id.profile,
      ),
    );
    const d = paired(r.perMatch, base.perMatch);
    const slope = slopes.get(probe.stat);
    const equiv = slope && slope.perPoint > 0 ? d.mean / slope.perPoint : NaN;
    const units = unitsOf(priceOf(probe.stat, statOf(id.stats, probe.stat)));
    const fires = probe.applies ? `${((r.firedPoints / r.rates.points) * 100).toFixed(1)}%` : '-';
    const firedWon = probe.applies ? `${((r.firedWon / r.firedPoints) * 100).toFixed(1)}%` : '-';
    row(name, r, [
      fires,
      firedWon,
      Number.isFinite(equiv) ? `${equiv.toFixed(1)} ${probe.stat}` : `- (${probe.stat})`,
      Number.isFinite(equiv) ? `${Math.round(equiv * units)}` : '-',
    ]);
  }

  log(
    [
      'condition',
      ...RATE_HEADERS,
      'Δpt-win (paired)',
      'fires',
      'won|fires',
      '≈ stat points',
      '≈ units',
    ].join('\t'),
  );
  for (const r of rows) log(r.join('\t'));
  log(`baseline point-win ${pointWin(base.rates).toFixed(2)}%`);
  for (const [stat, s] of slopes) {
    log(
      `slope ${stat}: ${s.perPoint >= 0 ? '+' : ''}${s.perPoint.toFixed(3)} ± ${s.se.toFixed(3)} pt-win per stat point; ` +
        `one point at ${statOf(id.stats, stat)} costs ${unitsOf(priceOf(stat, statOf(id.stats, stat)))} units`,
    );
  }
}

main();
