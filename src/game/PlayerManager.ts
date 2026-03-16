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
    const baseStats: PlayerStats = {
      technical: { ...DEFAULT_PLAYER_STATS.technical },
      physical: { ...DEFAULT_PLAYER_STATS.physical },
      mental: { ...DEFAULT_PLAYER_STATS.mental },
    };

    // Apply playstyle bonuses
    if (playstyle === 'offensive') {
      baseStats.technical.forehand += 5;
      baseStats.technical.backhand += 5;
      baseStats.physical.strength += 3;
    } else if (playstyle === 'defensive') {
      baseStats.physical.speed += 5;
      baseStats.physical.stamina += 5;
      baseStats.mental.defensive += 3;
    } else if (playstyle === 'balanced') {
      // Small bonus to all stats
      Object.keys(baseStats.technical).forEach((key) => {
        (baseStats.technical as any)[key] += 1;
      });
      Object.keys(baseStats.physical).forEach((key) => {
        (baseStats.physical as any)[key] += 1;
      });
      Object.keys(baseStats.mental).forEach((key) => {
        (baseStats.mental as any)[key] += 1;
      });
    }

    return {
      id: this.generateId(),
      name,
      stats: baseStats,
      abilities: [],

      // Initialize item system
      inventory: [],
      equippedItems: {
        racquet: null,
        shoes: null,
        outfit: null,
        hat: null,
      },
      storyItems: [],
      nextActivityBuffs: null,

      level: 1,
      experience: 0,
      tier: 1,  // All players start at tier 1
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      flags: {},
    };
  }

  /**
   * Create a player with custom starting stats
   */
  static createPlayerWithStats(name: string, stats: Partial<PlayerStats>): Player {
    const player = this.createPlayer(name);
    player.stats = {
      technical: { ...DEFAULT_PLAYER_STATS.technical, ...stats.technical },
      physical: { ...DEFAULT_PLAYER_STATS.physical, ...stats.physical },
      mental: { ...DEFAULT_PLAYER_STATS.mental, ...stats.mental },
    };
    return player;
  }

  /**
   * Apply stat boosts to a player
   */
  static applyStatBoosts(player: Player, boosts: StatBoosts): Player {
    const updatedStats: PlayerStats = {
      technical: { ...player.stats.technical },
      physical: { ...player.stats.physical },
      mental: { ...player.stats.mental },
    };

    for (const [stat, boost] of Object.entries(boosts)) {
      if (!boost) continue;

      // Map flat stat names to nested structure
      if (stat in updatedStats.technical) {
        const key = stat as keyof typeof updatedStats.technical;
        updatedStats.technical[key] = Math.min(100, updatedStats.technical[key] + boost);
      } else if (stat in updatedStats.physical) {
        const key = stat as keyof typeof updatedStats.physical;
        updatedStats.physical[key] = Math.min(100, updatedStats.physical[key] + boost);
      } else if (stat in updatedStats.mental) {
        const key = stat as keyof typeof updatedStats.mental;
        updatedStats.mental[key] = Math.min(100, updatedStats.mental[key] + boost);
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

    const existingAbility = player.abilities.find(a => a.name === ability.name);

    if (existingAbility) {
      // Upgrade existing ability
      return this.upgradeAbility(player, ability.name);
    }

    // Add new ability
    const updatedAbilities = [...player.abilities, ability];

    // Apply ability stat boosts
    const playerWithAbility = {
      ...player,
      abilities: updatedAbilities,
      updatedAt: new Date().toISOString(),
    };

    return this.applyStatBoosts(playerWithAbility, ability.modifiers.statBoosts);
  }

  /**
   * Upgrade an existing ability level
   */
  static upgradeAbility(player: Player, abilityName: string): Player {
    const abilityIndex = player.abilities.findIndex(a => a.name === abilityName);

    if (abilityIndex === -1) {
      return player;
    }

    const ability = player.abilities[abilityIndex];
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

    const updatedAbilities = [...player.abilities];
    updatedAbilities[abilityIndex] = upgradedAbility;

    const playerWithUpgrade = {
      ...player,
      abilities: updatedAbilities,
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
      aggressive: stats.mental.offensive + stats.technical.serve + stats.physical.strength,
      defensive: stats.mental.defensive + stats.physical.speed + stats.physical.stamina,
      allCourt: stats.mental.offensive + stats.mental.defensive + stats.mental.shotVariety,
      serveVolley: stats.technical.serve + stats.technical.volley + stats.physical.speed,
      counterpuncher: stats.mental.defensive + stats.technical.return + stats.mental.anticipation,
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
    const technical = Object.values(stats.technical).reduce((sum: number, val: number) => sum + val, 0);
    const physical = Object.values(stats.physical).reduce((sum: number, val: number) => sum + val, 0);
    const mental = Object.values(stats.mental).reduce((sum: number, val: number) => sum + val, 0);

    return {
      technical,
      physical,
      mental,
      total: technical + physical + mental,
    };
  }

  /**
   * Validate player stats (all must be 0-100)
   */
  static validateStats(stats: PlayerStats): boolean {
    const allValues = [
      ...Object.values(stats.technical),
      ...Object.values(stats.physical),
      ...Object.values(stats.mental),
    ];

    return allValues.every(value => value >= 0 && value <= 100);
  }

  /**
   * Update player tier
   */
  static updateTier(player: Player, newTier: 1 | 2 | 3 | 4): Player {
    return {
      ...player,
      tier: newTier,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate a unique player ID
   */
  private static generateId(): string {
    return `player-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
