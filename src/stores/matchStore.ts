/**
 * Match Store
 * Manages match state, key moments, and interactive match flow
 */

import { create } from 'zustand';
import {
  MatchScore,
  KeyMoment,
  InteractiveMatchConfig,
} from '../types/keyMoments';
import { PlayerStats } from '../types/game';
import { TacticalOption } from '../data/tacticalOptions';
import { MatchOrchestrator } from '../game/MatchOrchestrator';
import { KeyMomentResult } from '../game/KeyMomentResolver';
import { MatchStatistics as IMatchStatistics } from '../types';

interface MatchState {
  // Match configuration
  isMatchActive: boolean;
  matchConfig: InteractiveMatchConfig | null;

  // Match progress
  currentScore: MatchScore | null;
  finalScore: MatchScore | null;
  showMatchResults: boolean;
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
  keyMomentHistory: Array<{
    keyMoment: KeyMoment;
    chosenOption: TacticalOption;
    result: KeyMomentResult;
  }>;

  // Match orchestrator instance
  orchestrator: MatchOrchestrator | null;

  // Resolver for key moment promises
  keyMomentResolver: ((option: TacticalOption) => void) | null;

  // Actions
  startMatch: (config: InteractiveMatchConfig) => Promise<void>;
  handleKeyMomentChoice: (option: TacticalOption) => void;
  setKeyMomentResult: (result: KeyMomentResult) => void;
  hideKeyMomentResult: () => void;
  hideMatchResults: () => void;
  endMatch: () => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  // Initial state
  isMatchActive: false,
  matchConfig: null,
  currentScore: null,
  finalScore: null,
  showMatchResults: false,
  matchHistory: [],
  matchStatistics: null,
  currentKeyMoment: null,
  isWaitingForChoice: false,
  lastKeyMomentResult: null,
  showKeyMomentResult: false,
  keyMomentHistory: [],
  orchestrator: null,
  keyMomentResolver: null,

  // Start a new match
  startMatch: async (config: InteractiveMatchConfig) => {
    const orchestrator = new MatchOrchestrator();

    // Create config with callbacks
    const matchConfig: InteractiveMatchConfig = {
      ...config,
      enableKeyMoments: config.enableKeyMoments ?? true,
      keyMomentsPerMatch: config.keyMomentsPerMatch ?? 8,

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

      // Key moment result callback - shows result after choice
      onKeyMomentResult: (result: KeyMomentResult) => {
        set({
          lastKeyMomentResult: result,
          showKeyMomentResult: true,
        });
      },

      // Score update callback
      onScoreUpdate: (score: MatchScore) => {
        set({ currentScore: score });
      },

      // Match complete callback
      onMatchComplete: (finalScore: MatchScore) => {
        // Get statistics from orchestrator
        const statistics = orchestrator.getMatchStatistics();

        set({
          currentScore: finalScore,
          finalScore: finalScore,
          matchStatistics: statistics,
          isMatchActive: false,
          showMatchResults: true,
          currentKeyMoment: null,
          isWaitingForChoice: false,
        });
      },
    };

    set({
      isMatchActive: true,
      matchConfig,
      orchestrator,
      currentScore: null,
      matchHistory: [],
      matchStatistics: null,
      keyMomentHistory: [],
    });

    // Start match simulation (async)
    try {
      const finalScore = await orchestrator.simulateInteractiveMatch(matchConfig);
      // Get final statistics
      const statistics = orchestrator.getMatchStatistics();
      set({ currentScore: finalScore, matchStatistics: statistics });
    } catch (error) {
      console.error('Match simulation error:', error);
      set({
        isMatchActive: false,
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

    // Save to history (result will be added after resolution)
    // For now, just save the choice
    set({
      isWaitingForChoice: false,
      currentKeyMoment: null,
    });

    // Resolve the promise with the chosen option
    keyMomentResolver(option);

    // Clear resolver
    set({ keyMomentResolver: null });
  },

  // Set key moment result (called by orchestrator after resolving)
  setKeyMomentResult: (result: KeyMomentResult) => {
    set({
      lastKeyMomentResult: result,
      showKeyMomentResult: true,
    });
  },

  // Hide key moment result
  hideKeyMomentResult: () => {
    set({
      showKeyMomentResult: false,
      lastKeyMomentResult: null,
    });
  },

  // Hide match results
  hideMatchResults: () => {
    set({
      showMatchResults: false,
    });
  },

  // End match early
  endMatch: () => {
    const { orchestrator } = get();

    // Cancel the ongoing match simulation
    if (orchestrator) {
      orchestrator.cancelMatch();
    }

    set({
      isMatchActive: false,
      currentKeyMoment: null,
      isWaitingForChoice: false,
      keyMomentResolver: null,
    });
  },

  // Reset match state
  resetMatch: () => {
    const { orchestrator } = get();

    // Cancel the ongoing match simulation
    if (orchestrator) {
      orchestrator.cancelMatch();
    }

    set({
      isMatchActive: false,
      matchConfig: null,
      currentScore: null,
      matchHistory: [],
      matchStatistics: null,
      currentKeyMoment: null,
      isWaitingForChoice: false,
      keyMomentHistory: [],
      orchestrator: null,
      keyMomentResolver: null,
    });
  },
}));
