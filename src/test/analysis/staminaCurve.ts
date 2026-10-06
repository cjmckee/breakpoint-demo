/**
 * Stamina Curve — does stamina show, and where in a match?
 *
 * The design intent (stamina-at-tier-1.md §6): a high-stamina player has
 * noticeably lower fatigue and recovers more easily than a low-stamina one, and
 * it is most apparent late in long matches. Nobody starts a match tired.
 *
 * Plays best-of-three matches on the real MatchSimulator and splits each one
 * by point number. For every bucket it reports both players' mean fatigue and
 * the player's point-win %, so the curve shows where the difference opens up.
 *
 * Player: uniform BASE with stamina swept. Opponent: uniform BASE, stamina OPP.
 * VARIANTS picks fatigue configs to compare (see VARIANTS below); `current` is
 * whatever src/config/shotThresholds.ts holds.
 *
 * Run: npx tsx src/test/analysis/staminaCurve.ts
 * Env: N=600 (matches per row)  BASE=32  OPP=40  STAMINAS=20,40,60,80
 *      VARIANTS=current  CHET=1 (also the day-15 team match against Chet Vale)
 */

import type { CourtSurface, MatchFormat, PlayerStats } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { MatchSimulator } from '../../core/MatchSimulator';
import { MATCH_FATIGUE, STAMINA_RECOVERY, FATIGUE_MODIFIER } from '../../config/shotThresholds';
import { TEAM_MATCH_1 } from '../../data/teamMatches';
import { profileForArchetype } from '../../data/archetypeTree';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch, type Rates } from './matchTally';

const N = Number(process.env.N ?? 600);
const BASE = Number(process.env.BASE ?? 32);
const OPP = Number(process.env.OPP ?? 40);
const STAMINAS = (process.env.STAMINAS ?? '20,40,60,80').split(',').map(Number);
const BO3: MatchFormat = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };
/** Point-number buckets: [from, to). Most best-of-threes at tier 1 run 120-180 points. */
const BUCKETS: Array<[number, number]> = [
  [0, 40],
  [40, 80],
  [80, 120],
  [120, 999],
];

type Fatigue = typeof MATCH_FATIGUE;
type Recovery = typeof STAMINA_RECOVERY;
interface Variant {
  fatigue: Partial<Fatigue>;
  recovery: Partial<Recovery>;
  penalty?: number;
  /** FATIGUE_MODIFIER.exponent: above 1, light fatigue costs little and heavy fatigue a lot. */
  exponent?: number;
}

/** Fatigue configs under test. `current` leaves the shipped config alone. */
const VARIANTS: Record<string, Variant> = {
  current: { fatigue: {}, recovery: {} },
  // Wider gain and recovery spread, same penalty.
  wide: {
    fatigue: {
      maxFatigueRate: 1.4,
      minFatigueRate: 0.15,
      baseRecoveryPerPoint: 0.03,
      maxRecoveryPerPoint: 0.3,
    },
    recovery: { perGameBase: 1, perGameScale: 6, perSetBase: 4, perSetScale: 16 },
  },
  // Wide, and fatigue costs more.
  wide70: {
    fatigue: {
      maxFatigueRate: 1.4,
      minFatigueRate: 0.15,
      baseRecoveryPerPoint: 0.03,
      maxRecoveryPerPoint: 0.3,
    },
    recovery: { perGameBase: 1, perGameScale: 6, perSetBase: 4, perSetScale: 16 },
    penalty: 0.7,
  },
  // Curved penalty: light fatigue nearly free, exhaustion costs up to 35%.
  curve: { fatigue: {}, recovery: {}, penalty: 0.65, exponent: 2 },
  // Curved, and recovery that scales harder with stamina at changeovers and set
  // breaks: high stamina visibly bounces back, low stamina does not.
  curveRecover: {
    fatigue: { minFatigueRate: 0.2, maxRecoveryPerPoint: 0.3 },
    recovery: { perGameBase: 1.5, perGameScale: 5, perSetBase: 5, perSetScale: 20 },
    penalty: 0.65,
    exponent: 2,
  },
  // Wider still.
  wider65: {
    fatigue: {
      maxFatigueRate: 1.6,
      minFatigueRate: 0.1,
      baseRecoveryPerPoint: 0.02,
      maxRecoveryPerPoint: 0.32,
    },
    recovery: { perGameBase: 0.5, perGameScale: 7, perSetBase: 3, perSetScale: 20 },
    penalty: 0.65,
  },
};

