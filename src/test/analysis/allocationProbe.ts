/**
 * Allocation Probe — what does free stat allocation do to balance?
 *
 * Question: if players could spend points on any stat they like (instead of
 * training handing out a semi-random spread), how much stronger is the optimal
 * spend than the spread training produces today — and how much of that gap
 * does an escalating cost curve take back?
 *
 * Every build starts at the uniform-20 new player and spends the same budget.
 * Strategies:
 *   spread     +1 to every stat in turn
 *   training   the spread AnchorTrainingSystem actually produces: anchors
 *              chosen uniformly, two supports per session drawn from the pool
 *   core       all five core stats only
 *   top5       the five highest-value stats at tier-1 ratings (statChannels
 *              25-50 table): serve, return, speed, anticipation, tactics
 *   top3       serve, return, anticipation
 *   bigServer / counter / netRusher / baseliner
 *              six-stat identity builds — the choices a stylistic player makes
 *
 * Under COST=flat a budget point buys +1. Under CURVES=recipes the budget is
 * currency units, shaped like the training each strategy would do (walletFor), and
 * every +1 pays the real recipe at the real step price (statEconomy.ts, the
 * proposal's §6.1); whatever the strategy cannot use goes on the weakest stat
 * still affordable, as a player would spend it. 860 units buys about the same
 * even spread as 280 flat points. Under COST=curve each +1 costs
 * costOf(currentValue) currency — see COST_CURVES — so concentrating gets
 * expensive. Point-win % against fixed tier-1 opponents.
 *
 * PART A: every strategy above, no archetypes on either side unless OPP_ARCH=1
 *         (which gives the opponents their authored archetype).
 * PART B: the identity builds again, with archetypes on — the player carries a
 *         broad identity and four tier-I specialties matching the build, and
 *         every opponent plays its authored archetype. Three columns per
 *         identity separate what the stats are worth from what the behaviour is
 *         worth:
 *           bare      identity stats, no archetype (opponents still have theirs)
 *           styled    identity stats + matching archetype — the real player
 *           styleOnly even-spread stats + the identity's archetype
 *         Asked because PART A without archetypes left the groundstroke
 *         baseliner ~10 points behind every other identity, and a real
 *         baseliner's specialties shift its shot mix toward the wings.
 *
 * Run: npx tsx src/test/analysis/allocationProbe.ts
 * Env: N=60 (BO3 per cell)  BUDGETS=140,280  CURVES=flat,step20,step15,banded
 *      PARTS=A  OPP_ARCH=0  ID=<regex over PART B identity names>
 */

import type { PlayerStats, StatName } from '../../types';
import type {
  ArchetypeProfile,
  BroadArchetype,
  GamePhase,
  PhasePathId,
} from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { calculateOverallRating } from '../../utils/overallRating';
import { CURRENCIES, RECIPES, canAfford, pay, priceOf, unitsOf, type Wallet } from './statEconomy';
import { CORE_ANCHOR_ORDER } from '../../game/AnchorTrainingSystem';
import { SUPPORT_POOLS } from './legacyTraining';
import { profileForArchetype, type LegacyArchetype } from '../../data/archetypeTree';
import { playMatch } from './simMatch';
const NONE: ArchetypeProfile = {
  broad: null,
  phases: {},
  specializationPoints: 0,
  respecTokens: 0,
};

const stats = (
  core: [number, number, number, number, number],
  tech: [number, number, number],
  phys: [number, number, number],
  ment: [number, number, number],
): PlayerStats => ({
  core: { serve: core[0], forehand: core[1], backhand: core[2], return: core[3], net: core[4] },
  technical: { slice: tech[0], spin: tech[1], placement: tech[2] },
  physical: { speed: phys[0], stamina: phys[1], strength: phys[2] },
  mental: { focus: ment[0], anticipation: ment[1], tactics: ment[2] },
});

