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

/**
 * Archetype fingerprints: each archetype is defined by characteristic stat combinations.
 * - core: identity-defining stats — at least 1 must appear in the player's strong stats to qualify
 * - supporting: reinforcing stats that strengthen the signal
 *
 * The system looks at which of a player's top stats match each archetype's fingerprint,
 * so it works consistently at any rating range (20s through 90s).
 */
interface ArchetypeFingerprint {
  core: string[];
  supporting: string[];
}

const ARCHETYPE_FINGERPRINTS: Record<Exclude<PlayStyle['type'], 'all_court'>, ArchetypeFingerprint> = {
  aggressive: {
    core: ['forehand', 'serve'],
    supporting: ['strength', 'offensive', 'backhand', 'spin'],
  },
  defensive: {
    core: ['stamina', 'speed'],
    supporting: ['defensive', 'slice', 'recovery', 'agility'],
  },
  counterpuncher: {
    core: ['return', 'anticipation'],
    supporting: ['speed', 'defensive', 'agility', 'slice'],
  },
  serve_volley: {
    core: ['serve', 'volley'],
    supporting: ['overhead', 'strength', 'offensive', 'placement'],
  },
};

// Minimum score an archetype needs to beat all_court
const MIN_ARCHETYPE_SCORE = 5;

const ARCHETYPE_DESCRIPTIONS: Record<PlayStyle['type'], string> = {
  serve_volley: 'Aggressive net player who serves and volleys',
  counterpuncher: 'Defensive specialist who waits for opportunities',
  aggressive: 'Attacking player who goes for winners',
  all_court: 'Versatile player comfortable anywhere on court',
  defensive: 'Solid baseline player who focuses on consistency',
};

interface StatEntry {
  name: string;
  value: number;
}

function getAllStatEntries(stats: PlayerStats): StatEntry[] {
  const entries: StatEntry[] = [];
  for (const [name, value] of Object.entries(stats.core)) {
    entries.push({ name, value: value as number });
  }
  for (const [name, value] of Object.entries(stats.technical)) {
    entries.push({ name, value: value as number });
  }
  for (const [name, value] of Object.entries(stats.physical)) {
    entries.push({ name, value: value as number });
  }
  for (const [name, value] of Object.entries(stats.mental)) {
    entries.push({ name, value: value as number });
  }
  return entries;
}

/**
 * Derive play style by matching the player's strongest stats against archetype fingerprints.
 *
 * Algorithm:
 * 1. Collect all stats, compute the player's mean
 * 2. "Strong stats" = stats above the mean (filters noise from even/low stats)
 * 3. For each archetype, check how many core/supporting stats appear in the strong set
 * 4. Score = core_matches * 3 + supporting_matches * 1 + 2 bonus if #1 stat is a core stat
 * 5. All-court wins when no archetype clears MIN_ARCHETYPE_SCORE
 */
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

