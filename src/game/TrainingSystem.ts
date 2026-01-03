/**
 * Training System
 * Handles training session generation, tier assignment, and stat boosts
 * Converted from Python training_service.py
 */

import {
  TrainingSession,
  TrainingSessionType,
  TrainingSessionTier,
  TierModification,
  TrainingCategory,
  TIER_CONFIGS,
  DEFAULT_TIER_PROBABILITIES,
  Ability,
  AbilityRarity,
  AbilityName,
  StatBoosts,
  Modifiers,
  Player,
  TrainingResult,
} from '../types/game';
import { ItemManager } from './ItemManager';

// Training session base configurations
interface TrainingConfig {
  name: string;
  category: TrainingCategory;
  energyCost: number;
  statBoosts: Record<string, number>;
  ability?: string;
  description: string;
}

const TRAINING_SESSION_CONFIGS: Record<TrainingSessionType, TrainingConfig> = {
  groundstroke_training: {
    name: 'Groundstroke Training',
    category: 'technical',
    energyCost: 20,
    statBoosts: {
      forehand: 1,
      backhand: 1,
      stamina: 1,
    },
    ability: AbilityName.BASELINER,
    description: 'Focus on forehand and backhand technique',
  },
  serve_volley_training: {
    name: 'Serve & Volley Training',
    category: 'technical',
    energyCost: 20,
    statBoosts: {
      serve: 1,
      volley: 1,
      focus: 1,
    },
    ability: AbilityName.NETCRASHER,
    description: 'Master the serve and net game',
  },
  footwork_training: {
    name: 'Footwork Training',
    category: 'physical',
    energyCost: 25,
    statBoosts: {
      speed: 1,
      agility: 1,
    },
    ability: AbilityName.SPEED_DEMON,
    description: 'Improve court coverage and movement',
  },
  sports_psychology: {
    name: 'Sports Psychology',
    category: 'mental',
    energyCost: 10,
    statBoosts: {
      focus: 1,
      anticipation: 1,
      shotVariety: 1,
    },
    ability: AbilityName.MENTAL_FORTITUDE,
    description: 'Mental game and tactical awareness',
  },
  strength_training: {
    name: 'Strength Training',
    category: 'physical',
    energyCost: 30,
    statBoosts: {
      forehand: 1,
      strength: 1,
      focus: 1,
    },
    ability: AbilityName.HEAVY_HITTER,
    description: 'Build power and endurance',
  },
  overhead_academy: {
    name: 'Overhead Academy',
    category: 'physical',
    energyCost: 25,
    statBoosts: {
      overhead: 2,
      offensive: 1,
    },
    ability: AbilityName.OVERHEAD_SMASH,
    description: 'Master closing out the point at the net',
  },
  return_rapidfire: {
    name: 'Return Rapidfire',
    category: 'physical',
    energyCost: 35,
    statBoosts: {
      return: 2,
      defensive: 1
    },
    ability: AbilityName.RANGY_RETURN,
    description: 'Improve return of serve and defensive play',
  },
  spin_specialist: {
    name: 'Spin Specialist',
    category: 'technical',
    energyCost: 30,
    statBoosts: {
      spin: 2,
      dropShot: 1
    },
    ability: AbilityName.SPIN_MASTER,
    description: 'Practice the art of spin shots',
  },
  remote_coaching: {
    name: 'Remote Coaching',
    category: 'mental',
    energyCost: 15,
    statBoosts: {
      recovery: 1,
      offensive: 1,
      defensive: 1
    },
    ability: AbilityName.NATIONAL_ICON,
    description: 'Receive coaching tips and strategies from a famous coach online',
  }
};

export class TrainingSystem {
  /**
   * Get maximum training tier available based on player tier
   * Tier 1 = bronze only
   * Tier 2 = bronze, silver
   * Tier 3 = bronze, silver, gold
   * Tier 4 = bronze, silver, gold, diamond
   */
  private static getMaxTrainingTierForPlayerTier(playerTier: number): TrainingSessionTier[] {
    const tierMap: Record<number, TrainingSessionTier[]> = {
      1: ['bronze'],
      2: ['bronze', 'silver'],
      3: ['bronze', 'silver', 'gold'],
      4: ['bronze', 'silver', 'gold', 'diamond'],
    };
    return tierMap[playerTier] || ['bronze'];
  }

  /**
   * Generate available training sessions for the current time slot
   */
  static getAvailableTrainingSessions(
    player: Player,
    mood: number,
    lastTrainingType?: TrainingSessionType,
    numOptions: number = 2
  ): TrainingSession[] {
    // Get available session types (exclude last training type)
    const availableTypes = this.getAvailableSessionTypes(lastTrainingType);

    // Randomly select training options
    const selectedTypes = this.randomSample(availableTypes, Math.min(numOptions, availableTypes.length));

    // Generate sessions with tier assignments (respecting player tier)
    return selectedTypes.map(sessionType =>
      this.createTrainingSession(sessionType, mood, player.tier)
    );
  }

