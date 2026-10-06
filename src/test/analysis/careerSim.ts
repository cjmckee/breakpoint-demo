/**
 * Career Sim — the first weeks of a career under today's stat grants and under
 * the currency design in docs/proposals/stat-currency-progression.md §6.
 *
 * Question: how much currency does each activity have to pay for a player on
 * the currency system to be as ready for the story's team matches as the same
 * player is today — and does any player end up starved of a currency?
 *
 * THE CALENDAR is the game's own (gameStore's initial story schedule). Story
 * events take the slots their definitions say they take, the archetype is
 * chosen on day 11 (no specialties before that), and the team matches are
 * played on their afternoons: day 15 Chet Vale, 19 Rich Soil, 23 Martia
 * Estrella, 27 Reginald Werther, 31 Olivia Gulp — best of three, on their
 * surfaces. Every other free slot trains (20 energy) or, every MATCH_EVERY days
 * from day 5, plays a practice match (50 energy) against the tier-1 roster,
 * scaled per win the way the game scales it. Short of energy, the player rests
 * for 20; night sleeps for 50. Training reps are Binomial(3, REPS_P).
 *
 * THE PLAYER is not a playstyle. Each career draws its own preference weights:
 * its identity's key stats at KEY_W (a range), every other stat at OFF_W. It
 * wants each stat to have grown in proportion to its weight, so it spends on
 * whichever stat is furthest behind that shape — mostly the key stats, but a
 * baseliner still buys a serve. Weights are drawn per career, so no two players
 * of an identity build quite the same way. Both systems share the weights.
 *
 * today     The player picks the anchor whose core stat is furthest behind its
 *           shape (or, 1 − ADAPT of the time, one of its identity's anchors),
 *           and AnchorTrainingSystem pays +1 core, +1 per rep from the pool.
 *           Story, challenges and the shop arrive as OTHER_PER_DAY stat points
 *           spread like authored content (statIncome.ts).
 * currency  The player picks the anchor that pays most of what its next few
 *           purchases are short of, leaning to its identity's anchors (ADAPT of
 *           the time; otherwise one of those anchors). Training pays
 *           (TRAIN_BASE + TRAIN_PER_REP × reps) × INCOME_SCALE units:
 *           TRAIN_GENERAL_SHARE split evenly, TRAIN_MIND_SHARE as Mind, the rest
 *           in the anchor's recipe ratio. Story and challenges pay the same stat
 *           points as today through each stat's recipe; the shop no longer sells
 *           stats, so SHOP_SHARE of OTHER_PER_DAY is dropped. Matches pay
 *           MATCH_UNITS × (0.5 + overall/100) × INCOME_SCALE, MATCH_MIND_SHARE of
 *           it Mind and the rest by MatchRewardSystem's per-area scores
 *           (serving→Power, returning→Quickness, rally→Technique,
 *           net→Quickness+Technique, mental→Mind). Each evening the player buys
 *           toward its shape (SPEND, see buyTowardShape).
 *
 * Readiness is measured at each CHECK day against that day's team-match
 * opponent, on the mean build of each identity: point-win % and match-win %
 * over N best-of-three matches. The in-career team match results are reported
 * too (the share of careers that won it).
 *
 * Run: npx tsx src/test/analysis/careerSim.ts
 * Env: RUNS=20 (careers per identity per system)  N=200 (BO3 per readiness cell)
 *      DAYS=23  CHECK=15,19,23  MATCH_EVERY=2  REPS_P=0.7  ADAPT=0.7
 *      KEY_W=0.8,1.2  OFF_W=0.25,0.55
 *      OTHER_PER_DAY=2.2  SHOP_SHARE=0.25  INCOME_SCALE=1.2
 *      TRAIN_BASE=2  TRAIN_PER_REP=3  TRAIN_GENERAL_SHARE=0.2  TRAIN_MIND_SHARE=0.1
 *      MATCH_UNITS=16  MATCH_MIND_SHARE=0.6  EXCHANGE=0
 *      SPEND=patient|affordable|impatient  (see buyTowardShape)  OVERBUILD=8
 *      STATS=1 prints every stat of the mean build instead of the lowest/top three
 *      LEDGER=1 reports, per identity, slot use, currency earned by source, and
 *      currency spent per stat — no readiness matches, so it runs in seconds
 *            |level|rr  (the rigid planners of the first pass)
 *      §9.6–9.7 were run with SPEND=impatient EXCHANGE=2
 *      TRACE=<identity> prints one currency career day by day: every slot, match
 *      payout, purchase, exchange, and what the player is saving for
 */

