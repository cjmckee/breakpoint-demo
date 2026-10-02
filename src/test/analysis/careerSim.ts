/**
 * Career Sim — 40 days of play under today's stat grants and under the
 * currency design in docs/proposals/stat-currency-progression.md §6.
 *
 * Question: how much currency does each activity have to pay for a player on
 * the currency system to be as strong on day N as the same player is today —
 * and does any identity end up starved of a currency, or sitting on one it
 * cannot use?
 *
 * Both systems live the same days. Each day has four slots: morning, afternoon
 * and evening train (20 energy) or play a practice match (50 energy, every
 * MATCH_EVERY days from day 5), resting for 20 when short; night sleeps for 50.
 * Training reps are Binomial(3, REPS_P). Practice opponents rotate through the
 * tier-1 roster with getScaledOpponentStats, the way the game scales them.
 *
 * today     AnchorTrainingSystem as shipped: +1 core, +1 per rep from the pool.
 *           Everything else the save earns (story, challenges, shop) arrives as
 *           OTHER_PER_DAY stat points spread over the stats in proportion to
 *           what authored content grants (statIncome.ts).
 * currency  Training pays TRAIN_BASE + TRAIN_PER_REP × reps units in its anchor's
 *           recipe ratio. Story and challenges pay the same stat points as
 *           today, each converted through that stat's recipe; the shop no longer
 *           sells stats, so the SHOP_SHARE of OTHER_PER_DAY is dropped. Matches
 *           pay MATCH_UNITS × (0.5 + overall/100), MATCH_MIND_SHARE of it Mind
 *           and the rest split by MatchRewardSystem's per-area scores
 *           (serving→Power, returning→Quickness, rally→Technique,
 *           net→Quickness+Technique, mental→Mind). Every evening the player
 *           spends per SPEND (see spend()).
 *
 * INCOME_SCALE multiplies every currency payout. Calibrate it until the
 * currency rows match the today rows on strength.
 *
 * Strength is measured on the MEAN build of each identity at each checkpoint:
 * point-win % against Big Steve, Olivia Gulp and Jordan, archetypes on.
 *
 * Run: npx tsx src/test/analysis/careerSim.ts
 * Env: RUNS=12 (careers per identity per system)  N=120 (BO3 per strength cell)
 *      DAYS=40  CHECK=10,20,30,40  MATCH_EVERY=2  REPS_P=0.7
 *      OTHER_PER_DAY=2.2  SHOP_SHARE=0.25  INCOME_SCALE=1
 *      TRAIN_BASE=2  TRAIN_PER_REP=3  MATCH_UNITS=8  MATCH_MIND_SHARE=0.4  SPEND=level|rr
 *      TRAIN_MIND_SHARE=0 (share of every training session paid as Mind)
 *      TRAIN_GENERAL_SHARE=0 (share of every session split evenly over all four)
 *      EXCHANGE=0 (r units of a spare currency buy 1 of a short one; 0 = off)
 *      ALL_CHECKS=1 measures strength at every checkpoint, not just the last
 */

import type { MatchFormat, MatchState, PlayerStats, StatName } from '../../types';
import type {
  ArchetypeProfile,
  BroadArchetype,
  GamePhase,
  PhasePathId,
} from '../../types/archetype';
import type { StatBoosts } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { PointSimulator } from '../../core/PointSimulator';
import { ScoreTracker } from '../../core/ScoreTracker';
import { MatchStatistics } from '../../core/MatchStatistics';
import { MATCH_FATIGUE } from '../../config/shotThresholds';
import { calculateOverallRating } from '../../utils/overallRating';
import { PlayerManager } from '../../game/PlayerManager';
import { MatchRewardSystem } from '../../game/MatchRewardSystem';
import {
  buildAnchorTrainingResult,
  recentSupportsFrom,
  type CoreStat,
} from '../../game/AnchorTrainingSystem';
import {
  OPPONENTS_BY_TIER,
  getScaledOpponentStats,
  getOpponentArchetypeProfile,
} from '../../data/opponents';
import { aggregateArchetypeEffects, profileForArchetype } from '../../data/archetypeTree';

