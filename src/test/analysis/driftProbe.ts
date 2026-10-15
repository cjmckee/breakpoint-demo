/**
 * Drift Probe — why do identities that are even at Club end up a world apart on
 * the Tour?
 *
 * bandCheck showed it: against the Tour roster the net rusher wins 90-100% of
 * matches and the baseliner 0-30%, at about the same OVR. This takes the mean
 * career build of each identity (careerBuilds.json) on a few days across the
 * career and asks three questions of each:
 *
 *   who   What it wins against a common opponent: the five Club team-match
 *         shapes moved to the day's mean OVR, the same for every identity. Point
 *         and match win, holds and breaks, aces and double faults, how often it
 *         reaches the net and how often it wins there. Plus head to head.
 *   swap  Where its result comes from: its own build, its stats with no
 *         specialties, its serve and return raised to the four identities'
 *         average, and its net raised the same way.
 *   paths What each specialty is worth: the build with that one path removed.
 *   stats One stat at a time set to the identities' average (STATS=), to trace a lead.
 *   curve Point-win as a stat (or stats together, CURVE=) runs from 30 to 100.
 *   value What +5 on each stat is worth to it there, in point-win, and per 10
 *         currency units at the build's prices: which stats the engine over- or
 *         under-pays as ratings climb.
 *
 * After `who` on several days, it reports whether the contests a player could be
 * shown (my serve v their return, my return v their serve) predict hold, break
 * and point-win, and whether OVR does.
 *
 * Matches share seeds by index, so two conditions meet the same luck. Specialties
 * are raised to the season's cap, and each career's abilities ride along, as in
 * bandCheck.
 *
 * Run: npx tsx src/test/analysis/driftProbe.ts
 * Env: N=150 (BO3 per cell)  DAYS=31,64,104,144  SECTIONS=who,swap,value  SEED=1
 *      BUILDS_FILE=<path> reads another careerSim BUILDS= file
 *      H2H=0 skips the head-to-head table in who
 *      IDS=bigServer,counter,netRusher,baseliner (the identities in value)
 */

import { readFileSync } from 'node:fs';
import type { PlayerStats } from '../../types';
import { PointType } from '../../types';
import type { ArchetypeProfile, SpecialtyTier } from '../../types/archetype';
import type { OpponentTier, Venue } from '../../types/game';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed, clearSeed } from '../../core/random';
import { calculateOverallRating } from '../../utils/overallRating';
import {
  createEmptyArchetypeProfile,
  maxSpecialtyTier,
  profileForArchetype,
} from '../../data/archetypeTree';
import {
  TEAM_MATCH_1,
  TEAM_MATCH_2,
  TEAM_MATCH_3,
  TEAM_MATCH_4,
  TEAM_MATCH_5,
} from '../../data/teamMatches';
import { BO3, playMatch } from './simMatch';
import { emptyRates, tallyMatch, type Rates } from './matchTally';
import { priceOf, unitsOf } from './statEconomy';
import { statOf, type StatName } from './identityBuilds';
import { SEASON_OFFSET, type CareerBuilds } from './bandSlots';

const N = Number(process.env.N ?? 150);
const SEED = Number(process.env.SEED ?? 1);
const DAYS = (process.env.DAYS ?? '31,64,104,144').split(',').map(Number);
const SECTIONS = new Set((process.env.SECTIONS ?? 'who,swap,value').split(','));

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
  readFileSync(process.env.BUILDS_FILE ?? new URL('./careerBuilds.json', import.meta.url), 'utf8'),
) as CareerBuilds;
const IDS = (process.env.IDS ?? Object.keys(builds.identities).join(',')).split(',');

interface Side {
  stats: PlayerStats;
  profile: ArchetypeProfile;
  effects?: Array<Record<string, number>>;
  venue?: Venue;
}

