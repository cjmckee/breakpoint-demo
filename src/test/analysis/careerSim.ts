/**
 * Career Sim — the first weeks of a career under today's stat grants and under
 * the currency design in docs/proposals/stat-currency-progression.md §6.
 *
 * Question: how much currency does each activity have to pay for a player on
 * the currency system to be as ready for the story's team matches as the same
 * player is today — and does any player end up starved of a currency?
 *
 * THE CALENDAR is the game's own (the Club season, src/data/seasons/club.ts). Story
 * events take the slots their definitions say they take, the archetype is
 * chosen on day 11 (no specialties before that), and the team matches are
 * played on their afternoons, on the days the calendar schedules them (today day
 * 14 Chet Vale, 17 Rich Soil, 20 Martia Estrella, 23 Reginald Werther, 26 Olivia
 * Gulp) — best of three, at their venues. Every other free slot trains (20 energy) or, every MATCH_EVERY days
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
 * currency  Each slot offers four of the six drills (TrainingSystem.trainingOffer).
 *           The player picks the offered drill that pays most of what its next
 *           few purchases are short of, leaning to its identity's drills (ADAPT
 *           of the time; otherwise a favourite if one is offered, else any).
 *           Training pays the drill's mix (TRAINING_MIXES) × (reps + 1). Story and
 *           challenges are the game's own events, played as they come (STORY=stream),
 *           and the shop no longer sells stats. Matches pay
 *           CurrencyIncome.matchPayout: a base by result (lost 1/1/2/1, won
 *           2/2/3/2) plus MATCH_POOL × overall/100 by MatchRewardSystem's
 *           per-area scores, each paid in the currencies that buy its stats
 *           (areaCurrencyMix). Each evening the player buys
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
 *      STORY=stream|flat  STORY_PICK=random|best  STORY_CHANCE=40  CHALLENGE_P=0.5
 *      MINIGAME_PASS=0.6: the currency career plays the game's own story (storyStream.ts):
 *      scheduled beats and their chains, the random roll each free daytime slot, team
 *      match result events and milestones, each paying its outcome and taking its slots.
 *      STORY=flat pays OTHER_PER_DAY instead, as the economy was first calibrated. A
 *      skilled player is about REPS_P=0.9 STORY_PICK=best MINIGAME_PASS=0.85 CHALLENGE_P=0.8.
 *      OTHER_PER_DAY=2.2  SHOP_SHARE=0.25  INCOME_SCALE=1.2
 *      MATCH_POOL=30  EXCHANGE=0
 *      MATCH_BASE=1,1,2,1/2,2,3,2 overrides a match's base pay, lost/won, as P,Q,T,M
 *      SPEND=patient|affordable|impatient  (see buyTowardShape)  OVERBUILD=8
 *      SYSTEMS=today,currency  STEP_FROM=40 (statEconomy price steps)
 *      STATS=1 prints every stat of the mean build instead of the lowest/top three
 *      LEDGER=1 reports, per identity, slot use, currency earned by source, and
 *      currency spent per stat — no readiness matches, so it runs in seconds
 *            |level|rr  (the rigid planners of the first pass)
 *      §9.6–9.7 were run with SPEND=impatient EXCHANGE=2
 *      TRACE=<identity> prints one currency career day by day: every slot, match
 *      payout, purchase, exchange, and what the player is saving for
 *      TIER_PAY=41:2,81:3 multiplies everything the currency career earns (training,
 *      matches, story) and the currency price of abilities from each day on, to
 *      model a promotion. Bronze's calendar ends at day 26; after it every free
 *      day trains or plays practice.
 *      FUND_W=lo,hi weights serve and return at least that for every identity, to model a
 *      player who keeps the two shots of every point up whatever their style.
 *      SHARPEN=chance,gap: match sharpness. After every match, serve and return each gain 1
 *      with that chance while more than gap below the best core stat.
 *      CATCHUP=gap: serve and return cost the cheapest price step while more than gap below
 *      the best core stat.
 *      GEAR=all|tier buys gear with XP: the shop's two equipment offers a day, the one that
 *      adds most to the identity's stats (key stats count double) if it beats what that slot
 *      holds. tier (the default) is the game's shop, the season's pool and the next one's
 *      (ShopSystem.shopGearForTier); all sells every piece from day 7. Matches play the
 *      geared stats, and PAR reports both OVRs. GEAR=off leaves the shop out.
 *      FOCUS_FROM=41 lets the currency career pick a silver training focus from that
 *      day: the currency its next purchases are most short of (CurrencyIncome.focusedMix).
 *      PAR=1 reports, per identity and CHECK day, the mean build's OVR and the
 *      opponent OVR it beats half the time (best of three). "Par" is measured
 *      against each team-match opponent's stat shape, shifted to the target OVR,
 *      on that opponent's surface and archetype, and averaged over the five.
 *      Bronze days also show the team match actually played, for calibration.
 *      BUILDS=<path> writes each identity's mean currency build, its specialty profile and
 *      its careers' ability effects, on every career day an opponent slot falls on
 *      (bandSlots.ts), as JSON for bandCheck. It plays to the last slot day with flat pay
 *      and a training focus from day 41 (FOCUS_FROM), so DAYS and CHECK are ignored.
 *      Regenerate it when the economy or the Club calendar changes:
 *      BUILDS=src/test/analysis/careerBuilds.json RUNS=12 npx tsx src/test/analysis/careerSim.ts
 *      CAREERS=<path> appends one JSON line per currency career, RUNS per identity (IDS=a,b
 *      narrows them), played to DAYS (default the Riverside Open's opening ceremony): its build
 *      the evening before each opponent slot (day 4 for the tutorial and first practice,
 *      each team match's eve, DAYS for the open) for difficultyProbe, its
 *      wallet, ledger, team-match results and abilities, then the Riverside Open played with
 *      that build — once as a bracket (rounds until the first loss), and RO_N=20 BO3s a round
 *      for each round's win share. Every env setting is echoed on each line, for sweeps.
 *      TEAM_ABILITIES=0 plays team-match opponents without their abilities (the game gives them).
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
import type { OpponentTier, StatBoosts } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import {
  INCOME_SCALE as ECONOMY_INCOME_SCALE,
  MATCH_PAYOUT,
  STORY_PAY,
  TRAINING_MIXES,
} from '../../config/economy';
import { abilityEffects } from '../../core/EffectAggregator';
import { ABILITY_DEFINITIONS } from '../../data/abilities';
import { dailyOffers, priceFor, valueGain, type IdentityName, type Rarity } from './abilityEconomy';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch, type Rates } from './matchTally';
import {
  CURRENCIES,
  RECIPES,
  canAfford,
  earn,
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
import { StoryStream, type PlayedEvent, type StoryPick } from './storyStream';
import { MatchRewardSystem } from '../../game/MatchRewardSystem';
import { PERFORMANCE_AREAS } from '../../config/performanceScoring';
import type { CoreStats } from '../../types';
import { matchPayout, trainingPayout } from '../../game/CurrencyIncome';
import { DRILL_ORDER, trainingOffer } from '../../game/TrainingSystem';
import type { DrillId } from '../../minigames/types';
import { TimeSlot } from '../../types/game';
import { legacyTrainingBoosts } from './legacyTraining';
import {
  OPPONENTS_BY_TIER,
  getScaledOpponentStats,
  PRACTICE_BOOST_CAP,
  PRACTICE_BOOST_STEP,
  getOpponentArchetypeProfile,
} from '../../data/opponents';
import {
  aggregateArchetypeEffects,
  createEmptyArchetypeProfile,
  profileForArchetype,
} from '../../data/archetypeTree';
import { StoryEventRepository } from '../../data/storyEvents';
import { CLUB_SEASON } from '../../data/seasons/club';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import type { TeamMatchConfig } from '../../types/game';
import type { CourtSurface } from '../../types';
import { appendFileSync, writeFileSync } from 'node:fs';
import { riversideOpen } from '../../data/tournaments/riversideOpen';
import { BAND_DAYS, type CareerBuilds } from './bandSlots';
import { ALL_EQUIPMENT, getItemsByTier } from '../../data/items';
import type { Item } from '../../types/items';
import { equipmentPrice, shopGearForTier } from '../../game/ShopSystem';

type CoreStat = keyof CoreStats;

// ─── Configuration ───────────────────────────────────────────

const env = (k: string, d: number): number => Number(process.env[k] ?? d);
const RUNS = env('RUNS', 20);
const N = env('N', 200);
const BUILDS = process.env.BUILDS;
const CAREERS = process.env.CAREERS;
const DAYS = BUILDS ? Math.max(...BAND_DAYS) : env('DAYS', CAREERS ? riversideEve() : 23);
const CHECK = BUILDS
  ? BAND_DAYS
  : CAREERS
    ? Array.from({ length: DAYS }, (_, i) => i + 1)
    : (process.env.CHECK ?? '15,19,23').split(',').map(Number);

/** The Riverside Open's opening ceremony: the prep beat's day plus the delay it schedules. */
function riversideEve(): number {
  const prep = CLUB_SEASON.beats.find((b) => b.storyEventId === 'riverside_open_prep')!;
  const event = StoryEventRepository.getEventById(prep.storyEventId);
  const ceremony = (event?.defaultOutcome?.effects?.scheduledEvents ?? []).find(
    (e) =>
      e.metadata !== undefined &&
      'storyEventId' in e.metadata &&
      e.metadata.storyEventId === 'riverside_open_opening_ceremony',
  );
  return prep.day + (ceremony?.relativeDays ?? 0);
}
const ADAPT = env('ADAPT', 0.7);
const range = (k: string, d: string): [number, number] => {
  const [lo, hi] = (process.env[k] ?? d).split(',').map(Number);
  return [lo, hi];
};
const KEY_W = range('KEY_W', '0.8,1.2');
const OFF_W = range('OFF_W', '0.25,0.55');
/** FUND_W=lo,hi: serve and return weighted at least this, whatever the identity. */
const FUND_W = process.env.FUND_W ? range('FUND_W', '0.7,0.9') : undefined;
const FUNDAMENTALS: StatName[] = ['serve', 'return'];
/**
 * SHARPEN=chance,gap: after every match, serve and return each go up 1 with this
 * chance while they sit more than `gap` below the player's best core stat.
 */