  /**
   * Create a training session with tier assignment and mood effects
   */
  static createTrainingSession(
    sessionType: TrainingSessionType,
    playerMood: number,
    playerTier: number = 1
  ): TrainingSession {
    const config = TRAINING_SESSION_CONFIGS[sessionType];

    // Get allowed tiers for this player
    const allowedTiers = this.getMaxTrainingTierForPlayerTier(playerTier);

    // Assign tier based on probabilities, but only from allowed tiers
    const initialTier = this.assignTier(allowedTiers);

    // Apply mood effects to tier (but still respect allowed tiers)
    const { finalTier, tierModification } = this.applyMoodEffects(initialTier, playerMood, allowedTiers);

    // Get tier configuration and scale stat boosts
    const tierConfig = TIER_CONFIGS[finalTier];
    const scaledStatBoosts: Record<string, number> = {};

    for (const [stat, baseBoost] of Object.entries(config.statBoosts)) {
      scaledStatBoosts[stat] = Math.round(baseBoost * tierConfig.statMultiplier);
    }

    // Calculate energy cost - silver tier gets 15 energy discount
    let finalEnergyCost = config.energyCost;
    if (finalTier === 'silver') {
      finalEnergyCost = Math.max(5, config.energyCost - 15); // Minimum 5 energy
    }

    return {
      id: `${sessionType}-${Date.now()}`,  // Unique ID for UI
      sessionType,
      category: config.category,
      tier: finalTier,
      energyCost: finalEnergyCost,
      timeSlotsRequired: 1,
      statBoosts: scaledStatBoosts,
      statMultiplier: tierConfig.statMultiplier,  // Include multiplier for UI
      name: config.name,
      description: config.description,
      ability: config.ability,
      tierModification,
    };
  }

  /**
   * Execute a training session and return results
   */
  static executeTraining(
    player: Player,
    session: TrainingSession,
    currentEnergy: number
  ): TrainingResult {
    if (currentEnergy < session.energyCost) {
      throw new Error('Not enough energy for this training session');
    }

    // Check for and apply next activity buffs
    let finalStatBoosts = { ...session.statBoosts };
    let buffApplied: Modifiers | undefined;

    if (player.nextActivityBuffs) {
      console.log('[Training] Applying consumable buffs:', player.nextActivityBuffs);
      buffApplied = player.nextActivityBuffs;

      // Merge buff stat boosts with training stat boosts
      if (player.nextActivityBuffs.statBoosts) {
        Object.entries(player.nextActivityBuffs.statBoosts).forEach(([stat, value]) => {
          finalStatBoosts[stat] = (finalStatBoosts[stat] || 0) + value;
        });
      }
    }

    // Calculate ability roll for diamond tier
    let abilityGained: string | undefined;
    let abilityLevel = 1;
    let roll: number | undefined;
    let threshold: number | undefined;
    let baseChance: number | undefined;

    if (session.tier === 'diamond' && session.ability) {
      const abilityRoll = this.rollForAbility(session);
      // Always store roll details for UI display
      roll = abilityRoll.roll;
      threshold = abilityRoll.threshold;
      baseChance = abilityRoll.baseChance;

      // Only set ability gained if successful
      if (abilityRoll.success && abilityRoll.abilityName) {
        abilityGained = abilityRoll.abilityName;
      }
    }

    // Calculate mood result (training affects mood slightly)
    const moodChange = this.calculateMoodChange(session.tier);

    const result: TrainingResult = {
      id: this.generateId(),
      type: 'training',
      source: 'training_activity',
      timestamp: new Date().toISOString(),
      statBoosts: finalStatBoosts, // Use boosted stats if buff was applied
      energyCost: session.energyCost,
      timeSlotsUsed: session.timeSlotsRequired,
      trainingType: session.sessionType,
      trainingName: session.name,
      efficiency: 1.0, // TODO: Add efficiency modifiers based on abilities/equipment
      moodResult: moodChange,
      moodChange,  // Added for UI
      sessionTier: session.tier,
      tier: session.tier,  // Alias for UI
      sessionType: session.sessionType,
      ability: session.ability,
      tierModification: session.tierModification,
      abilityGained,
      abilityLevel: abilityGained ? abilityLevel : undefined,
      roll,
      threshold,
      baseChance,
      message: this.generateTrainingMessage(session.tier, abilityGained),  // Success message for UI
    };

    return result;
  }