const SHIPPED = {
  fatigue: { ...MATCH_FATIGUE },
  recovery: { ...STAMINA_RECOVERY },
  penalty: FATIGUE_MODIFIER.minModifier,
  exponent: FATIGUE_MODIFIER.exponent,
};

function apply(v: Variant): void {
  Object.assign(MATCH_FATIGUE, SHIPPED.fatigue, v.fatigue);
  Object.assign(STAMINA_RECOVERY, SHIPPED.recovery, v.recovery);
  FATIGUE_MODIFIER.minModifier = v.penalty ?? SHIPPED.penalty;
  FATIGUE_MODIFIER.exponent = v.exponent ?? SHIPPED.exponent;
}

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});

interface Row {
  won: number[];
  pts: number[];
  pFat: number[];
  oFat: number[];
  rates: Rates;
}

/** Fatigue is read off the shots, inverting the FATIGUE_MODIFIER curve. */
const fatigueOf = (modifier: number): number =>
  Math.pow((1 - modifier) / (1 - FATIGUE_MODIFIER.minModifier), 1 / FATIGUE_MODIFIER.exponent) *
  100;

function play(
  player: () => PlayerProfile,
  opponent: () => PlayerProfile,
  surface: CourtSurface = 'hard',
): Row {
  const r: Row = {
    won: BUCKETS.map(() => 0),
    pts: BUCKETS.map(() => 0),
    pFat: BUCKETS.map(() => 0),
    oFat: BUCKETS.map(() => 0),
    rates: emptyRates(),
  };
  for (let m = 0; m < N; m++) {
    const sim = new MatchSimulator({
      player: player(),
      opponent: opponent(),
      courtSurface: surface,
      matchFormat: BO3,
    });
    sim.simulateMatch();
    const points = sim.exportMatchData().points;
    tallyMatch(points, BO3, r.rates);
    points.forEach((pt, i) => {
      const b = BUCKETS.findIndex(([lo, hi]) => i >= lo && i < hi);
      r.pts[b]++;
      if (pt.winner === 'player') r.won[b]++;
      const playerRole = pt.server === 'player' ? 'server' : 'returner';
      const mine = pt.shots.find((s) => s.shooter === playerRole);
      const theirs = pt.shots.find((s) => s.shooter !== playerRole);
      if (mine) r.pFat[b] += fatigueOf(mine.modifiers.fatigueModifier);
      if (theirs) r.oFat[b] += fatigueOf(theirs.modifiers.fatigueModifier);
    });
  }
  return r;
}

function printRow(label: string, r: Row): void {
  const cells = BUCKETS.map((_, b) =>
    r.pts[b]
      ? `${((r.won[b] / r.pts[b]) * 100).toFixed(1)}% (${(r.pFat[b] / r.pts[b]).toFixed(0)} v ${(r.oFat[b] / r.pts[b]).toFixed(0)})`
      : '-',
  );
  console.log([label, ...formatRates(r.rates), ...cells].join('\t'));
}

function main(): void {
  const log = console.log;
  const variants = (process.env.VARIANTS ?? 'current').split(',');
  log(
    `staminaCurve  N=${N} BO3  player uniform ${BASE}, opponent uniform ${BASE} with stamina ${OPP}`,
  );
  log('cells: point-win % in that stretch of the match (player fatigue v opponent fatigue)');
  log(
    [
      'variant / stamina',
      ...RATE_HEADERS,
      ...BUCKETS.map(([lo, hi]) => `points ${lo + 1}-${hi === 999 ? 'end' : hi}`),
    ].join('\t'),
  );
  for (const name of variants) {
    apply(VARIANTS[name]);
    for (const s of STAMINAS) {
      console.log = (): void => {};
      const row = play(
        () => {
          const st = uniform(BASE);
          st.physical.stamina = s;
          return new PlayerProfile('p', 'P', st);
        },
        () => {
          const st = uniform(BASE);
          st.physical.stamina = OPP;
          return new PlayerProfile('o', 'O', st);
        },
      );
      console.log = log;
      printRow(`${name} / ${s}`, row);
    }
    if (process.env.CHET === '1') {
      const chet = TEAM_MATCH_1.opponent;
      for (const s of [21, 28, 40]) {
        console.log = (): void => {};
        const row = play(
          () => {
            const st = uniform(28);
            st.physical.stamina = s;
            return new PlayerProfile('p', 'P', st);
          },
          () => new PlayerProfile('o', 'O', chet.stats, profileForArchetype(chet.archetype)),
          TEAM_MATCH_1.surface,
        );
        console.log = log;
        printRow(`${name} / day-15 (28s, stamina ${s}) v Chet`, row);
      }
    }
  }
  apply(VARIANTS.current);
}

main();
