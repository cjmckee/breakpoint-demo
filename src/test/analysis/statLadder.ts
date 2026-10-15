/**
 * Stat Ladder — is each stat worth what OVR says it is, at every level of the
 * career?
 *
 * OVR is the yardstick progression is balanced against (bandCheck, the season
 * bands), so it should roughly predict who wins. It weights stats by category:
 * each core stat 0.09, each physical 0.083, each technical and mental 0.05
 * (utils/overallRating.ts). If the match engine pays stats in very different
 * proportions, OVR stops predicting results, and a build that buys the
 * under-paid stats falls behind at the same OVR. That is identity drift.
 *
 * For each level band this draws N random pairings: every stat of both players
 * uniform in the band, the player's specialties spent freely up to the season's
 * cap, the opponent on an authored profile at the season's tier. It plays one
 * best of three per pairing and fits point-win margin on all 14 stat
 * differences at once (OLS), so each slope is that stat's value with the others
 * held equal. Reported per band:
 *
 *   value   point-win % per +10 of the stat, ± 95%
 *   share   the stat's share of all the value, against its share of OVR
 *   R²      how much of the margin the 14 stats explain, how much OVR alone
 *           explains, and OVR's share of what is explainable
 *
 * The target is value roughly in proportion to OVR weight (core stats heaviest)
 * and OVR's share near 100%.
 *
 * Run: npx tsx src/test/analysis/statLadder.ts
 * Env: N=2000 (pairings per band)  SEED=1  BANDS=club,regional,tour,world
 *      OVR_W=serve:0.1,forehand:0.1,... scores another set of OVR weights (stats left
 *      out weigh 0) beside today's
 *      With tuneRun: TUNE='…' PROBE=statLadder npx tsx src/test/analysis/tuneRun.ts
 */

import type { PlayerStats } from '../../types';
import type { ArchetypeProfile, SpecialtyTier } from '../../types/archetype';
import type { OpponentTier } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed, clearSeed } from '../../core/random';
import { calculateOverallRating, ovrStatShares } from '../../utils/overallRating';
import { profileForArchetype, type LegacyArchetype } from '../../data/archetypeTree';
import { drawPlayerProfile } from './playerFactory';
import { playMatch } from './simMatch';

const N = Number(process.env.N ?? 2000);
const SEED = Number(process.env.SEED ?? 1);

interface Band {
  name: string;
  lo: number;
  hi: number;
  tier: OpponentTier;
  /** Specialization points a player of this season has spent, and its tier cap. */
  points: number;
  maxTier: SpecialtyTier;
}

const BANDS: Band[] = [
  { name: 'club', lo: 25, hi: 50, tier: 1, points: 3, maxTier: 1 },
  { name: 'regional', lo: 40, hi: 70, tier: 2, points: 6, maxTier: 2 },
  { name: 'tour', lo: 55, hi: 85, tier: 3, points: 8, maxTier: 3 },
  { name: 'world', lo: 65, hi: 95, tier: 4, points: 10, maxTier: 3 },
];

const STATS: Array<[keyof PlayerStats, string]> = [
  ['core', 'serve'],
  ['core', 'forehand'],
  ['core', 'backhand'],
  ['core', 'return'],
  ['core', 'net'],
  ['technical', 'slice'],
  ['technical', 'spin'],
  ['technical', 'placement'],
  ['physical', 'speed'],
  ['physical', 'stamina'],
  ['physical', 'strength'],
  ['mental', 'focus'],
  ['mental', 'anticipation'],
  ['mental', 'tactics'],
];

/** Each stat's weight in OVR, as a share (read at use, so a TUNE override shows). */
const ovrWeight = (): number[] => {
  const shares = ovrStatShares();
  return STATS.map(([, key]) => shares[key]);
};

/** Candidate OVR weights from OVR_W, normalised to sum to 1. */
const CANDIDATE_WEIGHT: number[] | undefined = process.env.OVR_W
  ? ((): number[] => {
      const given = Object.fromEntries(
        process.env.OVR_W!.split(',').map((kv) => {
          const [k, v] = kv.split(':');
          return [k.trim(), Number(v)];
        }),
      );
      const raw = STATS.map(([, key]) => given[key] ?? 0);
      const total = raw.reduce((a, b) => a + b, 0);
      return raw.map((w) => w / total);
    })()
  : undefined;

const LEGACY: LegacyArchetype[] = [
  'aggressive',
  'defensive',
  'counterpuncher',
  'serve_volley',
  'all_court',
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawStats(rng: () => number, band: Band): PlayerStats {
  const s: PlayerStats = {
    core: { serve: 0, forehand: 0, backhand: 0, return: 0, net: 0 },
    technical: { slice: 0, spin: 0, placement: 0 },
    physical: { speed: 0, stamina: 0, strength: 0 },
    mental: { focus: 0, anticipation: 0, tactics: 0 },
  };
  for (const [category, key] of STATS) {
    (s[category] as unknown as Record<string, number>)[key] = Math.round(
      band.lo + rng() * (band.hi - band.lo),
    );
  }
  return s;
}

const flat = (s: PlayerStats): number[] =>
  STATS.map(([category, key]) => (s[category] as unknown as Record<string, number>)[key]);

/** Solve A x = b by Gaussian elimination with partial pivoting; A is square. */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/** Inverse of a square matrix, column by column. */
function inverse(a: number[][]): number[][] {
  const n = a.length;
  const cols = Array.from({ length: n }, (_, j) =>
    solve(
      a,
      Array.from({ length: n }, (_, i) => (i === j ? 1 : 0)),
    ),
  );
  return a.map((_, i) => cols.map((col) => col[i]));
}

interface Fit {
  coef: number[];
  se: number[];
  r2: number;
}

/** OLS with an intercept: y on the columns of x. */
function ols(x: number[][], y: number[]): Fit {
  const rows = x.map((r) => [1, ...r]);
  const k = rows[0].length;
  const xtx = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
  );
  const xty = Array.from({ length: k }, (_, i) => rows.reduce((s, r, n) => s + r[i] * y[n], 0));
  const coef = solve(xtx, xty);
  const pred = rows.map((r) => r.reduce((s, v, i) => s + v * coef[i], 0));
  const my = y.reduce((s, v) => s + v, 0) / y.length;
  const sse = y.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0);
  const sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const sigma2 = sse / (y.length - k);
  const inv = inverse(xtx);
  return {
    coef: coef.slice(1),
    se: inv.slice(1).map((row, i) => Math.sqrt(sigma2 * row[i + 1])),
    r2: 1 - sse / sst,
  };
}

