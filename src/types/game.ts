/**
 * Game System Type Definitions
 * Ported from ai-slop-gaming and adapted for ai-slop-tennis
 */

import type { PlayerStats } from './index';
import type { StoryEventResult } from './storyEvents';
import type { Item, EquipmentSlot } from './items';
import type { ActiveTournament, TournamentMatchMetadata } from './tournaments';

export type { PlayerStats };

// ============================================================================
// STAT BOOSTS
// ============================================================================

export interface StatBoosts {
  serve?: number;
  forehand?: number;
  backhand?: number;
  volley?: number;
  overhead?: number;
  dropShot?: number;
  slice?: number;
  return?: number;
  spin?: number;
  placement?: number;
  speed?: number;
  stamina?: number;
  strength?: number;
  agility?: number;
  focus?: number;
  anticipation?: number;
  shotVariety?: number;
  recovery?: number;
  offensive?: number;
  defensive?: number;
}

// ============================================================================
// ABILITIES SYSTEM
// ============================================================================

export enum AbilityRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary',
}

export interface Ability {
  name: string;
  level: number;
  rarity: AbilityRarity;
  modifiers: Modifiers;
  description: string;
  effects: string;
}

export interface Modifiers {
  statBoosts: StatBoosts;
  additional?: Record<string, number>;
}

export const AbilityName = {
  // common
  BASELINER: 'baseliner',
  NETCRASHER: 'netcrasher',
  SLIDER: 'slider',
  CLUTCH: 'clutch',
  HEAVY_HITTER: 'heavy_hitter',
  OVERHEAD_SMASH: 'overhead_smash',
  RANGY_RETURN: 'rangy_return',
  SPIN_MASTER: 'spin_master',
  NATIONAL_ICON: 'national_icon',

  // uncommon
  SPEED_DEMON: 'speed_demon',

  // rare
  MENTAL_FORTITUDE: 'mental_fortitude',

  // legendary
  LEGENDARY_FOCUS: 'legendary_focus',
} as const;

// ============================================================================
// TRAINING SYSTEM
// ============================================================================

export type TrainingSessionType =
  | 'groundstroke_training'
  | 'serve_volley_training'
  | 'footwork_training'
  | 'sports_psychology'
  | 'strength_training'
  | 'overhead_academy'
  | 'return_rapidfire'
  | 'spin_specialist'
  | 'remote_coaching';

export type TrainingCategory = 'technical' | 'physical' | 'mental';

export type TrainingSessionTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type TierModification = 'promoted' | 'demoted';

export interface TrainingSession {
  id: string;  // Added for UI key prop
  sessionType: TrainingSessionType;
  category: TrainingCategory;
  tier: TrainingSessionTier;
  energyCost: number;
  timeSlotsRequired: number;
  statBoosts: Record<string, number>;
  statMultiplier: number;  // Added for UI display
  name: string;
  description?: string;
  ability?: string;
  tierModification?: TierModification;
}

export interface TierConfig {
  statMultiplier: number;
  abilityChance: number;
}

export const TIER_CONFIGS: Record<TrainingSessionTier, TierConfig> = {
  bronze: { statMultiplier: 1, abilityChance: 0 },
  silver: { statMultiplier: 1, abilityChance: 0 },
  gold: { statMultiplier: 2, abilityChance: 0 },
  diamond: { statMultiplier: 3, abilityChance: 30 },
};

export const DEFAULT_TIER_PROBABILITIES: Record<TrainingSessionTier, number> = {
  bronze: 50,
  silver: 25,
  gold: 10,
  diamond: 5,
};

// ============================================================================
// TIME MANAGEMENT
// ============================================================================

export enum TimeSlot {
  MORNING = 0,
  AFTERNOON = 1,
  EVENING = 2,
  NIGHT = 3,
}

export const TIME_SLOT_NAMES: Record<TimeSlot, string> = {
  [TimeSlot.MORNING]: 'Morning',
  [TimeSlot.AFTERNOON]: 'Afternoon',
  [TimeSlot.EVENING]: 'Evening',
  [TimeSlot.NIGHT]: 'Night',
};