  /**
   * Roll for ability gain in diamond tier training
   */
  static rollForAbility(session: TrainingSession): {
    success: boolean;
    abilityName?: string;
    roll?: number;
    threshold?: number;
    baseChance?: number;
  } {
    if (!session.ability) {
      return { success: false };
    }

    const tierConfig = TIER_CONFIGS[session.tier];
    const baseChance = tierConfig.abilityChance;

    if (baseChance === 0) {
      return { success: false };
    }

    const roll = Math.random() * 100;
    const threshold = baseChance;

    return {
      success: roll <= threshold,
      abilityName: roll <= threshold ? session.ability : undefined,
      roll,
      threshold,
      baseChance,
    };
  }

  /**
   * Assign a tier based on default probabilities, filtered by allowed tiers
   */
  private static assignTier(allowedTiers: TrainingSessionTier[]): TrainingSessionTier {
    // Filter probabilities to only include allowed tiers
    const filteredProbabilities: Partial<Record<TrainingSessionTier, number>> = {};
    let totalProbability = 0;

    for (const tier of allowedTiers) {
      const prob = DEFAULT_TIER_PROBABILITIES[tier];
      filteredProbabilities[tier] = prob;
      totalProbability += prob;
    }

    // Normalize probabilities to sum to 100
    const normalizedProbabilities: Record<string, number> = {};
    for (const tier of allowedTiers) {
      const prob = filteredProbabilities[tier] || 0;
      normalizedProbabilities[tier] = (prob / totalProbability) * 100;
    }

    // Roll for tier
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const tier of allowedTiers) {
      cumulative += normalizedProbabilities[tier];
      if (rand <= cumulative) {
        return tier;
      }
    }

    // Fallback to first allowed tier
    return allowedTiers[0];
  }

  /**
   * Apply mood effects to training tier
   * Mood < -50: demote 1 tier
   * Mood -50 to 0: 50% chance demote
   * Mood 0 to 50: 50% chance promote
   * Mood > 50: promote 1 tier
   * Respects allowed tiers based on player tier
   */
  private static applyMoodEffects(
    initialTier: TrainingSessionTier,
    playerMood: number,
    allowedTiers: TrainingSessionTier[]
  ): { finalTier: TrainingSessionTier; tierModification?: TierModification } {
    const currentIndex = allowedTiers.indexOf(initialTier);
    if (currentIndex === -1) {
      // Tier not in allowed list, return as-is
      return { finalTier: initialTier };
    }

    let newIndex = currentIndex;
    let modification: TierModification | undefined;

    if (playerMood < -50) {
      // Demote 1 tier
      newIndex = Math.max(0, currentIndex - 1);
      modification = newIndex !== currentIndex ? 'demoted' : undefined;
    } else if (playerMood < 0) {
      // 50% chance to demote
      if (Math.random() < 0.5) {
        newIndex = Math.max(0, currentIndex - 1);
        modification = newIndex !== currentIndex ? 'demoted' : undefined;
      }
    } else if (playerMood < 50) {
      // 50% chance to promote
      if (Math.random() < 0.5) {
        newIndex = Math.min(allowedTiers.length - 1, currentIndex + 1);
        modification = newIndex !== currentIndex ? 'promoted' : undefined;
      }
    } else {
      // Promote 1 tier
      newIndex = Math.min(allowedTiers.length - 1, currentIndex + 1);
      modification = newIndex !== currentIndex ? 'promoted' : undefined;
    }

    return {
      finalTier: allowedTiers[newIndex],
      tierModification: modification,
    };
  }

  /**
   * Calculate mood change from training
   * Higher tier = more mood boost
   */
  private static calculateMoodChange(tier: TrainingSessionTier): number {
    const moodBoosts = {
      bronze: 2,
      silver: 4,
      gold: 6,
      diamond: 10,
    };

    return moodBoosts[tier];
  }

  /**
   * Generate training success message based on tier and ability gain
   */
  private static generateTrainingMessage(tier: TrainingSessionTier, abilityGained?: string): string {
    if (abilityGained) {
      return `Excellent ${tier} tier training! You gained a new ability!`;
    }

    const messages = {
      bronze: 'Good training session. You made some progress.',
      silver: 'Great training session! Noticeable improvements.',
      gold: 'Excellent training session! Significant gains!',
      diamond: 'Outstanding training session! Exceptional progress!',
    };

    return messages[tier];
  }

  /**
   * Get available session types, excluding the last one trained
   * Automatically uses all configured training types
   */
  private static getAvailableSessionTypes(excludedType?: TrainingSessionType): TrainingSessionType[] {
    // Get all training types from the configurations
    const allTypes = Object.keys(TRAINING_SESSION_CONFIGS) as TrainingSessionType[];

    if (excludedType) {
      return allTypes.filter(type => type !== excludedType);
    }

    return allTypes;
  }

  /**
   * Random sample from array
   */
  private static randomSample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `training-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
