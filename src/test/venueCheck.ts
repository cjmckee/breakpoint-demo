/**
 * Venue check — do a venue's conditions reach the match, for both players?
 *
 * A venue is a surface plus conditions: effects both players feel, a fatigue
 * rate, and a crowd that backs the home side. They are applied inside the match
 * engines (core/venue.ts), and the failure worth guarding is a quiet one: a
 * condition that reaches only the player (the way the live match reads its
 * momentum and fatigue ability keys) would make every windy court a handicap
 * for the opponent, and nothing on screen would say so.
 *
 * So this checks that:
 *   - a venue with no conditions plays exactly like its bare surface;
 *   - the registry is consistent, and every team match and tournament names one;
 *   - a crowd scales the home side's momentum and no one else's;
 *   - wind (as fault risk) and heat (as fatigue) cost both players.
 *
 * The last two compare many seeded matches, so they test direction, not size.
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/venueCheck.ts
 */

import type { PlayerStats } from '../types';
import type { HomeSide, Venue } from '../types/game';
import type { MatchStatistics } from '../types';
import { MatchSimulator } from '../core/MatchSimulator';
import { MatchOrchestrator } from '../game/MatchOrchestrator';
import { MomentumEngine } from '../core/MomentumEngine';
import { PlayerProfile } from '../core/PlayerProfile';
import { setSeed, clearSeed } from '../core/random';
import { getVenue, VENUES } from '../data/venues';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../data/teamMatches';
import { TournamentRegistry } from '../data/tournaments';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

function uniform(value: number): PlayerStats {
  return {
    core: { serve: value, forehand: value, backhand: value, return: value, net: value },
    technical: { slice: value, spin: value, placement: value },
    physical: { speed: value, stamina: value, strength: value },
    mental: { focus: value, anticipation: value, tactics: value },
  };
}

