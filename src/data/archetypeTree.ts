/**
 * Archetype Tree — data definitions for the phase-based archetype system.
 *
 * Each phase offers several specialties. A specialty's behavior effects are
 * expressed purely in the archetype "behavior" EffectKey family (see EffectKey
 * in types/game.ts) and grow with tier (1-3). tierEffects[i] is the DELTA added
 * at tier i+1, so the effective value at tier T is the sum of tierEffects[0..T-1].
 *
 * Effects are intentionally NOT shot-quality keys — archetypes change WHAT a
 * player tries (ShotSelector/PointSimulator), never how well they execute.
 */

import { EffectKey } from '../types/game';
import type {
  ArchetypeProfile,
  BroadArchetype,
  GamePhase,
  PhasePathId,
  PhaseSpec,
  SpecialtyTier,
} from '../types/archetype';

export interface PhasePathDef {
  id: PhasePathId;
  phase: GamePhase;
  label: string;
  description: string;
  /** Human-readable cost/benefit shown in the tree UI. */
  tradeoff: string;
  /** Cumulative deltas per tier: [tier I, tier II, tier III]. */
  tierEffects: Record<string, number>[];
}

export const ALL_PHASES: GamePhase[] = [
  'first_serve',
  'second_serve',
  'return',
  'forehand',
  'backhand',
  'net',
];

export const PHASE_LABELS: Record<GamePhase, string> = {
  first_serve: 'First Serve',
  second_serve: 'Second Serve',
  return: 'Return',
  forehand: 'Forehand',
  backhand: 'Backhand',
  net: 'Net Play',
};