import type {
  MatchFormat,
  MatchStatistics as IMatchStatistics,
  PlayerStats,
  StatName,
} from '../../types';
import type {
  ArchetypeProfile,
  BroadArchetype,
  GamePhase,
  PhasePathId,
} from '../../types/archetype';
import type { StatBoosts } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch, type Rates } from './matchTally';
import {
  CURRENCIES,
  RECIPES,
  canAfford,
  earn,
  inRatio,
  pay,
  priceOf,
  unitsOf,
  type Amounts,
  type Currency,
  type Wallet,
} from './statEconomy';
import { MatchSimulator } from '../../core/MatchSimulator';
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
import {
  aggregateArchetypeEffects,
  createEmptyArchetypeProfile,
  profileForArchetype,
} from '../../data/archetypeTree';
import { StoryEventRepository } from '../../data/storyEvents';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import type { TeamMatchConfig } from '../../types/game';
import type { CourtSurface } from '../../types';

// ─── Configuration ───────────────────────────────────────────

const env = (k: string, d: number): number => Number(process.env[k] ?? d);
const RUNS = env('RUNS', 20);
const N = env('N', 200);
const DAYS = env('DAYS', 23);
const CHECK = (process.env.CHECK ?? '15,19,23').split(',').map(Number);
const ADAPT = env('ADAPT', 0.7);
const range = (k: string, d: string): [number, number] => {
  const [lo, hi] = (process.env[k] ?? d).split(',').map(Number);
  return [lo, hi];
};
const KEY_W = range('KEY_W', '0.8,1.2');
const OFF_W = range('OFF_W', '0.25,0.55');
const MATCH_EVERY = env('MATCH_EVERY', 2);
const REPS_P = env('REPS_P', 0.7);
const OTHER_PER_DAY = env('OTHER_PER_DAY', 2.2);
const SHOP_SHARE = env('SHOP_SHARE', 0.25);
const INCOME_SCALE = env('INCOME_SCALE', 1.2);
const TRAIN_BASE = env('TRAIN_BASE', 2);
const TRAIN_PER_REP = env('TRAIN_PER_REP', 3);
const MATCH_UNITS = env('MATCH_UNITS', 16);
const MATCH_MIND_SHARE = env('MATCH_MIND_SHARE', 0.6);
const TRAIN_MIND_SHARE = env('TRAIN_MIND_SHARE', 0.1);
const TRAIN_GENERAL_SHARE = env('TRAIN_GENERAL_SHARE', 0.2);

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

// ─── Calendar ────────────────────────────────────────────────

/** gameStore's initial story schedule: [day, story event id]. */
const STORY_SCHEDULE: Array<[number, string]> = [
  [2, 'making_connections'],
  [3, 'food_hall_gossip'],
  [4, 'player_tier_intro'],
  [5, 'match_play_basics'],
  [5, 'training_session_intro'],
  [6, 'relationship_basics'],
  [7, 'shop_basics'],
  [8, 'rival_first_encounter'],
  [9, 'club_team_intro'],
  [10, 'coach_first_meeting'],
  [11, 'coach_archetype_selection'],
  [11, 'club_team_first_practice'],
  [12, 'coach_training_focus'],
  [13, 'first_team_match_scheduled'],
  [16, 'coach_balanced_development'],
  [17, 'second_team_match_scheduled'],
  [21, 'third_team_match_scheduled'],
  [25, 'fourth_team_match_scheduled'],
  [29, 'fifth_team_match_scheduled'],
  [33, 'riverside_open_prep'],
];

/** Slots each day's story events take, from their own definitions. */
const STORY_SLOTS: Map<number, number> = STORY_SCHEDULE.reduce((m, [day, eventId]) => {
  const slots = StoryEventRepository.getEventById(eventId)?.timeSlotsRequired ?? 0;
  m.set(day, (m.get(day) ?? 0) + slots);
  return m;
}, new Map<number, number>());

/** Each announcement schedules its match two days on, in the afternoon. */
const TEAM_MATCHES: Map<number, TeamMatchConfig> = new Map([
  [15, TEAM_MATCH_1],
  [19, TEAM_MATCH_2],
  [23, TEAM_MATCH_3],
  [27, TEAM_MATCH_4],
  [31, TEAM_MATCH_5],
]);

/** coach_archetype_selection: no broad identity or specialties before this. */
const ARCHETYPE_DAY = 11;

