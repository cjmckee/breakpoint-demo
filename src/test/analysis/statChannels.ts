/**
 * Stat Channels — a stat reaches a shot through several different mechanisms.
 * Which ones are actually carrying the load?
 *
 * The channels, in the order the engine applies them:
 *
 *   1. COMPOSITE   PlayerProfile.getStatForShot blends stats into the shot's
 *                  base rating (SHOT_COMPOSITE_WEIGHTS / SERVE_QUALITY_WEIGHTS /
 *                  SERVE_ACCURACY_WEIGHTS / RETURN_COMPOSITE_WEIGHTS). Additive,
 *                  weights sum to 1, per shot family.
 *   2. BAND        ShotCalculator's support modifiers (STAT_MODIFIER_BANDS,
 *                  SERVE_MODIFIER_BANDS) — multiplicative, centered on
 *                  NEUTRAL_STAT, gated on a shot classification or a context flag.
 *                  An earlier version of this probe found a fourth channel here,
 *                  spin/placement as percentage-point BONUSES; it was the same
 *                  function with the constant scaled by 100 and measured as
 *                  nothing, so it was folded into the bands.
 *   3. THRESHOLD   OPPONENT_STAT_ADJUSTMENTS / SHOOTER_STAT_ADJUSTMENTS move the
 *                  bar the shot must clear rather than the shot itself. This is
 *                  the only channel that can express a stat acting on the
 *                  OPPONENT's shot.
 *
 * (A further group sits outside shot quality entirely — stamina through fatigue,
 * focus through pressure and momentum, and the stats that steer ShotSelector.
 * Not ablated here; see the note at the bottom of the output.)
 *
 * METHOD. The same randomized-population regression statSensitivity Part B uses:
 * independently random stats, random archetypes, random pairings, regress the
 * point-win margin on each stat difference. Run once per configuration, with one
 * channel zeroed each time. full − ablated is that channel's contribution to the
 * stat's measured value.
 *
 * The build population is drawn from a seeded PRNG and reused verbatim across
 * configurations, so every run regresses on an identical design matrix and the
 * differences between columns are paired rather than independent draws.
 *
 * Ablation works by zeroing the config tables in place before any match runs.
 * Two pieces of the threshold channel cannot be reached this way because they
 * are primitive exports rather than object properties:
 * WINNER_FLOOR_RETRIEVAL_WEIGHT (opponent speed/tactics scaling the winner
 * floor) and MODIFIER_SPREAD. The threshold column therefore understates itself
 * slightly.
 *
 * PART S is the same question asked without a simulator: how many points of shot
 * quality does +10 in a stat buy through each channel, by arithmetic on the
 * config tables alone. No sampling, so no noise — it bounds what PART A could
 * ever detect.
 *
 * Run: npm run build:node && node dist/src/test/analysis/statChannels.js
 * Env: N=1500 (pairings per configuration)  SEED=1  PARTS=SMA  REF=55
 *      LO=25 HI=90 (stat draw range — set LO=25 HI=50 for the shipped ladder)
 *      POP=real|presets  POINTS=6  MAX_TIER=3
 *
 * POPULATION. The player side is built the way a player builds one: a broad
 * archetype plus specialization points spent across six phases. The opponent
 * side uses the five authored profiles, which is how the game builds opponents.
 * POP=presets restores the old symmetric draw, which reached only 13 of the 18
 * paths and never reached tier III at all.
 */

import type { MatchFormat, MatchState, PlayerStats } from '../../types/index.js';
import type { ArchetypeProfile, PhaseSpec, GamePhase } from '../../types/archetype.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import {
  MATCH_FATIGUE,
  SHOT_COMPOSITE_WEIGHTS,
  SERVE_QUALITY_WEIGHTS,
  SERVE_ACCURACY_WEIGHTS,
  RETURN_COMPOSITE_WEIGHTS,
  STAT_MODIFIER_BANDS,
  SERVE_MODIFIER_BANDS,
  OPPONENT_STAT_ADJUSTMENTS,
  SHOOTER_STAT_ADJUSTMENTS,
} from '../../config/shotThresholds.js';
import { aggregateArchetypeEffects, profileForArchetype, type LegacyArchetype } from '../../data/archetypeTree.js';
import { drawPlayerProfile } from './playerFactory.js';

const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
const _origLog = console.log;

