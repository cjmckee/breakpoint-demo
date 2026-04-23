/**
 * Match Store
 * Manages match-internal state: orchestrator, scores, key moments, statistics.
 * Routing state (isMatchActive, showMatchResults) is now handled by gameStore's gamePhase.
 */

import { create } from 'zustand';
import {
  MatchScore,
  KeyMoment,
  InteractiveMatchConfig,
  PointResult as SimplePointResult,
} from '../types/keyMoments';
import { TacticalOption } from '../data/tacticalOptions';
import { MatchOrchestrator, AccumulatedMatchEffects } from '../game/MatchOrchestrator';
import { DEFAULT_KEY_MOMENTS_PER_MATCH } from '../config/matchRewards';
import { KeyMomentResult } from '../game/KeyMomentResolver';
import { narratePoint, narrateKeyMoment } from '../utils/matchNarrator';
import { MatchStatistics as IMatchStatistics } from '../types';
// No direct import of gameStore — the caller passes an onMatchComplete callback
// to startMatch() to avoid circular dependency.
import type { MatchCompletionData } from '../types/gamePhase';
import { trackKeyMomentDecided } from '../analytics/analytics';

interface MatchState {
  // Match configuration (kept for LiveMatchViewer to read opponent name, surface, etc.)
  matchConfig: InteractiveMatchConfig | null;

  // Match progress
  currentScore: MatchScore | null;
  matchHistory: Array<{
    pointNumber: number;
    winner: 'player' | 'opponent';
    score: MatchScore;
  }>;

  // Match statistics
  matchStatistics: IMatchStatistics | null;

  // Key moments
  currentKeyMoment: KeyMoment | null;
  isWaitingForChoice: boolean;
  lastKeyMomentResult: KeyMomentResult | null;
  showKeyMomentResult: boolean;
  lastChosenOption: TacticalOption | null;
  keyMomentHistory: Array<{
    keyMoment: KeyMoment;
    chosenOption: TacticalOption;
    result: KeyMomentResult;
  }>;

  // Match log for narration
  matchLog: string[];

  // Accumulated effects from key moment choices (surfaced for post-match)
  accumulatedEffects: AccumulatedMatchEffects | null;

  // Match orchestrator instance
  orchestrator: MatchOrchestrator | null;

  // Resolver for key moment promises
  keyMomentResolver: ((option: TacticalOption) => void) | null;
  // Resolver for key moment result display (blocks simulation until dismissed)
  keyMomentResultResolver: (() => void) | null;

  // Tutorial pause — blocks simulation until player dismisses the intro spotlight
  isTutorialPaused: boolean;
  tutorialPauseResolver: (() => void) | null;

  // Actions
  startMatch: (config: InteractiveMatchConfig, onComplete: (data: MatchCompletionData) => void) => Promise<void>;
  handleKeyMomentChoice: (option: TacticalOption) => void;
  setKeyMomentResult: (result: KeyMomentResult) => Promise<void>;
  hideKeyMomentResult: () => void;
  resumeFromTutorial: () => void;
  endMatch: () => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  // Initial state
  matchConfig: null,
  currentScore: null,
  matchHistory: [],
  matchLog: [],
  matchStatistics: null,
  currentKeyMoment: null,
  isWaitingForChoice: false,
  lastKeyMomentResult: null,
  showKeyMomentResult: false,
  lastChosenOption: null,
  keyMomentHistory: [],
  accumulatedEffects: null,
  orchestrator: null,
  keyMomentResolver: null,
  keyMomentResultResolver: null,
  isTutorialPaused: false,
  tutorialPauseResolver: null,

