/**
 * Game Phase State Machine
 *
 * Single discriminated union replacing all independent routing/modal state:
 * - currentScreen (gameStore)
 * - isMatchActive / showMatchResults / finalScore (matchStore)
 * - currentModal / modalQueue (gameStore)
 * - useEffect-based navigation triggers
 *
 * Each phase carries exactly the data needed for that screen.
 * Transitions are explicit synchronous actions — no setTimeout, no effects.
 */

import type { MatchScore, InteractiveMatchConfig } from './keyMoments';
import type { MatchStatistics } from './index';
import type { MatchReward, OpponentTier, TrainingResult, StoryMatchMetadata, PlayerStats } from './game';
import type { StoryEvent, StoryEventOption, StoryEventResult } from './storyEvents';
import type { TacticalOption } from '../data/tacticalOptions';
import type { KeyMomentResult } from '../game/KeyMomentResolver';
import type { AccumulatedMatchEffects } from '../game/MatchOrchestrator';

// ============================================================================
// GAME PHASE — the single source of truth for "where are we?"
// ============================================================================

export type GamePhase =
  | { type: 'uninitialized' }
  | { type: 'welcome' }
  | { type: 'player_creation' }
  | IdlePhase
  | { type: 'training' }
  | StoryEventPhase
  | StoryEventResultPhase
  | MatchSetupPhase
  | MatchActivePhase
  | MatchResultsPhase
  | { type: 'tournament_list' }
  | { type: 'inventory' };

// ============================================================================
// PHASE INTERFACES
// ============================================================================

/** Main menu — player picks an activity. Optional overlay for training results or events. */
export interface IdlePhase {
  type: 'idle';
  overlay: OverlayState | null;
}

/** Interactive story event — player must pick an option or dismiss. */
export interface StoryEventPhase {
  type: 'story_event';
  event: StoryEvent;
  availableOptions: StoryEventOption[];
  /** Where to go after this event chain completes */
  continuation: PhaseContinuation;
}

/** Showing the result of a story event choice. */
export interface StoryEventResultPhase {
  type: 'story_event_result';
  result: StoryEventResult;
  /** Where to go after dismissing this result */
  continuation: PhaseContinuation;
}

/** Pre-match screen — shows opponent info, "Play Match" button. */
export interface MatchSetupPhase {
  type: 'match_setup';
  matchType: MatchType;
  /** null for regular matches where the user picks their opponent in the UI */
  matchConfig: PreMatchConfig | null;
}

/** Match in progress — LiveMatchViewer + KeyMomentModal. */
export interface MatchActivePhase {
  type: 'match_active';
  matchType: MatchType;
  matchConfig: InteractiveMatchConfig;
  /** Preserved from match setup for post-match event lookup */
  storyMatchMetadata?: StoryMatchMetadata;
}

/** Match results screen — rewards already applied, purely presentational. */
export interface MatchResultsPhase {
  type: 'match_results';
  matchType: MatchType;
  finalScore: MatchScore;
  matchStatistics: MatchStatistics;
  rewards: MatchReward;
  matchConfig: InteractiveMatchConfig;
  accumulatedEffects: AccumulatedMatchEffects | null;
  keyMomentHistory: KeyMomentHistoryEntry[];
  /** Preserved from match setup for post-match event lookup */
  storyMatchMetadata?: StoryMatchMetadata;
  /** The tournament round index that was just played (before advancing) */
  tournamentRoundPlayed?: number;
  /** The tournament ID for post-match event lookup (needed when tournament ends mid-match) */
  tournamentId?: string;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export type MatchType = 'regular' | 'tournament' | 'story';

/** Pre-resolved match configuration for tournament/story matches. */
export interface PreMatchConfig {
  opponentName: string;
  opponentStats: PlayerStats;
  opponentTier: OpponentTier;
  opponentDescription?: string;
  surface: 'hard' | 'clay' | 'grass' | 'carpet';
  matchFormat: 'best-of-1' | 'best-of-3';
  matchTitle?: string;
  matchDescription?: string;
  /** Original metadata for story matches (needed for post-match event lookup) */
  storyMatchMetadata?: StoryMatchMetadata;
}

/** Key moment history entry — stored during match, passed to results phase. */
export interface KeyMomentHistoryEntry {
  keyMoment: { id: string; type: string; situation: string };
  chosenOption: TacticalOption;
  result: KeyMomentResult;
}

// ============================================================================
// OVERLAYS — modals shown on top of the idle (main menu) screen
// ============================================================================

export type OverlayState =
  | TrainingResultOverlay
  | StoryEventOverlay
  | StoryEventResultOverlay;

export interface TrainingResultOverlay {
  type: 'training_result';
  result: TrainingResult;
}

export interface StoryEventOverlay {
  type: 'story_event';
  event: StoryEvent;
  availableOptions: StoryEventOption[];
  continuation: PhaseContinuation;
}

export interface StoryEventResultOverlay {
  type: 'story_event_result';
  result: StoryEventResult;
  continuation: PhaseContinuation;
}

// ============================================================================
// CONTINUATION — explicit "where to go next" chain, replaces modal queue
// ============================================================================

export type PhaseContinuation =
  | { type: 'idle' }
  | { type: 'match_setup'; matchType: MatchType; matchConfig: PreMatchConfig }
  | { type: 'story_event'; event: StoryEvent; availableOptions: StoryEventOption[] };

// ============================================================================
// MATCH COMPLETION — data passed from matchStore → component → gameStore
// ============================================================================

/** All data needed for gameStore.onMatchComplete, avoiding store-to-store imports. */
export interface MatchCompletionData {
  finalScore: MatchScore;
  matchStatistics: MatchStatistics;
  accumulatedEffects: AccumulatedMatchEffects | null;
  keyMomentHistory: KeyMomentHistoryEntry[];
}