// ─── Configuration ───────────────────────────────────────────

const env = (k: string, d: number): number => Number(process.env[k] ?? d);
const RUNS = env('RUNS', 12);
const N = env('N', 120);
const DAYS = env('DAYS', 40);
const CHECK = (process.env.CHECK ?? '10,20,30,40').split(',').map(Number);
const MATCH_EVERY = env('MATCH_EVERY', 2);
const REPS_P = env('REPS_P', 0.7);
const OTHER_PER_DAY = env('OTHER_PER_DAY', 2.2);
const SHOP_SHARE = env('SHOP_SHARE', 0.25);
const INCOME_SCALE = env('INCOME_SCALE', 1);
const TRAIN_BASE = env('TRAIN_BASE', 2);
const TRAIN_PER_REP = env('TRAIN_PER_REP', 3);
const MATCH_UNITS = env('MATCH_UNITS', 8);
const MATCH_MIND_SHARE = env('MATCH_MIND_SHARE', 0.4);
const TRAIN_MIND_SHARE = env('TRAIN_MIND_SHARE', 0);
const TRAIN_GENERAL_SHARE = env('TRAIN_GENERAL_SHARE', 0);

const BO1: MatchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

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
const get = (s: PlayerStats, k: StatName): number =>
  (s[CATEGORY[k]] as unknown as Record<string, number>)[k];
const set = (s: PlayerStats, k: StatName, v: number): void => {
  (s[CATEGORY[k]] as unknown as Record<string, number>)[k] = v;
};
const clone = (s: PlayerStats): PlayerStats => ({
  core: { ...s.core },
  technical: { ...s.technical },
  physical: { ...s.physical },
  mental: { ...s.mental },
});

// ─── Currency design (proposal §6) ───────────────────────────

type Currency = 'power' | 'quickness' | 'technique' | 'mind';
const CURRENCIES: Currency[] = ['power', 'quickness', 'technique', 'mind'];
type Wallet = Record<Currency, number>;
type Amounts = Partial<Wallet>;

const RECIPES: Record<StatName, Amounts> = {
  serve: { power: 3, technique: 1 },
  return: { quickness: 2, technique: 1, mind: 1 },
  anticipation: { mind: 3, quickness: 1 },
  speed: { quickness: 3, power: 1 },
  tactics: { mind: 3, technique: 1 },
  forehand: { power: 2, technique: 1 },
  backhand: { technique: 2, quickness: 1 },
  placement: { technique: 2, mind: 1 },
  strength: { power: 3 },
  spin: { technique: 2, power: 1 },
  focus: { mind: 2 },
  stamina: { power: 1, quickness: 1 },
  net: { quickness: 1, technique: 1 },
  slice: { technique: 2 },
};

/** ×1 below 40, ×2 in the 40s-50s, ×3 in the 60s-70s, ×4 from 80. */
const stepMultiplier = (v: number): number => 1 + Math.floor(Math.max(0, v - 20) / 20);

const priceOf = (stat: StatName, value: number): Amounts => {
  const m = stepMultiplier(value);
  const out: Amounts = {};
  for (const [c, n] of Object.entries(RECIPES[stat]) as Array<[Currency, number]>) out[c] = n * m;
  return out;
};
const unitsOf = (a: Amounts): number => Object.values(a).reduce((x, y) => x + (y ?? 0), 0);
const canAfford = (w: Wallet, p: Amounts): boolean =>
  (Object.entries(p) as Array<[Currency, number]>).every(([c, n]) => w[c] >= n);
const pay = (w: Wallet, p: Amounts): void => {
  for (const [c, n] of Object.entries(p) as Array<[Currency, number]>) w[c] -= n;
};
const earn = (w: Wallet, a: Amounts, scale = 1): void => {
  for (const [c, n] of Object.entries(a) as Array<[Currency, number]>) w[c] += n * scale;
};
/** Split `units` across a recipe in its own ratio. */
const inRatio = (recipe: Amounts, units: number): Amounts => {
  const total = unitsOf(recipe);
  const out: Amounts = {};
  for (const [c, n] of Object.entries(recipe) as Array<[Currency, number]>)
    out[c] = (units * n) / total;
  return out;
};

