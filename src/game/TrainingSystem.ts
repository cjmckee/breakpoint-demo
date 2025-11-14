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
};

export class TrainingSystem {
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

    // Generate sessions with tier assignments
    return selectedTypes.map(sessionType =>
      this.createTrainingSession(sessionType, mood)
    );
  }

  /**
   * Create a training session with tier assignment and mood effects
   */
  static createTrainingSession(
    sessionType: TrainingSessionType,
    playerMood: number
  ): TrainingSession {
    const config = TRAINING_SESSION_CONFIGS[sessionType];

    // Assign tier based on probabilities
    const initialTier = this.assignTier();

    // Apply mood effects to tier
    const { finalTier, tierModification } = this.applyMoodEffects(initialTier, playerMood);

    // Get tier configuration and scale stat boosts
    const tierConfig = TIER_CONFIGS[finalTier];
    const scaledStatBoosts: Record<string, number> = {};

    for (const [stat, baseBoost] of Object.entries(config.statBoosts)) {
      scaledStatBoosts[stat] = Math.round(baseBoost * tierConfig.statMultiplier);
    }

    return {
      id: `${sessionType}-${Date.now()}`,  // Unique ID for UI
      sessionType,
      category: config.category,
      tier: finalTier,
      energyCost: config.energyCost,
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

    // Calculate ability roll for diamond tier
    let abilityGained: string | undefined;
    let abilityLevel = 1;
    let roll: number | undefined;
    let threshold: number | undefined;
    let baseChance: number | undefined;

    if (session.tier === 'diamond' && session.ability) {
      const abilityRoll = this.rollForAbility(session);
      if (abilityRoll.success && abilityRoll.abilityName) {
        abilityGained = abilityRoll.abilityName;
        roll = abilityRoll.roll;
        threshold = abilityRoll.threshold;
        baseChance = abilityRoll.baseChance;
      }
    }

    // Calculate mood result (training affects mood slightly)
    const moodChange = this.calculateMoodChange(session.tier);

    const result: TrainingResult = {
      id: this.generateId(),
      type: 'training',
      source: 'training_activity',
      timestamp: new Date().toISOString(),
      statBoosts: session.statBoosts,
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
   * Assign a tier based on default probabilities
   */
  private static assignTier(): TrainingSessionTier {
    const rand = Math.random() * 100; // 0-100

    let cumulative = 0;
    const tiers: TrainingSessionTier[] = ['bronze', 'silver', 'gold', 'diamond'];

    for (const tier of tiers) {
      cumulative += DEFAULT_TIER_PROBABILITIES[tier];
      if (rand <= cumulative) {
        return tier;
      }
    }

    return 'bronze'; // Fallback
  }

  /**
   * Apply mood effects to training tier
   * Mood < -50: demote 1 tier
   * Mood -50 to 0: 50% chance demote
   * Mood 0 to 50: 50% chance promote
   * Mood > 50: promote 1 tier
   */
  private static applyMoodEffects(
    initialTier: TrainingSessionTier,
    playerMood: number
  ): { finalTier: TrainingSessionTier; tierModification?: TierModification } {
    const tierOrder: TrainingSessionTier[] = ['bronze', 'silver', 'gold', 'diamond'];
    const currentIndex = tierOrder.indexOf(initialTier);

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
        newIndex = Math.min(tierOrder.length - 1, currentIndex + 1);
        modification = newIndex !== currentIndex ? 'promoted' : undefined;
      }
    } else {
      // Promote 1 tier
      newIndex = Math.min(tierOrder.length - 1, currentIndex + 1);
      modification = newIndex !== currentIndex ? 'promoted' : undefined;
    }

    return {
      finalTier: tierOrder[newIndex],
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
   */
  private static getAvailableSessionTypes(excludedType?: TrainingSessionType): TrainingSessionType[] {
    const allTypes: TrainingSessionType[] = [
      'groundstroke_training',
      'serve_volley_training',
      'footwork_training',
      'sports_psychology',
      'strength_training',
    ];

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
