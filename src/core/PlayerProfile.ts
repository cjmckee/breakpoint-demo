/**
 * PlayerProfile - Core player management with stat system
 *
 * Provides a clean interface for managing player statistics,
 * computing derived properties, and tracking player state.
 */

import type {
  PlayerProfile as IPlayerProfile,
  PlayerStats,
  PlayStyle,
  CourtSurface,
  ShotType,
  StatName,
  StatCategory
} from '../types/index.js';
import type { ArchetypeProfile, BroadArchetype } from '../types/archetype.js';
import { EffectKey } from '../types/game.js';
import {
  aggregateArchetypeEffects,
  createEmptyArchetypeProfile,
} from '../data/archetypeTree.js';
import {
  SERVE_QUALITY_WEIGHTS,
  SERVE_ACCURACY_WEIGHTS,
  RETURN_COMPOSITE_WEIGHTS,
  SHOT_COMPOSITE_WEIGHTS,
  MATCH_FORM,
} from '../config/shotThresholds.js';

const ARCHETYPE_DESCRIPTIONS: Record<PlayStyle['type'], string> = {
  serve_volley: 'Aggressive net player who serves and volleys',
  counterpuncher: 'Defensive specialist who waits for opportunities',
  aggressive: 'Attacking player who goes for winners',
  all_court: 'Versatile player comfortable anywhere on court',
  defensive: 'Solid baseline player who focuses on consistency',
};

/** Every dial shares this baseline before archetype nudges or specialization effects. */
const DIAL_BASELINE = 50;

/**
 * How far a dial must sit above its shared baseline before it defines the summary
 * type — meaningfully above only once that phase is actually specialized.
 */
const ABOVE_BASELINE_THRESHOLD = 15;

/**
 * Starting lean applied to the four dials based on the player's broad archetype —
 * a redistribution of a fixed budget, not a bonus: the offense pair (aggression,
 * netApproach) and defense pair (consistency, power) move by equal and opposite
 * amounts, so the total stays constant. Deliberately kept smaller than
 * ABOVE_BASELINE_THRESHOLD so the nudge alone can never cross into a fully
 * specialized classification — it's a lean, not a shortcut.
 */
const TENDENCY_NUDGE = 8;
const BROAD_TENDENCY_NUDGES: Record<BroadArchetype, { aggression: number; netApproach: number; consistency: number; power: number }> = {
  net_attacker: { aggression: TENDENCY_NUDGE, netApproach: TENDENCY_NUDGE, consistency: -TENDENCY_NUDGE, power: -TENDENCY_NUDGE },
  baseliner: { aggression: -TENDENCY_NUDGE, netApproach: -TENDENCY_NUDGE, consistency: TENDENCY_NUDGE, power: TENDENCY_NUDGE },
  all_courter: { aggression: 0, netApproach: 0, consistency: 0, power: 0 },
};
const NO_NUDGE = { aggression: 0, netApproach: 0, consistency: 0, power: 0 };

export function calculateOverallRating(stats: PlayerStats): number {
  const avg = (vals: object) => {
    const v = Object.values(vals) as number[];
    return v.reduce((s, x) => s + x, 0) / v.length;
  };
  return Math.round(
    avg(stats.core) * 0.45 +
    avg(stats.technical) * 0.15 +
    avg(stats.physical) * 0.25 +
    avg(stats.mental) * 0.15
  );
}

const clampDial = (v: number): number => Math.max(0, Math.min(100, v));

/**
 * Map a profile's aggregated behavior dials onto one of the legacy five PlayStyle
 * types, used as a summary label by the tactical-counter and display systems.
 *
 * Reads the same dials (and raw effects) that actually drive ShotSelector, so the
 * summary always describes how the profile currently plays — it strengthens
 * smoothly as specialization points go in, rather than flipping on a single
 * specific phase pick the way a path-name match would.
 */