const PATHS: PhasePathDef[] = [
  // ============================ FIRST SERVE ============================
  {
    id: 'fs_bomber', phase: 'first_serve', label: 'Bomber',
    description: 'Swing for the fences — huge first serves that end points before they start.',
    tradeoff: 'More free points and aces, but a higher chance of missing the first serve.',
    tierEffects: [
      { [EffectKey.FIRST_SERVE_POWER]: 8, [EffectKey.FAULT_RISK]: 5 },
      { [EffectKey.FIRST_SERVE_POWER]: 6, [EffectKey.FAULT_RISK]: 3 },
      { [EffectKey.FIRST_SERVE_POWER]: 6, [EffectKey.FAULT_RISK]: 3 },
    ],
  },
  {
    id: 'fs_spot', phase: 'first_serve', label: 'Spot-Server',
    description: 'Pinpoint placement over raw power — paint the lines and set up the next ball.',
    tradeoff: 'Fewer outright aces, but very reliable and sets up the point.',
    tierEffects: [
      { [EffectKey.FAULT_RISK]: -4 },
      { [EffectKey.FAULT_RISK]: -3 },
      { [EffectKey.FAULT_RISK]: -3 },
    ],
  },
  {
    id: 'fs_spin', phase: 'first_serve', label: 'Spin/Kick',
    description: 'Heavy spin that jumps off the court and pulls returners out of position.',
    tradeoff: 'Rarely free points, but extremely consistent and hard to attack.',
    tierEffects: [
      { [EffectKey.FAULT_RISK]: -3, [EffectKey.RALLY_TOLERANCE]: 2 },
      { [EffectKey.FAULT_RISK]: -2, [EffectKey.RALLY_TOLERANCE]: 2 },
      { [EffectKey.FAULT_RISK]: -2, [EffectKey.RALLY_TOLERANCE]: 2 },
    ],
  },

  // ============================ SECOND SERVE ============================
  {
    id: 'ss_safe', phase: 'second_serve', label: 'Safe',
    description: 'Get it in, start the point. No heroics on the second ball.',
    tradeoff: 'Almost never double-faults, but gets attacked by aggressive returners.',
    tierEffects: [
      { [EffectKey.FAULT_RISK]: -5, [EffectKey.SECOND_SERVE_AGGRESSION]: -6 },
      { [EffectKey.FAULT_RISK]: -3, [EffectKey.SECOND_SERVE_AGGRESSION]: -3 },
      { [EffectKey.FAULT_RISK]: -3, [EffectKey.SECOND_SERVE_AGGRESSION]: -3 },
    ],
  },
  {
    id: 'ss_kicker', phase: 'second_serve', label: 'Kicker',
    description: 'A high, heavy kick that pushes the returner back and buys control.',
    tradeoff: 'Balanced — some bite without much double-fault risk.',
    tierEffects: [
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 5 },
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 4 },
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 4 },
    ],
  },
  {
    id: 'ss_gambler', phase: 'second_serve', label: 'Gambler',
    description: '"I have two first serves." Go after the second ball just as hard.',
    tradeoff: 'Steals free points, but double-faults far more often.',
    tierEffects: [
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 9, [EffectKey.FAULT_RISK]: 7 },
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 6, [EffectKey.FAULT_RISK]: 4 },
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 6, [EffectKey.FAULT_RISK]: 4 },
    ],
  },

  // ============================ RETURN ============================
  {
    id: 'rt_neutralizer', phase: 'return', label: 'Neutralizer',
    description: 'Block it back deep, take the server out of their rhythm, reset to neutral.',
    tradeoff: 'Rarely misses the return, but hands the server the initiative.',
    tierEffects: [
      { [EffectKey.RETURN_AGGRESSION]: -6, [EffectKey.RALLY_TOLERANCE]: 4 },
      { [EffectKey.RETURN_AGGRESSION]: -3, [EffectKey.RALLY_TOLERANCE]: 3 },
      { [EffectKey.RETURN_AGGRESSION]: -3, [EffectKey.RALLY_TOLERANCE]: 3 },
    ],
  },
  {
    id: 'rt_aggressor', phase: 'return', label: 'Aggressor',
    description: 'Step in and take time away — turn the return into an attack.',
    tradeoff: 'Steals points off the return, but misses more.',
    tierEffects: [
      { [EffectKey.RETURN_AGGRESSION]: 8, [EffectKey.WINNER_BIAS]: 3 },
      { [EffectKey.RETURN_AGGRESSION]: 6, [EffectKey.WINNER_BIAS]: 2 },
      { [EffectKey.RETURN_AGGRESSION]: 6, [EffectKey.WINNER_BIAS]: 2 },
    ],
  },
  {
    id: 'rt_chip_charge', phase: 'return', label: 'Chip & Charge',
    description: 'Chip the return and follow it in, pressuring with the net.',
    tradeoff: 'Suffocating when it works, but exposed to the pass.',
    tierEffects: [
      { [EffectKey.RETURN_AGGRESSION]: 4, [EffectKey.NET_APPROACH_BIAS]: 8 },
      { [EffectKey.RETURN_AGGRESSION]: 3, [EffectKey.NET_APPROACH_BIAS]: 6 },
      { [EffectKey.RETURN_AGGRESSION]: 3, [EffectKey.NET_APPROACH_BIAS]: 6 },
    ],
  },

  // ============================ FOREHAND ============================
  {
    id: 'fh_heavy_topspin', phase: 'forehand', label: 'Heavy Topspin',
    description: 'High-margin, heavy topspin that builds pressure and pushes opponents back.',
    tradeoff: 'Dictates with safety, fewer flat-out winners.',
    tierEffects: [
      { [EffectKey.WINNER_BIAS]: 6, [EffectKey.RALLY_TOLERANCE]: 2 },
      { [EffectKey.WINNER_BIAS]: 5, [EffectKey.RALLY_TOLERANCE]: 2 },
      { [EffectKey.WINNER_BIAS]: 5, [EffectKey.RALLY_TOLERANCE]: 2 },
    ],
  },
  {
    id: 'fh_flat', phase: 'forehand', label: 'Flat Ball-Striker',
    description: 'Flat, penetrating power — first strike to take the ball early and end it.',
    tradeoff: 'More winners, but also more unforced errors.',
    tierEffects: [
      { [EffectKey.WINNER_BIAS]: 10 },
      { [EffectKey.WINNER_BIAS]: 7 },
      { [EffectKey.WINNER_BIAS]: 7 },
    ],
  },
  {
    id: 'fh_steady', phase: 'forehand', label: 'Steady',
    description: 'Rock-solid rally forehand — keep the ball deep and wait for the error.',
    tradeoff: 'Outlasts opponents, but rarely forces the issue.',
    tierEffects: [
      { [EffectKey.RALLY_TOLERANCE]: 8, [EffectKey.WINNER_BIAS]: -3 },
      { [EffectKey.RALLY_TOLERANCE]: 6, [EffectKey.WINNER_BIAS]: -2 },
      { [EffectKey.RALLY_TOLERANCE]: 6, [EffectKey.WINNER_BIAS]: -2 },
    ],
  },

  // ============================ BACKHAND ============================
  {
    id: 'bh_two_hand_driver', phase: 'backhand', label: 'Two-Hand Driver',
    description: 'An offensive two-hander that drives through the ball flat and hard.',
    tradeoff: 'A genuine weapon, but little variety or defensive cushion.',
    tierEffects: [
      { [EffectKey.WINNER_BIAS]: 6, [EffectKey.SLICE_PREFERENCE_BACKHAND]: -5 },
      { [EffectKey.WINNER_BIAS]: 5, [EffectKey.SLICE_PREFERENCE_BACKHAND]: -3 },
      { [EffectKey.WINNER_BIAS]: 5, [EffectKey.SLICE_PREFERENCE_BACKHAND]: -3 },
    ],
  },
  {
    id: 'bh_slice', phase: 'backhand', label: 'Slice / Defensive',
    description: 'A low, knifing slice — change the rhythm, stay in the point, frustrate.',
    tradeoff: 'Great variety and defense, but cedes pace and offense.',
    tierEffects: [
      { [EffectKey.SLICE_PREFERENCE_BACKHAND]: 10, [EffectKey.RALLY_TOLERANCE]: 4 },
      { [EffectKey.SLICE_PREFERENCE_BACKHAND]: 7, [EffectKey.RALLY_TOLERANCE]: 3 },
      { [EffectKey.SLICE_PREFERENCE_BACKHAND]: 7, [EffectKey.RALLY_TOLERANCE]: 3 },
    ],
  },
  {
    id: 'bh_steady', phase: 'backhand', label: 'Steady',
    description: 'A dependable two-hander that holds up under pressure and keeps rallies alive.',
    tradeoff: 'Reliable, but neither a weapon nor a defensive specialty.',
    tierEffects: [
      { [EffectKey.RALLY_TOLERANCE]: 6 },
      { [EffectKey.RALLY_TOLERANCE]: 5 },
      { [EffectKey.RALLY_TOLERANCE]: 5 },
    ],
  },

  // ============================ NET ============================
  {
    id: 'net_rusher', phase: 'net', label: 'Net-Rusher',
    description: 'Look to get forward at every opportunity and finish at the net.',
    tradeoff: 'Ends points early, but is exposed to passing shots and lobs.',
    tierEffects: [
      { [EffectKey.NET_APPROACH_BIAS]: 10 },
      { [EffectKey.NET_APPROACH_BIAS]: 8 },
      { [EffectKey.NET_APPROACH_BIAS]: 8 },
    ],
  },
  {
    id: 'net_opportunist', phase: 'net', label: 'Opportunist',
    description: 'Come forward only on a genuine short ball — controlled aggression.',
    tradeoff: 'Balanced — picks good moments without overexposing.',
    tierEffects: [
      { [EffectKey.NET_APPROACH_BIAS]: 5 },
      { [EffectKey.NET_APPROACH_BIAS]: 4 },
      { [EffectKey.NET_APPROACH_BIAS]: 4 },
    ],
  },
  {
    id: 'net_backcourt', phase: 'net', label: 'Backcourt',
    description: 'Live at the baseline — only approach when absolutely forced.',
    tradeoff: 'Safe and solid from the back, but never pressures with the net.',
    tierEffects: [
      { [EffectKey.NET_APPROACH_BIAS]: -6 },
      { [EffectKey.NET_APPROACH_BIAS]: -3 },
      { [EffectKey.NET_APPROACH_BIAS]: -3 },
    ],
  },
];