// ─── "Other" income: story, challenges, shop ─────────────────

/**
 * Positive stat points authored content grants, story outcomes plus challenge
 * rewards, from statIncome.ts. Used only as a distribution.
 */
const OTHER_WEIGHTS: Record<StatName, number> = {
  serve: 28 + 14,
  return: 27 + 8,
  placement: 51 + 30,
  net: 48 + 13,
  anticipation: 51 + 18,
  strength: 25 + 12,
  forehand: 28 + 0,
  backhand: 19 + 5,
  tactics: 61 + 32,
  focus: 44 + 24,
  spin: 37 + 26,
  speed: 55 + 14,
  stamina: 83 + 17,
  slice: 26 + 12,
};
const OTHER_TOTAL = Object.values(OTHER_WEIGHTS).reduce((a, b) => a + b, 0);

// ─── Identities ──────────────────────────────────────────────

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

interface Identity {
  name: string;
  /** Today: which anchors this player trains, cycled in order. */
  anchors: CoreStat[];
  /** Currency: what this player buys, round-robin. */
  buys: StatName[];
  profile: ArchetypeProfile;
}

const IDENTITIES: Identity[] = [
  {
    name: 'bigServer',
    anchors: ['serve', 'forehand', 'serve'],
    buys: ['serve', 'strength', 'placement', 'spin', 'focus', 'forehand'],
    profile: tier1('all_courter', {
      first_serve: 'fs_bomber',
      second_serve: 'ss_kicker',
      forehand: 'fh_laserbeam',
      net: 'net_opportunist',
    }),
  },
  {
    name: 'counter',
    anchors: ['return', 'backhand'],
    buys: ['return', 'speed', 'anticipation', 'tactics', 'stamina', 'backhand'],
    profile: tier1('baseliner', {
      return: 'rt_extinguisher',
      forehand: 'fh_survivor',
      backhand: 'bh_samurai',
      net: 'net_apologist',
    }),
  },
  {
    name: 'netRusher',
    anchors: ['net', 'serve', 'return'],
    buys: ['net', 'speed', 'anticipation', 'placement', 'serve', 'tactics'],
    profile: tier1('net_attacker', {
      net: 'net_downhill',
      first_serve: 'fs_bomber',
      return: 'rt_sneaky_beaky',
      second_serve: 'ss_kicker',
    }),
  },
  {
    name: 'baseliner',
    anchors: ['forehand', 'backhand'],
    buys: ['forehand', 'backhand', 'spin', 'strength', 'stamina', 'slice'],
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  },
  {
    // Same training as the baseliner; buys a serve with the Power it earns.
    name: 'baseliner+serve',
    anchors: ['forehand', 'backhand'],
    buys: ['forehand', 'backhand', 'spin', 'strength', 'stamina', 'serve'],
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  },
];

// ─── Match runner ────────────────────────────────────────────

function fatigue(cur: number, rally: number, stam: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  let gain = rally * MATCH_FATIGUE.basePerShot * sf;
  if (rally > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rally - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * sf;
  }
  const rec =
    MATCH_FATIGUE.baseRecoveryPerPoint +
    (stam / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec));
}

interface Side {
  stats: PlayerStats;
  profile: ArchetypeProfile;
}

