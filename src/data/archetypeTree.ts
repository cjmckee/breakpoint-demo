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

import { EffectKey } from '../types/game.js';
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
    description: 'Swing for the fences — huge first serves that end points before they start. Sometimes, you hit the fences.',
    tradeoff: 'More aces, at the cost of missed first serves — leveling tightens it up (fewer misses).',
    tierEffects: [
      { [EffectKey.FIRST_SERVE_POWER]: 18, [EffectKey.FAULT_RISK]: 12 },
      { [EffectKey.FAULT_RISK]: -4 },
      { [EffectKey.FAULT_RISK]: -4 },
    ],
  },
  {
    id: 'fs_sniper', phase: 'first_serve', label: 'Sniper',
    description: 'Pinpoint placement over raw power — paint the lines and set up the next ball. A line cheater\'s worst nightmare.',
    tradeoff: 'Softer, well-placed serves — lands far more often, but the returner gets a look at it. Leveling lowers your fault risk even further.',
    tierEffects: [
      { [EffectKey.FAULT_RISK]: -12, [EffectKey.SERVE_PACE]: -3 },
      { [EffectKey.FAULT_RISK]: -6 },
      { [EffectKey.FAULT_RISK]: -6 },
    ],
  },
  {
    id: 'fs_curveball', phase: 'first_serve', label: 'Curveball',
    description: 'Heavy spin that jumps off the court and pulls returners out of position. Punishes players like YOU (yes, you!) who don\'t bend their knees.',
    tradeoff: 'Rarely free points, but reliable and sets up the rally — leveling lowers fault risk further and improves rally tolerance.',
    tierEffects: [
      { [EffectKey.FAULT_RISK]: -8, [EffectKey.SERVE_PACE]: -2, [EffectKey.RALLY_TOLERANCE]: 3 },
      { [EffectKey.FAULT_RISK]: -4, [EffectKey.RALLY_TOLERANCE]: 3 },
      { [EffectKey.FAULT_RISK]: -4, [EffectKey.RALLY_TOLERANCE]: 3 },
    ],
  },

  // ============================ SECOND SERVE ============================
  {
    id: 'ss_pancake', phase: 'second_serve', label: 'Pancake',
    description: 'Get it in, start the point. No heroics on the second ball. You could make this with a frying pan.',
    tradeoff: 'Almost never double-faults, but the soft ball gets attacked — leveling lowers fault risk further and improves second-serve aggression.',
    tierEffects: [
      { [EffectKey.FAULT_RISK]: -14, [EffectKey.SERVE_PACE]: -4, [EffectKey.SECOND_SERVE_AGGRESSION]: -8 },
      { [EffectKey.FAULT_RISK]: -4, [EffectKey.SECOND_SERVE_AGGRESSION]: 3 },
      { [EffectKey.FAULT_RISK]: -4, [EffectKey.SERVE_PACE]: 2, [EffectKey.SECOND_SERVE_AGGRESSION]: 3 },
    ],
  },
  {
    id: 'ss_kicker', phase: 'second_serve', label: 'Kicker',
    description: 'A high, heavy kick with some aggression that pushes the returner back. One-handed backhands hate this guy.',
    tradeoff: 'Balanced — some bite without much double-fault risk. Leveling improves second-serve aggression further.',
    tierEffects: [
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 5 },
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 4 },
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 4 },
    ],
  },
  {
    id: 'ss_gambler', phase: 'second_serve', label: 'Gambler',
    description: 'You basically have two first serves. Go after the second ball just as hard. You miss the court sometimes.',
    tradeoff: 'Steals free points but double-faults are more common — leveling reins in the mistakes.',
    tierEffects: [
      { [EffectKey.SECOND_SERVE_AGGRESSION]: 16, [EffectKey.FAULT_RISK]: 14 },
      { [EffectKey.FAULT_RISK]: -5 },
      { [EffectKey.FAULT_RISK]: -5 },
    ],
  },

  // ============================ RETURN ============================
  {
    id: 'rt_extinguisher', phase: 'return', label: 'Extinguisher',
    description: 'Block it back deep, take the server out of their rhythm, and reset to neutral. Don\'t let your opponent get hot.',
    tradeoff: 'Rarely misses but hands over the initiative — leveling lets you neutralize less passively.',
    tierEffects: [
      { [EffectKey.RETURN_AGGRESSION]: -10, [EffectKey.RALLY_TOLERANCE]: 6 },
      { [EffectKey.RETURN_AGGRESSION]: 3 },
      { [EffectKey.RETURN_AGGRESSION]: 3 },
    ],
  },
  {
    id: 'rt_redliner', phase: 'return', label: 'Redliner',
    description: 'Turn the return into an attack by taking a huge swing. You only know one speed. Sometimes you even close your eyes to swing.',
    tradeoff: 'Steals points and applies pressure, but sprays errors — leveling tightens the aggressive return (less boom-or-bust).',
    tierEffects: [
      { [EffectKey.RETURN_AGGRESSION]: 16, [EffectKey.WINNER_BIAS]: 4, [EffectKey.POWER_VARIANCE]: 12 },
      { [EffectKey.POWER_VARIANCE]: -5 },
      { [EffectKey.POWER_VARIANCE]: -4 },
    ],
  },
  {
    id: 'rt_sneaky_beaky', phase: 'return', label: 'Sneaky Beaky',
    description: 'Find ways to take time from the opponent. Chip the return and follow it in. By the time they look up, you\'re at the net again.',
    tradeoff: 'Gets to the net quickly but exposed to the pass — leveling sharpens your net finish.',
    tierEffects: [
      { [EffectKey.RETURN_AGGRESSION]: 6, [EffectKey.NET_APPROACH_BIAS]: 14 },
      { [EffectKey.NET_GAME]: 3 },
      { [EffectKey.NET_GAME]: 3 },
    ],
  },

  // ============================ FOREHAND ============================
  {
    id: 'fh_rpm_overdrive', phase: 'forehand', label: 'RPM Overdrive',
    description: 'High-margin, heavy shots with lots of spin that builds pressure and pushes opponents back. Some coaches would make you play lefty, too.',
    tradeoff: 'Dictates with safety and tons of spin, but fewer flat-out winners. Leveling improves both winner bias and rally tolerance further.',
    tierEffects: [
      { [EffectKey.WINNER_BIAS]: 6, [EffectKey.RALLY_TOLERANCE]: 2 },
      { [EffectKey.WINNER_BIAS]: 5, [EffectKey.RALLY_TOLERANCE]: 2 },
      { [EffectKey.WINNER_BIAS]: 5, [EffectKey.RALLY_TOLERANCE]: 2 },
    ],
  },
  {
    id: 'fh_laserbeam', phase: 'forehand', label: 'Laserbeam',
    description: 'Flat, penetrating power — first strike to take the ball early and end it. Not really sure how you make that sound with your racquet.',
    tradeoff: 'Big winners but big misses — leveling tightens the accuracy (less boom-or-bust).',
    tierEffects: [
      { [EffectKey.WINNER_BIAS]: 16, [EffectKey.POWER_VARIANCE]: 12 },
      { [EffectKey.POWER_VARIANCE]: -5 },
      { [EffectKey.POWER_VARIANCE]: -4 },
    ],
  },
  {
    id: 'fh_survivor', phase: 'forehand', label: 'Survivor',
    description: 'Rock-solid rally forehand — keep the ball deep and wait for the error. You can survive two days in the desert and still get the ball back.',
    tradeoff: 'Outlasts opponents but rarely forces it — leveling lets you maintain rallies without losing aggressiveness.',
    tierEffects: [
      { [EffectKey.RALLY_TOLERANCE]: 12, [EffectKey.WINNER_BIAS]: -6 },
      { [EffectKey.WINNER_BIAS]: 3 },
      { [EffectKey.WINNER_BIAS]: 3 },
    ],
  },

  // ============================ BACKHAND ============================
  {
    id: 'bh_bazooka', phase: 'backhand', label: 'Bazooka',
    description: 'An offensive two-hander that drives through the ball flat and hard. You swing as hard as you can and usually the point ends one way or another.',
    tradeoff: 'A weapon with no cushion — leveling tightens the drive (less boom-or-bust).',
    tierEffects: [
      { [EffectKey.WINNER_BIAS]: 12, [EffectKey.SLICE_PREFERENCE_BACKHAND]: -8, [EffectKey.POWER_VARIANCE]: 12 },
      { [EffectKey.POWER_VARIANCE]: -5 },
      { [EffectKey.POWER_VARIANCE]: -4 },
    ],
  },
  {
    id: 'bh_samurai', phase: 'backhand', label: 'Samurai',
    description: 'A low, knifing slice — change the rhythm and look for your opportunity. You\'ve spent years studying the Wilson Blade.',
    tradeoff: 'Great variety and defense, but cedes pace and offense. Leveling deepens the slice and improves rally tolerance further.',
    tierEffects: [
      { [EffectKey.SLICE_PREFERENCE_BACKHAND]: 10, [EffectKey.RALLY_TOLERANCE]: 4 },
      { [EffectKey.SLICE_PREFERENCE_BACKHAND]: 7, [EffectKey.RALLY_TOLERANCE]: 3 },
      { [EffectKey.SLICE_PREFERENCE_BACKHAND]: 7, [EffectKey.RALLY_TOLERANCE]: 3 },
    ],
  },
  {
    id: 'bh_brick_wall', phase: 'backhand', label: 'Brick Wall',
    description: 'A dependable two-hander that holds up under pressure and keeps rallies alive. Winning doesn\'t always have to be pretty.',
    tradeoff: 'Reliable, but neither a weapon nor a defensive specialty. Leveling improves rally tolerance further.',
    tierEffects: [
      { [EffectKey.RALLY_TOLERANCE]: 6 },
      { [EffectKey.RALLY_TOLERANCE]: 5 },
      { [EffectKey.RALLY_TOLERANCE]: 5 },
    ],
  },

  // ============================ NET ============================
  {
    id: 'net_downhill', phase: 'net', label: 'Downhill',
    description: 'Look to get forward at every opportunity and finish points quickly. You basically have a summer home at the net.',
    tradeoff: 'Ends points early but exposed to the pass — leveling sharpens your net finishing.',
    tierEffects: [
      { [EffectKey.NET_APPROACH_BIAS]: 16 },
      { [EffectKey.NET_GAME]: 3 },
      { [EffectKey.NET_GAME]: 3 },
    ],
  },
  {
    id: 'net_opportunist', phase: 'net', label: 'Opportunist',
    description: 'Come forward only on a genuine short ball — controlled aggression. You\'re only as good as your approach shot.',
    tradeoff: 'Balanced — picks good moments without overexposing. Leveling improves net approach frequency further.',
    tierEffects: [
      { [EffectKey.NET_APPROACH_BIAS]: 5 },
      { [EffectKey.NET_APPROACH_BIAS]: 4 },
      { [EffectKey.NET_APPROACH_BIAS]: 4 },
    ],
  },
  {
    id: 'net_apologist', phase: 'net', label: 'Apologist',
    description: 'No thanks, you\'d rather not. Live at the baseline — only approach when absolutely forced. The net is scary.',
    tradeoff: 'Safe from the back but no net threat — leveling improves rally tolerance further.',
    tierEffects: [
      { [EffectKey.NET_APPROACH_BIAS]: -8, [EffectKey.RALLY_TOLERANCE]: 4 },
      { [EffectKey.RALLY_TOLERANCE]: 3 },
      { [EffectKey.RALLY_TOLERANCE]: 3 },
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

/** Starting specialization points granted when the broad archetype is chosen. */
export const STARTING_SPECIALIZATION_POINTS = 2;

/**
 * Display labels for the player's broad archetype — the one-time identity
 * chosen at the Coach Gonzalez event. Deliberately worded to not collide with
 * any legacy PlayStyle label (see ArchetypeType in data/archetypes.ts) or any
 * PhasePathId label (e.g. the net phase's own "Net-Rusher" specialty) — this
 * is a declared direction, not a promise of an already-active playstyle.
 */
export const BROAD_ARCHETYPE_LABELS: Record<BroadArchetype, string> = {
  baseliner: 'Baseliner',
  net_rusher: 'Net Attacker',
  all_courter: 'All-Courter',
};

/**
 * Shown in place of a broad archetype label before the player has chosen one
 * (pre Coach Gonzalez event). Deliberately distinct from "All-Courter" — that's
 * a real, deliberately-chosen archetype, not a placeholder for "none yet".
 */
export const DEFAULT_ARCHETYPE_LABEL = 'Balanced';

/**
 * Resolve the chosen specialty for a phase, or null if the player hasn't spent a
 * point to specialize it. There are no automatic defaults — every specialty is an
 * opt-in bonus the player selects; unspecialized phases use baseline behavior.
 */
export function resolvePhaseSpec(
  profile: ArchetypeProfile,
  phase: GamePhase,
): PhaseSpec | null {
  return profile.phases[phase] ?? null;
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
      forehand: { path: 'fh_laserbeam', tier: 2 },
      return: { path: 'rt_redliner', tier: 1 },
      net: { path: 'net_opportunist', tier: 1 },
    },
    defensive: {
      forehand: { path: 'fh_survivor', tier: 2 },
      backhand: { path: 'bh_brick_wall', tier: 1 },
      return: { path: 'rt_extinguisher', tier: 2 },
      net: { path: 'net_apologist', tier: 1 },
    },
    counterpuncher: {
      forehand: { path: 'fh_survivor', tier: 1 },
      backhand: { path: 'bh_samurai', tier: 2 },
      return: { path: 'rt_extinguisher', tier: 2 },
      net: { path: 'net_apologist', tier: 1 },
    },
    serve_volley: {
      first_serve: { path: 'fs_bomber', tier: 2 },
      return: { path: 'rt_sneaky_beaky', tier: 1 },
      net: { path: 'net_downhill', tier: 2 },
    },
    all_court: {
      forehand: { path: 'fh_rpm_overdrive', tier: 1 },
      second_serve: { path: 'ss_kicker', tier: 1 },
      net: { path: 'net_opportunist', tier: 1 },
    },
  };

  const broadByArchetype: Record<LegacyArchetype, BroadArchetype> = {
    aggressive: 'all_courter',
    defensive: 'baseliner',
    counterpuncher: 'baseliner',
    serve_volley: 'net_downhill',
    all_court: 'all_courter',
  };

  return {
    broad: broadByArchetype[legacy],
    phases: phasesByArchetype[legacy],
    specializationPoints: 0,
    respecTokens: 0,
  };
}