export interface TournamentCompletion {
  tournamentId: string;
  won: boolean;  // True if player won the championship
  completedAt: string;
}

export interface GameCalendar {
  currentSeason: number;
  currentDay: number;
  currentTimeSlot: TimeSlot;
  // Note: energy and mood are tracked in CurrentStatus, not in the calendar

  // Scheduled events and tournament state
  scheduledEvents: ScheduledEvent[];
  activeTournament: ActiveTournament | null;
  completedTournaments: TournamentCompletion[];
}

/**
 * Metadata for story-driven matches scheduled via story events
 * Similar to TournamentMatchMetadata but for non-tournament matches
 */
export interface StoryMatchMetadata {
  // Opponent info (character from CHARACTERS registry)
  opponentId: string;
  opponentName: string;
  opponentStats: PlayerStats;
  opponentTier: OpponentTier;
  opponentDescription?: string;

  // Story event linkage
  prematchEventId?: string;     // Optional: event to play before match
  winEventId: string;           // Required: event to play after winning
  lossEventId: string;          // Required: event to play after losing

  // Match configuration
  surface?: 'hard' | 'clay' | 'grass' | 'carpet';
  matchFormat?: 'best-of-1' | 'best-of-3';

  // Display info
  matchTitle?: string;          // e.g., "Challenge Match vs Keith"
  matchDescription?: string;    // Story context for the match
}

/**
 * Union type for all scheduled event metadata types
 * Each eventType has its corresponding metadata type
 */
export type ScheduledEventMetadata =
  | TournamentMatchMetadata
  | StoryMatchMetadata
  | Record<string, unknown>;  // For training, story, rest which have no fixed schema (yet)

/**
 * Generic scheduled event
 * Can represent any activity scheduled for a specific day/time slot
 */
export interface ScheduledEvent {
  eventType: 'tournament_match' | 'training' | 'story' | 'rest' | 'story_match';
  scheduledDay: number;
  scheduledTimeSlot: TimeSlot;
  metadata?: ScheduledEventMetadata;
}

/**
 * Scheduled event template for story event outcomes
 * Uses relative days instead of absolute days, resolved at runtime
 */
export interface ScheduledEventTemplate {
  eventType: 'tournament_match' | 'training' | 'story' | 'rest' | 'story_match';
  relativeDays: number;  // Days from current day (1 = tomorrow)
  scheduledTimeSlot: TimeSlot;
  metadata?: ScheduledEventMetadata;
}

export interface TimeDisplayInfo {
  season: number;
  day: number;
  timeSlot: TimeSlot;
  timeSlotName: string;
  formattedDisplay: string;
}

export interface EnergyDisplayInfo {
  current: number;
  max: number;
  percentage: number;
  efficiency: number;
  costModifier: string;
}

export interface MoodDisplayInfo {
  value: number;
  description: string;
  color: string;
  emoji: string;
}

// ============================================================================
// ACTIVITY SYSTEM
// ============================================================================

export type ActivityType =
  | 'training'
  | 'match'
  | 'story'
  | 'rest'
  | 'tournament_match'
  | 'skip';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  timeSlotsUsed: number;
  energyCost: number;
  moodResult: number;
}

export interface TrainingResult extends Activity {
  type: 'training';
  source: 'training_activity';
  statBoosts: Record<string, number>;
  trainingType: string;
  trainingName: string;
  efficiency: number;
  abilityGained?: string;
  abilityLevel?: number;
  tierModification?: TierModification;
  sessionTier?: TrainingSessionTier;
  tier?: TrainingSessionTier;  // Alias for sessionTier
  sessionType?: string;
  ability?: string;
  roll?: number;
  threshold?: number;
  baseChance?: number;
  message?: string;  // Success message
  moodChange: number;  // Mood change from training
}

// ============================================================================
// MATCH REWARDS SYSTEM
// ============================================================================

