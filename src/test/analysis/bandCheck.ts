/**
 * Band Check — does an opponent play as hard as its slot in the career says?
 *
 * Every opponent fills a slot (bandSlots.ts): Regional team match 3, the Tour
 * final's second round, a season's practice roster. Each slot has a target from
 * the pacing contract (docs/proposals/mid-late-progression.md §2.2), written as a
 * reference OVR: the OVR of a Club team-match opponent's stat shape, moved up or
 * down, that the expected player on that day should face.
 *
 * OVR alone doesn't say how hard an opponent plays. Shape matters (a 90 and a 60
 * is not two 75s), and so do abilities, specialties and the court. So this plays
 * it: the mean career build of each identity on the slot's day (careerBuilds.json,
 * from careerSim BUILDS=), with specialties raised to the season's cap, plays N
 * best of threes against the opponent. Then the same builds play the five
 * reference shapes at a range of OVRs, and the opponent's **effective OVR** is
 * the reference OVR they win against as often. Matches share seeds by index, so
 * the opponent and its reference meet the same luck.
 *
 * Reported per opponent: OVR as written, effective OVR, the slot's target and a
 * verdict (within ±2 is on band). The win % per identity shows who the opponent
 * is hard for: a 20-point spread means one identity will find this match a wall.
 *
 * Add an opponent by listing it in AUTHORED with its slot id. Practice rosters
 * are checked from OPPONENTS_BY_TIER on their own.
 *
 * FIT=1 writes the stat block for you: it moves every stat of the opponent up or
 * down together until it plays on its slot's band, and prints the block to
 * paste. With SLOT=, any opponent's shape can be fitted to any slot, so a new
 * opponent can start from the nearest existing one:
 *   SLOT=regional-tm3 ONLY="marcus cole" FIT=1   (an aggressive shape, for TM3)
 *
 * Run: npx tsx src/test/analysis/bandCheck.ts
 * Env: N=40 (matches per identity per cell)  SEED=1
 *      ONLY=<text> checks only opponents or slots whose name or slot id contains it
 *      SLOT=<slot id> checks the chosen opponents as if they filled that slot
 *      FIT=1 fits each one's stat block to its slot's target and prints it
 *      SLOTS=1 lists the slot ids and targets, and exits
 */

import { readFileSync } from 'node:fs';
import type { PlayerStats } from '../../types';
import type { ArchetypeProfile, SpecialtyTier } from '../../types/archetype';
import type { Ability, HomeSide, OpponentTier, Venue } from '../../types/game';
import type { MatchOpponent } from '../../types/tournaments';
import { PlayerProfile } from '../../core/PlayerProfile';
import { abilityEffects } from '../../core/EffectAggregator';
import { setSeed, clearSeed } from '../../core/random';
import { calculateOverallRating } from '../../utils/overallRating';
import {
  createEmptyArchetypeProfile,
  maxSpecialtyTier,
  profileForArchetype,
} from '../../data/archetypeTree';
import { OPPONENTS_BY_TIER } from '../../data/opponents';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import { riversideOpen } from '../../data/tournaments/riversideOpen';
import { BO3, playMatch } from './simMatch';
import {
  BAND_SLOTS,
  SEASON_NAMES,
  careerDay,
  getBandSlot,
  type BandSlot,
  type CareerBuilds,
} from './bandSlots';

const N = Number(process.env.N ?? 40);
const SEED = Number(process.env.SEED ?? 1);
const ONLY = process.env.ONLY?.toLowerCase();
const SLOT = process.env.SLOT;
const FIT = process.env.FIT === '1';

/** Within this many points of the target, an opponent is on band. */
const TOLERANCE = 2;

interface Candidate {
  slot: string;
  opponent: Pick<MatchOpponent, 'name' | 'stats' | 'tier' | 'archetype' | 'abilities'>;
  venue?: Venue;
  home?: HomeSide;
}

const TEAM_MATCHES = [TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5];

/**
 * Authored opponents and the slot each one fills. Add new team matches,
 * tournament rounds and playoff opponents here as they are written.
 */
const AUTHORED: Candidate[] = [
  ...TEAM_MATCHES.map((t, i) => ({
    slot: `club-tm${i + 1}`,
    opponent: t.opponent,
    venue: t.venue,
    home: t.home,
  })),
  ...riversideOpen.rounds.map((r) => ({
    slot: `club-final-r${r.roundNumber}`,
    opponent: r.opponent,
    venue: riversideOpen.venue,
  })),
];

