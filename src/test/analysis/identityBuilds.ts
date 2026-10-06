/**
 * The four career identities at day 23, as fixed builds for the ability probes.
 *
 * Stats are each identity's mean day-23 currency build from
 * `STATS=1 N=1 RUNS=30 DAYS=23 CHECK=23 careerSim.ts`; profiles are the tier-1
 * specialties careerSim gives them. Fixed builds take career variance out of an
 * ability measurement, so the only thing that differs between two conditions is
 * the thing under test.
 */

import type { PlayerStats } from '../../types';
import type {
  ArchetypeProfile,
  BroadArchetype,
  GamePhase,
  PhasePathId,
} from '../../types/archetype';

export type StatName =
  | keyof PlayerStats['core']
  | keyof PlayerStats['technical']
  | keyof PlayerStats['physical']
  | keyof PlayerStats['mental'];

const tier1 = (
  broad: BroadArchetype,
  paths: Partial<Record<GamePhase, PhasePathId>>,
): ArchetypeProfile => ({
  broad,
  phases: Object.fromEntries(
    Object.entries(paths).map(([phase, path]) => [phase, { path, tier: 1 }]),
  ),
  specializationPoints: 0,
  respecTokens: 0,
});

/** Stats in the order serve, forehand, backhand, return, net, slice, spin, placement,
 * speed, stamina, strength, focus, anticipation, tactics. */
const build = (v: number[]): PlayerStats => ({
  core: { serve: v[0], forehand: v[1], backhand: v[2], return: v[3], net: v[4] },
  technical: { slice: v[5], spin: v[6], placement: v[7] },
  physical: { speed: v[8], stamina: v[9], strength: v[10] },
  mental: { focus: v[11], anticipation: v[12], tactics: v[13] },
});

export interface IdentityBuild {
  stats: PlayerStats;
  profile: ArchetypeProfile;
}

export const IDENTITY_BUILDS: Record<string, IdentityBuild> = {
  bigServer: {
    stats: build([40, 41, 29, 28, 28, 29, 40, 41, 30, 31, 42, 49, 37, 29]),
    profile: tier1('all_courter', {
      first_serve: 'fs_bomber',
      second_serve: 'ss_kicker',
      forehand: 'fh_laserbeam',
      net: 'net_opportunist',
    }),
  },
  counter: {
    stats: build([28, 27, 39, 40, 28, 34, 28, 34, 40, 40, 28, 36, 43, 44]),
    profile: tier1('baseliner', {
      return: 'rt_extinguisher',
      forehand: 'fh_survivor',
      backhand: 'bh_samurai',
      net: 'net_apologist',
    }),
  },
  netRusher: {
    stats: build([40, 29, 29, 28, 42, 30, 28, 41, 41, 30, 31, 37, 46, 41]),
    profile: tier1('net_attacker', {
      net: 'net_downhill',
      first_serve: 'fs_bomber',
      return: 'rt_sneaky_beaky',
      second_serve: 'ss_kicker',
    }),
  },
  baseliner: {
    stats: build([29, 41, 41, 28, 29, 44, 40, 30, 28, 41, 40, 36, 35, 31]),
    profile: tier1('baseliner', {
      forehand: 'fh_laserbeam',
      backhand: 'bh_bazooka',
      return: 'rt_redliner',
      net: 'net_apologist',
    }),
  },
};

export const statOf = (s: PlayerStats, k: StatName): number => {
  for (const group of Object.values(s) as Array<Record<string, number>>) {
    if (k in group) return group[k];
  }
  throw new Error(`no stat ${k}`);
};

export const withStat = (s: PlayerStats, k: StatName, add: number): PlayerStats => {
  const out = structuredClone(s);
  for (const group of Object.values(out) as Array<Record<string, number>>) {
    if (k in group) group[k] = Math.min(100, group[k] + add);
  }
  return out;
};
