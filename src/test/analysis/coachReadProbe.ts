/**
 * Coach's Read Probe — could the game tell a player which stat would have won them
 * the match, by simulating it?
 *
 * After a loss the game could re-play the matchup with more of each stat and name
 * the one that helps most. That is only worth showing if it's right. This ranks
 * the 14 stats by the point-win gain of +BUMP on one identity's career build
 * against one opponent, once with a large sample (the truth) and then TRIALS
 * times at the small budgets a browser could afford after a match, and reports
 * how often the small read agrees with the truth.
 *
 * Opponent: Olivia (Club team match 5) on a Club day; on a later day, the tier's
 * practice opponent number OPP.
 *
 * Run: npx tsx src/test/analysis/coachReadProbe.ts
 * Env: DAY=104  ID=baseliner  OPP=0  BUMP=15  TRUTH=300  TRIALS=8
 */

import { readFileSync } from 'node:fs';
import type { PlayerStats } from '../../types';
import type { ArchetypeProfile } from '../../types/archetype';
import type { OpponentTier } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed, clearSeed } from '../../core/random';
import { maxSpecialtyTier, profileForArchetype } from '../../data/archetypeTree';
import { TEAM_MATCH_5 } from '../../data/teamMatches';
import { OPPONENTS_BY_TIER, getOpponentArchetypeProfile } from '../../data/opponents';
import { playMatch, BO3 } from './simMatch';
import { SEASON_OFFSET, type CareerBuilds } from './bandSlots';
import type { StatName } from './identityBuilds';

const DAY = Number(process.env.DAY ?? 104);
const ID = process.env.ID ?? 'baseliner';
const OPP = Number(process.env.OPP ?? 0);
const BUMP = Number(process.env.BUMP ?? 15);
const TRUTH = Number(process.env.TRUTH ?? 300);
const TRIALS = Number(process.env.TRIALS ?? 8);
const BUDGETS = [10, 20, 40];

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

const builds = JSON.parse(
  readFileSync(new URL('./careerBuilds.json', import.meta.url), 'utf8'),
) as CareerBuilds;

const tier: OpponentTier =
  DAY > SEASON_OFFSET[4] ? 4 : DAY > SEASON_OFFSET[3] ? 3 : DAY > SEASON_OFFSET[2] ? 2 : 1;
const identity = builds.identities[ID];
const build = identity.days[DAY];
const profile: ArchetypeProfile = {
  ...identity.profile,
  phases: Object.fromEntries(
    Object.entries(identity.profile.phases).map(([phase, spec]) => [
      phase,
      { ...spec, tier: maxSpecialtyTier(tier) },
    ]),
  ),
};
const opponent =
  tier === 1
    ? {
        name: TEAM_MATCH_5.opponent.name,
        stats: TEAM_MATCH_5.opponent.stats,
        profile: profileForArchetype(TEAM_MATCH_5.opponent.archetype, 1),
      }
    : {
        name: OPPONENTS_BY_TIER[tier][OPP].name,
        stats: OPPONENTS_BY_TIER[tier][OPP].stats,
        profile: getOpponentArchetypeProfile(OPPONENTS_BY_TIER[tier][OPP]),
      };

const bumped = (s: PlayerStats, k: StatName): PlayerStats => {
  const out = structuredClone(s);
  for (const group of Object.values(out) as Array<Record<string, number>>) {
    if (k in group) group[k] = Math.min(100, group[k] + BUMP);
  }
  return out;
};

let matches = 0;
let ms = 0;

/** Mean point-win share over n seeded matches. */
function pointWin(stats: PlayerStats, n: number, seedBase: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) {
    setSeed(seedBase + i);
    const start = performance.now();
    const m = playMatch(
      new PlayerProfile('p', 'P', stats, profile),
      new PlayerProfile('o', 'O', opponent.stats, opponent.profile),
      {
        format: BO3,
        playerEffects: build.effects[i % build.effects.length],
        initialServer: i % 2 === 0 ? 'player' : 'opponent',
      },
    );
    ms += performance.now() - start;
    matches++;
    total += m.points.filter((p) => p.winner === 'player').length / m.points.length;
  }
  return total / n;
}

/** Stats by point-win gain from +BUMP, best first. */
function rank(n: number, seedBase: number): Array<[StatName, number]> {
  const base = pointWin(build.stats, n, seedBase);
  return STATS.map((k): [StatName, number] => [
    k,
    (pointWin(bumped(build.stats, k), n, seedBase) - base) * 100,
  ]).sort((a, b) => b[1] - a[1]);
}

function main(): void {
  const log = console.log;
  console.log = (): void => {};
  const truth = rank(TRUTH, 7_000_000);
  const top3 = new Set(truth.slice(0, 3).map(([k]) => k));
  const rows = BUDGETS.map((n) => {
    let firstRight = 0;
    let overlap = 0;
    for (let t = 0; t < TRIALS; t++) {
      const read = rank(n, 1_000_003 * (t + 1));
      if (top3.has(read[0][0])) firstRight++;
      overlap += read.slice(0, 3).filter(([k]) => top3.has(k)).length;
    }
    return (
      `${n} matches per stat (${n * (STATS.length + 1)} in all): the read's #1 is a true top-3 ` +
      `stat ${firstRight}/${TRIALS}; top-3 overlap ${(overlap / TRIALS).toFixed(1)}/3`
    );
  });
  console.log = log;
  clearSeed();
  log(`coachReadProbe  ${ID} day ${DAY} (tier ${tier}) v ${opponent.name}, +${BUMP} per stat`);
  log(
    `truth (${TRUTH} matches per stat): ` +
      truth.map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v.toFixed(1)}`).join(', '),
  );
  for (const row of rows) log(row);
  log(`${(ms / matches).toFixed(1)} ms per best of three`);
}

main();
