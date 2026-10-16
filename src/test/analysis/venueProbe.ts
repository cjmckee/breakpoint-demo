/**
 * Venue Probe — how much does each venue condition move a match, and for whom?
 *
 * A venue's conditions hit both players, so a condition's net effect is about
 * who it favours: thin air that speeds serves up should help the big server
 * more than the counterpuncher who has to return them. This is the table an
 * author reads before giving a venue a condition: which identities it tilts
 * towards, and by how much.
 *
 * The four career identities on a slot's day (careerBuilds.json, as bandCheck
 * plays them) meet team match 3's stat shape moved to the slot's target OVR,
 * with that season's specialties, on a plain hard court, then again under each
 * condition, with the same seed per match index (core/random), so a condition
 * and the calm court share their luck until the condition changes something.
 * Reported: the change in point-win %, points ± one standard error of the
 * paired difference. For scale, +5 to a useful stat is worth about +1
 * point-win (simulation-findings.md §5).
 *
 * Conditions are worth more past Club: support stats count from the match
 * level there, so heat finds the stamina gap between two good players.
 *
 * Run: npx tsx src/test/analysis/venueProbe.ts
 * Env: N=300 (matches per cell)  SEED=1  SLOT=club-tm3 (any bandCheck slot: regional-tm3, tour-tm1…)
 */

import type { HomeSide, Venue, VenueConditions } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed } from '../../core/random';
import { profileForArchetype } from '../../data/archetypeTree';
import { TEAM_MATCH_3 } from '../../data/teamMatches';
import { calculateOverallRating } from '../../utils/overallRating';
import { getBandSlot, playersOn, shifted, type CareerPlayer } from './bandSlots';
import { playMatch, BO3 } from './simMatch';

const N = Number(process.env.N ?? 300);
const SEED = Number(process.env.SEED ?? 1);
const SLOT_ID = process.env.SLOT ?? 'club-tm3';
const SLOT = getBandSlot(SLOT_ID);
if (!SLOT) throw new Error(`venueProbe: no slot "${SLOT_ID}" (bandCheck SLOTS=1 lists them)`);

const SHAPE = TEAM_MATCH_3.opponent;
const OPPONENT = new PlayerProfile(
  'o',
  'O',
  shifted(SHAPE.stats, SLOT.target - calculateOverallRating(SHAPE.stats)),
  profileForArchetype(SHAPE.archetype, SLOT.tier),
);

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
function pointShares(player: CareerPlayer, venue: Venue, home?: HomeSide): number[] {
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const match = playMatch(new PlayerProfile('p', 'P', player.stats, player.profile), OPPONENT, {
      format: BO3,
      venue,
      home,
      playerEffects: player.effects[i % player.effects.length],
    });
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
  const players = playersOn(SLOT!);
  const log = console.log;
  console.log = (): void => {};
  const calm = players.map((p) => pointShares(p, COURT));
  const rows = CONDITIONS.map((c) => [
    c.label,
    ...players.map((p, i) =>
      paired(pointShares(p, { ...COURT, conditions: c.conditions }, c.home), calm[i]),
    ),
  ]);
  console.log = log;

  const mean = (xs: number[]): string =>
    ((xs.reduce((s, x) => s + x, 0) / xs.length) * 100).toFixed(1);
  console.log(
    `venueProbe  N=${N} BO3, ${SLOT!.id} (season day ${SLOT!.seasonDay}): ` +
      `${SHAPE.name}'s shape at OVR ${SLOT!.target}, hard court, paired seeds`,
  );
  console.log(['condition', ...players.map((p) => p.name)].join('\t'));
  console.log(['calm court (point-win %)', ...calm.map(mean)].join('\t'));
  for (const row of rows) console.log(row.join('\t'));
}

main();
