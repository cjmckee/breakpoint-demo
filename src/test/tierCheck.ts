/**
 * Tier check — does each season open what it promises, for the player and the
 * opponents they meet?
 *
 * A season's systems unlock by `player.tier`, and the opponents of that season
 * have to keep up. The failures worth guarding are quiet ones: a cap that lets
 * Regional take a specialty to tier III (it used to), or an opponent profile that
 * stays at Club specialties while the player has moved on, would only show as a
 * season that feels a little too easy.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/tierCheck.ts
 */

import type { OpponentTier } from '../types/game';
import type { LegacyArchetype } from '../data/archetypeTree';
import { maxSpecialtyTier, profileForArchetype } from '../data/archetypeTree';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

const ARCHETYPES: LegacyArchetype[] = [
  'aggressive',
  'defensive',
  'counterpuncher',
  'serve_volley',
  'all_court',
];
const TIERS: OpponentTier[] = [1, 2, 3, 4];

const specialtyTiers = (archetype: LegacyArchetype, tier: OpponentTier): number[] =>
  Object.values(profileForArchetype(archetype, tier).phases).map((spec) => spec.tier);

console.log('── the player: one more specialty tier each season ──');
check(
  'Club caps at I, Regional at II, Tour and World at III',
  [1, 2, 3, 4].map(maxSpecialtyTier).join() === '1,2,3,3',
  [1, 2, 3, 4].map(maxSpecialtyTier).join(),
);

console.log('\n── the opponents keep up ──');
check(
  'Club opponents play their authored profile, as bronze was tuned',
  ARCHETYPES.every(
    (a) => JSON.stringify(profileForArchetype(a, 1)) === JSON.stringify(profileForArchetype(a)),
  ),
);
for (const tier of TIERS.slice(1)) {
  const floor = maxSpecialtyTier(tier);
  const behind = ARCHETYPES.filter((a) => specialtyTiers(a, tier).some((t) => t < floor));
  check(
    `tier ${tier} opponents play every specialty at tier ${floor} or above`,
    behind.length === 0,
    behind.join(', '),
  );
}
check(
  'a tier keeps each archetype on the same specialties, only higher',
  ARCHETYPES.every((a) =>
    TIERS.every(
      (t) =>
        Object.entries(profileForArchetype(a, t).phases)
          .map(([phase, spec]) => `${phase}:${spec.path}`)
          .join() ===
        Object.entries(profileForArchetype(a).phases)
          .map(([phase, spec]) => `${phase}:${spec.path}`)
          .join(),
    ),
  ),
);

if (failures > 0) {
  console.log(`\n❌ ${failures} tier check(s) failed`);
  process.exit(1);
}
console.log('\n✅ all tier checks passed');