const teamSide = (t: TeamMatchConfig): Side => ({
  stats: t.opponent.stats,
  profile: profileForArchetype(t.opponent.archetype),
});

const BO3_FOR: Record<string, MatchFormat> = { 'best-of-3': BO3, 'best-of-1': BO1 };

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
  /** The anchors this identity leans toward. */
  anchors: CoreStat[];
  /** The identity's key stats: weighted KEY_W, everything else OFF_W. */
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
];

// ─── Match runner ────────────────────────────────────────────

interface Side {
  stats: PlayerStats;
  profile: ArchetypeProfile;
}

/**
 * One match through the game's own MatchSimulator, so fatigue, changeover and
 * set-break recovery, momentum and the starting fatigue of a tired player
 * (`energy`, the player's energy going in) are all the real thing. The
 * opponent always arrives fresh.
 */
function playMatch(
  a: Side,
  b: Side,
  format: MatchFormat,
  surface: CourtSurface = 'hard',
  energy = 100,
): {
  won: number;
  points: number;
  winner: 'player' | 'opponent';
  stats: IMatchStatistics;
  pointList: Array<{ server: 'player' | 'opponent'; winner: 'player' | 'opponent' }>;
} {
  const player = new PlayerProfile('p', 'P', a.stats, a.profile);
  player.energy = energy;
  const sim = new MatchSimulator({
    player,
    opponent: new PlayerProfile('o', 'O', b.stats, b.profile),
    courtSurface: surface,
    matchFormat: format,
  });
  const result = silently(() => sim.simulateMatch());
  const points = sim.exportMatchData().points;
  return {
    won: points.filter((pt) => pt.winner === 'player').length,
    points: points.length,
    winner: result.winner,
    stats: sim.getStatistics(),
    pointList: points,
  };
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
  /** Team match results so far, by day. */
  teamWon: Map<number, boolean>;
  /** Where currency came from and went, and how the slots were spent. */
  ledger: Ledger;
}

type Source = 'training' | 'practice' | 'team' | 'story';
const SOURCES: Source[] = ['training', 'practice', 'team', 'story'];
type SlotUse = 'train' | 'practice' | 'team' | 'story' | 'rest';
const SLOT_USES: SlotUse[] = ['train', 'practice', 'team', 'story', 'rest'];

interface Ledger {
  earned: Record<Source, Wallet>;
  spentOn: Record<StatName, Wallet>;
  slots: Record<SlotUse, number>;
  anchors: Record<CoreStat, number>;
}

const zeroWallet = (): Wallet => ({ power: 0, quickness: 0, technique: 0, mind: 0 });
const emptyLedger = (): Ledger => ({
  earned: Object.fromEntries(SOURCES.map((k) => [k, zeroWallet()])) as Record<Source, Wallet>,
  spentOn: Object.fromEntries(ALL_STATS.map((k) => [k, zeroWallet()])) as Record<StatName, Wallet>,
  slots: Object.fromEntries(SLOT_USES.map((k) => [k, 0])) as Record<SlotUse, number>,
  anchors: { serve: 0, forehand: 0, backhand: 0, return: 0, net: 0 },
});
const cloneLedger = (l: Ledger): Ledger => JSON.parse(JSON.stringify(l)) as Ledger;
const addInto = (into: Wallet, a: Amounts): void => {
  for (const c of CURRENCIES) into[c] += a[c] ?? 0;
};

/** Set while a currency career spends, so buy() can book each purchase to its stat. */
let spendLedger: Record<StatName, Wallet> | null = null;

const reps = (): number => [0, 1, 2].reduce((n) => n + (Math.random() < REPS_P ? 1 : 0), 0);

function applyBoosts(s: PlayerStats, b: StatBoosts): void {
  for (const [k, v] of Object.entries(b) as Array<[StatName, number]>) {
    if (v) set(s, k, Math.min(100, get(s, k) + v));
  }
}

/**
 * How the player spends each evening.
 *
 * patient | affordable | impatient
 *        buy toward the player's preference shape — see buyTowardShape().
 * level  the first pass's rigid planner: always buys the identity's LOWEST stat, saving
 *        for it when it is unaffordable. Currencies that stat does not need
 *        stay free for the identity's other stats. Spill only spends a
 *        currency no identity recipe uses. A currency that piles up in the
 *        wallet under this policy is a currency the identity cannot earn
 *        enough of.
 * rr     round-robin over the identity's stats, then spill everything left
 *        cheapest-first — a player who buys whatever is affordable.
 */
