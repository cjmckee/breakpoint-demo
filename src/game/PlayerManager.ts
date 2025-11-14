/**
 * Player Manager
 * Handles player creation, stat management, and level progression
 */

import {
  Player,
  PlayerStats,
  DEFAULT_PLAYER_STATS,
  StatBoosts,
  Ability
} from '../types/game';
import { AbilitySystem } from './AbilitySystem';

export class PlayerManager {
  /**
   * Create a new player with default stats and optional playstyle
   */
  static createPlayer(name: string, playstyle?: 'offensive' | 'defensive' | 'balanced'): Player {
    const baseStats = { ...DEFAULT_PLAYER_STATS };

    // Apply playstyle bonuses
    if (playstyle === 'offensive') {
      baseStats.forehand += 5;
      baseStats.backhand += 5;
      baseStats.strength += 3;
    } else if (playstyle === 'defensive') {
      baseStats.speed += 5;
      baseStats.stamina += 5;
      baseStats.defensive += 3;
    } else if (playstyle === 'balanced') {
      // Small bonus to all stats
      Object.keys(baseStats).forEach((key) => {
        if (key !== 'abilities' && typeof baseStats[key as keyof PlayerStats] === 'number') {
          (baseStats as any)[key] += 3;
        }
      });
    }

    return {
      id: this.generateId(),
      name,
      stats: baseStats,
      level: 1,
      experience: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a player with custom starting stats
   */
  static createPlayerWithStats(name: string, stats: Partial<PlayerStats>): Player {
    const player = this.createPlayer(name);
    player.stats = { ...DEFAULT_PLAYER_STATS, ...stats };
    return player;
  }

  /**
   * Apply stat boosts to a player
   */
  static applyStatBoosts(player: Player, boosts: StatBoosts): Player {
    const updatedStats = { ...player.stats };

    for (const [stat, boost] of Object.entries(boosts)) {
      if (boost && stat in updatedStats && stat !== 'abilities') {
        const currentValue = updatedStats[stat as keyof PlayerStats] as number;
        updatedStats[stat as keyof PlayerStats] = Math.min(100, currentValue + boost) as any;
      }
    }

    return {
      ...player,
      stats: updatedStats,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add an ability to a player (accepts name or full Ability object)
   */
  static addAbility(player: Player, abilityOrName: Ability | string): Player {
    // If string, look up ability from AbilitySystem
    const ability = typeof abilityOrName === 'string'
      ? AbilitySystem.getAbility(abilityOrName)
      : abilityOrName;

    if (!ability) {
      console.warn(`Ability not found: ${abilityOrName}`);
      return player;
    }

    const existingAbility = player.stats.abilities.find(a => a.name === ability.name);

    if (existingAbility) {
      // Upgrade existing ability
      return this.upgradeAbility(player, ability.name);
    }

    // Add new ability
    const updatedAbilities = [...player.stats.abilities, ability];

    // Apply ability stat boosts
    const playerWithAbility = {
      ...player,
      stats: {
        ...player.stats,
        abilities: updatedAbilities,
      },
      updatedAt: new Date().toISOString(),
    };

    return this.applyStatBoosts(playerWithAbility, ability.modifiers.statBoosts);
  }

  /**
   * Upgrade an existing ability level
   */
  static upgradeAbility(player: Player, abilityName: string): Player {
    const abilityIndex = player.stats.abilities.findIndex(a => a.name === abilityName);

    if (abilityIndex === -1) {
      return player;
    }

    const ability = player.stats.abilities[abilityIndex];
    if (ability.level >= 5) {
      return player; // Max level reached
    }

    const upgradedAbility = {
      ...ability,
      level: ability.level + 1,
    };

    // Apply additional stat boost for level up
    const levelBoost: StatBoosts = {};
    for (const [stat, value] of Object.entries(ability.modifiers.statBoosts)) {
      if (value) {
        levelBoost[stat as keyof StatBoosts] = 1; // +1 per level
      }
    }

    const updatedAbilities = [...player.stats.abilities];
    updatedAbilities[abilityIndex] = upgradedAbility;

    const playerWithUpgrade = {
      ...player,
      stats: {
        ...player.stats,
        abilities: updatedAbilities,
      },
      updatedAt: new Date().toISOString(),
    };

    return this.applyStatBoosts(playerWithUpgrade, levelBoost);
  }

  /**
   * Add experience and check for level up
   */
  static addExperience(player: Player, exp: number): { player: Player; leveledUp: boolean } {
    const newExperience = player.experience + exp;
    const newLevel = this.calculateLevel(newExperience);
    const leveledUp = newLevel > player.level;

    return {
      player: {
        ...player,
        experience: newExperience,
        level: newLevel,
        updatedAt: new Date().toISOString(),
      },
      leveledUp,
    };
  }

  /**
   * Calculate level from experience
   * Uses exponential curve: level = floor(sqrt(exp / 100)) + 1
   */
  static calculateLevel(experience: number): number {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  /**
   * Calculate experience required for next level
   */
  static experienceForNextLevel(currentLevel: number): number {
    return (currentLevel * currentLevel) * 100;
  }

  /**
   * Calculate experience progress percentage
   */
  static experienceProgress(player: Player): number {
    const currentLevelExp = this.experienceForNextLevel(player.level - 1);
    const nextLevelExp = this.experienceForNextLevel(player.level);
    const expIntoLevel = player.experience - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;

    return Math.min(100, (expIntoLevel / expNeeded) * 100);
  }

  /**
   * Calculate play style based on stats
   */
  static calculatePlayStyle(stats: PlayerStats): {
    primary: string;
    secondary: string;
  } {
    const styles = {
      aggressive: stats.offensive + stats.serve + stats.strength,
      defensive: stats.defensive + stats.speed + stats.stamina,
      allCourt: stats.offensive + stats.defensive + stats.shotVariety,
      serveVolley: stats.serve + stats.volley + stats.speed,
      counterpuncher: stats.defensive + stats.return + stats.anticipation,
    };

    const sorted = Object.entries(styles).sort((a, b) => b[1] - a[1]);

    return {
      primary: sorted[0][0],
      secondary: sorted[1][0],
    };
  }

  /**
   * Get stat category totals
   */
  static getStatCategoryTotals(stats: PlayerStats): {
    technical: number;
    physical: number;
    mental: number;
    total: number;
  } {
    const technical =
      stats.serve +
      stats.forehand +
      stats.backhand +
      stats.volley +
      stats.overhead +
      stats.dropShot +
      stats.slice +
      stats.return +
      stats.spin +
      stats.placement +
      stats.shotVariety;

    const physical =
      stats.speed +
      stats.stamina +
      stats.strength +
      stats.agility +
      stats.recovery;

    const mental = stats.focus + stats.anticipation;

    return {
      technical,
      physical,
      mental,
      total: technical + physical + mental + stats.offensive + stats.defensive,
    };
  }

  /**
   * Validate player stats (all must be 0-100)
   */
  static validateStats(stats: PlayerStats): boolean {
    const statValues = Object.entries(stats)
      .filter(([key]) => key !== 'abilities')
      .map(([_, value]) => value as number);

    return statValues.every(value => value >= 0 && value <= 100);
  }

  /**
   * Generate a unique player ID
   */
  private static generateId(): string {
    return `player-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