const PRACTICE: Candidate[] = ([1, 2, 3, 4] as OpponentTier[]).flatMap((tier) =>
  OPPONENTS_BY_TIER[tier].map((o) => ({ slot: `${SEASON_NAMES[tier]}-practice`, opponent: o })),
);

const builds = JSON.parse(
  readFileSync(new URL('./careerBuilds.json', import.meta.url), 'utf8'),
) as CareerBuilds;

interface Player {
  name: string;
  stats: PlayerStats;
  profile: ArchetypeProfile;
  effects: Array<Record<string, number>>;
}

/** The specialties a player of this identity has by then: raised to the season's cap. */
function raised(profile: ArchetypeProfile, cap: SpecialtyTier): ArchetypeProfile {
  return {
    ...profile,
    phases: Object.fromEntries(
      Object.entries(profile.phases).map(([phase, spec]) => [phase, { ...spec, tier: cap }]),
    ),
  };
}

function playersOn(slot: BandSlot): Player[] {
  const day = careerDay(slot);
  return Object.entries(builds.identities).map(([name, identity]) => {
    const build = identity.days[day];
    if (!build) {
      throw new Error(`careerBuilds.json has no day ${day}: regenerate it (careerSim BUILDS=)`);
    }
    return {
      name,
      stats: build.stats,
      profile:
        day >= identity.archetypeDay
          ? raised(identity.profile, maxSpecialtyTier(slot.tier))
          : createEmptyArchetypeProfile(),
      effects: build.effects,
    };
  });
}

/** Every stat moved by `offset`, clamped to 1-100. */
function shifted(stats: PlayerStats, offset: number): PlayerStats {
  const move = <T extends object>(group: T): T =>
    Object.fromEntries(
      Object.entries(group).map(([k, v]) => [
        k,
        Math.max(1, Math.min(100, Math.round(v + offset))),
      ]),
    ) as T;
  return {
    core: move(stats.core),
    technical: move(stats.technical),
    physical: move(stats.physical),
    mental: move(stats.mental),
  };
}

interface Opponent {
  stats: PlayerStats;
  profile: ArchetypeProfile;
  effects?: Record<string, number>;
  venue?: Venue;
  home?: HomeSide;
}

/** The share of N matches `player` wins against `opponentFor(i)`, seeded by match index. */
function winShare(player: Player, opponentFor: (i: number) => Opponent): number {
  let won = 0;
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const o = opponentFor(i);
    const match = playMatch(
      new PlayerProfile('p', 'P', player.stats, player.profile),
      new PlayerProfile('o', 'O', o.stats, o.profile),
      {
        format: BO3,
        venue: o.venue,
        home: o.home,
        playerEffects: player.effects[i % player.effects.length],
        opponentEffects: o.effects,
      },
    );
    if (match.winner === 'player') won++;
  }
  return won / N;
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

/** The five Club team-match shapes at `ovr`, with the slot tier's specialties and no abilities. */
function reference(tier: OpponentTier, ovr: number): (i: number) => Opponent {
  const sides = TEAM_MATCHES.map((t) => ({
    stats: shifted(t.opponent.stats, ovr - calculateOverallRating(t.opponent.stats)),
    profile: profileForArchetype(t.opponent.archetype, tier),
    venue: t.venue,
  }));
  return (i) => sides[i % sides.length];
}

const referenceCache = new Map<string, number>();

/** Mean win share of the slot's players against the reference at `ovr`. */
function referenceShare(slot: BandSlot, players: Player[], ovr: number): number {
  const key = `${careerDay(slot)}:${slot.tier}:${ovr}`;
  let share = referenceCache.get(key);
  if (share === undefined) {
    const ref = reference(slot.tier, ovr);
    share = mean(players.map((p) => winShare(p, ref)));
    referenceCache.set(key, share);
  }
  return share;
}

/**
 * The reference OVR the players beat as often as they beat the opponent: the
 * reference's win share falls as its OVR rises, so bisect for the crossing and
 * interpolate between the two whole OVRs either side of it.
 */
function effectiveOvr(slot: BandSlot, players: Player[], share: number): number {
  let lo = 5;
  let hi = 100;
  if (referenceShare(slot, players, lo) <= share) return lo;
  if (referenceShare(slot, players, hi) >= share) return hi;
  while (hi - lo > 1) {
    const mid = Math.round((lo + hi) / 2);
    if (referenceShare(slot, players, mid) >= share) lo = mid;
    else hi = mid;
  }
  const a = referenceShare(slot, players, lo);
  const b = referenceShare(slot, players, hi);
  return a === b ? lo : lo + (a - share) / (a - b);
}

