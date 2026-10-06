/**
 * Stat Value Probe — what does a player get for the points they spend?
 *
 * statSensitivity and statInContext measure stats from a base of 50 or across
 * random builds. The player's question is narrower: on the build I have, if I
 * spend currency on this stat, does anything happen? This adds +BUMP to each of
 * the 14 stats in turn on a career identity's day-23 build (identityBuilds) and
 * reports the point-win gain, what those points cost at the build's current
 * values (statEconomy recipes), and the gain per 10 units spent.
 *
 * Opponent: the day-27 team match (Reginald Werther, hard). N best-of-three per
 * condition, seeded per match.
 *
 * Run: npx tsx src/test/analysis/statValueProbe.ts
 * Env: N=1000  ID=baseliner  BUMP=5  SEED=1
 */

import type { PlayerStats } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed } from '../../core/random';
import { profileForArchetype } from '../../data/archetypeTree';
import { TEAM_MATCH_4 } from '../../data/teamMatches';
import { IDENTITY_BUILDS, statOf, withStat, type StatName } from './identityBuilds';
import { BO3, playMatch } from './simMatch';
import { emptyRates, tallyMatch } from './matchTally';
import { priceOf, unitsOf } from './statEconomy';

const N = Number(process.env.N ?? 1000);
const ID = process.env.ID ?? 'baseliner';
const BUMP = Number(process.env.BUMP ?? 5);
const SEED = Number(process.env.SEED ?? 1);
const TEAM = TEAM_MATCH_4;

const STATS: StatName[] = [
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

function perMatch(stats: PlayerStats): { perMatch: number[]; ptWin: number } {
  const id = IDENTITY_BUILDS[ID];
  const rates = emptyRates();
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const { points } = playMatch(
      new PlayerProfile('p', 'P', stats, id.profile),
      new PlayerProfile(
        'o',
        'O',
        TEAM.opponent.stats,
        profileForArchetype(TEAM.opponent.archetype),
      ),
      { format: BO3, surface: TEAM.surface, initialServer: i % 2 === 0 ? 'player' : 'opponent' },
    );
    tallyMatch(points, BO3, rates);
    out.push(points.filter((p) => p.winner === 'player').length / points.length);
  }
  return { perMatch: out, ptWin: (rates.pointsWon / rates.points) * 100 };
}

function main(): void {
  const id = IDENTITY_BUILDS[ID];
  const log = console.log;
  console.log = (): void => {};
  const base = perMatch(id.stats);
  const rows: Array<{ stat: StatName; from: number; d: number; se: number; units: number }> = [];
  for (const stat of STATS) {
    const r = perMatch(withStat(id.stats, stat, BUMP));
    const d = r.perMatch.map((x, i) => (x - base.perMatch[i]) * 100);
    const mean = d.reduce((s, x) => s + x, 0) / d.length;
    const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
    const from = statOf(id.stats, stat);
    let units = 0;
    for (let v = from; v < from + BUMP; v++) units += unitsOf(priceOf(stat, v));
    rows.push({ stat, from, d: mean, se: sd / Math.sqrt(d.length), units });
    process.stderr.write('.');
  }
  console.log = log;
  log(
    `\nstatValueProbe  N=${N} BO3  ${ID} day-23 build v ${TEAM.opponent.name} (${TEAM.surface})  ` +
      `+${BUMP} per stat; baseline point-win ${base.ptWin.toFixed(1)}%`,
  );
  log(['stat', 'from', 'Δpt-win', 'cost (units)', 'Δpt-win per 10 units'].join('\t'));
  for (const r of rows.sort((a, b) => b.d / b.units - a.d / a.units)) {
    log(
      [
        r.stat,
        `${r.from}→${r.from + BUMP}`,
        `${r.d >= 0 ? '+' : ''}${r.d.toFixed(2)} ± ${r.se.toFixed(2)}`,
        r.units,
        ((r.d / r.units) * 10).toFixed(2),
      ].join('\t'),
    );
  }
}

main();