/** Stats and archetypes as authored in data/opponents.ts, teamMatches.ts, riversideOpen.ts. */
const OPPONENTS: Array<[string, PlayerStats, LegacyArchetype]> = [
  [
    'Big Steve (30)',
    stats([35, 32, 32, 23, 35], [23, 23, 25], [28, 28, 33], [28, 31, 26]),
    'serve_volley',
  ],
  [
    'Olivia Gulp (42)',
    stats([42, 46, 39, 44, 34], [46, 39, 41], [36, 48, 35], [41, 43, 41]),
    'aggressive',
  ],
  [
    'Jordan (47)',
    stats([50, 50, 46, 47, 43], [48, 40, 48], [44, 48, 46], [46, 40, 40]),
    'serve_volley',
  ],
];

/** A side of the net: stats plus the archetype it plays. */
interface Side {
  stats: PlayerStats;
  profile: ArchetypeProfile;
}
const side = (stats: PlayerStats, profile: ArchetypeProfile = NONE): Side => ({ stats, profile });

const ALL_STATS: StatName[] = [
  'serve',
  'forehand',
  'backhand',
  'return',
  'net',
  'slice',
  'spin',
  'placement',
  'speed',
  'stamina',
  'strength',
  'focus',
  'anticipation',
  'tactics',
];
const CATEGORY: Record<StatName, keyof PlayerStats> = {
  serve: 'core',
  forehand: 'core',
  backhand: 'core',
  return: 'core',
  net: 'core',
  slice: 'technical',
  spin: 'technical',
  placement: 'technical',
  speed: 'physical',
  stamina: 'physical',
  strength: 'physical',
  focus: 'mental',
  anticipation: 'mental',
  tactics: 'mental',
};

type Flat = Record<StatName, number>;
const fromFlat = (f: Flat): PlayerStats => {
  const out: PlayerStats = { core: {}, technical: {}, physical: {}, mental: {} } as PlayerStats;
  for (const s of ALL_STATS) (out[CATEGORY[s]] as unknown as Record<string, number>)[s] = f[s];
  return out;
};
const uniformFlat = (v: number): Flat => Object.fromEntries(ALL_STATS.map((s) => [s, v])) as Flat;

/**
 * Point-win % per +10 at tier-1 ratings, from docs/research/stat-channels.md
 * (U(25,50) table), taken before the slice change. Used to price stats by value
 * for the `banded` curve and to drive the greedy spender under the multiplier
 * curves, so those rows reproduce the proposal's §3.
 */
const STAT_VALUE: Record<StatName, number> = {
  anticipation: 3.27,
  return: 2.96,
  serve: 2.81,
  speed: 2.72,
  tactics: 2.32,
  backhand: 1.9,
  placement: 1.77,
  strength: 1.6,
  forehand: 1.48,
  spin: 1.36,
  focus: 1.06,
  stamina: 0.9,
  net: 0.77,
  slice: 0.48,
};

/**
 * The same, re-measured after the slice change (slice-at-tier-1.md §5). Drives
 * the greedy spender under the `recipes` cost model, which prices the sim as it
 * now stands.
 */
const STAT_VALUE_NOW: Record<StatName, number> = {
  anticipation: 3.12,
  serve: 2.62,
  speed: 2.62,
  return: 2.52,
  tactics: 2.32,
  spin: 1.79,
  focus: 1.6,
  strength: 1.58,
  placement: 1.55,
  forehand: 1.54,
  backhand: 1.33,
  net: 1.31,
  slice: 1.13,
  stamina: 0.64,
};

/** Three price bands rather than a per-stat price — something a player can learn. */
const PRICE_BAND: Record<StatName, number> = {
  anticipation: 1.5,
  return: 1.5,
  serve: 1.5,
  speed: 1.5,
  tactics: 1.5,
  backhand: 1,
  placement: 1,
  strength: 1,
  forehand: 1,
  spin: 1,
  focus: 0.75,
  stamina: 0.75,
  net: 0.75,
  slice: 0.75,
};

const step20 = (v: number): number => 1 + Math.floor(Math.max(0, v - 20) / 20);
const step15 = (v: number): number => 1 + Math.floor(Math.max(0, v - 20) / 15);