function summarizeArchetypeType(
  dials: Pick<PlayStyle, 'aggression' | 'netApproach' | 'consistency'>,
  fx: Record<string, number>
): PlayStyle['type'] {
  const { aggression, netApproach, consistency } = dials;
  const threshold = DIAL_BASELINE + ABOVE_BASELINE_THRESHOLD;

  if (netApproach >= threshold) return 'serve_volley';
  if (aggression >= threshold) return 'aggressive';
  if (consistency >= threshold) {
    return (fx[EffectKey.SLICE_PREFERENCE_BACKHAND] ?? 0) > 0 ? 'counterpuncher' : 'defensive';
  }
  return 'all_court';
}

/**
 * Build a PlayStyle from a player's archetype profile.
 *
 * UI/display only — the simulation (ShotSelector/PointSimulator) reads EffectKeys
 * directly from the aggregated behavior effects; `playStyle` is no longer a
 * simulation driver. The four dials here are a projection used by the tactical
 * counter system and the "Current Tendencies" display.
 */
export function buildPlayStyle(profile: ArchetypeProfile): PlayStyle {
  const fx = aggregateArchetypeEffects(profile);
  const get = (k: string): number => fx[k] ?? 0;

  const winner = get(EffectKey.RALLY_WINNER_BIAS);
  const net = get(EffectKey.NET_APPROACH_BIAS);
  const rally = get(EffectKey.RALLY_PATIENCE);
  const returnAgg = get(EffectKey.RETURN_AGGRESSION);
  const firstServePower = get(EffectKey.FIRST_SERVE_AGGRESSION);

  const nudge = profile.broad ? (BROAD_TENDENCY_NUDGES[profile.broad] ?? NO_NUDGE) : NO_NUDGE;

  const aggression = clampDial(DIAL_BASELINE + nudge.aggression + winner + returnAgg * 0.5 - rally);
  const netApproach = clampDial(DIAL_BASELINE + nudge.netApproach + net);
  const consistency = clampDial(DIAL_BASELINE + nudge.consistency + rally - winner * 0.5);
  const power = clampDial(DIAL_BASELINE + nudge.power + firstServePower + winner * 0.5);

  const type = summarizeArchetypeType({ aggression, netApproach, consistency }, fx);

  return {
    type,
    aggression,
    netApproach,
    consistency,
    power,
    description: ARCHETYPE_DESCRIPTIONS[type],
  };
}

export class PlayerProfile implements IPlayerProfile {
  public readonly id: string;
  public readonly name: string;
  public stats: PlayerStats;

  // Current condition
  public energy: number = 100;

  /**
   * Match-day form: flat quality offset applied to every shot this match.
   * Rolled once at match start (see MATCH_FORM.variance); 0 outside matches.
   */
  public matchForm: number = 0;

  /**
   * Roll match-day form for the start of a match.
   *
   * @param options.variance - Overrides MATCH_FORM.variance. Pass 0 to disable
   *   form entirely (e.g. tutorial matches, where we want a predictable outcome).
   * @param options.mood - Player mood (-100 to 100). When provided, skews the
   *   roll toward positive form at high mood and negative form at low mood
   *   (see MATCH_FORM.moodInfluence). Omit for opponents, who have no mood.
   */
  public rollMatchForm(options: { variance?: number; mood?: number } = {}): void {
    const variance = options.variance ?? MATCH_FORM.variance;
    const moodBias = options.mood !== undefined
      ? (Math.max(-100, Math.min(100, options.mood)) / 100) * MATCH_FORM.moodInfluence
      : 0;
    const roll = Math.max(-1, Math.min(1, (Math.random() * 2 - 1) + moodBias));
    this.matchForm = roll * variance;
  }

  // Experience
  public level: number = 1;
  public experience: number = 0;
  public matchesPlayed: number = 0;
  public matchesWon: number = 0;

  // Phase-based archetype identity that drives shot-selection behavior.
  public archetypeProfile: ArchetypeProfile;

  constructor(
    id: string,
    name: string,
    stats?: Partial<PlayerStats>,
    archetypeProfile?: ArchetypeProfile
  ) {
    this.id = id;
    this.archetypeProfile = archetypeProfile ?? createEmptyArchetypeProfile();
    this.name = name;
    this.stats = this.createDefaultStats(stats);
  }