const tierOn = (day: number): OpponentTier =>
  day > SEASON_OFFSET[4] ? 4 : day > SEASON_OFFSET[3] ? 3 : day > SEASON_OFFSET[2] ? 2 : 1;

function raised(profile: ArchetypeProfile, cap: SpecialtyTier): ArchetypeProfile {
  return {
    ...profile,
    phases: Object.fromEntries(
      Object.entries(profile.phases).map(([phase, spec]) => [phase, { ...spec, tier: cap }]),
    ),
  };
}

function player(id: string, day: number): Side {
  const identity = builds.identities[id];
  const build = identity.days[day];
  if (!build) throw new Error(`careerBuilds.json has no day ${day}`);
  return {
    stats: build.stats,
    profile:
      day >= identity.archetypeDay
        ? raised(identity.profile, maxSpecialtyTier(tierOn(day)))
        : createEmptyArchetypeProfile(),
    effects: build.effects,
  };
}

const setStat = (s: PlayerStats, k: StatName, v: number): PlayerStats => {
  const out = structuredClone(s);
  for (const group of Object.values(out) as Array<Record<string, number>>) {
    if (k in group) group[k] = Math.max(1, Math.min(100, Math.round(v)));
  }
  return out;
};

function shifted(stats: PlayerStats, offset: number): PlayerStats {
  return STATS.reduce((s, k) => setStat(s, k, statOf(stats, k) + offset), stats);
}

/** The five Club team-match shapes at `ovr`, with the tier's specialties: everyone's opponent. */
function reference(tier: OpponentTier, ovr: number): Side[] {
  return [TEAM_MATCH_1, TEAM_MATCH_2, TEAM_MATCH_3, TEAM_MATCH_4, TEAM_MATCH_5].map((t) => ({
    stats: shifted(t.opponent.stats, ovr - calculateOverallRating(t.opponent.stats)),
    profile: profileForArchetype(t.opponent.archetype, tier),
    venue: t.venue,
  }));
}

interface Tally {
  rates: Rates;
  aces: number;
  doubleFaults: number;
  servePoints: number;
  netPoints: number;
  netWon: number;
  /** Points that reached a rally (five shots or more), and how many of those the player won. */
  rallies: number;
  ralliesWon: number;
  /** Point-win share of each match, by index, for paired differences. */
  shares: number[];
}

function play(me: Side, them: Side[]): Tally {
  const t: Tally = {
    rates: emptyRates(),
    aces: 0,
    doubleFaults: 0,
    servePoints: 0,
    netPoints: 0,
    netWon: 0,
    rallies: 0,
    ralliesWon: 0,
    shares: [],
  };
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const o = them[i % them.length];
    const { points } = playMatch(
      new PlayerProfile('p', 'P', me.stats, me.profile),
      new PlayerProfile('o', 'O', o.stats, o.profile),
      {
        format: BO3,
        venue: o.venue,
        playerEffects: me.effects?.[i % me.effects.length],
        opponentEffects: o.effects?.[i % o.effects.length],
        initialServer: i % 2 === 0 ? 'player' : 'opponent',
      },
    );
    tallyMatch(points, BO3, t.rates);
    let won = 0;
    for (const pt of points) {
      const role = pt.server === 'player' ? 'server' : 'returner';
      if (pt.winner === 'player') won++;
      if (pt.server === 'player') {
        t.servePoints++;
        if (pt.pointType === PointType.ACE) t.aces++;
        if (pt.pointType === PointType.DOUBLE_FAULT) t.doubleFaults++;
      }
      if (pt.shots.length >= 5) {
        t.rallies++;
        if (pt.winner === 'player') t.ralliesWon++;
      }
      if (pt.shots.some((s) => s.shooter === role && s.context.courtPosition === 'net')) {
        t.netPoints++;
        if (pt.winner === 'player') t.netWon++;
      }
    }
    t.shares.push(won / points.length);
  }
  return t;
}

