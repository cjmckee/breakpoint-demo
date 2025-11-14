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

interface MatchState {
  // Match configuration
  isMatchActive: boolean;
  matchConfig: InteractiveMatchConfig | null;

  // Match progress
  currentScore: MatchScore | null;
  matchHistory: Array<{
    pointNumber: number;
    winner: 'player' | 'opponent';
    score: MatchScore;
  }>;

  // Key moments
  currentKeyMoment: KeyMoment | null;
  isWaitingForChoice: boolean;
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
  endMatch: () => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  // Initial state
  isMatchActive: false,
  matchConfig: null,
  currentScore: null,
  matchHistory: [],
  currentKeyMoment: null,
  isWaitingForChoice: false,
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

      // Score update callback
      onScoreUpdate: (score: MatchScore) => {
        set({ currentScore: score });
      },

      // Match complete callback
      onMatchComplete: (finalScore: MatchScore) => {
        set({
          currentScore: finalScore,
          isMatchActive: false,
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
      keyMomentHistory: [],
    });

    // Start match simulation (async)
    try {
      const finalScore = await orchestrator.simulateInteractiveMatch(matchConfig);
      set({ currentScore: finalScore });
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

  // End match early
  endMatch: () => {
    set({
      isMatchActive: false,
      currentKeyMoment: null,
      isWaitingForChoice: false,
      keyMomentResolver: null,
    });
  },

  // Reset match state
  resetMatch: () => {
    set({
      isMatchActive: false,
      matchConfig: null,
      currentScore: null,
      matchHistory: [],
      currentKeyMoment: null,
      isWaitingForChoice: false,
      keyMomentHistory: [],
      orchestrator: null,
      keyMomentResolver: null,
    });
  },
}));