const BO3 = { bestOfSets: 3, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

function simulate(seed: number, venue?: Venue, home?: HomeSide): MatchSimulator {
  setSeed(seed);
  const sim = new MatchSimulator({
    player: new PlayerProfile('p', 'P', uniform(40)),
    opponent: new PlayerProfile('o', 'O', uniform(40)),
    courtSurface: venue?.surface ?? 'clay',
    matchFormat: BO3,
    venue,
    home,
  });
  const log = console.log;
  console.log = (): void => {};
  try {
    sim.simulateMatch();
  } finally {
    console.log = log;
  }
  return sim;
}

/** Summed per-side statistics over seeded matches 1..n at a venue. */
function tally(
  n: number,
  venue?: Venue,
): {
  doubleFaults: { player: number; opponent: number };
  errors: { player: number; opponent: number };
} {
  const out = { doubleFaults: { player: 0, opponent: 0 }, errors: { player: 0, opponent: 0 } };
  for (let seed = 1; seed <= n; seed++) {
    const stats = simulate(seed, venue).getStatistics();
    out.doubleFaults.player += stats.doubleFaults.player;
    out.doubleFaults.opponent += stats.doubleFaults.opponent;
    out.errors.player += stats.unforcedErrors.player;
    out.errors.opponent += stats.unforcedErrors.opponent;
  }
  return out;
}

/** The live match, as the game plays it, with key moments off and no point delay. */
async function play(seed: number, venue?: Venue): Promise<MatchStatistics> {
  setSeed(seed);
  const orchestrator = new MatchOrchestrator();
  await orchestrator.simulateInteractiveMatch({
    playerStats: uniform(40),
    opponentStats: uniform(40),
    surface: venue?.surface ?? 'clay',
    venue,
    mood: 0,
    energy: 100,
    enableKeyMoments: false,
    matchFormat: 'best-of-3',
    pointDelayMs: 0,
  });
  const stats = orchestrator.getMatchStatistics();
  if (!stats) throw new Error('the live match kept no statistics');
  return stats;
}

const CLAY: Venue = { id: 'test_clay', name: 'Test Clay', surface: 'clay' };

console.log('── a plain venue is just its surface ──');
{
  const winners = (sim: MatchSimulator): string =>
    sim
      .exportMatchData()
      .points.map((p) => (p.winner === 'player' ? 'p' : 'o'))
      .join('');
  check(
    'the same seed plays the same match with or without a condition-free venue',
    winners(simulate(11)) === winners(simulate(11, CLAY)),
  );
}

console.log('\n── the registry ──');
{
  check(
    'every venue is filed under its own id',
    Object.entries(VENUES).every(([id, venue]) => venue.id === id),
  );
  const named = [TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5]
    .map((t) => t.venue)
    .concat(TournamentRegistry.getAllTournaments().map((t) => t.venue));
  check(
    'every team match and tournament plays at a registered venue',
    named.every((venue) => getVenue(venue.id) === venue),
    named.map((v) => v.id).join(', '),
  );
  check('a match with no venue gets none', getVenue(undefined) === undefined);
}

console.log('\n── a home crowd backs one side ──');
{
  const bump = (winner: HomeSide, crowd: { side: HomeSide; gain: number } | null): number => {
    const engine = new MomentumEngine();
    engine.reset({ player: 0, opponent: 0 }, crowd);
    engine.applyPoint({ winner, pointType: 'ace' });
    return Math.abs(engine.get());
  };
  const homeCrowd = { side: 'player' as const, gain: 1.5 };
  check(
    "the home side's point moves momentum half as far again",
    Math.abs(bump('player', homeCrowd) - 1.5 * bump('player', null)) < 1e-9,
  );
  check(
    "the visitors' point moves it as far as it would anywhere",
    bump('opponent', homeCrowd) === bump('opponent', null),
  );
}

console.log('\n── effects and heat cost both players ──');
{
  // Heat moves unforced errors by a few percent, inside the noise of 40 matches.
  const MATCHES = 150;
  const calm = tally(MATCHES, CLAY);
  const windy = tally(MATCHES, { ...CLAY, conditions: { effects: { fault_risk: 30 } } });
  check(
    'a fault-risk effect means more double faults for the player',
    windy.doubleFaults.player > calm.doubleFaults.player,
    `${calm.doubleFaults.player} → ${windy.doubleFaults.player}`,
  );
  check(
    'and for the opponent',
    windy.doubleFaults.opponent > calm.doubleFaults.opponent,
    `${calm.doubleFaults.opponent} → ${windy.doubleFaults.opponent}`,
  );

  const hot = tally(MATCHES, { ...CLAY, conditions: { fatigue: 3 } });
  check(
    'a hot court (fatigue) means more unforced errors for the player',
    hot.errors.player > calm.errors.player,
    `${calm.errors.player} → ${hot.errors.player}`,
  );
  check(
    'and for the opponent',
    hot.errors.opponent > calm.errors.opponent,
    `${calm.errors.opponent} → ${hot.errors.opponent}`,
  );
}

async function liveMatch(): Promise<void> {
  console.log('\n── the live match feels the venue on both sides too ──');
  const MATCHES = 40;
  const sum = async (venue: Venue): Promise<{ df: number[]; ue: number[] }> => {
    const out = { df: [0, 0], ue: [0, 0] };
    for (let seed = 1; seed <= MATCHES; seed++) {
      const stats = await play(seed, venue);
      out.df[0] += stats.doubleFaults.player;
      out.df[1] += stats.doubleFaults.opponent;
      out.ue[0] += stats.unforcedErrors.player;
      out.ue[1] += stats.unforcedErrors.opponent;
    }
    return out;
  };
  const log = console.log;
  console.log = (): void => {};
  const calm = await sum(CLAY);
  const windy = await sum({ ...CLAY, conditions: { effects: { fault_risk: 30 } } });
  const gusty = await sum({ ...CLAY, conditions: { wind: 30 } });
  const hot = await sum({ ...CLAY, conditions: { fatigue: 3 } });
  console.log = log;
  check(
    'a fault-risk effect: more double faults for both players',
    windy.df[0] > calm.df[0] && windy.df[1] > calm.df[1],
    `player ${calm.df[0]} → ${windy.df[0]}, opponent ${calm.df[1]} → ${windy.df[1]}`,
  );
  check(
    'wind: more double faults for both players',
    gusty.df[0] > calm.df[0] && gusty.df[1] > calm.df[1],
    `player ${calm.df[0]} → ${gusty.df[0]}, opponent ${calm.df[1]} → ${gusty.df[1]}`,
  );
  check(
    'heat: more unforced errors for both players',
    hot.ue[0] > calm.ue[0] && hot.ue[1] > calm.ue[1],
    `player ${calm.ue[0]} → ${hot.ue[0]}, opponent ${calm.ue[1]} → ${hot.ue[1]}`,
  );
}

await liveMatch();
console.log('\n── wind tests the serve: accurate and reliable servers ride it out ──');
{
  /** First serves in, as a share, over seeded matches: player's and opponent's. */
  const firstIn = (
    venue: Venue,
    player: PlayerStats,
    opponent: PlayerStats,
    playerEffects?: Record<string, number>,
  ): { player: number; opponent: number } => {
    let p = 0;
    let o = 0;
    const MATCHES = 40;
    for (let seed = 1; seed <= MATCHES; seed++) {
      setSeed(seed);
      const sim = new MatchSimulator({
        player: new PlayerProfile('p', 'P', player),
        opponent: new PlayerProfile('o', 'O', opponent),
        courtSurface: venue.surface,
        matchFormat: BO3,
        venue,
        playerEffects,
      });
      const log = console.log;
      console.log = (): void => {};
      try {
        sim.simulateMatch();
      } finally {
        console.log = log;
      }
      const stats = sim.getStatistics();
      p += stats.firstServePercentage.player;
      o += stats.firstServePercentage.opponent;
    }
    return { player: p / MATCHES, opponent: o / MATCHES };
  };
  const windy: Venue = { ...CLAY, conditions: { wind: 30 } };

  // Same player both sides, but one serves accurately: serve, placement, focus and spin.
  const accurate = uniform(40);
  accurate.core.serve = 75;
  accurate.technical.placement = 75;
  accurate.technical.spin = 75;
  accurate.mental.focus = 75;
  const calm = firstIn(CLAY, accurate, uniform(40));
  const blown = firstIn(windy, accurate, uniform(40));
  const accurateDrop = calm.player - blown.player;
  const wildDrop = calm.opponent - blown.opponent;
  check(
    'wind costs both servers first serves',
    accurateDrop > 0 && wildDrop > 0,
    `accurate ${calm.player.toFixed(1)} → ${blown.player.toFixed(1)}, wild ${calm.opponent.toFixed(1)} → ${blown.opponent.toFixed(1)}`,
  );
  check(
    'and costs the inaccurate server more',
    wildDrop > accurateDrop,
    `accurate −${accurateDrop.toFixed(1)}, wild −${wildDrop.toFixed(1)}`,
  );

  const risky = firstIn(windy, uniform(40), uniform(40), { fault_risk: 20 });
  const riskyCalm = firstIn(CLAY, uniform(40), uniform(40), { fault_risk: 20 });
  const reliable = firstIn(windy, uniform(40), uniform(40), { fault_risk: -20 });
  const reliableCalm = firstIn(CLAY, uniform(40), uniform(40), { fault_risk: -20 });
  check(
    'a risky server (fault risk) loses more to the wind than a reliable one',
    riskyCalm.player - risky.player > reliableCalm.player - reliable.player,
    `risky −${(riskyCalm.player - risky.player).toFixed(1)}, reliable −${(reliableCalm.player - reliable.player).toFixed(1)}`,
  );
}

clearSeed();

if (failures > 0) {
  console.log(`\n❌ ${failures} venue check(s) failed`);
  process.exit(1);
}
console.log('\n✅ all venue checks passed');