/** Currency cost of the next +1 to stat `s` when it currently reads `v`. */
type Cost = (s: StatName, v: number) => number;
const COST_CURVES: Record<string, Cost> = {
  flat: () => 1,
  // 1 below 40, 2 in the 40s-50s, 3 in the 60s-70s, 4 from 80
  step20: (_s, v) => step20(v),
  // steeper: a new tier every 15 points
  step15: (_s, v) => step15(v),
  // step20, with the strong stats priced up and the weak ones down
  banded: (s, v) => step20(v) * PRICE_BAND[s],
};

/** Spend `budget` currency round-robin over `targets` (weighted by repetition). */
function spendRoundRobin(budget: number, targets: StatName[], cost: Cost): Flat {
  const f = uniformFlat(20);
  let left = budget;
  let i = 0;
  let stalled = 0;
  while (stalled < targets.length) {
    const s = targets[i++ % targets.length];
    const c = cost(s, f[s]);
    if (f[s] >= 100 || c > left) {
      stalled++;
      continue;
    }
    stalled = 0;
    f[s]++;
    left -= c;
  }
  return f;
}

/**
 * The spread anchor training produces: each session +1 to a uniformly chosen
 * anchor and +1 to two supports from its pool. Deterministic expectation
 * rather than a draw, so the row has no sampling noise of its own.
 */
function trainingTargets(): StatName[] {
  const seq: StatName[] = [];
  for (let rep = 0; rep < 12; rep++) {
    for (const core of CORE_ANCHOR_ORDER) {
      const pool = SUPPORT_POOLS[core];
      seq.push(core, pool[(rep * 2) % pool.length], pool[(rep * 2 + 1) % pool.length]);
    }
  }
  return seq;
}

/**
 * A player who has read the value table: every purchase goes to the stat with
 * the best value per unit cost right now. Linear value, so this is an upper
 * bound on min-maxing rather than a prediction.
 */
function spendGreedy(budget: number, cost: Cost): Flat {
  const f = uniformFlat(20);
  let left = budget;
  for (;;) {
    let best: StatName | null = null;
    let bestRatio = -1;
    for (const s of ALL_STATS) {
      const c = cost(s, f[s]);
      if (f[s] >= 100 || c > left) continue;
      const ratio = STAT_VALUE[s] / c;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = s;
      }
    }
    if (!best) return f;
    left -= cost(best, f[best]);
    f[best]++;
  }
}

// ─── The real recipes (statEconomy.ts) ───────────────────────

/**
 * A currency budget of `units` shaped like the training that would earn it:
 * 70% in proportion to what the targets' recipes need — a player trains the
 * anchors that pay its build — and 30% even, the general and Mind shares every
 * session and match pays whatever was trained (proposal §6.2).
 */
function walletFor(units: number, targets: StatName[]): Wallet {
  const need: Record<string, number> = Object.fromEntries(CURRENCIES.map((c) => [c, 0]));
  for (const k of targets) for (const [c, n] of Object.entries(RECIPES[k])) need[c] += n ?? 0;
  const total = CURRENCIES.reduce((t, c) => t + need[c], 0);
  return Object.fromEntries(
    CURRENCIES.map((c) => [c, units * (0.7 * (need[c] / total) + 0.3 / CURRENCIES.length)]),
  ) as Wallet;
}

function buyRecipe(f: Flat, w: Wallet, k: StatName): boolean {
  const price = priceOf(k, f[k]);
  if (f[k] >= 100 || !canAfford(w, price)) return false;
  pay(w, price);
  f[k]++;
  return true;
}

/** Whatever no target can use goes on the weakest stat it can still afford. */
function spendLeftovers(f: Flat, w: Wallet): void {
  for (;;) {
    const order = [...ALL_STATS].sort((x, y) => f[x] - f[y]);
    if (!order.some((k) => buyRecipe(f, w, k))) return;
  }
}

/** Round-robin over `targets` at the real recipe prices, then spend what is left. */
function spendRecipes(units: number, targets: StatName[]): Flat {
  const f = uniformFlat(20);
  const w = walletFor(units, targets);
  let i = 0;
  let stalled = 0;
  while (stalled < targets.length) {
    if (buyRecipe(f, w, targets[i++ % targets.length])) stalled = 0;
    else stalled++;
  }
  spendLeftovers(f, w);
  return f;
}

