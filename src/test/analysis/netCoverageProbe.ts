/**
 * Net Coverage Probe — does OPPONENT_STAT_ADJUSTMENTS.netCoverage earn its place?
 *
 * `statChannels` measures the whole threshold channel across a randomized
 * population and reports netCoverage as noise (+0.15 over U(25,90), +0.12 over
 * U(25,50)). That is the wrong denominator for it: netCoverage only applies
 * while the opponent is standing at the net, and most randomly generated builds
 * never come forward, so the mechanism spends nearly every point switched off.
 *
 * The question it should be asked is narrower. When a net player IS at the net,
 * does their `net` rating change how hard they are to pass — and does it change
 * it by more than the volley composite already does on its own?
 *
 * DESIGN. A net_downhill T3 attacker faces a baseliner. Two things vary:
 *
 *   the attacker's `net` rating       25 against 75, everything else uniform
 *   OPPONENT_STAT_ADJUSTMENTS.netCoverage   0 (off), 0.20 (shipped), 0.50, 1.00
 *
 * The row that answers the question is SPREAD: the gap between the net-75 and
 * net-25 attacker. At coverage 0 that gap is whatever the volley composite and
 * approach quality buy on their own. Any spread above that is what the
 * mechanism adds. If turning it off does not shrink the spread, it is not doing
 * a job the rest of the system was not already doing.
 *
 * Reported from the PASSER's side, because that is who the bar is applied to:
 * how often their passing attempts land, and how often they take the point once
 * the attacker has arrived.
 *
 * Run: npm run build:node && node dist/src/test/analysis/netCoverageProbe.js
 * Env: N=400 (BO3 per cell)  L=45 (uniform rating for everything but `net`)
 *      COVERAGES=0,0.2,0.5,1.0 (the values of netCoverage to sweep)
 */

import type { PlayerStats, ShotDetail } from '../../types';
import { PointType } from '../../types';
import type { ArchetypeProfile } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { playMatch } from './simMatch';
import { OPPONENT_STAT_ADJUSTMENTS } from '../../config/shotThresholds';

const NET_ATTACKER: ArchetypeProfile = {
  broad: 'net_attacker',
  phases: { net: { path: 'net_downhill', tier: 3 } },
  specializationPoints: 0,
  respecTokens: 0,
};
const BASELINER: ArchetypeProfile = {
  broad: 'baseliner',
  phases: {},
  specializationPoints: 0,
  respecTokens: 0,
};

function stats(r: number, net: number): PlayerStats {
  return {
    core: { serve: r, forehand: r, backhand: r, return: r, net },
    technical: { slice: r, spin: r, placement: r },
    physical: { speed: r, stamina: r, strength: r },
    mental: { focus: r, anticipation: r, tactics: r },
  };
}

interface Tally {
  /** points in which the attacker actually reached the net */
  netPoints: number;
  /** of those, points the PASSER won */
  passerWon: number;
  passAttempts: number;
  passIn: number;
  passWinners: number;
}

const newTally = (): Tally => ({
  netPoints: 0,
  passerWon: 0,
  passAttempts: 0,
  passIn: 0,
  passWinners: 0,
});

/** The attacker is 'player'; the passer is 'opponent'. */
function runMatch(attacker: PlayerProfile, passer: PlayerProfile, t: Tally): void {
  for (const pt of playMatch(attacker, passer).points) {
    const server = pt.server;

    const attackerRole = server === 'player' ? 'server' : 'returner';
    const reachedNet = pt.shots.some(
      (s: ShotDetail) => s.shooter === attackerRole && s.context?.courtPosition === 'net',
    );
    const winner = pt.winner;

    if (reachedNet) {
      t.netPoints++;
      if (winner === 'opponent') t.passerWon++;
      for (const s of pt.shots) {
        if (s.shooter === attackerRole) continue;
        if (!String(s.shotType).includes('passing')) continue;
        t.passAttempts++;
        if (s.outcome === PointType.WINNER) {
          t.passWinners++;
          t.passIn++;
        } else if (s.outcome === PointType.IN_PLAY) t.passIn++;
      }
    }
  }
}