const SPEND = process.env.SPEND ?? 'patient';

/**
 * EXCHANGE=r lets the planner trade r units of a currency its target does not
 * use for 1 unit of one it is short of. 0 disables it.
 */
const EXCHANGE = env('EXCHANGE', 0);

/** patient: how far past its shape a stat may be bought with spare currency. */
const OVERBUILD = env('OVERBUILD', 8);

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
  const gave = CURRENCIES.filter((c) => trial[c] < w[c]).map(
    (c) => `${(w[c] - trial[c]).toFixed(1)}${SHORT[c]}`,
  );
  const got = CURRENCIES.filter((c) => trial[c] > w[c]).map(
    (c) => `${(trial[c] - w[c]).toFixed(1)}${SHORT[c]}`,
  );
  note(`      exchange ${gave.join(' ')} → ${got.join(' ')}`);
  Object.assign(w, trial);
  return true;
}

const usesOnly = (stat: StatName, allowed: Set<Currency>): boolean =>
  (Object.keys(RECIPES[stat]) as Currency[]).every((c) => allowed.has(c));

function buy(s: PlayerStats, w: Wallet, k: StatName): boolean {
  const price = priceOf(k, get(s, k));
  if (get(s, k) >= 100 || !canAfford(w, price)) return false;
  pay(w, price);
  if (spendLedger) addInto(spendLedger[k], price);
  set(s, k, get(s, k) + 1);
  return true;
}

// ─── The player ──────────────────────────────────────────────

type Weights = Record<StatName, number>;
const uniformIn = ([lo, hi]: [number, number]): number => lo + Math.random() * (hi - lo);

/** One player's preferences: key stats heavy, the rest light, all a little random. */
function drawWeights(id: Identity): Weights {
  return Object.fromEntries(
    ALL_STATS.map((k) => [k, uniformIn(id.buys.includes(k) ? KEY_W : OFF_W)]),
  ) as Weights;
}

/** How far a stat is behind the player's shape: growth so far over its weight. */
const behind = (s: PlayerStats, w: Weights, k: StatName): number => (get(s, k) - 20) / w[k];
const shapeOrder = (s: PlayerStats, w: Weights): StatName[] =>
  ALL_STATS.filter((k) => get(s, k) < 100).sort((x, y) => behind(s, w, x) - behind(s, w, y));

/**
 * Buy toward the shape, the stat furthest behind first.
 *
 * patient     (default) if that stat is unaffordable, save for it — but spend
 *             every currency it does not need on the weakest stat that uses
 *             only those. A defensive player sitting on Power buys strength or
 *             serve with it rather than trading it away. It will not push a
 *             stat more than OVERBUILD points past where its shape wants it:
 *             past that, spare currency is banked (Mind for abilities, say).
 * affordable  never save: buy the weakest stat it can afford right now.
 * impatient   the first version: trade spare currency at EXCHANGE:1 the moment
 *             the target is unaffordable, and look only three stats down the
 *             list for anything else to buy. Kept to reproduce §9.6–9.7.
 */
function buyTowardShape(s: PlayerStats, wallet: Wallet, w: Weights): void {
  for (;;) {
    const order = shapeOrder(s, w);
    if (order.length === 0) return;
    if (SPEND === 'affordable') {
      if (!order.some((k) => buy(s, wallet, k))) return;
      continue;
    }
    const target = order[0];
    if (buy(s, wallet, target)) continue;
    if (
      SPEND === 'impatient' &&
      exchangeFor(wallet, priceOf(target, get(s, target))) &&
      buy(s, wallet, target)
    )
      continue;
    const reserved = new Set(Object.keys(RECIPES[target]) as Currency[]);
    const free = new Set(CURRENCIES.filter((c) => !reserved.has(c)));
    // Where the shape wants stat k, at the target's rate of growth.
    const wanted = (k: StatName): number => 20 + w[k] * behind(s, w, target);
    const candidates =
      SPEND === 'impatient'
        ? order.slice(1, 4)
        : order.slice(1).filter((k) => get(s, k) < wanted(k) + OVERBUILD);
    const other = candidates.find((k) => usesOnly(k, free) && buy(s, wallet, k));
    if (!other) {
      note(
        `      saving for ${target} ${get(s, target)}→${get(s, target) + 1}: ` +
          `costs ${fmtAmounts(priceOf(target, get(s, target)))}`,
      );
      return;
    }
  }
}