/**
 * Best current value per unit of real price, among what the wallet affords.
 * It trains for the five most valuable stats, so its wallet is shaped like theirs.
 */
function greedyRecipes(units: number): Flat {
  const f = uniformFlat(20);
  const top5 = [...ALL_STATS].sort((x, y) => STAT_VALUE_NOW[y] - STAT_VALUE_NOW[x]).slice(0, 5);
  const w = walletFor(units, top5);
  for (;;) {
    const options = ALL_STATS.filter((k) => f[k] < 100 && canAfford(w, priceOf(k, f[k])));
    if (options.length === 0) return f;
    const ratio = (k: StatName): number => STAT_VALUE_NOW[k] / unitsOf(priceOf(k, f[k]));
    buyRecipe(f, w, options.sort((x, y) => ratio(y) - ratio(x))[0]);
  }
}

/** Dispatch a strategy to the multiplier curves or to the real recipes. */
function build(curve: string, budget: number, targets: StatName[]): Flat {
  return curve === 'recipes'
    ? spendRecipes(budget, targets)
    : spendRoundRobin(budget, targets, COST_CURVES[curve]);
}

const STRATEGIES: Record<string, StatName[]> = {
  spread: ALL_STATS,
  training: trainingTargets(),
  core: ['serve', 'forehand', 'backhand', 'return', 'net'],
  top5: ['serve', 'return', 'speed', 'anticipation', 'tactics'],
  top3: ['serve', 'return', 'anticipation'],
  // Identity builds: what a player choosing a style (not a spreadsheet) would buy.
  bigServer: ['serve', 'strength', 'placement', 'spin', 'focus', 'forehand'],
  counter: ['return', 'speed', 'anticipation', 'tactics', 'stamina', 'backhand'],
  netRusher: ['net', 'speed', 'anticipation', 'placement', 'serve', 'tactics'],
  baseliner: ['forehand', 'backhand', 'spin', 'strength', 'stamina', 'slice'],
};

function pointWinPct(pa: Side, pb: Side, n: number): number {
  let won = 0;
  let total = 0;
  for (let m = 0; m < n; m++) {
    const { points } = playMatch(
      new PlayerProfile('p', 'P', pa.stats, pa.profile),
      new PlayerProfile('o', 'O', pb.stats, pb.profile),
    );
    total += points.length;
    won += points.filter((pt) => pt.winner === 'player').length;
  }
  return (won / total) * 100;
}

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

/**
 * PART B identities. Four tier-I specialties each: the 3 starting points plus
 * one level, and gameStore blocks tier II until player tier 2, so this is a
 * late-tier-1 player. Two baseliners because "baseliner" covers both the
 * player who swings and the one who grinds.
 */
const IDENTITIES: Array<{ name: string; targets: StatName[]; profile: ArchetypeProfile }> = [
  {
    name: 'bigServer',
    targets: STRATEGIES.bigServer,
    profile: tier1('all_courter', {
      first_serve: 'fs_bomber',
      second_serve: 'ss_kicker',
      forehand: 'fh_laserbeam',
      net: 'net_opportunist',
    }),
  },
  {
    name: 'counter',
    targets: STRATEGIES.counter,
    profile: tier1('baseliner', {
      return: 'rt_extinguisher',
      forehand: 'fh_survivor',
      backhand: 'bh_samurai',
      net: 'net_apologist',
    }),
  },
  {
    name: 'netRusher',
    targets: STRATEGIES.netRusher,
    profile: tier1('net_attacker', {
      net: 'net_downhill',
      first_serve: 'fs_bomber',
      return: 'rt_sneaky_beaky',
      second_serve: 'ss_kicker',
    }),
  },
  {
    name: 'baseliner/swing',
    targets: STRATEGIES.baseliner,
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  },
  {
    name: 'baseliner/grind',
    targets: STRATEGIES.baseliner,
    profile: tier1('baseliner', {
      forehand: 'fh_rpm_overdrive',
      backhand: 'bh_brick_wall',
      return: 'rt_extinguisher',
      net: 'net_apologist',
    }),
  },
  {
    // slice is worth ~0 at tier 1 (stat-channels §10); is the gap just slice?
    name: 'baseliner/swing -slice',
    targets: ['forehand', 'backhand', 'spin', 'strength', 'stamina', 'placement'],
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  },
  // Diagnostics: every other identity buys serve or return plus speed or
  // anticipation; the baseliner buys none. Swap slice for one of them.
  ...(
    [
      ['return', 'return'],
      ['speed', 'speed'],
      ['serve', 'serve'],
    ] as Array<[string, StatName]>
  ).map(([label, stat]) => ({
    name: `baseliner/swing +${label}`,
    targets: ['forehand', 'backhand', 'spin', 'strength', 'stamina', stat] as StatName[],
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  })),
];