  // =======================
  // STAT MANAGEMENT
  // =======================

  /**
   * Create default player stats with optional overrides
   */
  private createDefaultStats(overrides?: Partial<PlayerStats>): PlayerStats {
    const defaultStats: PlayerStats = {
      core: {
        serve: 25,
        forehand: 25,
        backhand: 25,
        return: 25,
        slice: 25,
      },
      technical: {
        volley: 25,
        overhead: 25,
        dropShot: 25,
        spin: 25,
        placement: 25,
      },
      physical: {
        speed: 25,
        stamina: 25,
        strength: 25,
        agility: 25,
        recovery: 25,
      },
      mental: {
        focus: 25,
        anticipation: 25,
        shotVariety: 25,
        offensive: 25,
        defensive: 25,
      },
    };

    // Apply overrides if provided
    if (overrides) {
      if (overrides.core) {
        Object.assign(defaultStats.core, overrides.core);
      }
      if (overrides.technical) {
        Object.assign(defaultStats.technical, overrides.technical);
      }
      if (overrides.physical) {
        Object.assign(defaultStats.physical, overrides.physical);
      }
      if (overrides.mental) {
        Object.assign(defaultStats.mental, overrides.mental);
      }
    }

    return defaultStats;
  }

  /**
   * Get the effective rating that drives a shot's quality.
   * Every shot family is a composite: the shot's own technique stat carries
   * most of the weight, with supporting stats blended in (see
   * SERVE_QUALITY_WEIGHTS / RETURN_COMPOSITE_WEIGHTS / SHOT_COMPOSITE_WEIGHTS)
   * so no single stat carries a whole contest.
   */
  public getStatForShot(shotType: ShotType): number {
    if (shotType === 'serve_first' || shotType === 'serve_second') {
      return this.blendStats(SERVE_QUALITY_WEIGHTS[shotType]);
    }

    if (shotType.startsWith('return_')) {
      return this.getReturnComposite();
    }

    const spec = this.getRallyCompositeSpec(shotType);
    if (!spec) {
      throw new Error(`Unknown shot type: ${shotType}`);
    }
    const { primary: primaryWeight, ...rest } = spec.weights;
    return spec.primaryValue * primaryWeight + this.blendStats(rest);
  }

  /**
   * Composite return rating: return technique plus reading the serve
   * (anticipation) and getting to it (speed). Used for return shot quality
   * and as the returner's ace resistance in the serve contest.
   */
  public getReturnComposite(): number {
    return this.blendStats(RETURN_COMPOSITE_WEIGHTS);
  }

  /**
   * Serve accuracy rating: how reliably the serve lands, as opposed to how
   * hurtful it is (getStatForShot). Feeds the serve-in roll — a power server
   * with poor placement/focus hits huge serves that miss more often.
   */
  public getServeAccuracy(serveType: 'serve_first' | 'serve_second'): number {
    return this.blendStats(SERVE_ACCURACY_WEIGHTS[serveType]);
  }

  /** Weighted blend over flat stat names (all four categories merged). */
  private blendStats(weights: Record<string, number>): number {
    const flat: Record<string, number> = {
      ...this.stats.core,
      ...this.stats.technical,
      ...this.stats.physical,
      ...this.stats.mental,
    };
    let total = 0;
    for (const [stat, weight] of Object.entries(weights)) {
      const value = flat[stat];
      if (value === undefined) {
        throw new Error(`Unknown stat in composite weights: ${stat}`);
      }
      total += value * weight;
    }
    return total;
  }