/** Lookup of every path by id. */
export const PATH_DEFS: Record<PhasePathId, PhasePathDef> = PATHS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<PhasePathId, PhasePathDef>,
);

/** Paths grouped by phase, for the tree UI. */
export const PATHS_BY_PHASE: Record<GamePhase, PhasePathDef[]> = ALL_PHASES.reduce(
  (acc, phase) => {
    acc[phase] = PATHS.filter((p) => p.phase === phase);
    return acc;
  },
  {} as Record<GamePhase, PhasePathDef[]>,
);

/**
 * Default specialty per phase for each broad archetype. Used for any phase the
 * player has not manually specialized, so a profile is always fully playable.
 */
export const BROAD_DEFAULTS: Record<BroadArchetype, Partial<Record<GamePhase, PhasePathId>>> = {
  baseliner: {
    forehand: 'fh_heavy_topspin',
    backhand: 'bh_steady',
    return: 'rt_neutralizer',
    net: 'net_backcourt',
  },
  net_rusher: {
    first_serve: 'fs_bomber',
    return: 'rt_chip_charge',
    net: 'net_rusher',
  },
  all_courter: {
    forehand: 'fh_heavy_topspin',
    second_serve: 'ss_kicker',
    net: 'net_opportunist',
  },
};

/** Starting specialization points granted when the broad archetype is chosen. */
export const STARTING_SPECIALIZATION_POINTS = 2;

