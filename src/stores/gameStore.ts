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
  TimeSlot,
} from '../types/game';
import type { StoryEvent, StoryEventTag, StoryEventOption } from '../types/storyEvents';
import { PlayerManager } from '../game/PlayerManager';
import { TrainingSystem } from '../game/TrainingSystem';
import { TimeManager } from '../game/TimeManager';
import { SaveManager } from '../game/SaveManager';
import { StoryEventManager } from '../game/StoryEventManager';
import { PrerequisiteChecker } from '../game/PrerequisiteChecker';

interface GameState {
  // Player data
  player: Player | null;

  // Calendar and time
  calendar: GameCalendar;

  // Current status
  currentStatus: CurrentStatus;

  // Activity history
  activityHistory: ActivityResult[];

  // Training sessions (generated per time slot, regenerated when calendar changes)
  currentTrainingSessions: TrainingSession[];

  // Story event state
  completedStoryEvents: string[];
  completedStoryEventChoices: Record<string, string>;
  relationships: Record<string, number>;
  storyEventTriggerChance: number;
  pendingStoryEvent: StoryEvent | null;

  // UI state
  isInitialized: boolean;
  currentScreen: 'welcome' | 'player-creation' | 'main-menu' | 'training' | 'match' | 'rest';
  showTrainingResultModal: boolean;

  // Actions
  initializeGame: () => void;
  createPlayer: (name: string, playstyle: 'offensive' | 'defensive' | 'balanced') => void;
  selectTraining: (session: TrainingSession) => void;
  executeTraining: () => void;
  applyTrainingResult: (result: TrainingResult) => Player;
  advanceTime: () => void;
  rest: () => void;
  updateMood: (change: number) => void;
  addMatchResult: (result: 'win' | 'loss', opponent: string, score: string, surface: string) => void;
  saveGame: (saveName?: string) => void;
  loadGame: (saveId: string) => void;
  resetGame: () => void;
  setScreen: (screen: GameState['currentScreen']) => void;
  clearTrainingResultModal: () => void;
  getAvailableTrainingSessions: () => TrainingSession[];

  // Story event actions
  checkForStoryEvent: (tag?: StoryEventTag, customChance?: number) => void;
  executeStoryEvent: (eventId: string, optionId?: string) => void;
  cancelStoryEvent: () => void;
  updateRelationship: (character: string, change: number) => void;
  setStoryEventTriggerChance: (chance: number) => void;
  getAvailableEventOptions: () => StoryEventOption[];
}

const initialCalendar = TimeManager.createCalendar();
const initialStatus: CurrentStatus = {
  energy: 100,
  mood: 0,
  lastActivity: null,
};