function playMatch(
  a: Side,
  b: Side,
  format: MatchFormat,
  withStats: boolean,
): { won: number; points: number; winner: 'player' | 'opponent'; stats?: MatchStatistics } {
  const p = new PlayerProfile('p', 'P', a.stats, a.profile);
  const o = new PlayerProfile('o', 'O', b.stats, b.profile);
  const aFx = aggregateArchetypeEffects(a.profile);
  const bFx = aggregateArchetypeEffects(b.profile);
  const tracker = new ScoreTracker(format);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  p.rollMatchForm();
  o.rollMatchForm();
  const sim = new PointSimulator();
  const stats = withStats ? new MatchStatistics(p, o) : undefined;
  const ms: MatchState = {
    score: tracker.getScore(),
    currentServer: tracker.getCurrentServer(),
    courtSurface: 'hard',
    momentum: 0,
    pressure: 'low',
    matchLength: 0,
    pointsPlayed: 0,
    isKeyMoment: false,
    fatigue: { player: 0, opponent: 0 },
  };
  let pts = 0;
  let won = 0;
  while (!tracker.isComplete() && pts < 600) {
    const server = tracker.getCurrentServer();
    ms.isKeyMoment = tracker.isKeyMoment();
    const breakPointFor = tracker.getBreakPointFor();
    const pr = sim.simulatePoint(
      server,
      server === 'player' ? p : o,
      server === 'player' ? o : p,
      ms,
      server === 'player' ? aFx : bFx,
      server === 'player' ? bFx : aFx,
    );
    const w = pr.winner === 'server' ? server : server === 'player' ? 'opponent' : 'player';
    if (w === 'player') won++;
    tracker.addPoint(w);
    stats?.addPointResult(pr, server, breakPointFor);
    ms.fatigue.player = fatigue(ms.fatigue.player, pr.rallyLength, a.stats.physical.stamina);
    ms.fatigue.opponent = fatigue(ms.fatigue.opponent, pr.rallyLength, b.stats.physical.stamina);
    ms.score = tracker.getScore();
    ms.currentServer = tracker.getCurrentServer();
    ms.pointsPlayed = ++pts;
  }
  stats?.finalizeStatistics();
  return { won, points: pts, winner: tracker.getWinner() ?? 'player', stats };
}

// ─── A career ────────────────────────────────────────────────

type System = 'today' | 'currency';

interface Snapshot {
  stats: PlayerStats;
  wallet: Wallet;
  /** Lifetime currency earned, spent or not. */
  earned: Wallet;
  matchesWon: number;
  matchesPlayed: number;
  sessions: number;
}

const reps = (): number => [0, 1, 2].reduce((n) => n + (Math.random() < REPS_P ? 1 : 0), 0);

function applyBoosts(s: PlayerStats, b: StatBoosts): void {
  for (const [k, v] of Object.entries(b) as Array<[StatName, number]>) {
    if (v) set(s, k, Math.min(100, get(s, k) + v));
  }
}

/**
 * How the player spends each evening.
 *
 * level  (default) a planner: always buys the identity's LOWEST stat, saving
 *        for it when it is unaffordable. Currencies that stat does not need
 *        stay free for the identity's other stats. Spill only spends a
 *        currency no identity recipe uses. A currency that piles up in the
 *        wallet under this policy is a currency the identity cannot earn
 *        enough of.
 * rr     round-robin over the identity's stats, then spill everything left
 *        cheapest-first — a player who buys whatever is affordable.
 */
const SPEND = process.env.SPEND ?? 'level';

/**
 * EXCHANGE=r lets the planner trade r units of a currency its target does not
 * use for 1 unit of one it is short of. 0 disables it.
 */
const EXCHANGE = env('EXCHANGE', 0);

/** Cover `price` by converting from currencies outside it, if that is enough. */
function exchangeFor(w: Wallet, price: Amounts): boolean {
  if (EXCHANGE <= 0) return false;
  const inPrice = new Set(Object.keys(price) as Currency[]);
  const sources = CURRENCIES.filter((c) => !inPrice.has(c));
  const trial = { ...w };
  for (const [c, need] of Object.entries(price) as Array<[Currency, number]>) {
    let short = need - trial[c];
    while (short > 0) {
      const src = sources.sort((a, b) => trial[b] - trial[a])[0];
      if (!src || trial[src] < EXCHANGE) return false;
      const take = Math.min(short, Math.floor(trial[src] / EXCHANGE));
      if (take <= 0) return false;
      trial[src] -= take * EXCHANGE;
      trial[c] += take;
      short -= take;
    }
  }
  Object.assign(w, trial);
  return true;
}

