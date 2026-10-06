/**
 * Mental Ability Probe — what are the key-moment and momentum abilities worth?
 *
 * Layer 1 (abilityProbe) runs on MatchSimulator, which has no key moments and
 * none of the orchestrator's momentum or focus effects, so Clutch, Mental
 * Fortitude and Iron Will cannot be measured there. This plays the live
 * MatchOrchestrator with key moments on, picking a random option at each one
 * (seeded, so the same match index starts from the same luck in every
 * condition), on the same fixed builds and opponent as Layer 1.
 *
 * Heavy Hitter and Pressure Cooker are included as cross-checks: they act on
 * shots, so their value here should match Layer 1's on MatchSimulator.
 *
 * Run: npx tsx src/test/analysis/mentalAbilityProbe.ts
 * Env: N=300 (matches per condition)  ID=baseliner  FORMAT=best-of-3  LEVEL=1
 *      SEED=1  KM=16 (key moments per match; the game default)
 */

import type { PlayerStats } from '../../types';
import { AbilityName } from '../../types/game';
import type { Ability } from '../../types/game';
import type { ArchetypeProfile } from '../../types/archetype';
import { MatchOrchestrator } from '../../game/MatchOrchestrator';
import { setSeed, random } from '../../core/random';
import { ABILITY_DEFINITIONS } from '../../data/abilities';
import { profileForArchetype } from '../../data/archetypeTree';
import { TEAM_MATCH_4 } from '../../data/teamMatches';
import { IDENTITY_BUILDS, withStat } from './identityBuilds';
import { RATE_HEADERS, emptyRates, formatRates, tallyMatch, type Rates } from './matchTally';
import { BO1, BO3 } from './simMatch';

type AbilityId = (typeof AbilityName)[keyof typeof AbilityName];

const N = Number(process.env.N ?? 300);
const ID = process.env.ID ?? 'baseliner';
const FORMAT = (process.env.FORMAT ?? 'best-of-3') as 'best-of-1' | 'best-of-3';
const LEVEL = Number(process.env.LEVEL ?? 1);
const SEED = Number(process.env.SEED ?? 1);
const KM = Number(process.env.KM ?? 16);
const TEAM = TEAM_MATCH_4;

const ABILITIES: AbilityId[] = [
  AbilityName.CLUTCH,
  AbilityName.MENTAL_FORTITUDE,
  AbilityName.IRON_WILL,
  AbilityName.PRESSURE_COOKER,
  AbilityName.HEAVY_HITTER,
];

interface Result {
  rates: Rates;
  perMatch: number[];
  keyMoments: number;
  keyMomentsWon: number;
}

async function run(
  stats: PlayerStats,
  profile: ArchetypeProfile,
  abilities: Ability[],
): Promise<Result> {
  const r: Result = { rates: emptyRates(), perMatch: [], keyMoments: 0, keyMomentsWon: 0 };
  const format = FORMAT === 'best-of-1' ? BO1 : BO3;
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const points: Array<{ server: 'player' | 'opponent'; winner: 'player' | 'opponent' }> = [];
    await new MatchOrchestrator().simulateInteractiveMatch({
      playerStats: stats,
      opponentStats: TEAM.opponent.stats,
      playerArchetypeProfile: profile,
      opponentArchetypeProfile: profileForArchetype(TEAM.opponent.archetype),
      playerAbilities: abilities,
      surface: TEAM.surface,
      mood: 0,
      energy: 100,
      enableKeyMoments: true,
      keyMomentsPerMatch: KM,
      matchFormat: FORMAT,
      pointDelayMs: 0,
      onKeyMoment: async (km) => km.options[Math.floor(random() * km.options.length)],
      onKeyMomentResult: async (km) => {
        r.keyMoments++;
        if (km.pointWinner === 'player') r.keyMomentsWon++;
      },
      onPointComplete: (pt) => {
        if (pt.server) points.push({ server: pt.server, winner: pt.winner });
      },
    });
    tallyMatch(points, format, r.rates);
    r.perMatch.push(points.filter((p) => p.winner === 'player').length / points.length);
  }
  process.stderr.write('.');
  return r;
}

function paired(a: number[], base: number[]): string {
  const d = a.map((x, i) => (x - base[i]) * 100);
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
  return `${mean >= 0 ? '+' : ''}${mean.toFixed(2)} ± ${(sd / Math.sqrt(d.length)).toFixed(2)}`;
}

async function main(): Promise<void> {
  const id = IDENTITY_BUILDS[ID];
  const log = console.log;
  console.log = (): void => {};
  const base = await run(id.stats, id.profile, []);
  const rows: string[][] = [];
  const row = (label: string, r: Result): void => {
    rows.push([
      label,
      ...formatRates(r.rates),
      r === base ? '' : paired(r.perMatch, base.perMatch),
      `${((r.keyMomentsWon / r.keyMoments) * 100).toFixed(1)}%`,
      (r.keyMoments / N).toFixed(1),
    ]);
  };
  row('baseline', base);
  row('+5 focus', await run(withStat(id.stats, 'focus', 5), id.profile, []));
  for (const name of ABILITIES) {
    row(name, await run(id.stats, id.profile, [{ ...ABILITY_DEFINITIONS[name], level: LEVEL }]));
  }
  console.log = log;
  log(
    `\nmentalAbilityProbe  N=${N} ${FORMAT} live orchestrator, random key-moment picks  ` +
      `${ID} day-23 build v ${TEAM.opponent.name} (${TEAM.surface})  LEVEL=${LEVEL} KM=${KM}`,
  );
  log(['condition', ...RATE_HEADERS, 'Δpt-win (paired)', 'KM won', 'KMs/match'].join('\t'));
  for (const r of rows) log(r.join('\t'));
}

void main();