const pct = (a: number, b: number): string => (b ? ((a / b) * 100).toFixed(1) : '-');
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Mean paired difference in point-win, in points per 100, ± one standard error. */
function paired(a: number[], base: number[]): { d: number; se: number } {
  const d = a.map((x, i) => (x - base[i]) * 100);
  const m = mean(d);
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1));
  return { d: m, se: sd / Math.sqrt(d.length) };
}
const fmt = ({ d, se }: { d: number; se: number }): string =>
  `${d >= 0 ? '+' : ''}${d.toFixed(1)}±${se.toFixed(1)}`;

function quietly<T>(fn: () => T): T {
  const log = console.log;
  console.log = (): void => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

function buildsTable(day: number): void {
  console.log(`\n── day ${day} (tier ${tierOn(day)}): the builds ──`);
  console.log(['identity', 'OVR', ...STATS.map((k) => k.slice(0, 5))].join('\t'));
  for (const id of Object.keys(builds.identities)) {
    const s = builds.identities[id].days[day].stats;
    console.log([id, calculateOverallRating(s), ...STATS.map((k) => statOf(s, k))].join('\t'));
  }
}

/** Per identity per day from `who`: the contest gaps, OVR against the field, and results. */
interface WhoRow {
  serveGap: number;
  returnGap: number;
  ovrGap: number;
  hold: number;
  brk: number;
  pointWin: number;
}
const whoRows: WhoRow[] = [];

const meanOf = (sides: Side[], f: (p: PlayerProfile) => number): number =>
  mean(sides.map((o) => f(new PlayerProfile('o', 'O', o.stats))));

function corr(x: number[], y: number[]): number {
  const mx = mean(x);
  const my = mean(y);
  const n = x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0);
  const dx = Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0));
  const dy = Math.sqrt(y.reduce((a, v) => a + (v - my) ** 2, 0));
  return n / (dx * dy);
}

function who(day: number, ref: Side[]): void {
  console.log(`\n── day ${day}: against a common opponent (Club team shapes at the mean OVR) ──`);
  console.log(
    [
      'identity',
      'pt-win',
      'match',
      'hold',
      'break',
      'aces',
      'DFs',
      'net pts',
      'net won',
      'rallies',
      'rally won',
    ].join('\t'),
  );
  const ids = Object.keys(builds.identities);
  const fieldOvr = mean(ids.map((id) => calculateOverallRating(player(id, day).stats)));
  for (const id of ids) {
    const t = quietly(() => play(player(id, day), ref));
    const r = t.rates;
    const me = new PlayerProfile('p', 'P', player(id, day).stats);
    whoRows.push({
      serveGap: me.getStatForShot('serve_first') - meanOf(ref, (o) => o.getReturnComposite()),
      returnGap: me.getReturnComposite() - meanOf(ref, (o) => o.getStatForShot('serve_first')),
      ovrGap: calculateOverallRating(me.stats) - fieldOvr,
      hold: r.holds / r.serviceGames,
      brk: r.breaks / r.returnGames,
      pointWin: r.pointsWon / r.points,
    });
    console.log(
      [
        id,
        pct(r.pointsWon, r.points),
        pct(r.matchesWon, r.matches),
        pct(r.holds, r.serviceGames),
        pct(r.breaks, r.returnGames),
        pct(t.aces, t.servePoints),
        pct(t.doubleFaults, t.servePoints),
        pct(t.netPoints, r.points),
        pct(t.netWon, t.netPoints),
        pct(t.rallies, r.points),
        pct(t.ralliesWon, t.rallies),
      ].join('\t'),
    );
  }
  if (process.env.H2H === '0') return;
  console.log('\nhead to head, point-win % of the row identity');
  console.log(['row \\ col', ...ids].join('\t'));
  for (const a of ids) {
    const cells = ids.map((b) =>
      a === b
        ? '-'
        : pct(
            ...quietly(() => {
              const r = play(player(a, day), [player(b, day)]).rates;
              return [r.pointsWon, r.points] as const;
            }),
          ),
    );
    console.log([a, ...cells].join('\t'));
  }
}