  // Start a new match
  startMatch: async (config: InteractiveMatchConfig, onComplete?: (data: MatchCompletionData) => void) => {
    const orchestrator = new MatchOrchestrator();

    // Create config with callbacks
    const matchConfig: InteractiveMatchConfig = {
      ...config,
      enableKeyMoments: config.enableKeyMoments ?? true,
      keyMomentsPerMatch: config.keyMomentsPerMatch ?? DEFAULT_KEY_MOMENTS_PER_MATCH,

      // Key moment callback - pauses match and waits for user choice
      onKeyMoment: async (keyMoment: KeyMoment): Promise<TacticalOption> => {
        return new Promise((resolve) => {
          set({
            currentKeyMoment: keyMoment,
            isWaitingForChoice: true,
            keyMomentResolver: resolve,
          });
        });
      },

      // Key moment result callback - shows result and blocks until user dismisses
      onKeyMomentResult: async (result: KeyMomentResult): Promise<void> => {
        return get().setKeyMomentResult(result);
      },

      // Point complete callback - narrate each point for match log
      onPointComplete: (pointResult: SimplePointResult) => {
        const playerName = config.playerName || 'You';
        const opponentName = config.opponentName || 'Opponent';
        const narration = narratePoint(pointResult, playerName, opponentName);
        set((s) => ({
          matchLog: [...s.matchLog, narration],
        }));
      },

      // Score update callback
      onScoreUpdate: (score: MatchScore) => {
        set({ currentScore: score });
      },

      // Stats update callback - updates live during match
      onStatsUpdate: (stats: IMatchStatistics) => {
        set({ matchStatistics: stats });
      },

      // Match complete callback — hand off to gameStore for phase transition
      onMatchComplete: (finalScore: MatchScore) => {
        // Store final data in matchStore for gameStore to read
        // These are always populated at match completion
        const statistics = orchestrator.getMatchStatistics()!;
        const effects = orchestrator.getAccumulatedEffects();

        set({
          currentScore: finalScore,
          matchStatistics: statistics,
          accumulatedEffects: effects,
          currentKeyMoment: null,
          isWaitingForChoice: false,
        });

        // Pass all match data to caller (gameStore) so it doesn't need to import matchStore
        onComplete?.({
          finalScore,
          matchStatistics: statistics,
          accumulatedEffects: effects,
          keyMomentHistory: get().keyMomentHistory,
        });
      },
    };

    set({
      matchConfig,
      orchestrator,
      currentScore: null,
      matchHistory: [],
      matchLog: [],
      matchStatistics: null,
      accumulatedEffects: null,
      keyMomentHistory: [],
      lastChosenOption: null,
    });

    // If this is a tutorial match, pause before simulation so player can read spotlight intro
    if (config.isTutorial) {
      await new Promise<void>((resolve) => {
        set({ isTutorialPaused: true, tutorialPauseResolver: resolve });
      });
      set({ isTutorialPaused: false, tutorialPauseResolver: null });
    }

    // Start match simulation (async)
    try {
      const finalScore = await orchestrator.simulateInteractiveMatch(matchConfig);
      // Get final statistics
      const statistics = orchestrator.getMatchStatistics();
      set({ currentScore: finalScore, matchStatistics: statistics });
    } catch (error) {
      console.error('Match simulation error:', error);
      set({
        currentKeyMoment: null,
        isWaitingForChoice: false,
      });
    }
  },

  // Handle user's key moment choice
  handleKeyMomentChoice: (option: TacticalOption) => {
    const { keyMomentResolver, currentKeyMoment } = get();

    if (!keyMomentResolver || !currentKeyMoment) {
      console.error('No key moment waiting for choice');
      return;
    }

    // Store the chosen option and keep currentKeyMoment for setKeyMomentResult
    set({
      isWaitingForChoice: false,
      lastChosenOption: option,
    });

    // Resolve the promise with the chosen option
    keyMomentResolver(option);

    // Clear resolver
    set({ keyMomentResolver: null });
  },

  // Set key moment result (called by orchestrator after resolving)
  // Returns a promise that blocks until the user dismisses the result modal
  setKeyMomentResult: (result: KeyMomentResult): Promise<void> => {
    const { currentKeyMoment, lastChosenOption, keyMomentHistory } = get();

    if (!currentKeyMoment || !lastChosenOption) {
      console.error('setKeyMomentResult called without currentKeyMoment or lastChosenOption in state');
      return Promise.resolve();
    }

    const historyEntry = {
      keyMoment: currentKeyMoment,
      chosenOption: lastChosenOption,
      result: result,
    };

    trackKeyMomentDecided(currentKeyMoment, lastChosenOption, result);

    // Add key moment narration to match log
    const kmPlayerName = get().matchConfig?.playerName || 'You';
    const kmNarration = narrateKeyMoment(result, kmPlayerName);
    const currentLog = get().matchLog;

    return new Promise<void>((resolve) => {
      set({
        lastKeyMomentResult: result,
        showKeyMomentResult: true,
        keyMomentHistory: [...keyMomentHistory, historyEntry],
        matchLog: [...currentLog, kmNarration],
        currentKeyMoment: null,
        lastChosenOption: null,
        keyMomentResultResolver: resolve,
      });
    });
  },

  // Hide key moment result and resume simulation
  hideKeyMomentResult: () => {
    const { keyMomentResultResolver } = get();

    set({
      showKeyMomentResult: false,
      lastKeyMomentResult: null,
      keyMomentResultResolver: null,
    });

    // Resolve the promise to unblock the orchestrator
    if (keyMomentResultResolver) {
      keyMomentResultResolver();
    }
  },

  // Resume match simulation after tutorial spotlight is dismissed
  resumeFromTutorial: () => {
    const { tutorialPauseResolver } = get();
    if (tutorialPauseResolver) {
      tutorialPauseResolver();
    }
  },

  // End match early
  endMatch: () => {
    const { orchestrator } = get();

    if (orchestrator) {
      orchestrator.cancelMatch();
    }

    set({
      currentKeyMoment: null,
      isWaitingForChoice: false,
      keyMomentResolver: null,
      keyMomentResultResolver: null,
      isTutorialPaused: false,
      tutorialPauseResolver: null,
    });
  },

  // Reset match state
  resetMatch: () => {
    const { orchestrator } = get();

    if (orchestrator) {
      orchestrator.cancelMatch();
    }

    set({
      matchConfig: null,
      currentScore: null,
      matchHistory: [],
      matchLog: [],
      matchStatistics: null,
      accumulatedEffects: null,
      currentKeyMoment: null,
      isWaitingForChoice: false,
      lastChosenOption: null,
      keyMomentHistory: [],
      orchestrator: null,
      keyMomentResolver: null,
      keyMomentResultResolver: null,
      isTutorialPaused: false,
      tutorialPauseResolver: null,
    });
  },
}));
