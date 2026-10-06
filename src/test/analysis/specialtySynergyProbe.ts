/**
 * Specialty Synergy Probe — does a specialty get better with the stat it's about?
 *
 * identityGapProbe found that three of the four career identities' specialties
 * net to about zero, and that only the net rusher's grow with the stats it buys.
 * The design wants a player who commits to an archetype — specialty and the
 * stats behind it — to win more than one who doesn't. This measures each of the
 * 18 tier-1 phase paths alone:
 *
 *   alone   = path on uniform BASE − uniform BASE
 *   backed  = path on BASE with its phase stat at HIGH − the same build without the path
 *   synergy = backed − alone
 *
 * Phase stat: serve for first/second serve, return, forehand, backhand, net.
 * Opponent: uniform BASE, no archetype, hard. Seeded per match, so each pair of
 * conditions shares its luck match by match.
 *
 * Run: npx tsx src/test/analysis/specialtySynergyProbe.ts
 * Env: N=600  BASE=35  HIGH=50  SEED=1  PHASES=first_serve,second_serve,return,forehand,backhand,net
 */

import type { PlayerStats } from '../../types';
import type { ArchetypeProfile, GamePhase, PhasePathId } from '../../types/archetype';
import { PlayerProfile } from '../../core/PlayerProfile';
import { setSeed } from '../../core/random';
import { BO3, playMatch } from './simMatch';
import { withStat, type StatName } from './identityBuilds';

const N = Number(process.env.N ?? 600);
const BASE = Number(process.env.BASE ?? 35);
const HIGH = Number(process.env.HIGH ?? 50);
const SEED = Number(process.env.SEED ?? 1);

const PATHS: Record<GamePhase, PhasePathId[]> = {
  first_serve: ['fs_bomber', 'fs_sniper', 'fs_curveball'],
  second_serve: ['ss_pancake', 'ss_kicker', 'ss_gambler'],
  return: ['rt_extinguisher', 'rt_redliner', 'rt_sneaky_beaky'],
  forehand: ['fh_rpm_overdrive', 'fh_laserbeam', 'fh_survivor'],
  backhand: ['bh_bazooka', 'bh_samurai', 'bh_brick_wall'],
  net: ['net_downhill', 'net_opportunist', 'net_apologist'],
};
const PHASE_STAT: Record<GamePhase, StatName> = {
  first_serve: 'serve',
  second_serve: 'serve',
  return: 'return',
  forehand: 'forehand',
  backhand: 'backhand',
  net: 'net',
};
const PHASES = (process.env.PHASES?.split(',') ?? Object.keys(PATHS)) as GamePhase[];

const uniform = (r: number): PlayerStats => ({
  core: { serve: r, forehand: r, backhand: r, return: r, net: r },
  technical: { slice: r, spin: r, placement: r },
  physical: { speed: r, stamina: r, strength: r },
  mental: { focus: r, anticipation: r, tactics: r },
});
const NONE: ArchetypeProfile = {
  broad: null,
  phases: {},
  specializationPoints: 0,
  respecTokens: 0,
};
const withPath = (phase: GamePhase, path: PhasePathId): ArchetypeProfile => ({
  ...NONE,
  phases: { [phase]: { path, tier: 1 } },
});

/** Per-match point-win share, seeded by match index. */
function perMatch(stats: PlayerStats, profile: ArchetypeProfile): number[] {
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    setSeed(SEED * 1_000_003 + i);
    const { points } = playMatch(
      new PlayerProfile('p', 'P', stats, profile),
      new PlayerProfile('o', 'O', uniform(BASE), NONE),
      { format: BO3, surface: 'hard', initialServer: i % 2 === 0 ? 'player' : 'opponent' },
    );
    out.push(points.filter((p) => p.winner === 'player').length / points.length);
  }
  return out;
}

/** Mean paired difference in points of %, and its standard error. */
function diff(a: number[], b: number[]): { mean: number; se: number } {
  const d = a.map((x, i) => (x - b[i]) * 100);
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
  return { mean, se: sd / Math.sqrt(d.length) };
}

const fmt = (x: { mean: number; se: number }): string =>
  `${x.mean >= 0 ? '+' : ''}${x.mean.toFixed(2)} ± ${x.se.toFixed(2)}`;

function main(): void {
  const log = console.log;
  console.log = (): void => {};
  const base = perMatch(uniform(BASE), NONE);
  const lines: string[] = [];
  for (const phase of PHASES) {
    const stat = PHASE_STAT[phase];
    const high = withStat(uniform(BASE), stat, HIGH - BASE);
    const highBase = perMatch(high, NONE);
    for (const path of PATHS[phase]) {
      const alone = diff(perMatch(uniform(BASE), withPath(phase, path)), base);
      const backed = diff(perMatch(high, withPath(phase, path)), highBase);
      const synergy = { mean: backed.mean - alone.mean, se: Math.hypot(alone.se, backed.se) };
      lines.push([phase, path, stat, fmt(alone), fmt(backed), fmt(synergy)].join('\t'));
      process.stderr.write('.');
    }
  }
  console.log = log;
  log(
    `\nspecialtySynergyProbe  N=${N} BO3  uniform ${BASE} v uniform ${BASE} (no archetype, hard); ` +
      `phase stat raised to ${HIGH} for "backed"`,
  );
  log(['phase', 'path', 'stat', 'alone', `backed (${stat(HIGH)})`, 'synergy'].join('\t'));
  for (const l of lines) log(l);
}

const stat = (v: number): string => `stat ${v}`;

main();