const ANCHORS: CoreStat[] = ['serve', 'forehand', 'backhand', 'return', 'net'];
const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Today: train the core stat furthest behind the shape, or lean on the identity. */
function anchorToday(s: PlayerStats, w: Weights, id: Identity): CoreStat {
  if (Math.random() >= ADAPT) return pick(id.anchors);
  return [...ANCHORS].sort((x, y) => behind(s, w, x) - behind(s, w, y))[0];
}

/** Currency: train for what the next few purchases are short of, leaning to the identity. */
function anchorCurrency(s: PlayerStats, wallet: Wallet, w: Weights, id: Identity): CoreStat {
  if (Math.random() >= ADAPT) return pick(id.anchors);
  const need: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  for (const k of shapeOrder(s, w).slice(0, 3)) earn(need, priceOf(k, get(s, k)));
  for (const c of CURRENCIES) need[c] = Math.max(0, need[c] - wallet[c]);
  if (unitsOf(need) === 0) return pick(id.anchors);
  const score = (a: CoreStat): number =>
    CURRENCIES.reduce((t, c) => t + need[c] * ((RECIPES[a][c] ?? 0) / unitsOf(RECIPES[a])), 0) *
    (id.anchors.includes(a) ? 1 : 0.6);
  return [...ANCHORS].sort((x, y) => score(y) - score(x))[0];
}