  /** Map a rally shot type to its primary technique stat and composite family. */
  private getRallyCompositeSpec(
    shotType: ShotType,
  ): { primaryValue: number; weights: { primary: number; [stat: string]: number } } | null {
    const families: Partial<Record<ShotType, { stat: number; family: string }>> = {
      'forehand': { stat: this.stats.core.forehand, family: 'groundstroke' },
      'backhand': { stat: this.stats.core.backhand, family: 'groundstroke' },
      'forehand_approach': { stat: this.stats.core.forehand, family: 'groundstroke' },
      'backhand_approach': { stat: this.stats.core.backhand, family: 'groundstroke' },
      'forehand_power': { stat: this.stats.core.forehand, family: 'powerGroundstroke' },
      'backhand_power': { stat: this.stats.core.backhand, family: 'powerGroundstroke' },
      'slice_forehand': { stat: this.stats.core.slice, family: 'slice' },
      'slice_backhand': { stat: this.stats.core.slice, family: 'slice' },
      'defensive_slice_forehand': { stat: this.stats.core.slice, family: 'slice' },
      'defensive_slice_backhand': { stat: this.stats.core.slice, family: 'slice' },
      'volley_forehand': { stat: this.stats.technical.volley, family: 'volley' },
      'volley_backhand': { stat: this.stats.technical.volley, family: 'volley' },
      'volley_forehand_power': { stat: this.stats.technical.volley, family: 'volley' },
      'volley_backhand_power': { stat: this.stats.technical.volley, family: 'volley' },
      'half_volley_forehand': { stat: this.stats.technical.volley, family: 'volley' },
      'half_volley_backhand': { stat: this.stats.technical.volley, family: 'volley' },
      'overhead': { stat: this.stats.technical.overhead, family: 'overhead' },
      'defensive_overhead': { stat: this.stats.technical.overhead, family: 'overhead' },
      'drop_shot_forehand': { stat: this.stats.technical.dropShot, family: 'dropShot' },
      'drop_shot_backhand': { stat: this.stats.technical.dropShot, family: 'dropShot' },
      'angle_shot_forehand': { stat: this.stats.technical.placement, family: 'angle' },
      'angle_shot_backhand': { stat: this.stats.technical.placement, family: 'angle' },
      'lob_forehand': { stat: this.stats.technical.placement, family: 'lob' },
      'lob_backhand': { stat: this.stats.technical.placement, family: 'lob' },
      'passing_shot_forehand': { stat: this.stats.technical.placement, family: 'passing' },
      'passing_shot_backhand': { stat: this.stats.technical.placement, family: 'passing' },
    };

    const entry = families[shotType];
    if (!entry) return null;
    return { primaryValue: entry.stat, weights: SHOT_COMPOSITE_WEIGHTS[entry.family] };
  }

  /**
   * Get stat value by name (for generic access)
   */
  public getStat(statName: StatName): number {
    if (statName in this.stats.core) {
      return this.stats.core[statName as keyof typeof this.stats.core];
    }
    if (statName in this.stats.technical) {
      return this.stats.technical[statName as keyof typeof this.stats.technical];
    }
    if (statName in this.stats.physical) {
      return this.stats.physical[statName as keyof typeof this.stats.physical];
    }
    if (statName in this.stats.mental) {
      return this.stats.mental[statName as keyof typeof this.stats.mental];
    }
    throw new Error(`Unknown stat name: ${statName}`);
  }

  /**
   * Update a specific stat with bounds checking
   */
  public updateStat(statName: StatName, value: number): void {
    const clampedValue = Math.max(0, Math.min(100, value));

    if (statName in this.stats.core) {
      (this.stats.core as any)[statName] = clampedValue;
    } else if (statName in this.stats.technical) {
      (this.stats.technical as any)[statName] = clampedValue;
    } else if (statName in this.stats.physical) {
      (this.stats.physical as any)[statName] = clampedValue;
    } else if (statName in this.stats.mental) {
      (this.stats.mental as any)[statName] = clampedValue;
    } else {
      throw new Error(`Unknown stat name: ${statName}`);
    }
  }

  /**
   * Apply stat boosts from training
   */
  public applyStatBoosts(boosts: Partial<Record<StatName, number>>): void {
    Object.entries(boosts).forEach(([statName, boost]) => {
      if (boost !== undefined) {
        const currentValue = this.getStat(statName as StatName);
        this.updateStat(statName as StatName, currentValue + boost);
      }
    });
  }

  // =======================
  // COMPUTED PROPERTIES
  // =======================

  /**
   * Calculate overall player rating (0-100)
   */
  public get overallRating(): number {
    return calculateOverallRating(this.stats);
  }

