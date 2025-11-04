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

export class PlayerProfile implements IPlayerProfile {
  public readonly id: string;
  public readonly name: string;
  public stats: PlayerStats;

  // Current condition
  public energy: number = 100;
  public form: number = 100;
  public confidence: number = 50;

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
        drop_shot: 25,
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
        shot_variety: 25,
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
      'drop_shot_forehand': 'drop_shot',
      'drop_shot_backhand': 'drop_shot',

      // Angle shots
      'short_angle_forehand': 'drop_shot',
      'short_angle_backhand': 'drop_shot',
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
   * Calculate current form based on energy and confidence
   */
  public getCurrentForm(): number {
    // Form is affected by energy (physical condition) and confidence
    const energyFactor = this.energy / 100;
    const confidenceFactor = this.confidence / 100;

    // Form ranges from 0.7 to 1.1 (70% to 110% of base stats)
    const baseForm = 0.7 + (energyFactor * confidenceFactor * 0.4);

    return Math.max(0.5, Math.min(1.2, baseForm));
  }

  /**
   * Determine play style based on offensive/defensive balance
   */
  public get playStyle(): PlayStyle {
    const offensive = this.stats.mental.offensive;
    const defensive = this.stats.mental.defensive;
    const volley = this.stats.technical.volley;
    const serve = this.stats.technical.serve;
    const consistency = (this.stats.mental.focus + this.stats.mental.anticipation) / 2;

    let type: PlayStyle['type'];
    let description: string;

    // Determine primary play style
    if (volley >= 70 && serve >= 65) {
      type = 'serve_volley';
      description = 'Aggressive net player who serves and volleys';
    } else if (defensive >= 70 && offensive <= 50) {
      type = 'counterpuncher';
      description = 'Defensive specialist who waits for opportunities';
    } else if (offensive >= 70 && defensive <= 50) {
      type = 'aggressive';
      description = 'Attacking player who goes for winners';
    } else if (Math.abs(offensive - defensive) <= 15) {
      type = 'all_court';
      description = 'Versatile player comfortable anywhere on court';
    } else {
      type = 'defensive';
      description = 'Solid baseline player who focuses on consistency';
    }

    return {
      type,
      aggression: offensive,
      netApproach: volley,
      consistency,
      power: this.stats.physical.strength,
      description,
    };
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
   * Update confidence based on match results
   */
  public updateConfidence(matchResult: 'win' | 'loss', competitiveness: number): void {
    if (matchResult === 'win') {
      this.confidence = Math.min(100, this.confidence + competitiveness * 5);
    } else {
      this.confidence = Math.max(0, this.confidence - competitiveness * 3);
    }
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
    clone.form = this.form;
    clone.confidence = this.confidence;
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
      form: this.form,
      confidence: this.confidence,
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
    player.form = data.form ?? 100;
    player.confidence = data.confidence ?? 50;
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
        drop_shot: generateStat(),
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
        shot_variety: generateStat(),
        offensive: generateStat(),
        defensive: generateStat(),
      },
    };

    return new PlayerProfile(`opponent_${Date.now()}`, name, stats);
  }
}