function spend(s: PlayerStats, w: Wallet, buys: StatName[], weights: Weights): void {
  if (SPEND !== 'level' && SPEND !== 'rr') return buyTowardShape(s, w, weights);
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
    if (!other) {
      note(
        `      saving for ${open[0]} ${get(s, open[0])}→${get(s, open[0]) + 1}: ` +
          `costs ${fmtAmounts(priceOf(open[0], get(s, open[0])))}`,
      );
      break;
    }
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

// ─── Trace ───────────────────────────────────────────────────

/** TRACE=<identity> prints one currency career's every slot and purchase. */
const TRACE = process.env.TRACE;
let traceLog: string[] | null = null;
const note = (line: string): void => {
  traceLog?.push(line);
};
const SHORT: Record<Currency, string> = { power: 'P', quickness: 'Q', technique: 'T', mind: 'M' };
const fmtAmounts = (a: Amounts): string =>
  CURRENCIES.filter((c) => (a[c] ?? 0) > 0.05)
    .map((c) => `${(a[c] ?? 0).toFixed(1).replace(/\.0$/, '')}${SHORT[c]}`)
    .join(' ');
const diffWallet = (after: Wallet, before: Wallet): Amounts =>
  Object.fromEntries(CURRENCIES.map((c) => [c, after[c] - before[c]])) as Amounts;

function silently<T>(fn: () => T): T {
  const log = console.log;
  console.log = (): void => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

/** Match currency: Mind share plus per-area scores (serving→Power, …). */
function payMatch(wallet: Wallet, ms: IMatchStatistics, won: boolean): string {
  const perf = silently(() => MatchRewardSystem.calculateRewards(ms, 1, won)).performanceBreakdown;
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
  return (
    `perf ${perf.overallScore.toFixed(0)} (serve ${perf.servingScore.toFixed(0)}, ` +
    `return ${perf.returningScore.toFixed(0)}, rally ${perf.rallyScore.toFixed(0)}, ` +
    `net ${perf.netPlayScore.toFixed(0)}, mental ${perf.mentalScore.toFixed(0)})`
  );
}

function career(
  id: Identity,
  system: System,
  weights: Weights = drawWeights(id),
): Map<number, Snapshot> {
  const stats = clone(PlayerManager.createPlayer('c', 'balanced').stats);
  const wallet: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  const spent: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  const other: Record<StatName, number> = Object.fromEntries(
    ALL_STATS.map((k) => [k, 0]),
  ) as Record<StatName, number>;
  const roster = OPPONENTS_BY_TIER[1];
  const unchosen = createEmptyArchetypeProfile();
  const teamWon = new Map<number, boolean>();
  let energy = 100;
  let anchorIdx = 0;
  let recent: StatBoosts | undefined;
  let tierWins = 0;
  let matchesWon = 0;
  let matchesPlayed = 0;
  let sessions = 0;
  const snaps = new Map<number, Snapshot>();
  const ledger = emptyLedger();
  const credit = (source: Source, before: Wallet): void =>
    addInto(ledger.earned[source], diffWallet(wallet, before));

  for (let day = 1; day <= DAYS; day++) {
    const team = TEAM_MATCHES.get(day);
    const practiceDay = !team && day >= 5 && (day - 5) % MATCH_EVERY === 0;
    const profile = day >= ARCHETYPE_DAY ? id.profile : unchosen;
    let storySlots = STORY_SLOTS.get(day) ?? 0;
    note(`Day ${day}  (energy ${energy})`);
    for (let slot = 0; slot < 3; slot++) {
      const slotName = ['morning  ', 'afternoon', 'evening  '][slot];
      const walletBefore = { ...wallet };
      if (storySlots > 0) {
        storySlots--;
        ledger.slots.story++;
        note(`  ${slotName} story event`);
      } else if (team && slot === 1) {
        const r = playMatch(
          { stats, profile },
          teamSide(team),
          BO3_FOR[team.matchFormat] ?? BO3,
          team.surface,
          energy,
        );
        energy -= Math.min(50, energy);
        teamWon.set(day, r.winner === 'player');
        ledger.slots.team++;
        const perf = system === 'currency' ? payMatch(wallet, r.stats, r.winner === 'player') : '';
        credit('team', walletBefore);
        note(
          `  ${slotName} TEAM MATCH vs ${team.opponent.name} on ${team.surface} — ` +
            `${r.winner === 'player' ? 'WON' : 'lost'}, ${r.won}/${r.points} points. ${perf} ` +
            `→ +${fmtAmounts(diffWallet(wallet, walletBefore))}`,
        );
      } else if (practiceDay && slot === 1 && energy >= 50) {
        const opp = roster[matchesPlayed % roster.length];
        const bump = Math.min(tierWins * 2, 20);
        const r = playMatch(
          { stats, profile },
          {
            stats: getScaledOpponentStats(opp.stats, tierWins),
            profile: getOpponentArchetypeProfile(opp),
          },
          BO1,
          'hard',
          energy,
        );
        energy -= 50;
        matchesPlayed++;
        if (r.winner === 'player') {
          matchesWon++;
          tierWins++;
        }
        ledger.slots.practice++;
        const perf = system === 'currency' ? payMatch(wallet, r.stats, r.winner === 'player') : '';
        credit('practice', walletBefore);
        note(
          `  ${slotName} practice vs ${opp.name} (+${bump}) — ` +
            `${r.winner === 'player' ? 'WON' : 'lost'}, ${r.won}/${r.points} points. ${perf} ` +
            `→ +${fmtAmounts(diffWallet(wallet, walletBefore))}`,
        );
      } else if (energy >= 20) {
        const core =
          SPEND === 'level' || SPEND === 'rr'
            ? id.anchors[anchorIdx++ % id.anchors.length]
            : system === 'today'
              ? anchorToday(stats, weights, id)
              : anchorCurrency(stats, wallet, weights, id);
        const n = reps();
        sessions++;
        energy -= 20;
        ledger.slots.train++;
        ledger.anchors[core]++;
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
          credit('training', walletBefore);
          note(
            `  ${slotName} train ${core} — ${n}/3 reps → +${fmtAmounts(diffWallet(wallet, walletBefore))}`,
          );
        }
      } else {
        energy = Math.min(100, energy + 20);
        ledger.slots.rest++;
        note(`  ${slotName} rest (energy ${energy})`);
      }
    }
    energy = Math.min(100, energy + 50);
    note(`  night     sleep (energy ${energy})`);
    const beforeOther = { ...wallet };

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
      credit('story', beforeOther);
      const otherGain = diffWallet(wallet, beforeOther);
      if (unitsOf(otherGain) > 0.05) note(`  story/challenges → +${fmtAmounts(otherGain)}`);
      const before = { ...wallet };
      const statsBefore = clone(stats);
      if (traceLog) note('  evening spend:');
      spendLedger = ledger.spentOn;
      spend(stats, wallet, id.buys, weights);
      spendLedger = null;
      for (const c of CURRENCIES) spent[c] += before[c] - wallet[c];
      const bought = ALL_STATS.filter((k) => get(stats, k) !== get(statsBefore, k)).map(
        (k) => `${k} ${get(statsBefore, k)}→${get(stats, k)}`,
      );
      if (bought.length)
        note(
          `      bought ${bought.join(', ')}  (spent ${fmtAmounts(diffWallet(before, wallet))})`,
        );
      note(`  wallet ${fmtAmounts(wallet) || 'empty'}`);
    }

    if (CHECK.includes(day)) {
      snaps.set(day, {
        stats: clone(stats),
        wallet: { ...wallet },
        earned: Object.fromEntries(CURRENCIES.map((c) => [c, wallet[c] + spent[c]])) as Wallet,
        matchesWon,
        matchesPlayed,
        sessions,
        teamWon: new Map(teamWon),
        ledger: cloneLedger(ledger),
      });
    }
  }
  return snaps;
}