function swap(day: number, ref: Side[]): void {
  const ids = Object.keys(builds.identities);
  const avg = (k: StatName): number =>
    mean(ids.map((id) => statOf(builds.identities[id].days[day].stats, k)));
  console.log(
    `\n── day ${day}: where the result comes from (point-win change v own build, v the common opponent) ──`,
  );
  console.log(
    `serve/return/net averaged over the four: ${avg('serve').toFixed(0)}/${avg('return').toFixed(0)}/${avg('net').toFixed(0)}`,
  );
  console.log(
    ['identity', 'own', 'no specialties', 'avg serve+return', 'avg net', 'avg S+R+net'].join('\t'),
  );
  for (const id of ids) {
    const me = player(id, day);
    const own = quietly(() => play(me, ref));
    const variant = (stats: PlayerStats, profile = me.profile): string => {
      const t = quietly(() => play({ ...me, stats, profile }, ref));
      const ovr = calculateOverallRating(stats) - calculateOverallRating(me.stats);
      return `${fmt(paired(t.shares, own.shares))} (OVR ${ovr >= 0 ? '+' : ''}${ovr})`;
    };
    const sr = setStat(setStat(me.stats, 'serve', avg('serve')), 'return', avg('return'));
    console.log(
      [
        id,
        pct(own.rates.pointsWon, own.rates.points),
        variant(me.stats, createEmptyArchetypeProfile()),
        variant(sr),
        variant(setStat(me.stats, 'net', avg('net'))),
        variant(setStat(sr, 'net', avg('net'))),
      ].join('\t'),
    );
  }
}

/**
 * STATS=a,b,c: each stat in turn set to the four identities' average, one column
 * per stat, so a lead can be traced to the stats behind it.
 */
function statSwap(day: number, ref: Side[]): void {
  const ids = Object.keys(builds.identities);
  const stats = (process.env.STATS ?? 'serve,return,speed,anticipation,tactics,net').split(
    ',',
  ) as StatName[];
  const avg = (k: StatName): number =>
    mean(ids.map((id) => statOf(builds.identities[id].days[day].stats, k)));
  console.log(
    `\n── day ${day}: one stat set to the four identities' average (point-win change v own build) ──`,
  );
  console.log(['identity', 'own', ...stats.map((k) => `${k} → ${avg(k).toFixed(0)}`)].join('\t'));
  for (const id of IDS) {
    const me = player(id, day);
    const own = quietly(() => play(me, ref));
    const cells = stats.map((k) => {
      const t = quietly(() => play({ ...me, stats: setStat(me.stats, k, avg(k)) }, ref));
      return `${fmt(paired(t.shares, own.shares))} (${statOf(me.stats, k)})`;
    });
    console.log([id, pct(own.rates.pointsWon, own.rates.points), ...cells].join('\t'));
  }
}

function paths(day: number, ref: Side[]): void {
  console.log(
    `\n── day ${day}: each specialty's share (point-win lost when that one path is removed) ──`,
  );
  for (const id of Object.keys(builds.identities)) {
    const me = player(id, day);
    const own = quietly(() => play(me, ref));
    const cells = Object.entries(me.profile.phases).map(([phase, spec]) => {
      const phases = { ...me.profile.phases };
      delete phases[phase as keyof typeof phases];
      const t = quietly(() => play({ ...me, profile: { ...me.profile, phases } }, ref));
      return `${spec.path} ${fmt(paired(t.shares, own.shares))}`;
    });
    console.log([id, ...cells].join('\t'));
  }
}