function measure(attackerNet: number, level: number, n: number): Tally {
  const t = newTally();
  for (let i = 0; i < n; i++) {
    runMatch(
      new PlayerProfile('a', 'A', stats(level, attackerNet), NET_ATTACKER),
      new PlayerProfile('p', 'P', stats(level, level), BASELINER),
      t,
    );
  }
  return t;
}

const pct = (a: number, b: number): number => (b === 0 ? 0 : (a / b) * 100);
const f = (x: number): string => (x >= 0 ? '+' : '') + x.toFixed(1);

function main(): void {
  const N = Number(process.env.N ?? 400);
  const L = Number(process.env.L ?? 45);
  const SHIPPED = OPPONENT_STAT_ADJUSTMENTS.netCoverage;

  console.log(`\n╔══ NET COVERAGE — what does OPPONENT_STAT_ADJUSTMENTS.netCoverage buy? ══╗`);
  console.log(`\n   net_downhill T3 attacker vs a uniform-${L} baseliner, ${N} BO3 per cell.`);
  console.log(
    `   Everything but the attacker's \`net\` is uniform ${L}. Shipped value is ${SHIPPED}.`,
  );
  console.log(`   All figures are from the PASSER's side, on points where the attacker`);
  console.log(`   actually reached the net.\n`);

  const header = [
    'coverage'.padEnd(10),
    'net'.padStart(5),
    'net pts'.padStart(9),
    'passer won'.padStart(12),
    'pass in%'.padStart(10),
    'pass win%'.padStart(11),
  ].join('');

  const rows: Array<[number, number, number]> = []; // [coverage, passerWon@25, passerWon@75]

  const sweep = (process.env.COVERAGES ?? `0,${SHIPPED},0.5,1.0`).split(',').map(Number);
  for (const coverage of sweep) {
    (OPPONENT_STAT_ADJUSTMENTS as unknown as Record<string, number>).netCoverage = coverage;
    console.log(
      `\n── netCoverage = ${coverage.toFixed(2)}${coverage === SHIPPED ? '  (shipped)' : ''} ──`,
    );
    console.log(header);
    console.log('-'.repeat(header.length));

    const won: number[] = [];
    for (const attackerNet of [25, 75]) {
      const t = measure(attackerNet, L, N);
      const passerWon = pct(t.passerWon, t.netPoints);
      won.push(passerWon);
      console.log(
        [
          ''.padEnd(10),
          String(attackerNet).padStart(5),
          String(t.netPoints).padStart(9),
          `${passerWon.toFixed(1)}%`.padStart(12),
          `${pct(t.passIn, t.passAttempts).toFixed(1)}%`.padStart(10),
          `${pct(t.passWinners, t.passAttempts).toFixed(1)}%`.padStart(11),
        ].join(''),
      );
    }
    console.log(
      `${''.padEnd(10)}${'SPREAD'.padStart(5)}${''.padStart(9)}${f(won[0] - won[1]).padStart(11)}pp`,
    );
    rows.push([coverage, won[0], won[1]]);
  }

  (OPPONENT_STAT_ADJUSTMENTS as unknown as Record<string, number>).netCoverage = SHIPPED;

  console.log('\n\n── SPREAD by coverage — how much a good volleyer is protected ──\n');
  console.log(
    [
      'coverage'.padStart(10),
      'passer won @net25'.padStart(19),
      '@net75'.padStart(10),
      'spread'.padStart(9),
    ].join(''),
  );
  console.log('-'.repeat(48));
  for (const [coverage, lo, hi] of rows) {
    console.log(
      [
        coverage.toFixed(2).padStart(10),
        `${lo.toFixed(1)}%`.padStart(19),
        `${hi.toFixed(1)}%`.padStart(10),
        `${f(lo - hi)}pp`.padStart(9),
      ].join(''),
    );
  }
  console.log('\nSpread at coverage 0 is what the volley composite and approach quality');
  console.log('already buy. Everything above that line is the mechanism. If the column');
  console.log('is flat, netCoverage is not doing a job the rest of the system was not.\n');
}

main();