export type OpponentTier = 1 | 2 | 3 | 4;

export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'bad';

export interface PerformanceRewardBreakdown {
  servingScore: number;
  returningScore: number;
  rallyScore: number;
  netPlayScore: number;
  mentalScore: number;
  overallScore: number;

  rewardedCategories: {
    serving?: StatBoosts;
    returning?: StatBoosts;
    rallying?: StatBoosts;
    netPlay?: StatBoosts;
    mental?: StatBoosts;
  };
}

export interface MatchReward {
  statBoosts: StatBoosts;
  moodChange: number;
  energyChange?: number;
  experience: number;
  abilitiesGained?: Ability[];
  itemsGained?: Item[];
  performanceBreakdown: PerformanceRewardBreakdown;
}

export interface MatchResult extends Activity {
  type: 'match';
  source: 'match_activity';
  opponent: string;
  opponentTier?: OpponentTier;
  result: 'win' | 'loss' | 'draw';
  score: string;
  duration: number;
  courtSurface: 'hard' | 'clay' | 'grass' | 'carpet';
  statChanges: StatBoosts;
  experienceGained: number;
  matchType: 'friendly' | 'tournament' | 'league';
  highlights: string[];
  reward?: MatchReward;
  tierUnlocked?: OpponentTier | null;
}

export interface RestResult extends Activity {
  type: 'rest';
  source: 'rest_activity';
  restType: 'light' | 'moderate' | 'deep';
  energyRestored: number;
  recoveryBonus?: number;
  stressReduction?: number;
}

export interface TournamentMatchResult extends Omit<MatchResult, 'type' | 'source'> {
  type: 'tournament_match';
  source: 'tournament_match_activity';
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  bracket: 'winner' | 'loser';
}

export type ActivityResult = TrainingResult | MatchResult | TournamentMatchResult | RestResult | StoryEventResult;

// ============================================================================
// PLAYER & GAME STATE
// ============================================================================

export interface Player {
  id: string;
  name: string;
  stats: PlayerStats;
  abilities: Ability[];

  // Item system
  inventory: Item[];  // Regular items (max 10)
  equippedItems: Record<EquipmentSlot, Item | null>;  // 4 equipment slots
  storyItems: Item[];  // Story items (no limit, don't count toward inventory)
  nextActivityBuffs: Modifiers | null;  // Temporary buffs from consumables

  level: number;
  experience: number;
  matchesPlayed?: number;
  matchesWon?: number;
  tier: OpponentTier;  // Player's current tier (1-4) determines available opponents and training
  latestMatchResults?: ('win' | 'loss')[];  // Rolling record of last 10 match results (newest first)
  createdAt: string;
  updatedAt: string;
}

// Simplified CurrentStatus for our architecture
export interface CurrentStatus {
  energy: number;
  mood: number;
  lastActivity: ActivityResult | null;
}

// Game state used in our simplified architecture
export interface GameState {
  player: Player | null;
  calendar: GameCalendar;
  currentStatus: CurrentStatus;
  activityHistory: ActivityResult[];
  isInitialized: boolean;
  currentScreen: 'welcome' | 'player-creation' | 'main-menu' | 'training' | 'match' | 'rest';
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  technical: {
    serve: 20,
    forehand: 20,
    backhand: 20,
    volley: 20,
    overhead: 20,
    dropShot: 20,
    slice: 20,
    return: 20,
    spin: 20,
    placement: 20,
  },
  physical: {
    speed: 20,
    stamina: 20,
    strength: 20,
    agility: 20,
    recovery: 20,
  },
  mental: {
    focus: 20,
    anticipation: 20,
    shotVariety: 20,
    offensive: 20,
    defensive: 20,
  },
};

export const DEFAULT_CALENDAR: GameCalendar = {
  currentSeason: 1,
  currentDay: 1,
  currentTimeSlot: TimeSlot.MORNING,
  scheduledEvents: [],
  activeTournament: null,
  completedTournaments: [],
};