const defaultRestEnergy = 20;
const defaultSleepBonus = 30;
const defaultMoodBonus = 5;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      player: null,
      calendar: initialCalendar,
      currentStatus: initialStatus,
      activityHistory: [],
      currentTrainingSessions: [],

      // Story event initial state
      completedStoryEvents: [],
      completedStoryEventChoices: {},
      relationships: {},
      storyEventTriggerChance: 20,
      pendingStoryEvent: null,

      isInitialized: false,
      currentScreen: 'welcome',
      showTrainingResultModal: false,

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

        // Generate initial training sessions
        const initialSessions = TrainingSystem.getAvailableTrainingSessions(player, 0);

        set({
          player,
          currentTrainingSessions: initialSessions,
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
          activityHistory: [result, ...get().activityHistory].slice(0, 50),
          currentScreen: 'main-menu',
        });

        // Auto-save
        get().saveGame();
      },

      // Apply training result (called from UI with specific session result)
      applyTrainingResult: (result: TrainingResult): Player => {
        const { player, currentStatus } = get();
        if (!player) throw new Error('No player found');

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
          activityHistory: [result, ...get().activityHistory].slice(0, 50),
          showTrainingResultModal: true, // Flag to show modal when we navigate to main menu
        });

        // Auto-save
        get().saveGame();

        return finalPlayer;
      },

      // Advance time slot
      advanceTime: () => {
        const { player, calendar, currentStatus } = get();

        const newCalendar = TimeManager.advanceTimeSlot(calendar);

        // No automatic energy restoration when advancing time
        const newEnergy = currentStatus.energy;

        // Decay mood toward neutral (simple decay)
        let newMood = currentStatus.mood;
        if (newMood > 0) {
          newMood = Math.max(0, newMood - 5);
        } else if (newMood < 0) {
          newMood = Math.min(0, newMood + 5);
        }

        // Generate new training sessions for the new time slot
        const newTrainingSessions = player
          ? TrainingSystem.getAvailableTrainingSessions(player, newMood)
          : [];

        set({
          calendar: newCalendar,
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
          },
          currentTrainingSessions: newTrainingSessions,
        });

        // Check for story event at start of new slot (except NIGHT)
        if (newCalendar.currentTimeSlot !== TimeSlot.NIGHT) {
          get().checkForStoryEvent();
        }

        // Auto-save
        get().saveGame();
      },

      // Rest (restore energy)
      rest: () => {
        const { currentStatus, calendar } = get();

        // Regular rest gives 20 energy
        // If it's night time (which will advance to next day), add 30 bonus for sleeping
        const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;
        const restEnergy = defaultRestEnergy;
        const sleepBonus = isNightTime ? defaultSleepBonus : 0;
        const totalEnergyRestored = restEnergy + sleepBonus;
        const newEnergy = Math.min(100, currentStatus.energy + totalEnergyRestored);

        const restResult: RestResult = {
          id: `rest-${Date.now()}`,
          type: 'rest',
          source: 'rest_activity',
          timestamp: new Date().toISOString(),
          timeSlotsUsed: 1,
          energyCost: 0,
          moodResult: defaultMoodBonus,
          restType: isNightTime ? 'deep' : 'moderate',
          energyRestored: totalEnergyRestored,
        };

        set({
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: Math.min(100, currentStatus.mood + 5),
            lastActivity: restResult,
          },
          activityHistory: [restResult, ...get().activityHistory].slice(0, 50),
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

      // Add match result to activity history
      addMatchResult: (result: 'win' | 'loss', opponent: string, score: string, surface: string) => {
        const { player, calendar, activityHistory, currentStatus } = get();
        if (!player) return;

        // Calculate experience and stat gains
        const experienceGained = result === 'win' ? 50 : 25;
        const statChanges: Record<string, number> = {};

        // Award small stat gains for match experience
        if (result === 'win') {
          statChanges.matchExperience = 3;
          statChanges.focus = 1;
          statChanges.anticipation = 1;
        } else {
          statChanges.matchExperience = 1;
        }

        // Create match activity result
        const matchResult: ActivityResult = {
          id: `match-${Date.now()}`,
          type: 'match',
          source: 'match_activity',
          timestamp: new Date().toISOString(),
          timeSlotsUsed: 1,
          energyCost: 30,
          moodResult: result === 'win' ? 15 : -10,
          opponent,
          result,
          score,
          duration: 60, // TODO: Calculate actual duration
          courtSurface: surface as 'hard' | 'clay' | 'grass' | 'carpet',
          statChanges,
          experienceGained,
          matchType: 'friendly',
          highlights: [], // TODO: Add highlights from key moments
        };

        // Update player stats
        const updatedPlayer = { ...player };
        Object.entries(statChanges).forEach(([stat, value]) => {
          if (stat in updatedPlayer.stats) {
            (updatedPlayer.stats as any)[stat] += value;
          }
        });

        // Deduct energy cost
        const newEnergy = Math.max(0, currentStatus.energy - 30);

        // Update mood based on result
        const moodChange = result === 'win' ? 15 : -10;
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + moodChange));

        set({
          player: updatedPlayer,
          activityHistory: [matchResult, ...activityHistory].slice(0, 50),
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
            lastActivity: matchResult,
          },
        });

        // Explicitly save to ensure persistence
        console.log('Match result added to history:', matchResult);
        console.log('New activity history length:', [matchResult, ...activityHistory].length);
        get().saveGame();
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

      // Clear training result modal flag
      clearTrainingResultModal: () => {
        set({ showTrainingResultModal: false });
      },

      // Get available training sessions (returns cached sessions for current time slot)
      getAvailableTrainingSessions: (): TrainingSession[] => {
        const { currentTrainingSessions } = get();
        return currentTrainingSessions;
      },

      // Story Event Actions

      // Check if a story event should trigger
      checkForStoryEvent: (tag?: StoryEventTag, customChance?: number) => {
        const { player, storyEventTriggerChance, pendingStoryEvent } = get();

        // Don't trigger if event already pending
        if (pendingStoryEvent) return;

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger
        const chance = customChance ?? storyEventTriggerChance;
        const roll = Math.random() * 100;
        const triggered = roll < chance;

        console.log(`[Story Event] Roll: ${roll.toFixed(2)} vs ${chance}% chance - ${triggered ? 'TRIGGERED ✓' : 'Not triggered ✗'}`);

        if (!triggered) {
          return;
        }

        // Get eligible events
        const gameState = get();
        const eligibleEvents = StoryEventManager.getEligibleEvents(
          player,
          {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
          },
          tag
        );

        console.log(`[Story Event] Eligible events (${eligibleEvents.length}):`, eligibleEvents.map(e => e.name));

        // Select random event
        const selectedEvent = StoryEventManager.selectRandomEvent(eligibleEvents);

        if (selectedEvent) {
          console.log(`[Story Event] Selected: "${selectedEvent.name}"`);
          set({ pendingStoryEvent: selectedEvent });
        } else {
          console.log(`[Story Event] No eligible events available`);
        }
      },

      // Execute story event with player's choice
      executeStoryEvent: (eventId: string, optionId?: string) => {
        const { player, pendingStoryEvent, calendar } = get();

        if (!player || !pendingStoryEvent) return;
        if (pendingStoryEvent.id !== eventId) return;

        // Get selected option (if any)
        const selectedOption = optionId
          ? pendingStoryEvent.options.find((opt) => opt.id === optionId) || null
          : null;

        // Execute event
        const gameState = get();
        const result = StoryEventManager.executeStoryEvent(
          pendingStoryEvent,
          selectedOption,
          player,
          {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
          }
        );

        // Get outcome for applying effects
        const outcome = StoryEventManager.getOutcome(pendingStoryEvent, selectedOption);

        // Apply stat changes to player
        let updatedPlayer = { ...player };
        if (outcome.effects.statBoosts) {
          updatedPlayer = PlayerManager.applyStatBoosts(updatedPlayer, outcome.effects.statBoosts);
        }

        // Apply abilities
        if (outcome.effects.abilitiesGained) {
          for (const abilityName of outcome.effects.abilitiesGained) {
            updatedPlayer = PlayerManager.addAbility(updatedPlayer, abilityName);
          }
        }

        // Update relationships
        const updatedRelationships = { ...get().relationships };
        if (outcome.effects.relationshipChanges) {
          Object.entries(outcome.effects.relationshipChanges).forEach(([char, change]) => {
            const current = updatedRelationships[char] || 0;
            updatedRelationships[char] = Math.max(0, Math.min(100, current + change));
          });
        }

        // Track event completion and choice
        const updatedCompletedEvents = [...get().completedStoryEvents, eventId];
        const updatedCompletedChoices = { ...get().completedStoryEventChoices };
        if (optionId) {
          updatedCompletedChoices[eventId] = optionId;
        }

        // Update energy and mood
        const currentStatus = get().currentStatus;
        const newEnergy = Math.max(
          0,
          Math.min(100, currentStatus.energy + (outcome.effects.energyChange || 0))
        );
        const newMood = Math.max(
          -100,
          Math.min(100, currentStatus.mood + (outcome.effects.moodChange || 0))
        );

        // Handle time slot consumption with overflow protection
        const slotsToAdvance = pendingStoryEvent.timeSlotsRequired;
        const currentSlot = calendar.currentTimeSlot;
        const targetSlot = currentSlot + slotsToAdvance;

        const newCalendar = { ...calendar };
        if (targetSlot > TimeSlot.NIGHT) {
          // Would overflow to next day - cap at NIGHT
          newCalendar.currentTimeSlot = TimeSlot.NIGHT;
        } else {
          newCalendar.currentTimeSlot = targetSlot as TimeSlot;
        }

        // Update state
        set({
          player: updatedPlayer,
          completedStoryEvents: updatedCompletedEvents,
          completedStoryEventChoices: updatedCompletedChoices,
          relationships: updatedRelationships,
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
            lastActivity: result,
          },
          calendar: newCalendar,
          activityHistory: [result, ...get().activityHistory].slice(0, 50),
          pendingStoryEvent: null,
        });

        // Auto-save
        get().saveGame();
      },

      // Cancel/dismiss pending story event
      cancelStoryEvent: () => {
        set({ pendingStoryEvent: null });
      },

      // Update character relationship
      updateRelationship: (character: string, change: number) => {
        const relationships = { ...get().relationships };
        const current = relationships[character] || 0;
        relationships[character] = Math.max(0, Math.min(100, current + change));

        set({ relationships });
      },

      // Set story event trigger chance
      setStoryEventTriggerChance: (chance: number) => {
        set({ storyEventTriggerChance: Math.max(0, Math.min(100, chance)) });
      },

      // Get available options for pending event
      getAvailableEventOptions: (): StoryEventOption[] => {
        const { player, pendingStoryEvent } = get();

        if (!player || !pendingStoryEvent) return [];

        const gameState = get();
        return PrerequisiteChecker.getAvailableOptions(pendingStoryEvent, player, {
          completedStoryEvents: gameState.completedStoryEvents,
          completedStoryEventChoices: gameState.completedStoryEventChoices,
          relationships: gameState.relationships,
          calendar: gameState.calendar,
        });
      },
    }),
    {
      name: 'tennis-rpg-game-store',
      partialize: (state) => ({
        player: state.player,
        calendar: state.calendar,
        currentStatus: state.currentStatus,
        activityHistory: state.activityHistory,
        currentTrainingSessions: state.currentTrainingSessions,

        // Story event persistence
        completedStoryEvents: state.completedStoryEvents,
        completedStoryEventChoices: state.completedStoryEventChoices,
        relationships: state.relationships,
        storyEventTriggerChance: state.storyEventTriggerChance,
      }),
    }
  )
);
