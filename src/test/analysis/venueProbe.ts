/**
 * Venue Probe — how much does each venue condition move a match, and for whom?
 *
 * A venue's conditions hit both players, so a condition's net effect is about
 * who it favours: thin air that speeds serves up should help the big server
 * more than the counterpuncher who has to return them. This is the table an
 * author reads before giving a venue a condition: which identities it tilts
 * towards, and by how much.
 *
 * Each of the four day-23 career identities (identityBuilds.ts) plays N best of
 * threes against team match 3's opponent (Martia Estrella, the day-23 team
 * match) on a plain hard court, then again under each condition, with the same
 * seed per match index (core/random), so a condition and the calm court share
 * their luck until the condition changes something. Reported: the change in
 * point-win %, points ± one standard error of the paired difference. For scale,
 * +5 to a useful stat is worth about +1 point-win (simulation-findings.md §5).
 *
 * Run: npx tsx src/test/analysis/venueProbe.ts
 * Env: N=300 (matches per cell)  SEED=1
 */

import type { HomeSide, Venue, VenueConditions } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed } from '../../core/random';
import { profileForArchetype } from '../../data/archetypeTree';
import { TEAM_MATCH_3 } from '../../data/teamMatches';
import { IDENTITY_BUILDS } from './identityBuilds';
import { playMatch, BO3 } from './simMatch';

const N = Number(process.env.N ?? 300);
const SEED = Number(process.env.SEED ?? 1);

interface Condition {
  label: string;
  conditions: VenueConditions;
  home?: HomeSide;
}

const CONDITIONS: Condition[] = [
  { label: 'fault_risk +20 (not wind)', conditions: { effects: { fault_risk: 20 } } },
  { label: 'wind 10', conditions: { wind: 10 } },
  { label: 'wind 20', conditions: { wind: 20 } },
  { label: 'wind 40', conditions: { wind: 40 } },
  { label: 'gusty: power_variance +10', conditions: { effects: { power_variance: 10 } } },
  { label: 'altitude: serve_speed +5', conditions: { effects: { serve_speed: 5 } } },
  { label: 'altitude: serve_speed +15', conditions: { effects: { serve_speed: 15 } } },
  { label: 'altitude: pace +5', conditions: { effects: { pace: 5 } } },
  { label: 'heat: fatigue x1.25', conditions: { fatigue: 1.25 } },
  { label: 'heat: fatigue x1.5', conditions: { fatigue: 1.5 } },
  { label: 'heatwave: fatigue x2', conditions: { fatigue: 2 } },
  { label: 'crowd x1.5, your home', conditions: { crowd: 1.5 }, home: 'player' },
  { label: 'crowd x1.5, their home', conditions: { crowd: 1.5 }, home: 'opponent' },
  { label: 'crowd x2, their home', conditions: { crowd: 2 }, home: 'opponent' },
];

const COURT: Venue = { id: 'probe', name: 'Probe Court', surface: 'hard' };

/** Point-win share of each match, by match index, at a venue. */
function pointShares(
  build: (typeof IDENTITY_BUILDS)[string],
  venue: Venue,
  home?: HomeSide,
): number[] {
  const opponent = TEAM_MATCH_3.opponent;
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const match = playMatch(
      new PlayerProfile('p', 'P', build.stats, build.profile),
      new PlayerProfile('o', 'O', opponent.stats, profileForArchetype(opponent.archetype)),
      { format: BO3, venue, home },
    );
    const won = match.points.filter((p) => p.winner === 'player').length;
    out.push(won / match.points.length);
  }
  return out;
}

function paired(a: number[], base: number[]): string {
  const d = a.map((x, i) => (x - base[i]) * 100);
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
  return `${mean >= 0 ? '+' : ''}${mean.toFixed(1)} ± ${(sd / Math.sqrt(d.length)).toFixed(1)}`;
}

function main(): void {
  const ids = Object.keys(IDENTITY_BUILDS);
  const log = console.log;
  console.log = (): void => {};
  const calm = Object.fromEntries(ids.map((id) => [id, pointShares(IDENTITY_BUILDS[id], COURT)]));
  const rows = CONDITIONS.map((c) => [
    c.label,
    ...ids.map((id) =>
      paired(
        pointShares(IDENTITY_BUILDS[id], { ...COURT, conditions: c.conditions }, c.home),
        calm[id],
      ),
    ),
  ]);
  console.log = log;

  const mean = (xs: number[]): string =>
    ((xs.reduce((s, x) => s + x, 0) / xs.length) * 100).toFixed(1);
  console.log(`venueProbe  N=${N} BO3 v ${TEAM_MATCH_3.opponent.name}, hard court, paired seeds`);
  console.log(['condition', ...ids].join('\t'));
  console.log(['calm court (point-win %)', ...ids.map((id) => mean(calm[id]))].join('\t'));
  for (const row of rows) console.log(row.join('\t'));
}

main();