const SHARPEN = process.env.SHARPEN ? range('SHARPEN', '0.5,15') : undefined;
/** CATCHUP=gap: serve and return cost the cheapest step while that far below the best core stat. */
const CATCHUP = process.env.CATCHUP ? Number(process.env.CATCHUP) : undefined;
const CORE_STATS: StatName[] = ['serve', 'forehand', 'backhand', 'return', 'net'];
const bestCore = (s: PlayerStats): number => Math.max(...CORE_STATS.map((k) => get(s, k)));
const behindFundamentals = (s: PlayerStats, k: StatName, gap: number): boolean =>
  FUNDAMENTALS.includes(k) && get(s, k) < bestCore(s) - gap;
const MATCH_EVERY = env('MATCH_EVERY', 2);
const REPS_P = env('REPS_P', 0.7);
const OTHER_PER_DAY = env('OTHER_PER_DAY', 2.2);
/**
 * How the currency career meets the story: `stream` plays the game's own story
 * events (storyStream.ts), `flat` is the old trickle of OTHER_PER_DAY stat points.
 */
const STORY = (process.env.STORY ?? 'stream') as 'stream' | 'flat';
const STORY_PICK = (process.env.STORY_PICK ?? 'random') as StoryPick;
// STORY_PAY=0.4 tries another story pay scale: written into the shared config, so
// the game's own storyPay uses it.
if (process.env.STORY_PAY) STORY_PAY.scale = Number(process.env.STORY_PAY);
const STORY_CHANCE = env('STORY_CHANCE', 40);
const CHALLENGE_P = env('CHALLENGE_P', 0.5);
const MINIGAME_PASS = env('MINIGAME_PASS', 0.6);
const SHOP_SHARE = env('SHOP_SHARE', 0.25);
const INCOME_SCALE = env('INCOME_SCALE', ECONOMY_INCOME_SCALE);
const MATCH_POOL = env('MATCH_POOL', MATCH_PAYOUT.pool);
function baseFromEnv(): typeof MATCH_PAYOUT.base {
  const raw = process.env.MATCH_BASE;
  if (!raw) return MATCH_PAYOUT.base;
  const [lost, won] = raw.split('/').map((side) => {
    const [power, quickness, technique, mind] = side.split(',').map(Number);
    return { power, quickness, technique, mind };
  });
  return { lost, won };
}
/** The game's payout functions, at the rates above (env overrides included). */
const MATCH_RATES = { ...MATCH_PAYOUT, base: baseFromEnv(), pool: MATCH_POOL };
/** Ability shopping (abilityEconomy.ts). ABILITIES=0 turns it off. */
const ABILITIES_ON = process.env.ABILITIES !== '0';
/** Buy an ability when its point-win per currency unit is at least this (a typical stat buy). */
const ABILITY_BAR = env('ABILITY_BAR', 0.05);
/** XP from challenges per day, on top of match XP. */
const CHALLENGE_XP = env('CHALLENGE_XP', 10);
const GEAR = (process.env.GEAR ?? 'tier') as 'off' | 'all' | 'tier';
const SHOP_GEAR = ALL_EQUIPMENT.filter((i) => i.shopAvailable !== false && i.equipmentSlot);