const usesOnly = (stat: StatName, allowed: Set<Currency>): boolean =>
  (Object.keys(RECIPES[stat]) as Currency[]).every((c) => allowed.has(c));

function buy(s: PlayerStats, w: Wallet, k: StatName): boolean {
  const price = priceOf(k, get(s, k));
  if (get(s, k) >= 100 || !canAfford(w, price)) return false;
  pay(w, price);
  set(s, k, get(s, k) + 1);
  return true;
}

function spend(s: PlayerStats, w: Wallet, buys: StatName[]): void {
  if (SPEND === 'rr') {
    let i = 0;
    let stalled = 0;
    while (stalled < buys.length) {
      if (buy(s, w, buys[i++ % buys.length])) stalled = 0;
      else stalled++;
    }
    for (;;) {
      const options = ALL_STATS.filter(
        (k) => get(s, k) < 100 && canAfford(w, priceOf(k, get(s, k))),
      ).sort((x, y) => unitsOf(priceOf(x, get(s, x))) - unitsOf(priceOf(y, get(s, y))));
      if (options.length === 0 || !buy(s, w, options[0])) return;
    }
  }

  for (;;) {
    const open = buys.filter((k) => get(s, k) < 100).sort((x, y) => get(s, x) - get(s, y));
    if (open.length === 0) break;
    if (buy(s, w, open[0])) continue;
    if (exchangeFor(w, priceOf(open[0], get(s, open[0]))) && buy(s, w, open[0])) continue;
    // Saving for open[0]: its currencies are reserved, the rest are free.
    const reserved = new Set(Object.keys(RECIPES[open[0]]) as Currency[]);
    const free = new Set(CURRENCIES.filter((c) => !reserved.has(c)));
    const other = open.slice(1).find((k) => usesOnly(k, free) && buy(s, w, k));
    if (!other) break;
  }

  const identityCurrencies = new Set(buys.flatMap((k) => Object.keys(RECIPES[k]) as Currency[]));
  const spare = new Set(CURRENCIES.filter((c) => !identityCurrencies.has(c)));
  if (spare.size === 0) return;
  for (;;) {
    const options = ALL_STATS.filter((k) => usesOnly(k, spare) && get(s, k) < 100).sort(
      (x, y) => get(s, x) - get(s, y),
    );
    if (!options.some((k) => buy(s, w, k))) return;
  }
}