const f = (x: number, d = 2): string => (x >= 0 ? '+' : '') + x.toFixed(d);

function measure(band: Band, bandIndex: number): string[] {
  const out: string[] = [];
  const rng = mulberry32(SEED * 7919 + bandIndex);
  const diffs: number[][] = [];
  const ovrDiffs: number[][] = [];
  const candidateDiffs: number[][] = [];
  const ys: number[] = [];
  for (let i = 0; i < N; i++) {
    const p = drawStats(rng, band);
    const o = drawStats(rng, band);
    const pProf: ArchetypeProfile = drawPlayerProfile(rng, band.points, band.maxTier);
    const oProf = profileForArchetype(LEGACY[Math.floor(rng() * LEGACY.length)], band.tier);
    const serveFirst = rng() < 0.5;
    setSeed(SEED * 1_000_003 + bandIndex * 100_000 + i);
    const { points } = playMatch(
      new PlayerProfile('p', 'P', p, pProf),
      new PlayerProfile('o', 'O', o, oProf),
      { initialServer: serveFirst ? 'player' : 'opponent' },
    );
    const won = points.filter((pt) => pt.winner === 'player').length;
    const pf = flat(p);
    const of = flat(o);
    diffs.push(pf.map((v, j) => v - of[j]));
    ovrDiffs.push([calculateOverallRating(p) - calculateOverallRating(o)]);
    if (CANDIDATE_WEIGHT) {
      candidateDiffs.push([pf.reduce((a, v, j) => a + (v - of[j]) * CANDIDATE_WEIGHT[j], 0)]);
    }
    ys.push((won / points.length) * 100 - 50);
  }

  const full = ols(diffs, ys);
  const byOvr = ols(ovrDiffs, ys);
  const value = full.coef.map((c) => c * 10);
  const positive = value.map((v) => Math.max(0, v));
  const total = positive.reduce((s, v) => s + v, 0);
  const share = positive.map((v) => v / total);
  const mean = (xs: number[]): number => xs.reduce((s, v) => s + v, 0) / xs.length;
  const corr = (x: number[], y: number[]): number => {
    const mx = mean(x);
    const my = mean(y);
    const n = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0);
    return (
      n /
      Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0) * y.reduce((s, v) => s + (v - my) ** 2, 0))
    );
  };
  const core = value.slice(0, 5);
  const rest = value.slice(5);

  out.push(
    `\n── ${band.name}: stats ~ U(${band.lo}, ${band.hi}), specialties to tier ${band.maxTier}, ${N} pairings ──`,
  );
  out.push(['stat', 'value', '±95%', 'share', 'OVR share'].join('\t'));
  const order = value.map((_, j) => j).sort((a, b) => value[b] - value[a]);
  for (const j of order) {
    out.push(
      [
        STATS[j][1],
        f(value[j]),
        (full.se[j] * 10 * 1.96).toFixed(2),
        `${(share[j] * 100).toFixed(0)}%`,
        `${(ovrWeight()[j] * 100).toFixed(0)}%`,
      ].join('\t'),
    );
  }
  out.push(
    `core mean ${f(mean(core))} / others ${f(mean(rest))} (OVR asks ×${(mean(ovrWeight().slice(0, 5)) / mean(ovrWeight().slice(5))).toFixed(2)}); ` +
      `largest/smallest positive ×${(Math.max(...positive) / Math.min(...positive.filter((v) => v > 0))).toFixed(1)}; ` +
      `r(value, OVR weight) ${corr(value, ovrWeight()).toFixed(2)}`,
  );
  out.push(
    `R²: 14 stats ${full.r2.toFixed(2)}, OVR alone ${byOvr.r2.toFixed(2)} ` +
      `→ OVR explains ${((byOvr.r2 / full.r2) * 100).toFixed(0)}% of what the stats can`,
  );
  if (CANDIDATE_WEIGHT) {
    const byCandidate = ols(candidateDiffs, ys);
    out.push(
      `candidate OVR weights: R² ${byCandidate.r2.toFixed(2)} ` +
        `→ explains ${((byCandidate.r2 / full.r2) * 100).toFixed(0)}% of what the stats can`,
    );
  }
  return out;
}

function main(): void {
  const wanted = (process.env.BANDS ?? 'club,regional,tour,world').split(',');
  const log = console.log;
  log(`statLadder  N=${N} per band, SEED=${SEED}, best of three`);
  BANDS.forEach((band, i) => {
    if (!wanted.includes(band.name)) return;
    console.log = (): void => {};
    let lines: string[];
    try {
      lines = measure(band, i);
    } finally {
      console.log = log;
    }
    for (const line of lines) log(line);
  });
  clearSeed();
}

main();
