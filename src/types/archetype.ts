/**
 * Phase-Based Archetype System — type definitions
 *
 * A player's identity is composed of per-phase specialties (how they handle
 * distinct moments of a point) rather than a single stat-derived archetype.
 * Each phase holds one chosen specialty at a tier (1-3); higher tiers
 * strengthen that specialty's behavior effects.
 *
 * Archetypes drive the DECISION layer (what shot the player tries) via
 * behavior EffectKeys read by ShotSelector/PointSimulator. They are distinct
 * from abilities (which drive the EXECUTION/quality layer in ShotCalculator).
 */

/** The decision contexts a player specializes into. Baseline is folded into FH/BH. */
export type GamePhase =
  | 'first_serve'
  | 'second_serve'
  | 'return'
  | 'forehand'
  | 'backhand'
  | 'net';

/** Broad identity chosen via the Coach Gonzalez event; seeds default specialties. */
export type BroadArchetype = 'baseliner' | 'net_attacker' | 'all_courter';

/** Every selectable specialty across all phases. */
export type PhasePathId =
  // first serve
  | 'fs_bomber' | 'fs_sniper' | 'fs_curveball'
  // second serve
  | 'ss_pancake' | 'ss_kicker' | 'ss_gambler'
  // return
  | 'rt_extinguisher' | 'rt_redliner' | 'rt_sneaky_beaky'
  // forehand
  | 'fh_rpm_overdrive' | 'fh_laserbeam' | 'fh_survivor'
  // backhand
  | 'bh_bazooka' | 'bh_samurai' | 'bh_brick_wall'
  // net
  | 'net_downhill' | 'net_opportunist' | 'net_apologist';

export type SpecialtyTier = 1 | 2 | 3;

/** A chosen specialty within a single phase. */
export interface PhaseSpec {
  path: PhasePathId;
  tier: SpecialtyTier;
}

/**
 * The player's (or an opponent's) complete archetype identity.
 * Phases left unset fall back to the broad archetype's default specialties.
 */
export interface ArchetypeProfile {
  /** null until chosen in the Coach Gonzalez event. */
  broad: BroadArchetype | null;
  phases: Partial<Record<GamePhase, PhaseSpec>>;
  /** Currency earned on level-up; spent to specialize a new phase or upgrade a tier. */
  specializationPoints: number;
  /** Consumed to respec a phase. Granted only by specific items/events (no free respec). */
  respecTokens: number;
}
