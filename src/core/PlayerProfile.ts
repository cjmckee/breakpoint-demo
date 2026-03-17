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

// Archetype signal definitions: which stats indicate each archetype, and their weights.
// Positive weights reward stats above the player's mean; negative weights penalize them.
interface ArchetypeSignal {
  getStat: (s: PlayerStats) => number;
  weight: number;
}

const ARCHETYPE_SIGNALS: Record<Exclude<PlayStyle['type'], 'all_court'>, ArchetypeSignal[]> = {
  aggressive: [
    { getStat: s => s.mental.offensive, weight: 3.0 },
    { getStat: s => s.physical.strength, weight: 1.5 },
    { getStat: s => s.technical.forehand, weight: 1.0 },
    { getStat: s => s.technical.serve, weight: 0.5 },
    { getStat: s => s.mental.defensive, weight: -1.0 },
  ],
  defensive: [
    { getStat: s => s.mental.defensive, weight: 3.0 },
    { getStat: s => s.physical.stamina, weight: 1.5 },
    { getStat: s => s.physical.speed, weight: 1.0 },
    { getStat: s => s.technical.slice, weight: 0.5 },
    { getStat: s => s.mental.offensive, weight: -0.5 },
  ],
  counterpuncher: [
    { getStat: s => s.mental.defensive, weight: 2.5 },
    { getStat: s => s.mental.anticipation, weight: 2.0 },
    { getStat: s => s.physical.speed, weight: 1.5 },
    { getStat: s => s.technical.return, weight: 1.0 },
    { getStat: s => s.mental.offensive, weight: -1.5 },
  ],
  serve_volley: [
    { getStat: s => s.technical.volley, weight: 3.0 },
    { getStat: s => s.technical.serve, weight: 2.5 },
    { getStat: s => s.technical.overhead, weight: 0.5 },
  ],
};

// all_court wins when no other archetype scores strongly
const BASE_ALL_COURT_SCORE = 3.0;
const DIFFERENTIATION_PENALTY = 0.8;

const ARCHETYPE_DESCRIPTIONS: Record<PlayStyle['type'], string> = {
  serve_volley: 'Aggressive net player who serves and volleys',
  counterpuncher: 'Defensive specialist who waits for opportunities',
  aggressive: 'Attacking player who goes for winners',
  all_court: 'Versatile player comfortable anywhere on court',
  defensive: 'Solid baseline player who focuses on consistency',
};

function getAllStatValues(stats: PlayerStats): number[] {
  return [
    ...Object.values(stats.technical),
    ...Object.values(stats.physical),
    ...Object.values(stats.mental),
  ];
}

/**
 * Derive play style from stats as a pure function.
 * Uses relative scoring: compares each stat to the player's personal mean
 * so that low-rated players with clear strengths still get the right archetype.
 */
export function derivePlayStyle(stats: PlayerStats): PlayStyle {
  const allValues = getAllStatValues(stats);
  const playerMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

  // Score each specialized archetype
  const scores: Record<PlayStyle['type'], number> = {
    aggressive: 0,
    defensive: 0,
    counterpuncher: 0,
    serve_volley: 0,
    all_court: 0,
  };

  for (const [archetype, signals] of Object.entries(ARCHETYPE_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      score += signal.weight * (signal.getStat(stats) - playerMean);
    }
    scores[archetype as PlayStyle['type']] = score;
  }

  // all_court scores high when no other archetype dominates
  const maxSpecializedScore = Math.max(
    scores.aggressive,
    scores.defensive,
    scores.counterpuncher,
    scores.serve_volley
  );
  scores.all_court = BASE_ALL_COURT_SCORE - maxSpecializedScore * DIFFERENTIATION_PENALTY;

  // Pick the highest-scoring archetype (priority order breaks ties)
  const priority: PlayStyle['type'][] = [
    'aggressive', 'serve_volley', 'counterpuncher', 'defensive', 'all_court',
  ];
  let bestType: PlayStyle['type'] = 'all_court';
  let bestScore = -Infinity;
  for (const t of priority) {
    if (scores[t] > bestScore) {
      bestScore = scores[t];
      bestType = t;
    }
  }

  const consistency = (stats.mental.focus + stats.mental.anticipation) / 2;

  return {
    type: bestType,
    aggression: stats.mental.offensive,
    netApproach: stats.technical.volley,
    consistency,
    power: stats.physical.strength,
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
      technical: {
        serve: 25,
        forehand: 25,
        backhand: 25,
        volley: 25,
        overhead: 25,
        dropShot: 25,
        slice: 25,
        return: 25,
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
    const shotStatMapping: Record<ShotType, keyof PlayerStats['technical']> = {
      // Serves (no forehand/backhand distinction)
      'serve_first': 'serve',
      'serve_second': 'serve',
      'kick_serve': 'serve',

      // Basic groundstrokes
      'forehand': 'forehand',
      'backhand': 'backhand',

      // Power shots
      'forehand_power': 'forehand',
      'backhand_power': 'backhand',

      // Approach shots
      'forehand_approach': 'forehand',
      'backhand_approach': 'backhand',

      // Volleys
      'volley_forehand': 'volley',
      'volley_backhand': 'volley',
      'half_volley_forehand': 'volley',
      'half_volley_backhand': 'volley',

      // Overheads (no forehand/backhand distinction)
      'overhead': 'overhead',
      'defensive_overhead': 'overhead',

      // Drop shots
      'drop_shot_forehand': 'dropShot',
      'drop_shot_backhand': 'dropShot',

      // Angle shots
      'angle_shot_forehand': 'placement',
      'angle_shot_backhand': 'placement',

      // Slice shots
      'slice_forehand': 'slice',
      'slice_backhand': 'slice',
      'defensive_slice_forehand': 'slice',
      'defensive_slice_backhand': 'slice',

      // Returns
      'return_forehand': 'return',
      'return_backhand': 'return',
      'return_forehand_power': 'return',
      'return_backhand_power': 'return',

      // Topspin shots
      'topspin_forehand': 'forehand',
      'topspin_backhand': 'backhand',

      // Directional shots
      'down_the_line_forehand': 'placement',
      'down_the_line_backhand': 'placement',
      'cross_court_forehand': 'placement',
      'cross_court_backhand': 'placement',

      // Lobs
      'lob_forehand': 'placement',
      'lob_backhand': 'placement',

      // Passing shots
      'passing_shot_forehand': 'placement',
      'passing_shot_backhand': 'placement',
    };

    const statName = shotStatMapping[shotType];
    return this.stats.technical[statName];
  }

  /**
   * Get stat value by name (for generic access)
   */
  public getStat(statName: StatName): number {
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

    if (statName in this.stats.technical) {
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
    const technicalAvg = this.getStatCategoryAverage('technical');
    const physicalAvg = this.getStatCategoryAverage('physical');
    const mentalAvg = this.getStatCategoryAverage('mental');

    // Weighted average (technical skills matter most)
    return Math.round(
      technicalAvg * 0.5 +
      physicalAvg * 0.3 +
      mentalAvg * 0.2
    );
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
    const serve = this.stats.technical.serve;
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
      technical: {
        serve: generateStat(),
        forehand: generateStat(),
        backhand: generateStat(),
        volley: generateStat(),
        overhead: generateStat(),
        dropShot: generateStat(),
        slice: generateStat(),
        return: generateStat(),
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