function verdict(gap: number): string {
  if (Math.abs(gap) <= TOLERANCE) return 'on band';
  return gap > 0 ? `too hard (+${gap.toFixed(1)})` : `too soft (${gap.toFixed(1)})`;
}

interface Measured {
  slot: BandSlot;
  /** Win share of each identity's build against the opponent. */
  shares: number[];
  effective: number;
}

function measure(candidate: Candidate): Measured {
  const slot = getBandSlot(candidate.slot);
  if (!slot) throw new Error(`${candidate.opponent.name}: no slot "${candidate.slot}"`);
  const o = candidate.opponent;
  const players = playersOn(slot);
  const opponent: Opponent = {
    stats: o.stats,
    profile: profileForArchetype(o.archetype, o.tier),
    effects: abilityEffects(o.abilities ?? ([] as Ability[])),
    venue: candidate.venue,
    home: candidate.home,
  };
  const shares = players.map((p) => winShare(p, () => opponent));
  return { slot, shares, effective: effectiveOvr(slot, players, mean(shares)) };
}

function row(candidate: Candidate, m: Measured): string[] {
  return [
    m.slot.id,
    candidate.opponent.name,
    String(calculateOverallRating(candidate.opponent.stats)),
    m.effective.toFixed(1),
    String(m.slot.target),
    verdict(m.effective - m.slot.target),
    ...m.shares.map((s) => `${(s * 100).toFixed(0)}%`),
  ];
}

/**
 * Move the whole stat block until its effective OVR is within half a point of
 * the target. Effective OVR tracks a uniform shift closely, so a few rounds of
 * "shift by the gap" settle it; each round shifts the original block, so
 * rounding doesn't build up.
 */
function fit(candidate: Candidate): { candidate: Candidate; measured: Measured } {
  const original = candidate.opponent.stats;
  let offset = 0;
  let current = candidate;
  let measured = measure(current);
  for (
    let round = 0;
    round < 5 && Math.abs(measured.effective - measured.slot.target) > 0.5;
    round++
  ) {
    offset += measured.slot.target - measured.effective;
    current = {
      ...candidate,
      opponent: { ...candidate.opponent, stats: shifted(original, offset) },
    };
    measured = measure(current);
  }
  return { candidate: current, measured };
}

function statBlock(stats: PlayerStats): string {
  const line = (group: object): string =>
    `{ ${Object.entries(group)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')} }`;
  return [
    'stats: {',
    `  core: ${line(stats.core)},`,
    `  technical: ${line(stats.technical)},`,
    `  physical: ${line(stats.physical)},`,
    `  mental: ${line(stats.mental)},`,
    '},',
  ].join('\n');
}

function main(): void {
  if (process.env.SLOTS === '1') {
    console.log(['slot', 'season day', 'career day', 'target'].join('\t'));
    for (const s of BAND_SLOTS) {
      console.log([s.id, s.seasonDay, careerDay(s), s.target].join('\t'));
    }
    return;
  }
  const chosen = [...AUTHORED, ...PRACTICE].filter(
    (c) =>
      !ONLY || c.slot.toLowerCase().includes(ONLY) || c.opponent.name.toLowerCase().includes(ONLY),
  );
  const target = SLOT === undefined ? undefined : getBandSlot(SLOT);
  if (SLOT !== undefined && !target) throw new Error(`no slot "${SLOT}" (SLOTS=1 lists them)`);
  const candidates = target
    ? chosen.map((c) => ({
        slot: target.id,
        opponent: { ...c.opponent, tier: target.tier },
        venue: c.venue,
        home: c.home,
      }))
    : chosen;

  const log = console.log;
  console.log = (): void => {};
  const results = candidates.map((c) => (FIT ? fit(c) : { candidate: c, measured: measure(c) }));
  console.log = log;
  clearSeed();

  console.log(`bandCheck  N=${N} BO3 per identity, SEED=${SEED}  builds: ${builds.generated}`);
  console.log(
    [
      'slot',
      'opponent',
      'OVR',
      'effective',
      'target',
      'verdict',
      ...Object.keys(builds.identities).map((id) => `${id} win`),
    ].join('\t'),
  );
  for (const r of results) console.log(row(r.candidate, r.measured).join('\t'));
  if (FIT) {
    for (const r of results) {
      console.log(
        `\n// ${r.candidate.opponent.name}, fitted to ${r.measured.slot.id} ` +
          `(OVR ${calculateOverallRating(r.candidate.opponent.stats)}, ` +
          `effective ${r.measured.effective.toFixed(1)})`,
      );
      console.log(statBlock(r.candidate.opponent.stats));
    }
  }
}

main();