function partB(N: number, budgets: number[], curves: string[]): void {
  const opponents = OPPONENTS.map(([n, s, a]): [string, Side] => [
    n,
    side(s, profileForArchetype(a)),
  ]);
  for (const curveName of curves) {
    for (const budget of budgets) {
      console.log(`\n=== PART B  cost=${curveName}  budget=${budget}  N=${N} BO3/cell ===`);
      console.log(['identity', 'column', ...opponents.map(([n]) => n), 'mean'].join('\t'));
      const spread = fromFlat(build(curveName, budget, STRATEGIES.spread));
      const control: Array<[string, Side]> = [['spread (no style)', side(spread)]];
      for (const [label, s] of control) {
        const row = opponents.map(([, o]) => pointWinPct(s, o, N));
        const mean = row.reduce((x, y) => x + y, 0) / row.length;
        console.log(
          [label, 'control', ...row.map((v) => v.toFixed(1)), mean.toFixed(1)].join('\t'),
        );
      }
      const only = process.env.ID ? new RegExp(process.env.ID) : null;
      for (const id of IDENTITIES.filter((i) => !only || only.test(i.name))) {
        const built = fromFlat(build(curveName, budget, id.targets));
        const columns: Array<[string, Side]> = [
          ['bare', side(built)],
          ['styled', side(built, id.profile)],
          ['styleOnly', side(spread, id.profile)],
        ];
        for (const [col, s] of columns) {
          const row = opponents.map(([, o]) => pointWinPct(s, o, N));
          const mean = row.reduce((x, y) => x + y, 0) / row.length;
          console.log([id.name, col, ...row.map((v) => v.toFixed(1)), mean.toFixed(1)].join('\t'));
        }
      }
    }
  }
}

function main(): void {
  const N = Number(process.env.N ?? 60);
  const budgets = (process.env.BUDGETS ?? '140,280').split(',').map(Number);
  const curves = (process.env.CURVES ?? 'flat,step20,step15').split(',');
  const parts = process.env.PARTS ?? 'A';
  if (parts.includes('B')) partB(N, budgets, curves);
  if (!parts.includes('A')) return;
  const oppArch = process.env.OPP_ARCH === '1';
  const opponents = OPPONENTS.map(([n, s, a]): [string, Side] => [
    n,
    side(s, oppArch ? profileForArchetype(a) : NONE),
  ]);

  for (const curveName of curves) {
    const cost = COST_CURVES[curveName] ?? COST_CURVES.flat;
    for (const budget of budgets) {
      console.log(`\n=== cost=${curveName}  budget=${budget}  N=${N} BO3/cell ===`);
      const header = ['strategy', 'OVR', 'pts', 'max', ...opponents.map(([n]) => n)];
      console.log(header.join('\t'));
      const builds: Array<[string, Flat]> = [
        ...Object.entries(STRATEGIES).map(([name, targets]): [string, Flat] => [
          name,
          build(curveName, budget, targets),
        ]),
        ['greedy', curveName === 'recipes' ? greedyRecipes(budget) : spendGreedy(budget, cost)],
      ];
      for (const [name, f] of builds) {
        const s = fromFlat(f);
        const gained = ALL_STATS.reduce((acc, k) => acc + f[k] - 20, 0);
        const max = Math.max(...ALL_STATS.map((k) => f[k]));
        const row = opponents.map(([, o]) => pointWinPct(side(s), o, N).toFixed(1));
        console.log([name, calculateOverallRating(s), gained, max, ...row].join('\t'));
      }
    }
  }
}

main();
