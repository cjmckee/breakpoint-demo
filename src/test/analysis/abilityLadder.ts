/**
 * Ability Ladder — what is each on-court ability worth in each season, and is
 * its rarity what it's worth?
 *
 * abilityProbe prices abilities on day-23 Club builds. Rares are sold from the
 * shop's first day, and from Regional on they are what a career buys, so this
 * measures them where they are used: each identity's career build on a slot's
 * day (careerBuilds.json, as bandCheck plays it, with the career's own
 * abilities removed) against team match 3's stat shape moved to the slot's
 * target, with that season's specialties. Each ability is played alone at
 * LEVEL against the same build without it, match by match on the same seed.
 *
 * Reported: point-win gain per identity (± one standard error of the paired
 * difference), the mean, and each rarity's mean. Clutch, Mental Fortitude and
 * Iron Will act mostly through key moments and momentum, which the quick sim
 * plays only in part, so their numbers here are a floor (mentalAbilityProbe
 * plays the live engine).
 *
 * Run: npx tsx src/test/analysis/abilityLadder.ts
 * Env: N=300 (BO3 per cell)  SLOT=regional-tm3  LEVEL=1  SEED=1  ONLY=heavy_hitter,clutch
 *      With tuneRun: TUNE='…' PROBE=abilityLadder npx tsx src/test/analysis/tuneRun.ts
 */

import type { Ability } from '../../types/game';
import { ABILITY_DEFINITIONS } from '../../data/abilities';
import { ABILITY_CURRENCY } from '../../config/economy';
import { abilityEffects } from '../../core/EffectAggregator';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed, clearSeed } from '../../core/random';
import { profileForArchetype } from '../../data/archetypeTree';
import { TEAM_MATCH_3 } from '../../data/teamMatches';
import { calculateOverallRating } from '../../utils/overallRating';
import { getBandSlot, playersOn, shifted, type CareerPlayer } from './bandSlots';
import { playMatch, BO3 } from './simMatch';

const N = Number(process.env.N ?? 300);
const SEED = Number(process.env.SEED ?? 1);
const LEVEL = Number(process.env.LEVEL ?? 1);
const SLOT_ID = process.env.SLOT ?? 'regional-tm3';
const ONLY = process.env.ONLY?.split(',');
const SLOT = getBandSlot(SLOT_ID);
if (!SLOT) throw new Error(`abilityLadder: no slot "${SLOT_ID}" (bandCheck SLOTS=1 lists them)`);

const SHAPE = TEAM_MATCH_3.opponent;
const OPPONENT = new PlayerProfile(
  'o',
  'O',
  shifted(SHAPE.stats, SLOT.target - calculateOverallRating(SHAPE.stats)),
  profileForArchetype(SHAPE.archetype, SLOT.tier),
);

/** The shop's on-court abilities: everything priced in a currency. */
const ABILITIES: Ability[] = Object.values(ABILITY_DEFINITIONS).filter(
  (a) => a.name in ABILITY_CURRENCY && (!ONLY || ONLY.includes(a.name)),
);

/** Per-match point-win share against the slot's opponent, seeded by match index. */
function perMatch(player: CareerPlayer, effects: Record<string, number>): number[] {
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const { points } = playMatch(
      new PlayerProfile('p', 'P', player.stats, player.profile),
      OPPONENT,
      { format: BO3, venue: TEAM_MATCH_3.venue, playerEffects: effects },
    );
    out.push(points.filter((p) => p.winner === 'player').length / points.length);
  }
  return out;
}

function paired(a: number[], base: number[]): { mean: number; se: number } {
  const d = a.map((x, i) => (x - base[i]) * 100);
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
  return { mean, se: sd / Math.sqrt(d.length) };
}

const f = (x: number): string => `${x >= 0 ? '+' : ''}${x.toFixed(1)}`;

function main(): void {
  const players = playersOn(SLOT!);
  const log = console.log;
  console.log = (): void => {};
  const base = players.map((p) => perMatch(p, {}));
  const rows = ABILITIES.map((a) => {
    const effects = abilityEffects([{ ...a, level: LEVEL }]);
    const gains = players.map((p, i) => paired(perMatch(p, effects), base[i]));
    process.stderr.write('.');
    return { a, gains, mean: gains.reduce((s, g) => s + g.mean, 0) / gains.length };
  });
  console.log = log;
  clearSeed();

  log(
    `\nabilityLadder  N=${N} BO3, ${SLOT!.id} (OVR ${SLOT!.target}), level ${LEVEL}, ` +
      `career builds without their own abilities, paired seeds`,
  );
  log(['ability', 'rarity', ...players.map((p) => p.name), 'mean'].join('\t'));
  for (const r of rows.sort((x, y) => y.mean - x.mean)) {
    log(
      [
        r.a.name,
        r.a.rarity,
        ...r.gains.map((g) => `${f(g.mean)} ± ${g.se.toFixed(1)}`),
        f(r.mean),
      ].join('\t'),
    );
  }
  const byRarity = new Map<string, number[]>();
  for (const r of rows) byRarity.set(r.a.rarity, [...(byRarity.get(r.a.rarity) ?? []), r.mean]);
  for (const [rarity, means] of byRarity) {
    log(
      `${rarity}: mean ${f(means.reduce((s, x) => s + x, 0) / means.length)} over ${means.length}`,
    );
  }
}

main();