// ─── Report ──────────────────────────────────────────────────

function meanStats(list: PlayerStats[]): PlayerStats {
  const out = clone(list[0]);
  for (const k of ALL_STATS) {
    set(out, k, Math.round(list.reduce((a, s) => a + get(s, k), 0) / list.length));
  }
  return out;
}

/** Point, game (hold / break) and match win rates over N best-of-three matches against `team`. */
function readiness(s: PlayerStats, profile: ArchetypeProfile, team: TeamMatchConfig): Rates {
  const rates = emptyRates();
  for (let i = 0; i < N; i++) {
    const r = playMatch({ stats: s, profile }, teamSide(team), BO3, team.surface);
    tallyMatch(r.pointList, BO3, rates);
  }
  return rates;
}

function traceCareer(name: string): void {
  const id = IDENTITIES.find((i) => i.name === name);
  if (!id)
    throw new Error(
      `TRACE: no identity '${name}' — try ${IDENTITIES.map((i) => i.name).join(', ')}`,
    );
  const weights = drawWeights(id);
  console.log(
    `${id.name}: preference weights ` +
      [...ALL_STATS]
        .sort((x, y) => weights[y] - weights[x])
        .map((k) => `${k} ${weights[k].toFixed(2)}`)
        .join(', '),
  );
  traceLog = [];
  const snaps = career(id, 'currency', weights);
  console.log(traceLog.join('\n'));
  traceLog = null;
  const last = snaps.get(CHECK[CHECK.length - 1]);
  if (last) {
    const s = last.stats;
    const team = [...last.teamWon].map(([d, w]) => `day ${d} ${w ? 'W' : 'L'}`).join(', ');
    console.log(
      `\nFinal (day ${CHECK[CHECK.length - 1]}): total ${ALL_STATS.reduce((a, k) => a + get(s, k), 0)}, ` +
        `OVR ${calculateOverallRating(s)}, practice ${last.matchesWon}-${last.matchesPlayed - last.matchesWon}, ` +
        `team matches ${team || 'none'}`,
    );
    console.log(ALL_STATS.map((k) => `${k} ${get(s, k)}`).join(', '));
  }
}

/**
 * LEDGER=1: for each identity, RUNS currency careers to the last CHECK day —
 * how the slots went, where every unit of currency came from, and what it
 * bought. Means per career.
 */
function ledgerReport(): void {
  const day = CHECK[CHECK.length - 1];
  const f = (x: number): string => x.toFixed(0);
  const split = (w: Wallet): string => CURRENCIES.map((c) => f(w[c])).join(' / ');
  console.log(
    `careerSim LEDGER  RUNS=${RUNS} day ${day} INCOME_SCALE=${INCOME_SCALE} SPEND=${SPEND}`,
  );
  for (const id of IDENTITIES) {
    const ls = Array.from({ length: RUNS }, () => career(id, 'currency').get(day)!);
    const mean = (pick: (l: Snapshot) => number): number =>
      ls.reduce((a, l) => a + pick(l), 0) / ls.length;
    const meanWallet = (pick: (l: Snapshot) => Wallet): Wallet =>
      Object.fromEntries(CURRENCIES.map((c) => [c, mean((l) => pick(l)[c])])) as Wallet;

    console.log(`\n== ${id.name}`);
    console.log(
      'slots: ' +
        SLOT_USES.map((u) => `${u} ${mean((l) => l.ledger.slots[u]).toFixed(1)}`).join(', ') +
        '  |  anchors trained: ' +
        ANCHORS.map((a) => `${a} ${mean((l) => l.ledger.anchors[a]).toFixed(1)}`).join(', '),
    );
    const total = SOURCES.reduce(
      (t, src) => t + unitsOf(meanWallet((l) => l.ledger.earned[src])),
      0,
    );
    console.log('source\tunits\tshare\tP / Q / T / M');
    for (const src of SOURCES) {
      const w = meanWallet((l) => l.ledger.earned[src]);
      console.log(
        [src, f(unitsOf(w)), `${((unitsOf(w) / total) * 100).toFixed(0)}%`, split(w)].join('\t'),
      );
    }
    const earnedAll = meanWallet((l) => l.earned);
    console.log(['earned', f(unitsOf(earnedAll)), '', split(earnedAll)].join('\t'));
    const unspent = meanWallet((l) => l.wallet);
    console.log(['unspent', f(unitsOf(unspent)), '', split(unspent)].join('\t'));

    console.log('stat\tunits spent\tshare\tP / Q / T / M\tstat at day ' + day);
    const spentTotal = ALL_STATS.reduce(
      (t, k) => t + unitsOf(meanWallet((l) => l.ledger.spentOn[k])),
      0,
    );
    for (const k of [...ALL_STATS].sort(
      (x, y) =>
        unitsOf(meanWallet((l) => l.ledger.spentOn[y])) -
        unitsOf(meanWallet((l) => l.ledger.spentOn[x])),
    )) {
      const w = meanWallet((l) => l.ledger.spentOn[k]);
      console.log(
        [
          k,
          f(unitsOf(w)),
          `${((unitsOf(w) / spentTotal) * 100).toFixed(0)}%`,
          split(w),
          mean((l) => get(l.stats, k)).toFixed(0),
        ].join('\t'),
      );
    }
  }
}

