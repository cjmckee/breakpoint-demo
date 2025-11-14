/**
 * Game Store
 * Central state management for player, calendar, training, and game progression
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  GameCalendar,
  GameState as GameStateType,
  TrainingSession,
  TrainingResult,
  RestResult,
  ActivityResult,
  CurrentStatus,
} from '../types/game';
import { PlayerManager } from '../game/PlayerManager';
import { TrainingSystem } from '../game/TrainingSystem';
import { TimeManager } from '../game/TimeManager';
import { SaveManager } from '../game/SaveManager';

interface GameState {
  // Player data
  player: Player | null;

  // Calendar and time
  calendar: GameCalendar;

  // Current status
  currentStatus: CurrentStatus;

  // Activity history
  activityHistory: ActivityResult[];

  // UI state
  isInitialized: boolean;
  currentScreen: 'welcome' | 'player-creation' | 'main-menu' | 'training' | 'match' | 'rest';

  // Actions
  initializeGame: () => void;
  createPlayer: (name: string, playstyle: 'offensive' | 'defensive' | 'balanced') => void;
  selectTraining: (session: TrainingSession) => void;
  executeTraining: () => void;
  advanceTime: () => void;
  rest: () => void;
  updateMood: (change: number) => void;
  saveGame: (saveName?: string) => void;
  loadGame: (saveId: string) => void;
  resetGame: () => void;
  setScreen: (screen: GameState['currentScreen']) => void;
}

const initialCalendar = TimeManager.createCalendar();
const initialStatus: CurrentStatus = {
  energy: 100,
  mood: 0,
  lastActivity: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      player: null,
      calendar: initialCalendar,
      currentStatus: initialStatus,
      activityHistory: [],
      isInitialized: false,
      currentScreen: 'welcome',

      // Initialize game (check for auto-save)
      initializeGame: () => {
        const autoSave = SaveManager.getAutoSave();

        if (autoSave && autoSave.player) {
          set({
            player: autoSave.player,
            calendar: autoSave.calendar,
            currentStatus: autoSave.currentStatus,
            activityHistory: autoSave.activityHistory || [],
            isInitialized: true,
            currentScreen: 'main-menu',
          });
        } else {
          set({
            isInitialized: true,
            currentScreen: 'player-creation',
          });
        }
      },

      // Create new player
      createPlayer: (name: string, playstyle: 'offensive' | 'defensive' | 'balanced') => {
        const player = PlayerManager.createPlayer(name, playstyle);
        set({
          player,
          currentScreen: 'main-menu',
        });

        // Auto-save after player creation
        get().saveGame();
      },

      // Select training session (doesn't execute yet)
      selectTraining: (session: TrainingSession) => {
        set({ currentScreen: 'training' });
      },

      // Execute training
      executeTraining: () => {
        const { player, currentStatus, calendar } = get();
        if (!player) return;

        // Get available training sessions
        const sessions = TrainingSystem.getAvailableTrainingSessions(
          player,
          currentStatus.mood
        );

        if (sessions.length === 0) return;

        // For now, execute the first session (UI will handle selection)
        const session = sessions[0];

        const result = TrainingSystem.executeTraining(
          player,
          session,
          currentStatus.energy
        );

        // Apply stat boosts to player
        const updatedPlayer = PlayerManager.applyStatBoosts(player, result.statBoosts);

        // Check for ability gained
        let finalPlayer = updatedPlayer;
        if (result.abilityGained) {
          finalPlayer = PlayerManager.addAbility(updatedPlayer, result.abilityGained);
        }

        // Update energy and mood
        const newEnergy = Math.max(0, currentStatus.energy - result.energyCost);
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + result.moodChange));

        set({
          player: finalPlayer,
          currentStatus: {
            energy: newEnergy,
            mood: newMood,
            lastActivity: result,
          },
          activityHistory: [...get().activityHistory, result],
          currentScreen: 'main-menu',
        });

        // Auto-save
        get().saveGame();
      },

      // Advance time slot
      advanceTime: () => {
        const { calendar, currentStatus } = get();

        const newCalendar = TimeManager.advanceTimeSlot(calendar);

        // If day changed, restore energy to 100
        let newEnergy = currentStatus.energy;
        if (newCalendar.currentDay !== calendar.currentDay) {
          newEnergy = 100;
        }

        // Decay mood toward neutral (simple decay)
        let newMood = currentStatus.mood;
        if (newMood > 0) {
          newMood = Math.max(0, newMood - 5);
        } else if (newMood < 0) {
          newMood = Math.min(0, newMood + 5);
        }

        set({
          calendar: newCalendar,
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
          },
        });

        // Auto-save
        get().saveGame();
      },

      // Rest (restore energy)
      rest: () => {
        const { currentStatus } = get();

        const energyRestored = 20;
        const newEnergy = Math.min(100, currentStatus.energy + energyRestored);

        const restResult: RestResult = {
          id: `rest-${Date.now()}`,
          type: 'rest',
          source: 'rest_activity',
          timestamp: new Date().toISOString(),
          timeSlotsUsed: 1,
          energyCost: 0,
          moodResult: 5,
          restType: 'moderate',
          energyRestored,
        };

        set({
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: Math.min(100, currentStatus.mood + 5),
            lastActivity: restResult,
          },
          activityHistory: [...get().activityHistory, restResult],
          currentScreen: 'main-menu',
        });

        // Advance time
        get().advanceTime();

        // Auto-save
        get().saveGame();
      },

      // Update mood manually (for events)
      updateMood: (change: number) => {
        const { currentStatus } = get();
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + change));

        set({
          currentStatus: {
            ...currentStatus,
            mood: newMood,
          },
        });
      },

      // Save game
      saveGame: (saveName?: string) => {
        const state = get();
        if (!state.player) return;

        const gameState: GameStateType = {
          player: state.player,
          calendar: state.calendar,
          currentStatus: state.currentStatus,
          activityHistory: state.activityHistory,
          isInitialized: state.isInitialized,
          currentScreen: state.currentScreen,
        };

        SaveManager.autoSave(gameState);
      },

      // Load game
      loadGame: (saveId: string) => {
        const gameState = SaveManager.load(saveId);
        if (!gameState) return;

        set({
          player: gameState.player,
          calendar: gameState.calendar,
          currentStatus: gameState.currentStatus,
          activityHistory: gameState.activityHistory || [],
          currentScreen: 'main-menu',
        });
      },

      // Reset game
      resetGame: () => {
        set({
          player: null,
          calendar: initialCalendar,
          currentStatus: initialStatus,
          activityHistory: [],
          isInitialized: true,
          currentScreen: 'player-creation',
        });
      },

      // Set current screen
      setScreen: (screen: GameState['currentScreen']) => {
        set({ currentScreen: screen });
      },
    }),
    {
      name: 'tennis-rpg-game-store',
      partialize: (state) => ({
        player: state.player,
        calendar: state.calendar,
        currentStatus: state.currentStatus,
        activityHistory: state.activityHistory,
      }),
    }
  )
);