// ─── Stat plumbing ───────────────────────────────────────────

const BUCKETS = ['core', 'technical', 'physical', 'mental'] as const;
type Bucket = typeof BUCKETS[number];

const STAT_KEYS: Array<{ bucket: Bucket; key: string }> = [
  ...(['serve', 'forehand', 'backhand', 'return', 'net'] as const).map(k => ({ bucket: 'core' as Bucket, key: k })),
  ...(['slice', 'spin', 'placement'] as const).map(k => ({ bucket: 'technical' as Bucket, key: k })),
  ...(['speed', 'stamina', 'strength'] as const).map(k => ({ bucket: 'physical' as Bucket, key: k })),
  ...(['focus', 'anticipation', 'tactics'] as const).map(k => ({ bucket: 'mental' as Bucket, key: k })),
];

function uniformStats(r: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net: r },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

function flatten(s: PlayerStats): number[] {
  return STAT_KEYS.map(({ bucket, key }) => (s[bucket] as unknown as Record<string, number>)[key]);
}

function profileOf(phases: Partial<Record<GamePhase, PhaseSpec>>): ArchetypeProfile {
  return { broad: null, phases, specializationPoints: 0, respecTokens: 0 };
}

// ─── Seeded build population ─────────────────────────────────

/** mulberry32 — small, fast, good enough for drawing a build population. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEGACY: LegacyArchetype[] = ['aggressive', 'defensive', 'counterpuncher', 'serve_volley', 'all_court'];

interface Pairing {
  pStats: PlayerStats; oStats: PlayerStats;
  pProf: ArchetypeProfile; oProf: ArchetypeProfile;
  serveFirst: boolean;
}

/**
 * `lo`/`hi` bound the uniform draw for every stat. The default U(25, 90) matches
 * statSensitivity Part B, which describes a population the game does not contain
 * — the shipped ladder is OVR 20-49. Pass LO=25 HI=50 to ask the same question
 * about the players who actually exist.
 */
function drawPopulation(
  n: number, seed: number, lo: number, hi: number,
  mode: string, points: number, maxTier: 1 | 2 | 3,
): Pairing[] {
  const rng = mulberry32(seed);
  const stats = (): PlayerStats => {
    const s = uniformStats(50);
    for (const { bucket, key } of STAT_KEYS) {
      (s[bucket] as unknown as Record<string, number>)[key] = lo + rng() * (hi - lo);
    }
    return s;
  };
  /**
   * How the game builds an OPPONENT: one of five authored profiles, drawn
   * uniformly because the shipped roster is uniform — four opponents each. No
   * unspecialized branch: every opponent in `data/opponents.ts` has an
   * archetype, so leaving one in six without one understated opponent identity.
   */
  const opponentProf = (): ArchetypeProfile =>
    profileForArchetype(LEGACY[Math.floor(rng() * LEGACY.length)]);
  /** How the game builds a PLAYER: points spent freely across the phase tree. */
  const playerProf = (): ArchetypeProfile => drawPlayerProfile(rng, points, maxTier);

  const drawP = mode === 'presets' ? opponentProf : playerProf;

  const out: Pairing[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ pStats: stats(), oStats: stats(), pProf: drawP(), oProf: opponentProf(), serveFirst: rng() < 0.5 });
  }
  return out;
}

// ─── Channel ablation ────────────────────────────────────────

type Channel = 'composite' | 'band' | 'threshold';
/** `control` ablates nothing. Its column is the noise floor for every other column. */
type Column = Channel | 'control';

/** Deep snapshot of every table an ablation touches, so configs can be restored. */
const ORIGINAL = JSON.parse(JSON.stringify({
  SHOT_COMPOSITE_WEIGHTS, SERVE_QUALITY_WEIGHTS, SERVE_ACCURACY_WEIGHTS, RETURN_COMPOSITE_WEIGHTS,
  STAT_MODIFIER_BANDS, SERVE_MODIFIER_BANDS,
  OPPONENT_STAT_ADJUSTMENTS, SHOOTER_STAT_ADJUSTMENTS,
}));