/** The gear the shop can offer at this tier: everything, or the season's pool and below. */
function gearPool(tier: OpponentTier): Item[] {
  return GEAR === 'all' ? SHOP_GEAR : shopGearForTier(tier);
}

/** Equipped gear by slot. */
type Gear = Map<string, { id: string; boosts: StatBoosts }>;
/** [fromDay, multiplier], ascending. Empty means ×1 throughout. */
const TIER_PAY: Array<[number, number]> = (process.env.TIER_PAY ?? '')
  .split(',')
  .filter(Boolean)
  .map((pair) => pair.split(':').map(Number) as [number, number])
  .sort((a, b) => a[0] - b[0]);
const FOCUS_FROM = env('FOCUS_FROM', BUILDS ? 41 : Infinity);
const payOn = (day: number): number =>
  TIER_PAY.reduce((m, [from, mult]) => (day >= from ? mult : m), 1);

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

/** The Club season's fixed beats, the game's own schedule: [day, story event id]. */
const STORY_SCHEDULE: Array<[number, string]> = CLUB_SEASON.beats.map((b) => [
  b.day,
  b.storyEventId,
]);

/** Slots each day's story events take, from their own definitions. */
const STORY_SLOTS: Map<number, number> = STORY_SCHEDULE.reduce((m, [day, eventId]) => {
  const slots = StoryEventRepository.getEventById(eventId)?.timeSlotsRequired ?? 0;
  m.set(day, (m.get(day) ?? 0) + slots);
  return m;
}, new Map<number, number>());

/**
 * Team match days, from the calendar itself: the announcement beat that schedules
 * each team match, plus the `relativeDays` it schedules it on (in the afternoon).
 */
const TEAM_MATCHES: Map<number, TeamMatchConfig> = new Map(
  [TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5].map((team) => {
    for (const b of CLUB_SEASON.beats) {
      const event = StoryEventRepository.getEventById(b.storyEventId);
      const outcomes = [event?.defaultOutcome, ...(event?.options ?? []).map((o) => o.outcome)];
      const match = outcomes
        .flatMap((o) => o?.effects?.scheduledEvents ?? [])
        .find(
          (e) =>
            e.eventType === 'story_match' &&
            e.metadata !== undefined &&
            'opponentId' in e.metadata &&
            e.metadata.opponentId === team.opponent.characterId,
        );
      if (match) return [b.day + match.relativeDays, team] as const;
    }
    throw new Error(`no announcement schedules the team match against ${team.opponent.name}`);
  }),
);

/** coach_archetype_selection: no broad identity or specialties before this. */
const ARCHETYPE_DAY = 11;

/** Team-match opponents play with their abilities, as the game does; TEAM_ABILITIES=0 drops them. */
const TEAM_ABILITIES = process.env.TEAM_ABILITIES !== '0';