function value(day: number, ref: Side[]): void {
  console.log(
    `\n── day ${day}: what +5 on each stat is worth (point-win change; per 10 units at the build's prices) ──`,
  );
  console.log(['stat', ...IDS.flatMap((id) => [`${id} +5`, 'at', '/10u'])].join('\t'));
  const base = Object.fromEntries(IDS.map((id) => [id, quietly(() => play(player(id, day), ref))]));
  for (const k of STATS) {
    const cells = IDS.flatMap((id) => {
      const me = player(id, day);
      const from = statOf(me.stats, k);
      if (from + 5 > 100) return ['maxed', String(from), ''];
      const t = quietly(() => play({ ...me, stats: setStat(me.stats, k, from + 5) }, ref));
      const p = paired(t.shares, base[id].shares);
      let units = 0;
      for (let v = from; v < from + 5; v++) units += unitsOf(priceOf(k, v));
      return [fmt(p), String(from), ((p.d / units) * 10).toFixed(2)];
    });
    console.log([k, ...cells].join('\t'));
  }
}

/**
 * Do the contests a player can see predict the match? Across every identity and
 * day `who` ran: the serve gap (my first-serve composite − their return
 * composite) against hold %, the return gap against break %, and OVR against the
 * field's against point-win.
 */
function contestReport(): void {
  if (whoRows.length < 3) return;
  const col = (f: (r: WhoRow) => number): number[] => whoRows.map(f);
  console.log(
    `\n── do the visible contests predict the match? (${whoRows.length} identity-days) ──`,
  );
  console.log(
    `r(serve gap, hold %)      ${corr(
      col((r) => r.serveGap),
      col((r) => r.hold),
    ).toFixed(2)}`,
  );
  console.log(
    `r(return gap, break %)    ${corr(
      col((r) => r.returnGap),
      col((r) => r.brk),
    ).toFixed(2)}`,
  );
  console.log(
    `r(serve+return gap, point-win) ${corr(
      col((r) => r.serveGap + r.returnGap),
      col((r) => r.pointWin),
    ).toFixed(2)}`,
  );
  console.log(
    `r(OVR v field, point-win)  ${corr(
      col((r) => r.ovrGap),
      col((r) => r.pointWin),
    ).toFixed(2)}`,
  );
}

/**
 * CURVE=forehand+backhand (stats set together; several curves comma-separated):
 * point-win as those stats run from 30 to 100 on each identity in IDS.
 */
function curve(day: number, ref: Side[]): void {
  for (const group of (process.env.CURVE ?? 'forehand+backhand,serve,speed').split(',')) {
    const stats = group.split('+') as StatName[];
    console.log(`\n── day ${day}: point-win as ${group} runs from 30 to 100 ──`);
    console.log(['identity', ...[30, 40, 50, 60, 70, 80, 90, 100].map(String)].join('\t'));
    for (const id of IDS) {
      const me = player(id, day);
      const cells = [30, 40, 50, 60, 70, 80, 90, 100].map((v) => {
        const t = quietly(() =>
          play({ ...me, stats: stats.reduce((s, k) => setStat(s, k, v), me.stats) }, ref),
        );
        return pct(t.rates.pointsWon, t.rates.points);
      });
      console.log([id, ...cells].join('\t'));
    }
  }
}

function main(): void {
  console.log(`driftProbe  N=${N} BO3 per cell, SEED=${SEED}  builds: ${builds.generated}`);
  for (const day of DAYS) {
    const ovr = Math.round(
      mean(Object.values(builds.identities).map((i) => calculateOverallRating(i.days[day].stats))),
    );
    const ref = reference(tierOn(day), ovr);
    buildsTable(day);
    if (SECTIONS.has('who')) who(day, ref);
    if (SECTIONS.has('swap')) swap(day, ref);
    if (SECTIONS.has('paths')) paths(day, ref);
    if (SECTIONS.has('stats')) statSwap(day, ref);
    if (SECTIONS.has('value')) value(day, ref);
    if (SECTIONS.has('curve')) curve(day, ref);
  }
  if (SECTIONS.has('who')) contestReport();
  clearSeed();
}

main();