function main(): void {
  if (TRACE) return traceCareer(TRACE);
  if (process.env.LEDGER === '1') return ledgerReport();
  console.log(
    `careerSim  RUNS=${RUNS} N=${N} DAYS=${DAYS} SPEND=${SPEND} ADAPT=${ADAPT} KEY_W=${KEY_W} ` +
      `OFF_W=${OFF_W} MATCH_EVERY=${MATCH_EVERY} REPS_P=${REPS_P} OTHER_PER_DAY=${OTHER_PER_DAY} ` +
      `SHOP_SHARE=${SHOP_SHARE} INCOME_SCALE=${INCOME_SCALE} TRAIN_BASE=${TRAIN_BASE} ` +
      `TRAIN_PER_REP=${TRAIN_PER_REP} TRAIN_GENERAL_SHARE=${TRAIN_GENERAL_SHARE} ` +
      `TRAIN_MIND_SHARE=${TRAIN_MIND_SHARE} MATCH_UNITS=${MATCH_UNITS} ` +
      `MATCH_MIND_SHARE=${MATCH_MIND_SHARE} EXCHANGE=${EXCHANGE}`,
  );
  console.log(
    [
      'identity',
      'system',
      'day',
      'opponent',
      'total',
      'OVR',
      ...RATE_HEADERS,
      'won in career',
      'unspent P/Q/T/M',
      'lowest 3 / top 3 stats',
    ].join('\t'),
  );
  for (const id of IDENTITIES) {
    for (const system of ['today', 'currency'] as System[]) {
      const careers = Array.from({ length: RUNS }, () => career(id, system));
      for (const day of CHECK) {
        const snaps = careers.map((c) => c.get(day)!);
        const s = meanStats(snaps.map((x) => x.stats));
        const total = ALL_STATS.reduce((a, k) => a + get(s, k), 0);
        const team = TEAM_MATCHES.get(day);
        const rates = team
          ? readiness(s, day >= ARCHETYPE_DAY ? id.profile : createEmptyArchetypeProfile(), team)
          : null;
        const inCareer = team ? (snaps.filter((x) => x.teamWon.get(day)).length / RUNS) * 100 : NaN;
        const w = CURRENCIES.map((c) =>
          (snaps.reduce((a, x) => a + x.wallet[c], 0) / RUNS).toFixed(0),
        ).join('/');
        const sorted = [...ALL_STATS].sort((x, y) => get(s, x) - get(s, y));
        const fmt = (ks: StatName[]): string => ks.map((k) => `${k} ${get(s, k)}`).join(', ');
        console.log(
          [
            id.name,
            system,
            day,
            team?.opponent.name ?? '',
            total,
            calculateOverallRating(s),
            ...(rates ? formatRates(rates) : RATE_HEADERS.map(() => '')),
            Number.isNaN(inCareer) ? '' : `${inCareer.toFixed(0)}%`,
            system === 'currency' ? w : '',
            process.env.STATS === '1'
              ? ALL_STATS.map((k) => `${k} ${get(s, k)}`).join(', ')
              : `${fmt(sorted.slice(0, 3))} / ${fmt(sorted.slice(-3).reverse())}`,
          ].join('\t'),
        );
      }
    }
  }
}

main();