/**
 * Resolve the effective specialty for a phase: the player's manual pick if set,
 * otherwise the broad archetype's default (at tier 1), otherwise null.
 */
export function resolvePhaseSpec(
  profile: ArchetypeProfile,
  phase: GamePhase,
): PhaseSpec | null {
  const chosen = profile.phases[phase];
  if (chosen) return chosen;

  if (profile.broad) {
    const defaultPath = BROAD_DEFAULTS[profile.broad][phase];
    if (defaultPath) return { path: defaultPath, tier: 1 };
  }
  return null;
}

/** Sum a specialty's cumulative tier effects up to (and including) its tier. */
export function getSpecialtyEffects(path: PhasePathId, tier: SpecialtyTier): Record<string, number> {
  const def = PATH_DEFS[path];
  const result: Record<string, number> = {};
  for (let i = 0; i < tier && i < def.tierEffects.length; i++) {
    for (const [key, value] of Object.entries(def.tierEffects[i])) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

/**
 * Aggregate all behavior effects from an archetype profile (across every phase,
 * including broad-archetype defaults).
 */
export function aggregateArchetypeEffects(profile: ArchetypeProfile): Record<string, number> {
  const effects: Record<string, number> = {};
  for (const phase of ALL_PHASES) {
    const spec = resolvePhaseSpec(profile, phase);
    if (!spec) continue;
    for (const [key, value] of Object.entries(getSpecialtyEffects(spec.path, spec.tier))) {
      effects[key] = (effects[key] ?? 0) + value;
    }
  }
  return effects;
}

/** A blank profile for a brand-new player (broad chosen later via the coach event). */
export function createEmptyArchetypeProfile(): ArchetypeProfile {
  return { broad: null, phases: {}, specializationPoints: 0, respecTokens: 0 };
}

/** The five legacy archetype labels still used to author opponents and counters. */
export type LegacyArchetype =
  | 'aggressive'
  | 'defensive'
  | 'counterpuncher'
  | 'serve_volley'
  | 'all_court';

/**
 * Build a full archetype profile from a legacy archetype label. Opponents (and
 * any code that only knows the coarse archetype) use this so they play with a
 * coherent, authored phase identity rather than a stat-derived one.
 */
export function profileForArchetype(legacy: LegacyArchetype): ArchetypeProfile {
  const phasesByArchetype: Record<LegacyArchetype, Partial<Record<GamePhase, PhaseSpec>>> = {
    aggressive: {
      first_serve: { path: 'fs_bomber', tier: 2 },
      forehand: { path: 'fh_flat', tier: 2 },
      return: { path: 'rt_aggressor', tier: 1 },
      net: { path: 'net_opportunist', tier: 1 },
    },
    defensive: {
      forehand: { path: 'fh_steady', tier: 2 },
      backhand: { path: 'bh_steady', tier: 1 },
      return: { path: 'rt_neutralizer', tier: 2 },
      net: { path: 'net_backcourt', tier: 1 },
    },
    counterpuncher: {
      forehand: { path: 'fh_steady', tier: 1 },
      backhand: { path: 'bh_slice', tier: 2 },
      return: { path: 'rt_neutralizer', tier: 2 },
      net: { path: 'net_backcourt', tier: 1 },
    },
    serve_volley: {
      first_serve: { path: 'fs_bomber', tier: 2 },
      return: { path: 'rt_chip_charge', tier: 1 },
      net: { path: 'net_rusher', tier: 2 },
    },
    all_court: {
      forehand: { path: 'fh_heavy_topspin', tier: 1 },
      second_serve: { path: 'ss_kicker', tier: 1 },
      net: { path: 'net_opportunist', tier: 1 },
    },
  };

  const broadByArchetype: Record<LegacyArchetype, BroadArchetype> = {
    aggressive: 'all_courter',
    defensive: 'baseliner',
    counterpuncher: 'baseliner',
    serve_volley: 'net_rusher',
    all_court: 'all_courter',
  };

  return {
    broad: broadByArchetype[legacy],
    phases: phasesByArchetype[legacy],
    specializationPoints: 0,
    respecTokens: 0,
  };
}