function restore(): void {
  const assign = (target: Record<string, unknown>, src: Record<string, unknown>): void => {
    for (const k of Object.keys(target)) delete target[k];
    for (const [k, v] of Object.entries(src)) {
      target[k] = (v !== null && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
    }
  };
  assign(SHOT_COMPOSITE_WEIGHTS as never, ORIGINAL.SHOT_COMPOSITE_WEIGHTS);
  assign(SERVE_QUALITY_WEIGHTS as never, ORIGINAL.SERVE_QUALITY_WEIGHTS);
  assign(SERVE_ACCURACY_WEIGHTS as never, ORIGINAL.SERVE_ACCURACY_WEIGHTS);
  assign(RETURN_COMPOSITE_WEIGHTS as never, ORIGINAL.RETURN_COMPOSITE_WEIGHTS);
  assign(STAT_MODIFIER_BANDS as never, ORIGINAL.STAT_MODIFIER_BANDS);
  assign(SERVE_MODIFIER_BANDS as never, ORIGINAL.SERVE_MODIFIER_BANDS);
  assign(OPPONENT_STAT_ADJUSTMENTS as never, ORIGINAL.OPPONENT_STAT_ADJUSTMENTS);
  assign(SHOOTER_STAT_ADJUSTMENTS as never, ORIGINAL.SHOOTER_STAT_ADJUSTMENTS);
}

/**
 * Zero one channel. Composite ablation keeps every shot's PRIMARY stat and
 * pushes the support weight onto it, so the sum stays 1 and a uniform player's
 * rating is unchanged — only the blending disappears.
 */
function ablate(ch: Column): void {
  restore();
  const zero = (o: Record<string, number>): void => { for (const k of Object.keys(o)) o[k] = 0; };

  if (ch === 'control') {
    return; // shipped config, re-measured — the column exists to show what zero looks like
  } else if (ch === 'composite') {
    for (const fam of Object.keys(SHOT_COMPOSITE_WEIGHTS)) {
      SHOT_COMPOSITE_WEIGHTS[fam] = { primary: 1 };
    }
    SERVE_QUALITY_WEIGHTS.serve_first = { serve: 1 } as never;
    SERVE_QUALITY_WEIGHTS.serve_second = { serve: 1 } as never;
    SERVE_ACCURACY_WEIGHTS.serve_first = { serve: 1 } as never;
    SERVE_ACCURACY_WEIGHTS.serve_second = { serve: 1 } as never;
    for (const k of Object.keys(RETURN_COMPOSITE_WEIGHTS)) {
      (RETURN_COMPOSITE_WEIGHTS as unknown as Record<string, number>)[k] = k === 'return' ? 1 : 0;
    }
  } else if (ch === 'band') {
    zero(STAT_MODIFIER_BANDS as unknown as Record<string, number>);
    zero(SERVE_MODIFIER_BANDS.first as unknown as Record<string, number>);
    zero(SERVE_MODIFIER_BANDS.second as unknown as Record<string, number>);
  } else {
    zero(OPPONENT_STAT_ADJUSTMENTS as unknown as Record<string, number>);
    zero(SHOOTER_STAT_ADJUSTMENTS as unknown as Record<string, number>);
  }
}

// ─── Match runner ────────────────────────────────────────────

function calcFatigue(cur: number, rally: number, stam: number): number {
  const sf = MATCH_FATIGUE.minFatigueRate + (1 - MATCH_FATIGUE.minFatigueRate) * (1 - stam / 100);
  let gain = rally * MATCH_FATIGUE.basePerShot * sf;
  if (rally > MATCH_FATIGUE.longRallyThreshold) {
    gain += (rally - MATCH_FATIGUE.longRallyThreshold) * MATCH_FATIGUE.longRallyExtra * sf;
  }
  const rec = MATCH_FATIGUE.baseRecoveryPerPoint +
    (stam / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);
  return Math.max(0, Math.min(100, cur + gain - rec));
}

function runMatch(pair: Pairing): [number, number] {
  const player = new PlayerProfile('p', 'P', pair.pStats, pair.pProf);
  const opponent = new PlayerProfile('o', 'O', pair.oStats, pair.oProf);
  const pEff = aggregateArchetypeEffects(pair.pProf);
  const oEff = aggregateArchetypeEffects(pair.oProf);

  const tracker = new ScoreTracker(BO3);
  tracker.setInitialServer(pair.serveFirst ? 'player' : 'opponent');
  player.rollMatchForm();
  opponent.rollMatchForm();
  const sim = new PointSimulator();

  const ms: MatchState = {
    score: tracker.getScore(), currentServer: tracker.getCurrentServer(), courtSurface: 'hard',
    momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0,
    isKeyMoment: false, fatigue: { player: 0, opponent: 0 },
  };

  let points = 0;
  let playerPoints = 0;
  while (!tracker.isComplete() && points < 600) {
    const server = tracker.getCurrentServer();
    ms.isKeyMoment = tracker.isKeyMoment();
    const pr = sim.simulatePoint(server, server === 'player' ? player : opponent,
      server === 'player' ? opponent : player, ms, pEff, oEff);
    const winner = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    if (winner === 'player') playerPoints++;
    tracker.addPoint(winner);
    ms.fatigue.player = calcFatigue(ms.fatigue.player, pr.rallyLength, player.stats.physical.stamina);
    ms.fatigue.opponent = calcFatigue(ms.fatigue.opponent, pr.rallyLength, opponent.stats.physical.stamina);
    ms.score = tracker.getScore();
    ms.currentServer = tracker.getCurrentServer();
    ms.pointsPlayed = ++points;
  }
  return [playerPoints, points];
}

// ─── Regression ──────────────────────────────────────────────

interface Slopes { slope: number[]; se: number[] }

function measure(pop: Pairing[]): Slopes {
  const diffs: number[][] = [];
  const ys: number[] = [];
  console.log = () => {};
  for (const pair of pop) {
    const [won, tot] = runMatch(pair);
    if (tot === 0) continue;
    const pf = flatten(pair.pStats), of = flatten(pair.oStats);
    diffs.push(pf.map((v, j) => v - of[j]));
    ys.push((won / tot) * 100 - 50);
  }
  console.log = _origLog;

  const n = ys.length;
  const my = ys.reduce((s, x) => s + x, 0) / n;
  const slope: number[] = [];
  const se: number[] = [];
  STAT_KEYS.forEach((_, j) => {
    const xs = diffs.map(d => d[j]);
    const mx = xs.reduce((s, x) => s + x, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const b = sxy / sxx;
    let sse = 0;
    for (let i = 0; i < n; i++) { const pred = my + b * (xs[i] - mx); sse += (ys[i] - pred) ** 2; }
    slope.push(b * 10);                                   // per +10 stat
    se.push(Math.sqrt((sse / (n - 2)) / sxx) * 10);
  });
  return { slope, se };
}

// ─── Report ──────────────────────────────────────────────────

const f = (x: number, d = 2): string => (x >= 0 ? '+' : '') + x.toFixed(d);

// ─── Part S: static channel margins ──────────────────────────

interface Margin {
  /** points of shot quality (or of the bar, for threshold) per +10 stat */
  size: number;
  channel: Channel;
  /** what has to be true for the channel to pay at all */
  gate: string;
}

/**
 * What +10 in a stat is worth through each channel, in points of shot quality,
 * at a reference rating. Pure arithmetic on the config tables:
 *
 *   composite   Δq = 10 × weight                       (finalAdjustment ≈ 1 at neutral)
 *   band        Δq = ref × (10/50) × band              multiplies the whole shot
 *   threshold   Δbar = 10 × multiplier                 same 0-100 scale as quality
 */
function staticMargins(ref: number): Map<string, Margin[]> {
  const out = new Map<string, Margin[]>();
  const push = (stat: string, m: Margin): void => {
    if (!out.has(stat)) out.set(stat, []);
    out.get(stat)!.push(m);
  };

  // 1. COMPOSITE — every family, both serve tables, the return table.
  const compHits = new Map<string, { lo: number; hi: number; n: number }>();
  const noteComp = (stat: string, w: number): void => {
    const e = compHits.get(stat) ?? { lo: Infinity, hi: 0, n: 0 };
    compHits.set(stat, { lo: Math.min(e.lo, w), hi: Math.max(e.hi, w), n: e.n + 1 });
  };
  for (const [, w] of Object.entries(SHOT_COMPOSITE_WEIGHTS)) {
    for (const [stat, weight] of Object.entries(w)) noteComp(stat, weight);
  }
  for (const table of [SERVE_QUALITY_WEIGHTS.serve_first, SERVE_QUALITY_WEIGHTS.serve_second,
    SERVE_ACCURACY_WEIGHTS.serve_first, SERVE_ACCURACY_WEIGHTS.serve_second]) {
    for (const [stat, weight] of Object.entries(table)) noteComp(stat, weight);
  }
  for (const [stat, weight] of Object.entries(RETURN_COMPOSITE_WEIGHTS)) noteComp(stat, weight);
  for (const [stat, e] of compHits) {
    // `primary` is a placeholder for whichever stat names the shot — report it
    // against the stats that can hold it rather than as a stat of its own.
    if (stat === 'primary') continue;
    push(stat, {
      channel: 'composite', size: 10 * e.hi,
      gate: e.lo === e.hi ? `${e.n} shot famil${e.n === 1 ? 'y' : 'ies'} @ w=${e.hi.toFixed(2)}`
        : `${e.n} shot families @ w=${e.lo.toFixed(2)}-${e.hi.toFixed(2)}`,
    });
  }
  // The primary slot itself, for the five stats that can own a shot.
  const primaries = new Set(Object.values(SHOT_COMPOSITE_WEIGHTS).map(w => w.primary));
  const pLo = Math.min(...primaries), pHi = Math.max(...primaries);
  for (const stat of ['forehand', 'backhand', 'net', 'slice', 'placement']) {
    push(stat, { channel: 'composite', size: 10 * pHi, gate: `primary slot, w=${pLo.toFixed(2)}-${pHi.toFixed(2)}` });
  }

  // 2. BAND — multiplicative supports.
  const band = (stat: string, b: number, gate: string): void =>
    push(stat, { channel: 'band', size: ref * 0.2 * b, gate });
  band('speed', STAT_MODIFIER_BANDS.courtCoverage, 'defensive shot or defensive position');
  band('speed', STAT_MODIFIER_BANDS.reactions, 'net shot or rushed ball');
  band('strength', STAT_MODIFIER_BANDS.power, 'power shots');
  band('anticipation', STAT_MODIFIER_BANDS.reading, 'opponent at net / well positioned');
  band('spin', STAT_MODIFIER_BANDS.touch, 'tactical shots (drop/angle/lob/passing)');
  band('tactics', STAT_MODIFIER_BANDS.tactics, 'any offensive or defensive shot');
  band('spin', STAT_MODIFIER_BANDS.shape, 'spin shots (slice/drop/defensive slice)');
  band('placement', STAT_MODIFIER_BANDS.precision, 'placement shots (drop/angle/lob)');
  band('strength', SERVE_MODIFIER_BANDS.first.strength, 'first serve');
  band('tactics', SERVE_MODIFIER_BANDS.first.tactics, 'first serve');
  band('spin', SERVE_MODIFIER_BANDS.first.spin, 'first serve');
  band('tactics', SERVE_MODIFIER_BANDS.second.tactics, 'second serve');
  band('spin', SERVE_MODIFIER_BANDS.second.spin, 'second serve');

  // 3. THRESHOLD — moves the bar. Opponent-side entries are the OPPONENT's stat.
  push('tactics', { channel: 'threshold', size: 10 * OPPONENT_STAT_ADJUSTMENTS.tactics, gate: "opponent's stat, every rally shot" });
  push('speed', { channel: 'threshold', size: 10 * OPPONENT_STAT_ADJUSTMENTS.speed, gate: "opponent's stat, every rally shot" });
  push('net', { channel: 'threshold', size: 10 * OPPONENT_STAT_ADJUSTMENTS.netCoverage, gate: "opponent's stat, only while at net" });
  push('anticipation', { channel: 'threshold', size: 10 * SHOOTER_STAT_ADJUSTMENTS.anticipation, gate: 'own stat, every rally shot' });

  return out;
}

function partS(ref: number): void {
  console.log(`\n╔══ PART S: points of shot quality per +10 stat, by channel, at rating ${ref} ══╗`);
  console.log('\nNo simulation — arithmetic on the config tables. `when active` is the size the');
  console.log('channel pays on a shot whose gate is open; a channel that pays a lot but almost');
  console.log('never opens is worth little, and PART A is what settles that.\n');

  const margins = staticMargins(ref);
  const hdr = ['stat'.padEnd(13), 'channel'.padEnd(11), 'when active'.padStart(12), '  gate'].join('');
  console.log(hdr);
  console.log('-'.repeat(78));
  for (const { key } of STAT_KEYS) {
    const rows = (margins.get(key) ?? []).sort((a, b) => b.size - a.size);
    if (rows.length === 0) {
      console.log([key.padEnd(13), '—'.padEnd(11), '—'.padStart(12), '  no shot-quality channel'].join(''));
      continue;
    }
    rows.forEach((m, i) => {
      console.log([
        (i === 0 ? key : '').padEnd(13),
        m.channel.padEnd(11),
        m.size.toFixed(2).padStart(12),
        `  ${m.gate}`,
      ].join(''));
    });
  }
  console.log('');
}

// ─── Part M: the band channel's measured dynamic range ──────

/**
 * Every band is centered on NEUTRAL_STAT, so a uniform-50 player multiplies by
 * exactly 1.000 on every shot. Running uniform players at other ratings
 * therefore reads the channel's whole dynamic range straight off the shots, with
 * no ablation and no regression: whatever the product differs from 1.0 is the
 * entire contribution of the band channel at that rating.
 *
 * Reported against the composite, which is the same number at every rating
 * because the weights sum to 1 — a uniform-L player's base rating is L.
 */
function partM(levels: number[], matches: number): void {
  console.log(`\n╔══ PART M: what the support bands actually multiply by, per rally shot ══╗`);
  console.log('\nUniform players, so the composite base rating equals the level exactly and every');
  console.log('band is 1.000 at 50 by construction. `support ×` is the measured product of the');
  console.log('physical, mental, spin and placement factors — the entire band channel.\n');

  const hdr = ['level'.padStart(6), 'support ×'.padStart(11), 'quality Δ'.padStart(11),
    'phys ×'.padStart(9), 'ment ×'.padStart(9), 'spin ×'.padStart(9), 'place ×'.padStart(9)].join('');
  console.log(hdr);
  console.log('-'.repeat(hdr.length));

  for (const L of levels) {
    let n = 0, phys = 0, ment = 0, spin = 0, place = 0, prod = 0;
    console.log = () => {};
    for (let i = 0; i < matches; i++) {
      const pair: Pairing = {
        pStats: uniformStats(L), oStats: uniformStats(L),
        pProf: profileOf({}), oProf: profileOf({}), serveFirst: i % 2 === 0,
      };
      const player = new PlayerProfile('p', 'P', pair.pStats, pair.pProf);
      const opponent = new PlayerProfile('o', 'O', pair.oStats, pair.oProf);
      const tracker = new ScoreTracker(BO3);
      tracker.setInitialServer(pair.serveFirst ? 'player' : 'opponent');
      player.rollMatchForm(); opponent.rollMatchForm();
      const sim = new PointSimulator();
      const ms: MatchState = {
        score: tracker.getScore(), currentServer: tracker.getCurrentServer(), courtSurface: 'hard',
        momentum: 0, pressure: 'low', matchLength: 0, pointsPlayed: 0,
        isKeyMoment: false, fatigue: { player: 0, opponent: 0 },
      };
      let points = 0;
      while (!tracker.isComplete() && points < 600) {
        const server = tracker.getCurrentServer();
        const pr = sim.simulatePoint(server, server === 'player' ? player : opponent,
          server === 'player' ? opponent : player, ms, {}, {});
        for (const s of pr.shots) {
          const m = s.modifiers;
          const sp = m.spinModifier;
          const pl = m.placementModifier;
          phys += m.physicalModifier; ment += m.mentalModifier; spin += sp; place += pl;
          prod += m.physicalModifier * m.mentalModifier * sp * pl;
          n++;
        }
        tracker.addPoint(pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player'));
        ms.score = tracker.getScore(); ms.currentServer = tracker.getCurrentServer();
        ms.pointsPlayed = ++points;
      }
    }
    console.log = _origLog;
    const mean = prod / n;
    console.log([
      String(L).padStart(6),
      mean.toFixed(4).padStart(11),
      f((mean - 1) * L, 2).padStart(11),
      (phys / n).toFixed(4).padStart(9),
      (ment / n).toFixed(4).padStart(9),
      (spin / n).toFixed(4).padStart(9),
      (place / n).toFixed(4).padStart(9),
    ].join(''));
  }
  console.log('\n`quality Δ` is the points of shot quality the whole band channel adds or');
  console.log('removes at that level — compare it against PART S\'s composite column, which is');
  console.log('2.5 to 8.0 points for a single +10.\n');
}

function main(): void {
  const N = Number(process.env.N ?? 1500);
  const SEED = Number(process.env.SEED ?? 1);
  const PARTS = (process.env.PARTS ?? 'SMA').toUpperCase();
  const REF = Number(process.env.REF ?? 55);
  const LO = Number(process.env.LO ?? 25);
  const HI = Number(process.env.HI ?? 90);
  const POP = process.env.POP ?? 'real';
  const POINTS = Number(process.env.POINTS ?? 6);
  const MAX_TIER = Number(process.env.MAX_TIER ?? 3) as 1 | 2 | 3;

  if (PARTS.includes('S')) partS(REF);
  if (PARTS.includes('M')) partM([20, 30, 50, 70, 90], 20);
  if (!PARTS.includes('A')) return;

  const pop = drawPopulation(N, SEED, LO, HI, POP, POINTS, MAX_TIER);

  const CHANNELS: Column[] = ['control', 'composite', 'band', 'threshold'];

  console.log(`\n╔══ PART A: where each stat's measured value comes from ══╗`);
  console.log(`   ${N} randomized pairings per configuration, stats ~ U(${LO}, ${HI}), seed ${SEED}.
   Builds: ${POP === 'presets'
    ? 'both sides from the five authored opponent profiles'
    : `player side spends ${POINTS} points (max tier ${MAX_TIER}), opponent side authored`}.
   Identical build population in every column.`);
  console.log(`   Units: point-win-% per +10 stat.\n`);

  process.stdout.write('   running full...');
  restore();
  const full = measure(pop);
  const ablated: Record<string, Slopes> = {};
  for (const ch of CHANNELS) {
    process.stdout.write(` ${ch}...`);
    ablate(ch);
    ablated[ch] = measure(pop);
  }
  restore();
  console.log(' done.\n');

  const hdr = ['stat'.padEnd(13), 'full'.padStart(9), '±95%'.padStart(7),
    ...CHANNELS.map(c => `−${c}`.padStart(11))].join('');
  console.log(hdr);
  console.log('-'.repeat(hdr.length));

  const order = STAT_KEYS.map((_, j) => j).sort((a, b) => full.slope[b] - full.slope[a]);
  for (const j of order) {
    const cells = CHANNELS.map(c => f(ablated[c].slope[j]).padStart(11));
    console.log([
      STAT_KEYS[j].key.padEnd(13),
      f(full.slope[j]).padStart(9),
      full.se[j] === 0 ? '  n/a' : (full.se[j] * 1.96).toFixed(2).padStart(7),
      ...cells,
    ].join(''));
  }

  console.log('\n\n── CHANNEL CONTRIBUTION: full − ablated, i.e. how much of the stat\'s value that channel carries ──\n');
  const hdr2 = ['stat'.padEnd(13), 'full'.padStart(9), ...CHANNELS.map(c => c.padStart(11)), 'accounted'.padStart(11)].join('');
  console.log(hdr2);
  console.log('-'.repeat(hdr2.length));
  for (const j of order) {
    const deltas = CHANNELS.map(c => full.slope[j] - ablated[c].slope[j]);
    console.log([
      STAT_KEYS[j].key.padEnd(13),
      f(full.slope[j]).padStart(9),
      ...deltas.map(d => f(d).padStart(11)),
      f(deltas.reduce((s, d) => s + d, 0)).padStart(11),
    ].join(''));
  }

  console.log('\nReading it:');
  console.log('  · `control` ablates nothing, so its column is what zero looks like. Any other');
  console.log('    column smaller than it is a mechanism that could be deleted unmeasurably.');
  console.log('  · `composite` only measures a stat in its SUPPORT role. The ablation moves the');
  console.log('    support weight onto whichever stat is primary, so primary stats (forehand,');
  console.log('    backhand, serve, return, and slice/placement/net on the shots they name) go');
  console.log('    UP, and their column is not an ablation of them at all. There is no ablation');
  console.log('    that isolates a primary stat — removing it removes the shot.');
  console.log('  · `accounted` sums the four channels. The gap to `full` is what the stat earns');
  console.log('    outside shot quality — fatigue for stamina, pressure and momentum for focus,');
  console.log('    ShotSelector frequency for forehand/backhand/spin/placement — plus the');
  console.log('    unablatable winner-floor retrieval term.\n');
}

main();