  /**
   * Get average for a stat category
   */
  public getStatCategoryAverage(category: StatCategory): number {
    const stats = this.stats[category];
    const values = Object.values(stats);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Play style built from the player's chosen archetype profile.
   */
  public get playStyle(): PlayStyle {
    return buildPlayStyle(this.archetypeProfile);
  }

  /**
   * Determine preferred court surface based on stats
   */
  public get preferredSurface(): CourtSurface {
    const serve = this.stats.core.serve;
    const speed = this.stats.physical.speed;
    const defensive = this.stats.mental.defensive;
    const spin = this.stats.technical.spin;

    // Grass favors serve and volley
    if (serve >= 70 && this.stats.technical.volley >= 65) {
      return 'grass';
    }

    // Clay favors defensive players with good spin
    if (defensive >= 65 && spin >= 60) {
      return 'clay';
    }

    // Hard court is balanced
    return 'hard';
  }

  // =======================
  // CONDITION MANAGEMENT
  // =======================

  /**
   * Reduce energy after activity
   */
  public reduceEnergy(amount: number): void {
    this.energy = Math.max(0, this.energy - amount);
  }

  /**
   * Restore energy from rest
   */
  public restoreEnergy(amount: number): void {
    this.energy = Math.min(100, this.energy + amount);
  }

  /**
   * Gain experience from activities
   */
  public gainExperience(amount: number): void {
    this.experience += amount;

    // Check for level up (every 1000 experience)
    const newLevel = Math.floor(this.experience / 1000) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
    }
  }

  // =======================
  // UTILITY METHODS
  // =======================

  /**
   * Create a copy of this player profile
   */
  public clone(): PlayerProfile {
    const clonedArchetype: ArchetypeProfile = {
      broad: this.archetypeProfile.broad,
      phases: { ...this.archetypeProfile.phases },
      specializationPoints: this.archetypeProfile.specializationPoints,
      respecTokens: this.archetypeProfile.respecTokens,
    };
    const clone = new PlayerProfile(this.id, this.name, this.stats, clonedArchetype);
    clone.energy = this.energy;
    clone.level = this.level;
    clone.experience = this.experience;
    clone.matchesPlayed = this.matchesPlayed;
    clone.matchesWon = this.matchesWon;
    return clone;
  }

  /**
   * Export player data for saving
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      stats: this.stats,
      energy: this.energy,
      level: this.level,
      experience: this.experience,
      matchesPlayed: this.matchesPlayed,
      matchesWon: this.matchesWon,
    };
  }

  /**
   * Create player from saved data
   */
  public static fromJSON(data: Record<string, any>): PlayerProfile {
    const player = new PlayerProfile(data.id, data.name, data.stats);
    player.energy = data.energy ?? 100;
    player.level = data.level ?? 1;
    player.experience = data.experience ?? 0;
    player.matchesPlayed = data.matchesPlayed ?? 0;
    player.matchesWon = data.matchesWon ?? 0;
    return player;
  }

  /**
   * Create a random opponent with balanced stats around a target rating
   */
  public static createOpponent(name: string, targetRating: number): PlayerProfile {
    const variance = 10; // ±10 points variance

    const generateStat = () => {
      const base = targetRating + (Math.random() - 0.5) * variance * 2;
      return Math.max(10, Math.min(90, Math.round(base)));
    };

    const stats: PlayerStats = {
      core: {
        serve: generateStat(),
        forehand: generateStat(),
        backhand: generateStat(),
        return: generateStat(),
        slice: generateStat(),
      },
      technical: {
        volley: generateStat(),
        overhead: generateStat(),
        dropShot: generateStat(),
        spin: generateStat(),
        placement: generateStat(),
      },
      physical: {
        speed: generateStat(),
        stamina: generateStat(),
        strength: generateStat(),
        agility: generateStat(),
        recovery: generateStat(),
      },
      mental: {
        focus: generateStat(),
        anticipation: generateStat(),
        shotVariety: generateStat(),
        offensive: generateStat(),
        defensive: generateStat(),
      },
    };

    return new PlayerProfile(`opponent_${Date.now()}`, name, stats);
  }
}