export function derivePlayStyle(stats: PlayerStats): PlayStyle {
  const allStats = getAllStatEntries(stats);
  const allValues = allStats.map(s => s.value);
  const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

  // Sort descending to identify the player's #1 stat
  allStats.sort((a, b) => b.value - a.value);
  const topStatName = allStats[0].name;

  // Strong stats: 3+ above the player's personal mean
  const strongStatNames = new Set(
    allStats.filter(s => s.value > mean + 3).map(s => s.name)
  );

  // Score each archetype by fingerprint overlap with strong stats
  const scores: Record<PlayStyle['type'], number> = {
    aggressive: 0,
    defensive: 0,
    counterpuncher: 0,
    serve_volley: 0,
    all_court: 0,
  };

  for (const [archetype, fingerprint] of Object.entries(ARCHETYPE_FINGERPRINTS)) {
    const coreMatches = fingerprint.core.filter(s => strongStatNames.has(s)).length;

    // Must have at least 1 core stat among strong stats to qualify
    if (coreMatches === 0) continue;

    const supportMatches = fingerprint.supporting.filter(s => strongStatNames.has(s)).length;

    let score = coreMatches * 3 + supportMatches;

    // Bonus if the player's single best stat is a core stat for this archetype
    if (fingerprint.core.includes(topStatName)) {
      score += 2;
    }

    scores[archetype as PlayStyle['type']] = score;
  }

  // Pick the highest-scoring archetype (priority order breaks ties)
  const priority: PlayStyle['type'][] = [
    'aggressive', 'serve_volley', 'counterpuncher', 'defensive', 'all_court',
  ];
  let bestType: PlayStyle['type'] = 'all_court';
  let bestScore = MIN_ARCHETYPE_SCORE - 1;
  for (const t of priority) {
    if (scores[t] > bestScore) {
      bestScore = scores[t];
      bestType = t;
    }
  }

  const aggression = ((stats.mental.offensive * 2) + stats.physical.strength + stats.core.forehand) / 4;
  const netApproach = ((stats.technical.volley * 3) + stats.technical.overhead + stats.physical.speed) / 5;
  const consistency = (stats.mental.focus + stats.mental.anticipation + stats.core.forehand + stats.core.backhand) / 4;
  const power = ((stats.physical.strength * 2) + stats.mental.offensive + stats.core.serve) / 4;

  return {
    type: bestType,
    aggression,
    netApproach,
    consistency,
    power,
    description: ARCHETYPE_DESCRIPTIONS[bestType],
  };
}

export class PlayerProfile implements IPlayerProfile {
  public readonly id: string;
  public readonly name: string;
  public stats: PlayerStats;

  // Current condition
  public energy: number = 100;

  // Experience
  public level: number = 1;
  public experience: number = 0;
  public matchesPlayed: number = 0;
  public matchesWon: number = 0;

  constructor(
    id: string,
    name: string,
    stats?: Partial<PlayerStats>
  ) {
    this.id = id;
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
   * Get the primary stat that influences a specific shot type
   */
  public getStatForShot(shotType: ShotType): number {
    // Core stats: serve, forehand, backhand, return, slice
    const coreMapping: Partial<Record<ShotType, keyof PlayerStats['core']>> = {
      'serve_first': 'serve',
      'serve_second': 'serve',
      'forehand': 'forehand',
      'backhand': 'backhand',
      'forehand_power': 'forehand',
      'backhand_power': 'backhand',
      'forehand_approach': 'forehand',
      'backhand_approach': 'backhand',
      'slice_forehand': 'slice',
      'slice_backhand': 'slice',
      'defensive_slice_forehand': 'slice',
      'defensive_slice_backhand': 'slice',
      'return_forehand': 'return',
      'return_backhand': 'return',
      'return_forehand_power': 'return',
      'return_backhand_power': 'return',
    };

    const coreStat = coreMapping[shotType];
    if (coreStat) {
      return this.stats.core[coreStat];
    }

    // Technical stats: volley, overhead, dropShot, spin, placement
    const technicalMapping: Partial<Record<ShotType, keyof PlayerStats['technical']>> = {
      'volley_forehand': 'volley',
      'volley_backhand': 'volley',
      'half_volley_forehand': 'volley',
      'half_volley_backhand': 'volley',
      'overhead': 'overhead',
      'defensive_overhead': 'overhead',
      'drop_shot_forehand': 'dropShot',
      'drop_shot_backhand': 'dropShot',
      'angle_shot_forehand': 'placement',
      'angle_shot_backhand': 'placement',
      'lob_forehand': 'placement',
      'lob_backhand': 'placement',
      'passing_shot_forehand': 'placement',
      'passing_shot_backhand': 'placement',
    };

    const techStat = technicalMapping[shotType];
    if (techStat) {
      return this.stats.technical[techStat];
    }

    throw new Error(`Unknown shot type: ${shotType}`);
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
   * Determine play style based on offensive/defensive balance
   */
  public get playStyle(): PlayStyle {
    return derivePlayStyle(this.stats);
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
    const clone = new PlayerProfile(this.id, this.name, this.stats);
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