const teamSide = (t: TeamMatchConfig): Side => ({
  stats: t.opponent.stats,
  profile: profileForArchetype(t.opponent.archetype, t.opponent.tier),
  effects: TEAM_ABILITIES ? abilityEffects(t.opponent.abilities ?? []) : undefined,
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
  /** The anchors this identity leans toward, in the old shot training ('today'). */
  anchors: CoreStat[];
  /** The drills it leans toward: the ones paying its main currencies. */
  drills: DrillId[];
  /** The identity's key stats: weighted KEY_W, everything else OFF_W. */
  buys: StatName[];
  profile: ArchetypeProfile;
}

const IDENTITIES: Identity[] = [
  {
    name: 'bigServer',
    anchors: ['serve', 'forehand', 'serve'],
    drills: ['rally_rhythm', 'split_step'],
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
    drills: ['read_return', 'corner_paint'],
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
    drills: ['corner_paint', 'read_return', 'split_step'],
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
    drills: ['rally_rhythm', 'corner_paint'],
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
  /** Ability effects, if the side owns any. */
  effects?: Record<string, number>;
}

type Owned = Map<string, number>;
const effectsOf = (owned: Owned): Record<string, number> =>
  abilityEffects([...owned].map(([id, level]) => ({ ...ABILITY_DEFINITIONS[id], level })));

/**
 * One match through the game's own MatchSimulator, so fatigue, changeover and
 * set-break recovery, momentum and the starting fatigue of a tired player
 * (`energy`, the player's energy going in) are all the real thing. The
 * opponent always arrives fresh.
 */
/** Where a match is played: a bare surface (practice), or a team match's venue. */
type Court = CourtSurface | Pick<TeamMatchConfig, 'venue' | 'home'>;

function playMatch(
  a: Side,
  b: Side,
  format: MatchFormat,
  court: Court = 'hard',
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
    courtSurface: typeof court === 'string' ? court : court.venue.surface,
    venue: typeof court === 'string' ? undefined : court.venue,
    home: typeof court === 'string' ? undefined : court.home,
    matchFormat: format,
    playerEffects: a.effects,
    opponentEffects: b.effects,
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
  /** Abilities owned, by id → level, and unspent XP. */
  abilities: Owned;
  xp: number;
  /** Everything the equipped gear adds, stat by stat. */
  gear: StatBoosts;
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
  drills: Record<DrillId, number>;
  /** Currency and XP spent on abilities, XP earned, and levels bought by rarity. */
  abilitySpend: Wallet;
  abilityXp: number;
  xpEarned: number;
  abilityLevels: Record<Rarity, number>;
  /** XP spent on gear, and pieces bought. */
  gearXp: number;
  gearBought: number;
  /** Story events played (STORY=stream). */
  storyEvents: number;
}

const zeroWallet = (): Wallet => ({ power: 0, quickness: 0, technique: 0, mind: 0 });
const emptyLedger = (): Ledger => ({
  earned: Object.fromEntries(SOURCES.map((k) => [k, zeroWallet()])) as Record<Source, Wallet>,
  spentOn: Object.fromEntries(ALL_STATS.map((k) => [k, zeroWallet()])) as Record<StatName, Wallet>,
  slots: Object.fromEntries(SLOT_USES.map((k) => [k, 0])) as Record<SlotUse, number>,
  anchors: { serve: 0, forehand: 0, backhand: 0, return: 0, net: 0 },
  drills: Object.fromEntries(DRILL_ORDER.map((d) => [d, 0])) as Record<DrillId, number>,
  abilitySpend: zeroWallet(),
  abilityXp: 0,
  xpEarned: 0,
  abilityLevels: { common: 0, uncommon: 0, rare: 0 },
  gearXp: 0,
  gearBought: 0,
  storyEvents: 0,
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

/** What the next point of a stat costs, at the catch-up price when CATCHUP applies. */
function statPrice(s: PlayerStats, k: StatName): Amounts {
  return CATCHUP !== undefined && behindFundamentals(s, k, CATCHUP)
    ? priceOf(k, Math.min(get(s, k), 39))
    : priceOf(k, get(s, k));
}

/** Match sharpness (SHARPEN): playing keeps serve and return within reach. */
function sharpen(s: PlayerStats): void {
  if (!SHARPEN) return;
  for (const k of FUNDAMENTALS) {
    if (behindFundamentals(s, k, SHARPEN[1]) && Math.random() < SHARPEN[0])
      set(s, k, get(s, k) + 1);
  }
}

function buy(s: PlayerStats, w: Wallet, k: StatName): boolean {
  const price = statPrice(s, k);
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
    ALL_STATS.map((k) => {
      const w = uniformIn(id.buys.includes(k) ? KEY_W : OFF_W);
      return [k, FUND_W && FUNDAMENTALS.includes(k) ? Math.max(w, uniformIn(FUND_W)) : w];
    }),
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

/**
 * Currency: of the drills offered, train for what the next few purchases are short
 * of, leaning to the identity's drills.
 */
function drillCurrency(
  s: PlayerStats,
  wallet: Wallet,
  w: Weights,
  id: Identity,
  offered: DrillId[],
): DrillId {
  const habit = (): DrillId => {
    const liked = offered.filter((d) => id.drills.includes(d));
    return pick(liked.length > 0 ? liked : offered);
  };
  if (Math.random() >= ADAPT) return habit();
  const need: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  for (const k of shapeOrder(s, w).slice(0, 3)) earn(need, priceOf(k, get(s, k)));
  for (const c of CURRENCIES) need[c] = Math.max(0, need[c] - wallet[c]);
  if (unitsOf(need) === 0) return habit();
  const score = (d: DrillId): number =>
    CURRENCIES.reduce(
      (t, c) => t + need[c] * ((TRAINING_MIXES[d][c] ?? 0) / unitsOf(TRAINING_MIXES[d])),
      0,
    ) * (id.drills.includes(d) ? 1 : 0.6);
  return [...offered].sort((x, y) => score(y) - score(x))[0];
}

/** The silver focus a player picks: the currency its next few purchases are most short of. */
function focusFor(s: PlayerStats, wallet: Wallet, w: Weights): Currency | undefined {
  const need: Wallet = { power: 0, quickness: 0, technique: 0, mind: 0 };
  for (const k of shapeOrder(s, w).slice(0, 3)) earn(need, priceOf(k, get(s, k)));
  for (const c of CURRENCIES) need[c] = Math.max(0, need[c] - wallet[c]);
  if (unitsOf(need) === 0) return undefined;
  return [...CURRENCIES].sort((x, y) => need[y] - need[x])[0];
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

/** Match currency: the base by result plus the pool, area by area (CurrencyIncome.matchPayout). */
function payMatch(
  wallet: Wallet,
  ms: IMatchStatistics,
  won: boolean,
  scale = 1,
): { perf: string; xp: number } {
  const rewards = silently(() => MatchRewardSystem.calculateRewards(ms, 1, won));
  const perf = rewards.performanceBreakdown;
  earn(wallet, matchPayout(perf, won, MATCH_RATES), scale);
  return {
    perf:
      `perf ${perf.overallScore.toFixed(0)} (` +
      PERFORMANCE_AREAS.map((a) => `${a} ${perf.areas[a].toFixed(0)}`).join(', ') +
      ')',
    xp: rewards.experience,
  };
}

/**
 * The day's ability offers: buy the best one whose point-win per currency unit
 * clears ABILITY_BAR and that the player can afford, at most one a day.
 * Abilities come before stats in the evening, so Mind and other spare
 * currency go to them when they are worth it.
 */
/** All the boosts the equipped gear adds. */
function gearTotal(gear: Gear): StatBoosts {
  const out: StatBoosts = {};
  for (const { boosts } of gear.values()) {
    for (const [k, v] of Object.entries(boosts) as Array<[StatName, number]>) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

/** A copy of the stats with boosts added, clamped to 100. */
function withBoosts(s: PlayerStats, b: StatBoosts): PlayerStats {
  const out = clone(s);
  applyBoosts(out, b);
  return out;
}

/**
 * The day's two equipment offers: buy the one that adds most to this identity
 * (key stats count double) over what its slot holds, if the XP is there.
 */
function shopGear(
  keyStats: StatName[],
  gear: Gear,
  xp: number,
  ledger: Ledger,
  tier: OpponentTier,
): { label: string; xp: number } | null {
  const pool = gearPool(tier);
  const worth = (b: StatBoosts): number =>
    (Object.entries(b) as Array<[StatName, number]>).reduce(
      (a, [k, v]) => a + v * (keyStats.includes(k) ? 1 : 0.5),
      0,
    );
  const offers = [0, 1].map(() => pool[Math.floor(Math.random() * pool.length)]);
  const best = offers
    .map((item) => {
      const boosts = item.modifiers?.statBoosts ?? {};
      const held = gear.get(item.equipmentSlot!);
      return {
        item,
        boosts,
        gain: worth(boosts) - (held ? worth(held.boosts) : 0),
        price: equipmentPrice(boosts),
      };
    })
    .filter((o) => o.gain > 0 && o.price <= xp)
    .sort((a, b) => b.gain - a.gain)[0];
  if (!best) return null;
  gear.set(best.item.equipmentSlot!, { id: best.item.id, boosts: best.boosts });
  ledger.gearXp += best.price;
  ledger.gearBought++;
  return { label: `${best.item.id} for ${best.price} XP`, xp: best.price };
}

/** The tier a career is in on a day: seasons start at days 41, 81 and 121 (§2.1). */
function tierOnDay(day: number): OpponentTier {
  return day >= 121 ? 4 : day >= 81 ? 3 : day >= 41 ? 2 : 1;
}

function shopAbilities(
  identity: IdentityName,
  wallet: Wallet,
  owned: Owned,
  xp: number,
  ledger: Ledger,
  day: number,
  scale = 1,
): { label: string; xp: number } | null {
  const offers = dailyOffers(tierOnDay(day))
    .map((a) => {
      const level = owned.get(a.id) ?? 0;
      const base = priceFor(a, level);
      const cost: Wallet = zeroWallet();
      for (const c of CURRENCIES) cost[c] = (base.currency[c] ?? 0) * scale;
      const price = { xp: base.xp, cost, units: unitsOf(cost) };
      return { a, level, price, perUnit: valueGain(a, identity, level) / price.units };
    })
    .filter(
      (o) =>
        o.perUnit >= ABILITY_BAR &&
        CURRENCIES.every((c) => wallet[c] >= o.price.cost[c]) &&
        xp >= o.price.xp,
    )
    .sort((x, y) => y.perUnit - x.perUnit);
  const best = offers[0];
  if (!best) return null;
  for (const c of CURRENCIES) {
    wallet[c] -= best.price.cost[c];
    ledger.abilitySpend[c] += best.price.cost[c];
  }
  ledger.abilityXp += best.price.xp;
  ledger.abilityLevels[best.a.rarity]++;
  owned.set(best.a.id, best.level + 1);
  return {
    label: `${best.a.id} Lv${best.level + 1} for ${fmtAmounts(best.price.cost)} + ${best.price.xp} XP`,
    xp: best.price.xp,
  };
}

let careersRun = 0;

function career(
  id: Identity,
  system: System,
  weights: Weights = drawWeights(id),
): Map<number, Snapshot> {
  const stats = clone(PlayerManager.createPlayer('c').stats);
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
  // Each career rolls its own training offers, the same way the game rolls a player's.
  const careerSeed = `${id.name}:${system}:${careersRun++}`;
  let recent: StatBoosts | undefined;
  let tierWins = 0;
  let matchesWon = 0;
  let matchesPlayed = 0;
  let sessions = 0;
  const snaps = new Map<number, Snapshot>();
  const ledger = emptyLedger();
  const owned: Owned = new Map();
  const gear: Gear = new Map();
  let xp = 0;
  let mult = 1;
  const paid = (r: { winner: 'player' | 'opponent'; stats: IMatchStatistics }): string => {
    if (system !== 'currency') return '';
    const p = payMatch(wallet, r.stats, r.winner === 'player', mult);
    xp += p.xp;
    ledger.xpEarned += p.xp;
    return p.perf;
  };
  const credit = (source: Source, before: Wallet): void =>
    addInto(ledger.earned[source], diffWallet(wallet, before));

  // The game's story, played event by event (currency careers, STORY=stream).
  const stream =
    system === 'currency' && STORY === 'stream'
      ? new StoryStream({
          pick: STORY_PICK,
          triggerChance: STORY_CHANCE,
          challengeRate: CHALLENGE_P,
          minigamePass: MINIGAME_PASS,
        })
      : null;
  const storyPlayer = PlayerManager.createPlayer('c');
  const results: Array<'win' | 'loss'> = [];
  const playerNow = (): typeof storyPlayer => ({
    ...storyPlayer,
    stats,
    matchesPlayed: results.length,
    matchesWon: results.filter((r) => r === 'win').length,
    latestMatchResults: results.slice(0, 10),
  });
  /** Pay out an event; returns the slots it takes. */
  const story = (played: PlayedEvent | null, slotName: string): number => {
    if (!played) return 0;
    const before = { ...wallet };
    earn(wallet, played.currency, mult);
    // A penalty bigger than the balance stops at zero, as applyCurrency does.
    for (const c of CURRENCIES) wallet[c] = Math.max(0, wallet[c]);
    for (const [k, v] of Object.entries(played.statChanges) as Array<[StatName, number]>) {
      if (v) set(stats, k, Math.max(0, Math.min(100, get(stats, k) + v)));
    }
    energy = Math.max(0, Math.min(100, energy + played.energyChange));
    credit('story', before);
    ledger.storyEvents++;
    note(
      `  ${slotName} story ${played.eventId} → +${fmtAmounts(diffWallet(wallet, before))}` +
        (Object.keys(played.statChanges).length ? ` ${JSON.stringify(played.statChanges)}` : ''),
    );
    return played.slots;
  };
  /** After a match: its result, any team-match result event, then milestones. */
  const afterMatch = (
    won: boolean,
    slot: number,
    slotName: string,
    resultEvent?: string,
  ): number => {
    results.unshift(won ? 'win' : 'loss');
    if (!stream) return 0;
    let slots = resultEvent
      ? story(stream.fire(playerNow(), resultEvent, day, slot as TimeSlot), slotName)
      : 0;
    for (const m of stream.milestones(playerNow(), day, slot as TimeSlot))
      slots += story(m, slotName);
    return slots;
  };
  let day = 0;

  for (day = 1; day <= DAYS; day++) {
    mult = payOn(day);
    const team = TEAM_MATCHES.get(day);
    const practiceDay = !team && day >= 5 && (day - 5) % MATCH_EVERY === 0;
    const profile = day >= ARCHETYPE_DAY ? id.profile : unchosen;
    let storySlots = stream ? 0 : (STORY_SLOTS.get(day) ?? 0);
    note(`Day ${day}  (energy ${energy})`);
    for (let slot = 0; slot < 3; slot++) {
      const slotName = ['morning  ', 'afternoon', 'evening  '][slot];
      // A slot an earlier event already took (a milestone after a match) still runs the
      // beat scheduled in it; only a free slot rolls for a random event.
      if (stream) {
        const free = storySlots === 0;
        const played = story(stream.slotStart(playerNow(), day, slot as TimeSlot, free), slotName);
        storySlots = Math.max(storySlots, played);
      }
      const walletBefore = { ...wallet };
      if (storySlots > 0) {
        storySlots--;
        ledger.slots.story++;
        note(`  ${slotName} story event`);
      } else if (team && slot === 1) {
        const r = playMatch(
          { stats: withBoosts(stats, gearTotal(gear)), profile, effects: effectsOf(owned) },
          teamSide(team),
          BO3_FOR[team.matchFormat] ?? BO3,
          team,
          energy,
        );
        energy -= Math.min(50, energy);
        teamWon.set(day, r.winner === 'player');
        sharpen(stats);
        ledger.slots.team++;
        const perf = paid(r);
        credit('team', walletBefore);
        note(
          `  ${slotName} TEAM MATCH vs ${team.opponent.name} on ${team.venue.surface} — ` +
            `${r.winner === 'player' ? 'WON' : 'lost'}, ${r.won}/${r.points} points. ${perf} ` +
            `→ +${fmtAmounts(diffWallet(wallet, walletBefore))}`,
        );
        const won = r.winner === 'player';
        storySlots += afterMatch(won, slot, slotName, won ? team.winEventId : team.lossEventId);
      } else if (practiceDay && slot === 1 && energy >= 50) {
        const opp = roster[matchesPlayed % roster.length];
        const bump = Math.min(tierWins * PRACTICE_BOOST_STEP[1], PRACTICE_BOOST_CAP[1]);
        const r = playMatch(
          { stats: withBoosts(stats, gearTotal(gear)), profile, effects: effectsOf(owned) },
          {
            stats: getScaledOpponentStats(opp.stats, tierWins, 1),
            profile: getOpponentArchetypeProfile(opp),
          },
          BO1,
          'hard',
          energy,
        );
        energy -= 50;
        matchesPlayed++;
        sharpen(stats);
        if (r.winner === 'player') {
          matchesWon++;
          tierWins++;
        }
        ledger.slots.practice++;
        const perf = paid(r);
        credit('practice', walletBefore);
        note(
          `  ${slotName} practice vs ${opp.name} (+${bump}) — ` +
            `${r.winner === 'player' ? 'WON' : 'lost'}, ${r.won}/${r.points} points. ${perf} ` +
            `→ +${fmtAmounts(diffWallet(wallet, walletBefore))}`,
        );
        storySlots += afterMatch(r.winner === 'player', slot, slotName);
      } else if (energy >= 20) {
        const n = reps();
        sessions++;
        energy -= 20;
        ledger.slots.train++;
        if (system === 'today') {
          const core =
            SPEND === 'level' || SPEND === 'rr'
              ? id.anchors[anchorIdx++ % id.anchors.length]
              : anchorToday(stats, weights, id);
          ledger.anchors[core]++;
          recent = legacyTrainingBoosts(core, n, recent);
          applyBoosts(stats, recent);
        } else {
          const offered = trainingOffer(careerSeed, day, slot as TimeSlot).map((o) => o.drill);
          const drill =
            SPEND === 'level' || SPEND === 'rr'
              ? (offered.find((d) => id.drills.includes(d)) ?? offered[0])
              : drillCurrency(stats, wallet, weights, id, offered);
          ledger.drills[drill]++;
          const focus = day >= FOCUS_FROM ? focusFor(stats, wallet, weights) : undefined;
          earn(wallet, trainingPayout(drill, n, false, undefined, focus), mult);
          credit('training', walletBefore);
          note(
            `  ${slotName} train ${drill} (of ${offered.join(', ')}) — ${n}/3 reps → +${fmtAmounts(diffWallet(wallet, walletBefore))}`,
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

    // Story, challenges and (today only) the shop, as a steady trickle — unless the
    // story stream is playing the real thing.
    const otherToday = stream
      ? 0
      : system === 'today'
        ? OTHER_PER_DAY
        : OTHER_PER_DAY * (1 - SHOP_SHARE);
    for (const k of ALL_STATS) {
      other[k] += (otherToday * OTHER_WEIGHTS[k]) / OTHER_TOTAL;
      const whole = Math.floor(other[k]);
      if (whole <= 0) continue;
      other[k] -= whole;
      if (system === 'today') set(stats, k, Math.min(100, get(stats, k) + whole));
      else earn(wallet, RECIPES[k], whole * INCOME_SCALE * mult);
    }

    if (system === 'currency') {
      credit('story', beforeOther);
      const otherGain = diffWallet(wallet, beforeOther);
      if (unitsOf(otherGain) > 0.05) note(`  story/challenges → +${fmtAmounts(otherGain)}`);
      xp += CHALLENGE_XP;
      ledger.xpEarned += CHALLENGE_XP;
      if (ABILITIES_ON) {
        const bought = shopAbilities(id.name as IdentityName, wallet, owned, xp, ledger, day, mult);
        if (bought) {
          xp -= bought.xp;
          note(`  shop: bought ${bought.label}`);
        }
      }
      if (GEAR !== 'off' && day >= 7) {
        const piece = shopGear(id.buys, gear, xp, ledger, tierOnDay(day));
        if (piece) {
          xp -= piece.xp;
          note(`  shop: bought ${piece.label}`);
        }
      }
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
        earned: Object.fromEntries(
          CURRENCIES.map((c) => [c, wallet[c] + spent[c] + ledger.abilitySpend[c]]),
        ) as Wallet,
        matchesWon,
        matchesPlayed,
        sessions,
        teamWon: new Map(teamWon),
        ledger: cloneLedger(ledger),
        abilities: new Map(owned),
        xp,
        gear: gearTotal(gear),
      });
    }
  }
  return snaps;
}

// ─── Report ──────────────────────────────────────────────────

/** Mean ability levels owned, and the most-owned abilities with how many careers own them. */
function abilitySummary(snaps: Snapshot[], top = 4): string {
  const levels = snaps.reduce(
    (a, x) => a + [...x.abilities.values()].reduce((b, l) => b + l, 0),
    0,
  );
  const owners = new Map<string, number>();
  for (const x of snaps)
    for (const id of x.abilities.keys()) owners.set(id, (owners.get(id) ?? 0) + 1);
  const most = [...owners]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([id, n]) => `${id} ${((n / snaps.length) * 100).toFixed(0)}%`)
    .join(', ');
  return `${(levels / snaps.length).toFixed(1)} levels${most ? `: ${most}` : ''}`;
}

function meanStats(list: PlayerStats[]): PlayerStats {
  const out = clone(list[0]);
  for (const k of ALL_STATS) {
    set(out, k, Math.round(list.reduce((a, s) => a + get(s, k), 0) / list.length));
  }
  return out;
}

/** Point, game (hold / break) and match win rates over N best-of-three matches against `team`. */
function readiness(
  s: PlayerStats,
  profile: ArchetypeProfile,
  team: TeamMatchConfig,
  effectSets: Array<Record<string, number>> = [{}],
): Rates {
  const rates = emptyRates();
  for (let i = 0; i < N; i++) {
    const effects = effectSets[i % effectSets.length];
    const r = playMatch({ stats: s, profile, effects }, teamSide(team), BO3, team);
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
        `  |  story events ${mean((l) => l.ledger.storyEvents).toFixed(1)}` +
        '  |  drills trained: ' +
        DRILL_ORDER.map((d) => `${d} ${mean((l) => l.ledger.drills[d]).toFixed(1)}`).join(', '),
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
    const onAbilities = meanWallet((l) => l.ledger.abilitySpend);
    console.log(['on abilities', f(unitsOf(onAbilities)), '', split(onAbilities)].join('\t'));
    console.log(
      `XP: earned ${f(mean((l) => l.ledger.xpEarned))}, on abilities ${f(mean((l) => l.ledger.abilityXp))}, ` +
        `unspent ${f(mean((l) => l.xp))}, on gear ${f(mean((l) => l.ledger.gearXp))} ` +
        `(${mean((l) => l.ledger.gearBought).toFixed(1)} pieces)  |  levels bought: ` +
        (['common', 'uncommon', 'rare'] as Rarity[])
          .map((r) => `${r} ${mean((l) => l.ledger.abilityLevels[r]).toFixed(1)}`)
          .join(', ') +
        `  |  ${abilitySummary(ls, 6)}`,
    );

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

/** Every stat moved by `offset`, clamped to 1-100, so OVR moves by about the same. */
function shifted(s: PlayerStats, offset: number): PlayerStats {
  const out = clone(s);
  for (const k of ALL_STATS) set(out, k, Math.max(1, Math.min(100, get(s, k) + offset)));
  return out;
}

/**
 * The share of best-of-three matches `s` wins against every team-match
 * opponent's shape moved to `targetOvr`, `n` matches split across the five.
 */
function winShareAt(
  s: PlayerStats,
  profile: ArchetypeProfile,
  effectSets: Array<Record<string, number>>,
  targetOvr: number,
  n: number,
): number {
  const teams = [...TEAM_MATCHES.values()];
  let won = 0;
  for (let i = 0; i < n; i++) {
    const t = teams[i % teams.length];
    const offset = targetOvr - calculateOverallRating(t.opponent.stats);
    const r = playMatch(
      { stats: s, profile, effects: effectSets[i % effectSets.length] },
      { stats: shifted(t.opponent.stats, offset), profile: teamSide(t).profile },
      BO3,
      t,
    );
    if (r.winner === 'player') won++;
  }
  return won / n;
}

/** The opponent OVR the build beats half the time, by bisection to the nearest point. */
function parOvr(
  s: PlayerStats,
  profile: ArchetypeProfile,
  effectSets: Array<Record<string, number>>,
): number {
  let lo = 10;
  let hi = 100;
  while (hi - lo > 1) {
    const mid = Math.round((lo + hi) / 2);
    if (winShareAt(s, profile, effectSets, mid, N) >= 0.5) lo = mid;
    else hi = mid;
  }
  return lo;
}

function parReport(): void {
  console.log(
    `careerSim PAR  RUNS=${RUNS} N=${N} DAYS=${DAYS} TIER_PAY=${process.env.TIER_PAY ?? ''} ` +
      `SPEND=${SPEND} INCOME_SCALE=${INCOME_SCALE}`,
  );
  console.log(
    [
      'identity',
      'day',
      'pay',
      'OVR',
      'OVR+gear',
      'key avg',
      'other avg',
      'par OVR',
      'team match (OVR)',
    ].join('\t'),
  );
  for (const id of IDENTITIES) {
    const careers = Array.from({ length: RUNS }, () => career(id, 'currency'));
    for (const day of CHECK) {
      const snaps = careers.map((c) => c.get(day)!);
      const s = meanStats(snaps.map((x) => x.stats));
      const geared = meanStats(snaps.map((x) => withBoosts(x.stats, x.gear)));
      const avg = (ks: StatName[]): string =>
        (ks.reduce((a, k) => a + get(s, k), 0) / ks.length).toFixed(0);
      const profile = day >= ARCHETYPE_DAY ? id.profile : createEmptyArchetypeProfile();
      const team = TEAM_MATCHES.get(day);
      console.log(
        [
          id.name,
          day,
          `x${payOn(day)}`,
          calculateOverallRating(s),
          calculateOverallRating(geared),
          avg(id.buys),
          avg(ALL_STATS.filter((k) => !id.buys.includes(k))),
          parOvr(
            geared,
            profile,
            snaps.map((x) => effectsOf(x.abilities)),
          ),
          team ? `${team.opponent.name} (${calculateOverallRating(team.opponent.stats)})` : '',
        ].join('\t'),
      );
    }
  }
}

/** Ability effect sets kept per build day: enough for a spread, small enough to commit. */
const BUILD_EFFECT_SETS = 8;

function buildsReport(path: string): void {
  const out: CareerBuilds = {
    generated:
      `careerSim BUILDS RUNS=${RUNS} DAYS=${DAYS} FOCUS_FROM=${FOCUS_FROM} SPEND=${SPEND}` +
      (FUND_W ? ` FUND_W=${FUND_W}` : '') +
      (SHARPEN ? ` SHARPEN=${SHARPEN}` : '') +
      (CATCHUP !== undefined ? ` CATCHUP=${CATCHUP}` : ''),
    identities: {},
  };
  for (const id of IDENTITIES) {
    const careers = Array.from({ length: RUNS }, () => career(id, 'currency'));
    const days: CareerBuilds['identities'][string]['days'] = {};
    for (const day of CHECK) {
      const snaps = careers.map((c) => c.get(day)!);
      days[day] = {
        stats: meanStats(snaps.map((x) => x.stats)),
        effects: snaps.slice(0, BUILD_EFFECT_SETS).map((x) => effectsOf(x.abilities)),
      };
    }
    out.identities[id.name] = { profile: id.profile, archetypeDay: ARCHETYPE_DAY, days };
    console.log(`${id.name}: ${RUNS} careers to day ${DAYS}`);
  }
  writeFileSync(path, `${JSON.stringify(out)}\n`);
  console.log(`wrote ${path}`);
}

/**
 * CAREERS=<path>: one JSON line per career, for sweeps across player types. The
 * Riverside Open is played with the career's day-DAYS build, fresh each round, at its
 * venue, against each round's opponent with their abilities.
 */
function careersReport(path: string): void {
  const roN = env('RO_N', 20);
  const ids = process.env.IDS?.split(',');
  const settings = Object.fromEntries(
    Object.entries(process.env).filter(([k]) =>
      /^(RUNS|DAYS|STEP_FROM|STEP_WIDTH|REPS_P|ADAPT|SPEND|STORY|STORY_PICK|STORY_CHANCE|CHALLENGE_P|MINIGAME_PASS|MATCH_EVERY|KEY_W|OFF_W|GEAR|ABILITIES|TEAM_ABILITIES|TAG|SKILL)$/.test(
        k,
      ),
    ),
  );
  const rounds = riversideOpen.rounds.map((r) => ({
    name: r.opponent.name,
    side: {
      stats: r.opponent.stats,
      profile: profileForArchetype(r.opponent.archetype, r.opponent.tier),
      effects: abilityEffects(r.opponent.abilities ?? []),
    } satisfies Side,
  }));
  const court = { venue: riversideOpen.venue };
  const lines: string[] = [];
  for (const id of IDENTITIES.filter((i) => !ids || ids.includes(i.name))) {
    for (let run = 0; run < RUNS; run++) {
      const snaps = career(id, 'currency');
      const snap = snaps.get(DAYS)!;
      // The build each opponent meets: the evening before its match. Day 5 opens with
      // the tutorial matches and the first practice; the open plays from DAYS's build.
      const buildOn = (day: number): Side => {
        const b = snaps.get(day)!;
        return {
          stats: withBoosts(b.stats, b.gear),
          profile: day >= ARCHETYPE_DAY ? id.profile : createEmptyArchetypeProfile(),
          effects: effectsOf(b.abilities),
        };
      };
      const builds: Record<string, Side & { day: number }> = {
        early: { day: 4, ...buildOn(4) },
        ...Object.fromEntries(
          [...TEAM_MATCHES.keys()].map((d, i) => [`tm${i + 1}`, { day: d, ...buildOn(d - 1) }]),
        ),
        riverside: { day: DAYS, ...buildOn(DAYS) },
      };
      const me: Side = {
        stats: withBoosts(snap.stats, snap.gear),
        profile: id.profile,
        effects: effectsOf(snap.abilities),
      };
      let reached = 0;
      while (
        reached < rounds.length &&
        playMatch(me, rounds[reached].side, BO3, court).winner === 'player'
      )
        reached++;
      const roundWinShare = rounds.map((r) => {
        let won = 0;
        for (let i = 0; i < roN; i++)
          if (playMatch(me, r.side, BO3, court).winner === 'player') won++;
        return roN ? won / roN : null;
      });
      lines.push(
        JSON.stringify({
          identity: id.name,
          settings,
          day: DAYS,
          ovr: calculateOverallRating(snap.stats),
          stats: Object.fromEntries(ALL_STATS.map((k) => [k, get(snap.stats, k)])),
          gear: snap.gear,
          wallet: snap.wallet,
          earned: snap.earned,
          xp: snap.xp,
          practice: { won: snap.matchesWon, played: snap.matchesPlayed },
          sessions: snap.sessions,
          teamWon: Object.fromEntries(snap.teamWon),
          abilities: Object.fromEntries(snap.abilities),
          ledger: snap.ledger,
          builds,
          riverside: {
            roundsWon: reached,
            champion: reached === rounds.length,
            winShare: Object.fromEntries(rounds.map((r, i) => [r.name, roundWinShare[i]])),
          },
        }),
      );
    }
  }
  appendFileSync(path, lines.join('\n') + '\n');
}

function main(): void {
  if (BUILDS) return buildsReport(BUILDS);
  if (CAREERS) return careersReport(CAREERS);
  if (TRACE) return traceCareer(TRACE);
  if (process.env.LEDGER === '1') return ledgerReport();
  if (process.env.PAR === '1') return parReport();
  console.log(
    `careerSim  RUNS=${RUNS} N=${N} DAYS=${DAYS} SPEND=${SPEND} ADAPT=${ADAPT} KEY_W=${KEY_W} ` +
      `OFF_W=${OFF_W} MATCH_EVERY=${MATCH_EVERY} REPS_P=${REPS_P} OTHER_PER_DAY=${OTHER_PER_DAY} ` +
      `SHOP_SHARE=${SHOP_SHARE} INCOME_SCALE=${INCOME_SCALE} MATCH_POOL=${MATCH_POOL} ` +
      `EXCHANGE=${EXCHANGE}`,
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
      'abilities (mean levels: most owned)',
      'lowest 3 / top 3 stats',
    ].join('\t'),
  );
  for (const id of IDENTITIES) {
    for (const system of (process.env.SYSTEMS ?? 'today,currency').split(',') as System[]) {
      const careers = Array.from({ length: RUNS }, () => career(id, system));
      for (const day of CHECK) {
        const snaps = careers.map((c) => c.get(day)!);
        const s = meanStats(snaps.map((x) => x.stats));
        const total = ALL_STATS.reduce((a, k) => a + get(s, k), 0);
        const team = TEAM_MATCHES.get(day);
        const rates = team
          ? readiness(
              s,
              day >= ARCHETYPE_DAY ? id.profile : createEmptyArchetypeProfile(),
              team,
              snaps.map((x) => effectsOf(x.abilities)),
            )
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
            system === 'currency' ? abilitySummary(snaps) : '',
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