function silently<T>(fn: () => T): T {
  const log = console.log;
  console.log = (): void => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

function career(id: Identity, system: System): Map<number, Snapshot> {
  const stats = clone(PlayerManager.createPlayer('c', 'balanced').stats);
  const wallet: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  const spent: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  const other: Record<StatName, number> = Object.fromEntries(
    ALL_STATS.map((k) => [k, 0]),
  ) as Record<StatName, number>;
  const roster = OPPONENTS_BY_TIER[1];
  let energy = 100;
  let anchorIdx = 0;
  let recent: StatBoosts | undefined;
  let tierWins = 0;
  let matchesWon = 0;
  let matchesPlayed = 0;
  let sessions = 0;
  const snaps = new Map<number, Snapshot>();

  for (let day = 1; day <= DAYS; day++) {
    const matchDay = day >= 5 && (day - 5) % MATCH_EVERY === 0;
    for (let slot = 0; slot < 3; slot++) {
      if (matchDay && slot === 1 && energy >= 50) {
        const opp = roster[matchesPlayed % roster.length];
        const r = playMatch(
          { stats, profile: id.profile },
          {
            stats: getScaledOpponentStats(opp.stats, tierWins),
            profile: getOpponentArchetypeProfile(opp),
          },
          BO1,
          system === 'currency',
        );
        energy -= 50;
        matchesPlayed++;
        if (r.winner === 'player') {
          matchesWon++;
          tierWins++;
        }
        if (system === 'currency' && r.stats) {
          const ms = r.stats;
          const perf = silently(() =>
            MatchRewardSystem.calculateRewards(ms.getStatistics(), 1, r.winner === 'player'),
          ).performanceBreakdown;
          const units = MATCH_UNITS * (0.5 + perf.overallScore / 100) * INCOME_SCALE;
          const areaUnits = units * (1 - MATCH_MIND_SHARE);
          const area = {
            power: perf.servingScore,
            quickness: perf.returningScore + perf.netPlayScore / 2,
            technique: perf.rallyScore + perf.netPlayScore / 2,
            mind: perf.mentalScore,
          };
          const areaTotal = Object.values(area).reduce((a, b) => a + b, 0) || 1;
          for (const c of CURRENCIES) wallet[c] += (areaUnits * area[c]) / areaTotal;
          wallet.mind += units * MATCH_MIND_SHARE;
        }
      } else if (energy >= 20) {
        const core = id.anchors[anchorIdx++ % id.anchors.length];
        const n = reps();
        sessions++;
        energy -= 20;
        if (system === 'today') {
          const result = buildAnchorTrainingResult(core, n, recentSupportsFrom(recent));
          recent = result.statBoosts;
          applyBoosts(stats, result.statBoosts);
        } else {
          const units = (TRAIN_BASE + TRAIN_PER_REP * n) * INCOME_SCALE;
          const general = units * TRAIN_GENERAL_SHARE;
          earn(wallet, inRatio(RECIPES[core], units - general - units * TRAIN_MIND_SHARE));
          wallet.mind += units * TRAIN_MIND_SHARE;
          for (const c of CURRENCIES) wallet[c] += general / CURRENCIES.length;
        }
      } else {
        energy = Math.min(100, energy + 20);
      }
    }
    energy = Math.min(100, energy + 50);

    // Story, challenges and (today only) the shop, as a steady trickle.
    const otherToday = system === 'today' ? OTHER_PER_DAY : OTHER_PER_DAY * (1 - SHOP_SHARE);
    for (const k of ALL_STATS) {
      other[k] += (otherToday * OTHER_WEIGHTS[k]) / OTHER_TOTAL;
      const whole = Math.floor(other[k]);
      if (whole <= 0) continue;
      other[k] -= whole;
      if (system === 'today') set(stats, k, Math.min(100, get(stats, k) + whole));
      else earn(wallet, RECIPES[k], whole * INCOME_SCALE);
    }

    if (system === 'currency') {
      const before = { ...wallet };
      spend(stats, wallet, id.buys);
      for (const c of CURRENCIES) spent[c] += before[c] - wallet[c];
    }

    if (CHECK.includes(day)) {
      snaps.set(day, {
        stats: clone(stats),
        wallet: { ...wallet },
        earned: Object.fromEntries(CURRENCIES.map((c) => [c, wallet[c] + spent[c]])) as Wallet,
        matchesWon,
        matchesPlayed,
        sessions,
      });
    }
  }
  return snaps;
}

// ─── Report ──────────────────────────────────────────────────

const STRENGTH_OPPONENTS = [
  {
    name: 'Big Steve',
    stats: OPPONENTS_BY_TIER[1].find((o) => o.name === 'Big Steve')!.stats,
    profile: profileForArchetype('serve_volley'),
  },
  {
    name: 'Olivia',
    stats: {
      core: { serve: 42, forehand: 46, backhand: 39, return: 44, net: 34 },
      technical: { slice: 46, spin: 39, placement: 41 },
      physical: { speed: 36, stamina: 48, strength: 35 },
      mental: { focus: 41, anticipation: 43, tactics: 41 },
    },
    profile: profileForArchetype('aggressive'),
  },
  {
    name: 'Jordan',
    stats: {
      core: { serve: 50, forehand: 50, backhand: 46, return: 47, net: 43 },
      technical: { slice: 48, spin: 40, placement: 48 },
      physical: { speed: 44, stamina: 48, strength: 46 },
      mental: { focus: 46, anticipation: 40, tactics: 40 },
    },
    profile: profileForArchetype('serve_volley'),
  },
];

function meanStats(list: PlayerStats[]): PlayerStats {
  const out = clone(list[0]);
  for (const k of ALL_STATS) {
    set(out, k, Math.round(list.reduce((a, s) => a + get(s, k), 0) / list.length));
  }
  return out;
}

function strength(s: PlayerStats, profile: ArchetypeProfile): number[] {
  return STRENGTH_OPPONENTS.map((o) => {
    let won = 0;
    let pts = 0;
    for (let i = 0; i < N; i++) {
      const r = playMatch(
        { stats: s, profile },
        { stats: o.stats, profile: o.profile },
        BO3,
        false,
      );
      won += r.won;
      pts += r.points;
    }
    return (won / pts) * 100;
  });
}

function main(): void {
  console.log(
    `careerSim  RUNS=${RUNS} N=${N} DAYS=${DAYS} MATCH_EVERY=${MATCH_EVERY} REPS_P=${REPS_P} ` +
      `OTHER_PER_DAY=${OTHER_PER_DAY} SHOP_SHARE=${SHOP_SHARE} INCOME_SCALE=${INCOME_SCALE} ` +
      `TRAIN_BASE=${TRAIN_BASE} TRAIN_PER_REP=${TRAIN_PER_REP} MATCH_UNITS=${MATCH_UNITS} ` +
      `MATCH_MIND_SHARE=${MATCH_MIND_SHARE} TRAIN_MIND_SHARE=${TRAIN_MIND_SHARE} TRAIN_GENERAL_SHARE=${TRAIN_GENERAL_SHARE} EXCHANGE=${EXCHANGE} SPEND=${SPEND}`,
  );
  console.log(
    [
      'identity',
      'system',
      'day',
      'total',
      'OVR',
      'W-L',
      ...STRENGTH_OPPONENTS.map((o) => o.name),
      'mean',
      'unspent P/Q/T/M',
      'earned P/Q/T/M',
      'top stats',
    ].join('\t'),
  );
  for (const id of IDENTITIES) {
    for (const system of ['today', 'currency'] as System[]) {
      const careers = Array.from({ length: RUNS }, () => career(id, system));
      for (const day of CHECK) {
        const snaps = careers.map((c) => c.get(day)!);
        const s = meanStats(snaps.map((x) => x.stats));
        const total = ALL_STATS.reduce((a, k) => a + get(s, k), 0);
        const won = snaps.reduce((a, x) => a + x.matchesWon, 0) / RUNS;
        const played = snaps.reduce((a, x) => a + x.matchesPlayed, 0) / RUNS;
        const e = CURRENCIES.map((c) =>
          (snaps.reduce((a, x) => a + x.earned[c], 0) / RUNS).toFixed(0),
        ).join('/');
        const w = CURRENCIES.map((c) =>
          (snaps.reduce((a, x) => a + x.wallet[c], 0) / RUNS).toFixed(0),
        ).join('/');
        const top = [...ALL_STATS]
          .sort((x, y) => get(s, y) - get(s, x))
          .slice(0, 4)
          .map((k) => `${k} ${get(s, k)}`)
          .join(', ');
        const str =
          day === CHECK[CHECK.length - 1] || process.env.ALL_CHECKS ? strength(s, id.profile) : [];
        const mean = str.length ? str.reduce((a, b) => a + b, 0) / str.length : NaN;
        console.log(
          [
            id.name,
            system,
            day,
            total,
            calculateOverallRating(s),
            `${won.toFixed(1)}-${(played - won).toFixed(1)}`,
            ...(str.length ? str.map((v) => v.toFixed(1)) : ['', '', '']),
            Number.isNaN(mean) ? '' : mean.toFixed(1),
            system === 'currency' ? w : '',
            system === 'currency' ? e : '',
            top,
          ].join('\t'),
        );
      }
    }
  }
}

main();
