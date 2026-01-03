/**
 * Game Store
 * Central state management for player, calendar, training, and game progression
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  GameCalendar,
  TrainingSession,
  TrainingResult,
  RestResult,
  ActivityResult,
  CurrentStatus,
  TimeSlot,
  OpponentTier,
  ScheduledEvent,
} from '../types/game';
import type { StoryEvent, StoryEventTag, StoryEventOption } from '../types/storyEvents';
import type { Challenge } from '../types/challenges';
import type { MatchStatistics } from '../types/index';
import type { MatchReward } from '../types/game';
import type { Item, EquipmentSlot } from '../types/items';
import type { ActiveTournament, TournamentMatchMetadata } from '../types/tournaments';
import { PlayerManager } from '../game/PlayerManager';
import { TrainingSystem } from '../game/TrainingSystem';
import { TimeManager } from '../game/TimeManager';
import { StoryEventManager } from '../game/StoryEventManager';
import { PrerequisiteChecker } from '../game/PrerequisiteChecker';
import { ChallengeManager } from '../game/ChallengeManager';
import { MatchRewardSystem } from '../game/MatchRewardSystem';
import { ItemManager } from '../game/ItemManager';
import { TournamentRegistry } from '../data/tournaments';
import { TournamentManager } from '../game/TournamentManager';
import { ScheduledEventManager } from '../game/ScheduledEventManager';

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

  // Challenge state
  activeChallenges: Challenge[];
  completedChallenges: string[];

  // Opponent tier progression
  unlockedTiers: OpponentTier[];

  // UI state
  isInitialized: boolean;
  currentScreen: 'welcome' | 'player-creation' | 'main-menu' | 'training' | 'match' | 'rest' | 'inventory' | 'tournaments' | 'tournament-match';
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
  addMatchResult: (
    result: 'win' | 'loss',
    opponent: string,
    opponentTier: OpponentTier,
    score: string,
    surface: string,
    matchStatistics: MatchStatistics,
    preCalculatedRewards?: MatchReward
  ) => void;
  unlockNextTier: () => OpponentTier | null;
  exportSave: () => string;
  importSave: (jsonData: string) => boolean;
  clearAllData: () => void;
  setScreen: (screen: GameState['currentScreen']) => void;
  clearTrainingResultModal: () => void;
  getAvailableTrainingSessions: () => TrainingSession[];

  // Story event actions
  checkForStoryEventById: (eventId: string) => void;
  checkForStoryEventByTag: (tag: StoryEventTag, customChance?: number) => void;
  checkForRandomStoryEvent: (customChance?: number) => void;
  executeStoryEvent: (eventId: string, optionId?: string) => void;
  cancelStoryEvent: () => void;
  updateRelationship: (character: string, change: number) => void;
  setStoryEventTriggerChance: (chance: number) => void;
  getAvailableEventOptions: () => StoryEventOption[];

  // Challenge actions
  assignChallenge: (challenge: Challenge) => void;
  updateChallengeProgress: (challengeId: string) => void;
  completeChallenge: (challengeId: string) => void;
  checkChallengeCompletion: () => void;

  // Item actions
  addItem: (item: Item) => void;
  equipItem: (itemId: string, slot: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  swapEquipment: (itemId: string, slot: EquipmentSlot) => void;
  useConsumable: (itemId: string) => void;
  trashItem: (itemId: string) => void;
  getPlayerItems: () => Item[];

  // Tournament actions
  startTournament: (tournamentId: string) => void;
  scheduleNextTournamentMatch: () => void;
  completeTournamentMatch: (result: 'win' | 'loss', score: string, matchStats: MatchStatistics, rewards: MatchReward) => void;
  cancelTournament: () => void;
  checkTournamentEligibility: () => string[];
  getScheduledTournamentMatch: () => ScheduledEvent | null;
  isTournamentMatchScheduled: () => boolean;

  // Generic scheduled event actions
  scheduleEvent: (event: ScheduledEvent) => void;
  clearScheduledEvent: (day: number, slot: TimeSlot) => void;
  getScheduledEvent: () => ScheduledEvent | null;
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
      storyEventTriggerChance: 40,
      pendingStoryEvent: null,

      // Challenge initial state
      activeChallenges: [],
      completedChallenges: [],

      // Opponent tier progression initial state
      unlockedTiers: [1],  // Start with only tier 1 unlocked

      isInitialized: false,
      currentScreen: 'welcome',
      showTrainingResultModal: false,

      // Initialize game (Zustand auto-loads persisted state)
      initializeGame: () => {
        const state = get();
        set({
          isInitialized: true,
          currentScreen: state.player ? 'main-menu' : 'player-creation',
        });
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

        // Trigger welcome event (guaranteed, no probability roll)
        // Use setTimeout to ensure state is fully updated before checking for event
        setTimeout(() => {
          get().checkForStoryEventById('welcome_to_tennis_rpg');
        }, 0);
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
          activityHistory: [result, ...get().activityHistory].slice(0, 10),
          currentScreen: 'main-menu',
        });
      },

      // Apply training result (called from UI with specific session result)
      applyTrainingResult: (result: TrainingResult): Player => {
        const { player, currentStatus } = get();
        if (!player) throw new Error('No player found');

        // Apply stat boosts to player
        let updatedPlayer = PlayerManager.applyStatBoosts(player, result.statBoosts);

        // Check for ability gained
        if (result.abilityGained) {
          updatedPlayer = PlayerManager.addAbility(updatedPlayer, result.abilityGained);
        }

        // Clear next activity buffs (they were consumed during training)
        const finalPlayer = {
          ...updatedPlayer,
          nextActivityBuffs: null,
        };

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
          activityHistory: [result, ...get().activityHistory].slice(0, 10),
          showTrainingResultModal: true, // Flag to show modal when we navigate to main menu
        });

        // Check for challenge completion after stat changes
        get().checkChallengeCompletion();

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

        // Check for random story event at start of new slot (except NIGHT)
        // BUT: Don't trigger if there's a scheduled event for this time slot
        if (newCalendar.currentTimeSlot !== TimeSlot.NIGHT) {
          const hasScheduledEvent = ScheduledEventManager.hasScheduledEvent(
            newCalendar.scheduledEvents,
            newCalendar.currentDay,
            newCalendar.currentTimeSlot
          );

          if (!hasScheduledEvent) {
            get().checkForRandomStoryEvent();
          }
        }
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
          activityHistory: [restResult, ...get().activityHistory].slice(0, 10),
          currentScreen: 'main-menu',
        });

        // Advance time
        get().advanceTime();
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

      // Add match result to activity history with rewards
      addMatchResult: (
        result: 'win' | 'loss',
        opponent: string,
        opponentTier: OpponentTier,
        score: string,
        surface: string,
        matchStatistics: MatchStatistics,
        preCalculatedRewards?: MatchReward
      ) => {
        const { player, currentStatus } = get();
        if (!player) return;

        const isWin = result === 'win';

        // Use pre-calculated rewards if provided, otherwise calculate from match statistics
        // This prevents duplicate rolls when rewards are already calculated in the UI
        const rewards = preCalculatedRewards || MatchRewardSystem.calculateRewards(
          matchStatistics,
          opponentTier,
          isWin
        );

        console.log('=== APPLYING MATCH REWARDS ===');
        console.log('Pre-calculated rewards provided:', !!preCalculatedRewards);
        console.log('Rewards to apply:', rewards);

        // Apply stat boosts
        let updatedPlayer = PlayerManager.applyStatBoosts(player, rewards.statBoosts);

        // Apply abilities
        if (rewards.abilitiesGained && rewards.abilitiesGained.length > 0) {
          console.log('Applying abilities to player:', rewards.abilitiesGained);
          for (const ability of rewards.abilitiesGained) {
            updatedPlayer = PlayerManager.addAbility(updatedPlayer, ability);
          }
        }

        // Apply items
        if (rewards.itemsGained && rewards.itemsGained.length > 0) {
          console.log('Applying items to player:', rewards.itemsGained);
          for (const item of rewards.itemsGained) {
            updatedPlayer = ItemManager.addItem(updatedPlayer, item);
          }
        }

        // Update match counts
        updatedPlayer.matchesPlayed = (updatedPlayer.matchesPlayed || 0) + 1;
        if (isWin) {
          updatedPlayer.matchesWon = (updatedPlayer.matchesWon || 0) + 1;
        }

        // Update latest match results (newest first, keep last 10)
        const currentResults = updatedPlayer.latestMatchResults || [];
        updatedPlayer.latestMatchResults = [result, ...currentResults].slice(0, 10);

        // Update energy (deduct match cost)
        const newEnergy = Math.max(0, currentStatus.energy - 30);

        // Update mood from rewards
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + rewards.moodChange));

        // Check for tier unlock and update player tier (only on win against current tier)
        let tierUnlocked: OpponentTier | null = null;
        if (isWin && opponentTier === updatedPlayer.tier && updatedPlayer.tier < 4) {
          // Player beat an opponent of their tier, so they can advance
          const newTier = (updatedPlayer.tier + 1) as OpponentTier;
          updatedPlayer = PlayerManager.updateTier(updatedPlayer, newTier);
          tierUnlocked = newTier;
        }

        // Create match activity result with rewards
        const matchActivity: ActivityResult = {
          id: `match-${Date.now()}`,
          type: 'match',
          source: 'match_activity',
          timestamp: new Date().toISOString(),
          timeSlotsUsed: 1,
          energyCost: 30,
          moodResult: rewards.moodChange,
          opponent,
          opponentTier,
          result: isWin ? 'win' : 'loss',
          score,
          duration: 60, // Matches are approximately 60 minutes
          courtSurface: surface as 'hard' | 'clay' | 'grass' | 'carpet',
          statChanges: rewards.statBoosts,
          experienceGained: rewards.experience,
          matchType: 'friendly',
          highlights: [], // TODO: Add highlights from key moments
          reward: rewards,
          tierUnlocked,
        };

        set({
          player: updatedPlayer,
          currentStatus: {
            energy: newEnergy,
            mood: newMood,
            lastActivity: matchActivity,
          },
          activityHistory: [matchActivity, ...get().activityHistory].slice(0, 10),
        });

        // Check for challenge completion after stat changes
        get().checkChallengeCompletion();

        console.log('Match result added with rewards:', matchActivity);
      },

      // Unlock next tier (only if winning against current max unlocked tier)
      unlockNextTier: () => {
        const { unlockedTiers } = get();
        const maxUnlocked = Math.max(...unlockedTiers);
        const nextTier = (maxUnlocked + 1) as OpponentTier;

        if (nextTier <= 4 && !unlockedTiers.includes(nextTier)) {
          set({
            unlockedTiers: [...unlockedTiers, nextTier].sort() as OpponentTier[],
          });
          return nextTier;
        }
        return null;
      },

      // Export entire save as JSON string
      exportSave: (): string => {
        const state = get();
        const exportData = {
          player: state.player,
          calendar: state.calendar,
          currentStatus: state.currentStatus,
          activityHistory: state.activityHistory,
          currentTrainingSessions: state.currentTrainingSessions,
          completedStoryEvents: state.completedStoryEvents,
          completedStoryEventChoices: state.completedStoryEventChoices,
          relationships: state.relationships,
          storyEventTriggerChance: state.storyEventTriggerChance,
          activeChallenges: state.activeChallenges,
          completedChallenges: state.completedChallenges,
          unlockedTiers: state.unlockedTiers,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        };
        return JSON.stringify(exportData, null, 2);
      },

      // Import save data from JSON string
      importSave: (jsonData: string): boolean => {
        try {
          const data = JSON.parse(jsonData);

          // Basic validation
          if (!data.player || !data.calendar) {
            console.error('Invalid save data: missing required fields');
            return false;
          }

          // Restore state
          set({
            player: data.player,
            calendar: data.calendar,
            currentStatus: data.currentStatus || initialStatus,
            activityHistory: data.activityHistory || [],
            currentTrainingSessions: data.currentTrainingSessions || [],
            completedStoryEvents: data.completedStoryEvents || [],
            completedStoryEventChoices: data.completedStoryEventChoices || {},
            relationships: data.relationships || {},
            storyEventTriggerChance: data.storyEventTriggerChance || 40,
            activeChallenges: data.activeChallenges || [],
            completedChallenges: data.completedChallenges || [],
            unlockedTiers: data.unlockedTiers || [1],
            currentScreen: 'main-menu',
            isInitialized: true,
          });

          console.log('Save data imported successfully');
          return true;
        } catch (error) {
          console.error('Failed to import save:', error);
          return false;
        }
      },

      // Clear all data and start fresh
      clearAllData: () => {
        set({
          player: null,
          calendar: initialCalendar,
          currentStatus: initialStatus,
          activityHistory: [],
          completedStoryEvents: [],
          completedStoryEventChoices: {},
          relationships: {},
          storyEventTriggerChance: 40,
          activeChallenges: [],
          completedChallenges: [],
          unlockedTiers: [1],
          currentTrainingSessions: [],
          pendingStoryEvent: null,
          isInitialized: true,
          currentScreen: 'player-creation',
          showTrainingResultModal: false,
        });

        // Also clear localStorage to ensure clean slate
        localStorage.clear();
        console.log('All game data cleared');
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

      /**
       * Check for a specific story event by ID
       * Triggers immediately if player is eligible (no probability roll)
       * Use case: Guaranteed story events (like welcome event)
       */
      checkForStoryEventById: (eventId: string) => {
        const { player, pendingStoryEvent } = get();

        // Don't trigger if event already pending
        if (pendingStoryEvent) {
          console.log(`[Story Event] Event already pending: ${pendingStoryEvent.id}`);
          return;
        }

        // Don't trigger if no player
        if (!player) {
          console.log(`[Story Event] No player exists`);
          return;
        }

        console.log(`[Story Event] Checking for event by ID: ${eventId}`);

        // Get specific event
        const gameState = get();
        const event = StoryEventManager.getEligibleEventById(
          eventId,
          player,
          {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          }
        );

        if (event) {
          console.log(`[Story Event] ✅ Triggered: "${event.name}"`);
          set({ pendingStoryEvent: event });
        } else {
          console.log(`[Story Event] ❌ Event not eligible: ${eventId}`);
        }
      },

      /**
       * Check for story events matching a specific tag
       * Randomly selects from eligible events with that tag
       * Use case: Tag-specific random events (e.g., coach events, romance events)
       */
      checkForStoryEventByTag: (tag: StoryEventTag, customChance?: number) => {
        const { player, storyEventTriggerChance, pendingStoryEvent } = get();

        // Don't trigger if event already pending
        if (pendingStoryEvent) return;

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger
        const chance = customChance ?? storyEventTriggerChance;
        const roll = Math.random() * 100;
        const triggered = roll < chance;

        console.log(`[Story Event] Tag: ${tag} | Roll: ${roll.toFixed(2)} vs ${chance}% - ${triggered ? 'TRIGGERED ✓' : 'Not triggered ✗'}`);

        if (!triggered) {
          return;
        }

        // Get eligible events for this tag
        const gameState = get();
        const eligibleEvents = StoryEventManager.getEligibleEventsByTag(
          tag,
          player,
          {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          }
        );

        console.log(`[Story Event] Eligible events with tag '${tag}' (${eligibleEvents.length}):`, eligibleEvents.map(e => e.name));

        // Select random event
        const selectedEvent = StoryEventManager.selectRandomEvent(eligibleEvents);

        if (selectedEvent) {
          console.log(`[Story Event] Selected: "${selectedEvent.name}"`);
          set({ pendingStoryEvent: selectedEvent });
        } else {
          console.log(`[Story Event] No eligible events available for tag: ${tag}`);
        }
      },

      /**
       * Check for any random story event
       * Randomly selects from all eligible events
       * Use case: General random events during time advancement
       */
      checkForRandomStoryEvent: (customChance?: number) => {
        const { player, storyEventTriggerChance, pendingStoryEvent } = get();

        // Don't trigger if event already pending
        if (pendingStoryEvent) return;

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger
        const chance = customChance ?? storyEventTriggerChance;
        const roll = Math.random() * 100;
        const triggered = roll < chance;

        console.log(`[Story Event] Random | Roll: ${roll.toFixed(2)} vs ${chance}% - ${triggered ? 'TRIGGERED ✓' : 'Not triggered ✗'}`);

        if (!triggered) {
          return;
        }

        // Get all eligible events
        const gameState = get();
        const eligibleEvents = StoryEventManager.getAllEligibleEvents(
          player,
          {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          }
        );

        console.log(`[Story Event] All eligible events (${eligibleEvents.length}):`, eligibleEvents.map(e => e.name));

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

        // Get outcome for applying effects
        const outcome = StoryEventManager.getOutcome(pendingStoryEvent, selectedOption);

        // Handle time slot consumption with overflow protection
        // Check both NIGHT overflow AND scheduled event conflicts
        const slotsToAdvance = pendingStoryEvent.timeSlotsRequired;
        const currentSlot = calendar.currentTimeSlot;
        let actualSlotsConsumed = slotsToAdvance;

        // Check if any slot in the range has a scheduled event
        for (let i = 1; i <= slotsToAdvance; i++) {
          const slotToCheck = currentSlot + i;

          // Stop if we would overflow past NIGHT
          if (slotToCheck > TimeSlot.NIGHT) {
            actualSlotsConsumed = i - 1;
            break;
          }

          // Stop if there's a scheduled event in this slot
          const hasScheduledEvent = ScheduledEventManager.hasScheduledEvent(
            calendar.scheduledEvents,
            calendar.currentDay,
            slotToCheck as TimeSlot
          );

          if (hasScheduledEvent) {
            actualSlotsConsumed = i - 1;
            break;
          }
        }

        // Execute event with actual time slots consumed
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
          },
          actualSlotsConsumed
        );

        // Apply stat changes to player
        let updatedPlayer = { ...player };
        if (outcome.effects.statChanges) {
          updatedPlayer = PlayerManager.applyStatBoosts(updatedPlayer, outcome.effects.statChanges);
        }

        // Apply abilities
        if (outcome.effects.abilitiesGained) {
          for (const abilityName of outcome.effects.abilitiesGained) {
            updatedPlayer = PlayerManager.addAbility(updatedPlayer, abilityName);
          }
        }

        // Update relationships (can range from -100 to 100)
        const updatedRelationships = { ...get().relationships };
        if (outcome.effects.relationshipChanges) {
          Object.entries(outcome.effects.relationshipChanges).forEach(([char, change]) => {
            const current = updatedRelationships[char] || 0;
            updatedRelationships[char] = Math.max(-100, Math.min(100, current + change));
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

        const newCalendar = { ...calendar };
        const finalSlot = currentSlot + actualSlotsConsumed;
        newCalendar.currentTimeSlot = Math.min(finalSlot, TimeSlot.NIGHT) as TimeSlot;

        // Assign challenges if any
        if (outcome.challengesAssigned) {
          outcome.challengesAssigned.forEach((challenge) => {
            get().assignChallenge(challenge);
          });
        }

        // Add scheduled events if any (resolve relative days to absolute days)
        let updatedScheduledEvents = [...get().calendar.scheduledEvents];
        if (outcome.effects.scheduledEvents) {
          const resolvedEvents = outcome.effects.scheduledEvents.map((template) => ({
            eventType: template.eventType,
            scheduledDay: calendar.currentDay + template.relativeDays,
            scheduledTimeSlot: template.scheduledTimeSlot,
            metadata: template.metadata,
          }));
          updatedScheduledEvents = [...updatedScheduledEvents, ...resolvedEvents];
        }

        // Check if we need to schedule a tournament match
        const shouldScheduleTournamentMatch = outcome.effects.scheduleNextTournamentMatch === true;

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
          calendar: {
            ...newCalendar,
            scheduledEvents: updatedScheduledEvents,
          },
          activityHistory: [result, ...get().activityHistory].slice(0, 10),
          pendingStoryEvent: null,
        });

        // Check for challenge completion after state changes
        get().checkChallengeCompletion();

        // Schedule next tournament match if requested by the event outcome
        if (shouldScheduleTournamentMatch) {
          get().scheduleNextTournamentMatch();
        }
      },

      // Cancel/dismiss pending story event
      // When skipping an event, mark it as completed so it doesn't show up again
      cancelStoryEvent: () => {
        const { pendingStoryEvent, completedStoryEvents } = get();

        if (pendingStoryEvent) {
          set({
            pendingStoryEvent: null,
            completedStoryEvents: [...completedStoryEvents, pendingStoryEvent.id],
          });
        } else {
          set({ pendingStoryEvent: null });
        }
      },

      // Update character relationship
      updateRelationship: (character: string, change: number) => {
        const relationships = { ...get().relationships };
        const current = relationships[character] || 0;
        relationships[character] = Math.max(0, Math.min(100, current + change));

        set({ relationships });

        // Check for challenge completion after relationship change
        get().checkChallengeCompletion();
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
          activeTournament: gameState.calendar.activeTournament,
        });
      },

      // Challenge Actions

      // Assign a new challenge to the player
      assignChallenge: (challenge: Challenge) => {
        const { player, activeChallenges, relationships, calendar } = get();

        if (!player) {
          throw new Error('Cannot assign challenge: no player exists');
        }

        // Don't add if already active or completed
        const alreadyActive = activeChallenges.some((c) => c.id === challenge.id);
        const alreadyCompleted = get().completedChallenges.includes(challenge.id);

        if (alreadyActive || alreadyCompleted) {
          return;
        }

        // Calculate initial progress before assigning
        const gameState = { relationships, calendar };
        const initialProgress = ChallengeManager.updateProgress(challenge, player, gameState);

        const challengeWithProgress: Challenge = {
          ...challenge,
          progress: initialProgress,
          status: initialProgress.isComplete ? 'completed' : 'active',
          completedAt: initialProgress.isComplete ? new Date().toISOString() : undefined,
        };

        set({
          activeChallenges: [...activeChallenges, challengeWithProgress],
        });
      },

      // Update progress for a specific challenge
      updateChallengeProgress: (challengeId: string) => {
        const { player, activeChallenges, relationships, calendar } = get();
        if (!player) return;

        const challengeIndex = activeChallenges.findIndex((c) => c.id === challengeId);
        if (challengeIndex === -1) return;

        const challenge = activeChallenges[challengeIndex];
        const gameState = { relationships, calendar };

        // Calculate new progress
        const newProgress = ChallengeManager.updateProgress(challenge, player, gameState);

        // Update challenge with new progress
        const updatedChallenges = [...activeChallenges];
        updatedChallenges[challengeIndex] = {
          ...challenge,
          progress: newProgress,
          status: newProgress.isComplete ? 'completed' : 'active',
          completedAt: newProgress.isComplete && !challenge.completedAt
            ? new Date().toISOString()
            : challenge.completedAt,
        };

        set({ activeChallenges: updatedChallenges });
      },

      // Complete a challenge and apply rewards
      completeChallenge: (challengeId: string) => {
        const { player, activeChallenges, relationships } = get();
        if (!player) return;

        const challengeIndex = activeChallenges.findIndex((c) => c.id === challengeId);
        if (challengeIndex === -1) return;

        const challenge = activeChallenges[challengeIndex];

        // Apply rewards
        let updatedPlayer = ChallengeManager.applyRewards(challenge, player);

        // Apply relationship changes from reward
        const updatedRelationships = { ...relationships };
        if (challenge.reward.relationshipChanges) {
          Object.entries(challenge.reward.relationshipChanges).forEach(([char, change]) => {
            const current = updatedRelationships[char] || 0;
            updatedRelationships[char] = Math.max(0, Math.min(100, current + change));
          });
        }

        // Mark challenge as claimed and remove from active list
        const remainingChallenges = activeChallenges.filter((c) => c.id !== challengeId);
        const completedChallenges = [...get().completedChallenges, challengeId];

        set({
          player: updatedPlayer,
          relationships: updatedRelationships,
          activeChallenges: remainingChallenges,
          completedChallenges,
        });
      },

      // Check all active challenges for completion
      checkChallengeCompletion: () => {
        const { player, activeChallenges, relationships, calendar } = get();
        if (!player || activeChallenges.length === 0) return;

        const gameState = { relationships, calendar };
        let hasUpdates = false;

        const updatedChallenges = activeChallenges.map((challenge) => {
          // Skip if already completed
          if (challenge.status === 'completed') return challenge;

          // Calculate new progress
          const newProgress = ChallengeManager.updateProgress(challenge, player, gameState);

          // Check if newly completed
          if (newProgress.isComplete) {
            hasUpdates = true;
            return {
              ...challenge,
              progress: newProgress,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
            };
          }

          // Update progress even if not complete
          if (newProgress.completionPercentage !== challenge.progress.completionPercentage) {
            hasUpdates = true;
            return {
              ...challenge,
              progress: newProgress,
            };
          }

          return challenge;
        });

        if (hasUpdates) {
          set({ activeChallenges: updatedChallenges });
        }
      },

      // Item Actions

      // Add item to player's inventory or story items
      addItem: (item: Item) => {
        const { player } = get();
        if (!player) return;

        const updatedPlayer = ItemManager.addItem(player, item);
        set({ player: updatedPlayer });
      },

      // Equip an item from inventory
      equipItem: (itemId: string, slot: EquipmentSlot) => {
        const { player } = get();
        if (!player) return;

        const updatedPlayer = ItemManager.equipItem(player, itemId, slot);
        set({ player: updatedPlayer });
      },

      // Unequip an item back to inventory
      unequipItem: (slot: EquipmentSlot) => {
        const { player } = get();
        if (!player) return;

        const updatedPlayer = ItemManager.unequipItem(player, slot);
        set({ player: updatedPlayer });
      },

      // Swap equipment directly
      swapEquipment: (itemId: string, slot: EquipmentSlot) => {
        const { player } = get();
        if (!player) return;

        const updatedPlayer = ItemManager.swapEquipment(player, itemId, slot);
        set({ player: updatedPlayer });
      },

      // Use a consumable item
      useConsumable: (itemId: string) => {
        const { player, currentStatus } = get();
        if (!player) return;

        const result = ItemManager.useConsumable(player, itemId);

        // Update player and apply instant effects
        const newEnergy = Math.max(
          0,
          Math.min(100, currentStatus.energy + result.energyChange)
        );
        const newMood = Math.max(
          -100,
          Math.min(100, currentStatus.mood + result.moodChange)
        );

        set({
          player: result.player,
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
          },
        });

        console.log(
          `Consumable used: Energy ${result.energyChange >= 0 ? '+' : ''}${result.energyChange}, Mood ${result.moodChange >= 0 ? '+' : ''}${result.moodChange}, Buff: ${result.buffApplied}`
        );
      },

      // Trash/remove an item from inventory permanently
      trashItem: (itemId: string) => {
        const { player } = get();
        if (!player) return;

        const updatedPlayer = ItemManager.trashItem(player, itemId);
        set({ player: updatedPlayer });
      },

      // Get all player items
      getPlayerItems: (): Item[] => {
        const { player } = get();
        if (!player) return [];
        return ItemManager.getAllItems(player);
      },

      // ========================================================================
      // TOURNAMENT ACTIONS
      // ========================================================================

      // Start a tournament
      startTournament: (tournamentId: string) => {
        const config = TournamentRegistry.getTournament(tournamentId);
        if (!config) {
          console.error(`Tournament ${tournamentId} not found`);
          return;
        }

        const newActiveTournament: ActiveTournament = {
          tournamentId: config.id,
          tournamentName: config.name,
          currentBracket: 'winner',
          currentRound: 0,
          matchResults: [],
          isActive: true,
          isComplete: false,
          startedAt: new Date().toISOString(),
        };

        set((state) => ({
          calendar: {
            ...state.calendar,
            activeTournament: newActiveTournament,
          },
        }));

        // Check if opening ceremony already completed
        const completedStoryEvents = get().completedStoryEvents;
        const ceremonyAlreadyCompleted = completedStoryEvents.includes(config.openingCeremonyEventId);

        if (ceremonyAlreadyCompleted) {
          // Skip ceremony and schedule first match directly
          console.log('Opening ceremony already completed, scheduling first match directly');
          setTimeout(() => {
            get().scheduleNextTournamentMatch();
          }, 100);
        } else {
          // Queue opening ceremony story event (which will schedule the match)
          setTimeout(() => {
            get().checkForStoryEventById(config.openingCeremonyEventId);
          }, 100);
        }
      },

      // Schedule the next tournament match
      scheduleNextTournamentMatch: () => {
        const { calendar } = get();
        const activeTournament = calendar.activeTournament;
        if (!activeTournament || !activeTournament.isActive) return;

        const config = TournamentRegistry.getTournament(activeTournament.tournamentId);
        if (!config) return;

        // Get current round
        const round = config.rounds[activeTournament.currentRound];
        if (!round) return;

        console.log('Scheduling next tournament match...');
        console.log('activeTournament:', activeTournament);
        console.log('calendar:', calendar);

        // Schedule for next day at afternoon slot
        const scheduledDay = calendar.currentDay + 1;
        const scheduledTimeSlot = TimeSlot.AFTERNOON;

        const metadata: TournamentMatchMetadata = {
          tournamentId: activeTournament.tournamentId,
          tournamentName: activeTournament.tournamentName,
          roundNumber: round.roundNumber,
          opponentId: round.opponent.characterId,
          opponentName: round.opponent.name,
          bracket: activeTournament.currentBracket,
        };

        console.log('Metadata for scheduled event:', metadata);

        const scheduledEvent = ScheduledEventManager.scheduleEvent(
          'tournament_match',
          scheduledDay,
          scheduledTimeSlot,
          metadata
        );

        console.log('Scheduled event created:', scheduledEvent);

        set((state) => ({
          calendar: {
            ...state.calendar,
            scheduledEvents: [...state.calendar.scheduledEvents, scheduledEvent],
          },
        }));
      },

      // Complete a tournament match
      completeTournamentMatch: (result: 'win' | 'loss', score: string, matchStats: MatchStatistics, rewards: MatchReward) => {
        const { calendar, currentStatus, player } = get();
        if (!player) return;

        const activeTournament = calendar.activeTournament;
        if (!activeTournament || !activeTournament.isActive) return;

        const config = TournamentRegistry.getTournament(activeTournament.tournamentId);
        if (!config) return;

        const round = config.rounds[activeTournament.currentRound];
        if (!round) return;

        const isWin = result === 'win';

        // Apply match rewards to player (stat boosts, abilities, items)
        let updatedPlayer = PlayerManager.applyStatBoosts(player, rewards.statBoosts);

        // Apply abilities
        if (rewards.abilitiesGained && rewards.abilitiesGained.length > 0) {
          console.log('Applying abilities to player:', rewards.abilitiesGained);
          for (const ability of rewards.abilitiesGained) {
            updatedPlayer = PlayerManager.addAbility(updatedPlayer, ability);
          }
        }

        // Apply items
        if (rewards.itemsGained && rewards.itemsGained.length > 0) {
          console.log('Applying items to player:', rewards.itemsGained);
          for (const item of rewards.itemsGained) {
            updatedPlayer = ItemManager.addItem(updatedPlayer, item);
          }
        }

        // Update match counts
        updatedPlayer.matchesPlayed = (updatedPlayer.matchesPlayed || 0) + 1;
        if (isWin) {
          updatedPlayer.matchesWon = (updatedPlayer.matchesWon || 0) + 1;
        }

        // Update latest match results (newest first, keep last 10)
        const currentResults = updatedPlayer.latestMatchResults || [];
        updatedPlayer.latestMatchResults = [result, ...currentResults].slice(0, 10);

        // Clear scheduled tournament match event
        const updatedScheduledEvents = ScheduledEventManager.clearScheduledEvent(
          get().calendar.scheduledEvents,
          calendar.currentDay,
          calendar.currentTimeSlot
        );

        // Record match result
        const matchResult = {
          roundNumber: round.roundNumber,
          opponent: round.opponent.name,
          result,
          score,
        };

        const updatedTournament = {
          ...activeTournament,
          matchResults: [...activeTournament.matchResults, matchResult],
        };

        // Handle bracket changes and progression
        if (result === 'loss' && activeTournament.currentBracket === 'winner') {
          // Move to loser bracket
          updatedTournament.currentBracket = 'loser';
          updatedTournament.currentRound = 0;

          // Queue elimination event
          if (config.eliminationEventId) {
            setTimeout(() => {
              get().checkForStoryEventById(config.eliminationEventId!);
            }, 100);
          }
        } else {
          // Increment round for both win in any bracket or loss in loser bracket
          updatedTournament.currentRound = activeTournament.currentRound + 1;
        }

        // Check if tournament complete
        const isComplete = updatedTournament.currentRound >= config.rounds.length;
        if (isComplete) {
          updatedTournament.isActive = false;
          updatedTournament.isComplete = true;
          updatedTournament.completedAt = new Date().toISOString();

          const wonChampionship = result === 'win';

          // Add to completed tournaments with win status
          set((state) => ({
            calendar: {
              ...state.calendar,
              completedTournaments: [
                ...state.calendar.completedTournaments,
                {
                  tournamentId: activeTournament.tournamentId,
                  won: wonChampionship,
                  completedAt: new Date().toISOString(),
                }
              ],
              // Clear active tournament when complete
              activeTournament: null,
            },
          }));

          // Queue victory event if won championship
          if (wonChampionship && config.victoryEventId) {
            setTimeout(() => {
              get().checkForStoryEventById(config.victoryEventId!);
            }, 100);
          }
        }

        // Deduct energy (variable cost)
        const energyCost = TournamentManager.calculateMatchEnergyCost(currentStatus.energy);
        const newEnergy = Math.max(0, currentStatus.energy - energyCost);

        // Update mood from rewards
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + rewards.moodChange));

        // Update state with player changes and tournament progression
        // Only update activeTournament if tournament is not complete (it was already cleared above)
        set((state) => ({
          player: updatedPlayer,
          calendar: {
            ...state.calendar,
            activeTournament: isComplete ? state.calendar.activeTournament : updatedTournament,
            scheduledEvents: updatedScheduledEvents,
          },
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
          },
        }));

        // Check for challenge completion after stat changes
        get().checkChallengeCompletion();

        // Queue post-match event (use the current round BEFORE incrementing)
        const postMatchEventId = TournamentManager.getPostMatchEventId(config, activeTournament.currentRound, result);
        if (postMatchEventId) {
          setTimeout(() => {
            get().checkForStoryEventById(postMatchEventId);
          }, 100);
        }

        // Schedule next match if tournament continues
        if (!isComplete) {
          setTimeout(() => {
            get().scheduleNextTournamentMatch();
          }, 100);
        }
      },

      // Cancel/forfeit tournament
      cancelTournament: () => {
        const { calendar, completedStoryEvents } = get();
        const activeTournament = calendar.activeTournament;

        // Get tournament configuration to find all related event IDs
        let eventIdsToRemove: string[] = [];
        if (activeTournament) {
          const config = TournamentRegistry.getTournament(activeTournament.tournamentId);
          if (config) {
            // Collect all event IDs from this tournament
            // Opening ceremony (keep this as completed to skip on restart)
            // Victory and elimination events
            if (config.victoryEventId) {
              eventIdsToRemove.push(config.victoryEventId);
            }
            if (config.eliminationEventId) {
              eventIdsToRemove.push(config.eliminationEventId);
            }

            // All round-specific events (prematch and postmatch for both brackets)
            config.rounds.forEach(round => {
              eventIdsToRemove.push(round.prematchEventWinner);
              eventIdsToRemove.push(round.prematchEventLoser);
              eventIdsToRemove.push(round.winEventId);
              eventIdsToRemove.push(round.lossEventId);
            });
          }
        }

        // Remove tournament events from completed list (except opening ceremony)
        const updatedCompletedEvents = completedStoryEvents.filter(
          eventId => !eventIdsToRemove.includes(eventId)
        );

        set((state) => ({
          calendar: {
            ...state.calendar,
            activeTournament: null,
            // Clear only tournament_match scheduled events
            scheduledEvents: state.calendar.scheduledEvents.filter(
              event => event.eventType !== 'tournament_match'
            ),
          },
          completedStoryEvents: updatedCompletedEvents,
        }));
      },

      // Check which tournaments player is eligible for
      checkTournamentEligibility: (): string[] => {
        const { player, completedStoryEvents, calendar } = get();
        if (!player) return [];

        return TournamentRegistry.getEligibleTournaments(player, {
          completedStoryEvents,
          calendar: {
            activeTournament: calendar.activeTournament,
            completedTournaments: calendar.completedTournaments,
          },
        }).map(t => t.id);
      },

      // Get scheduled tournament match
      getScheduledTournamentMatch: (): ScheduledEvent | null => {
        const { calendar } = get();
        return TournamentManager.getScheduledTournamentMatch(calendar.activeTournament, calendar.scheduledEvents, calendar);
      },

      // Check if tournament match is scheduled
      isTournamentMatchScheduled: (): boolean => {
        return get().getScheduledTournamentMatch() !== null;
      },

      // ========================================================================
      // GENERIC SCHEDULED EVENT ACTIONS
      // ========================================================================

      // Schedule any event
      scheduleEvent: (event: ScheduledEvent) => {
        set((state) => ({
          calendar: {
            ...state.calendar,
            scheduledEvents: [...state.calendar.scheduledEvents, event],
          },
        }));
      },

      // Clear a scheduled event
      clearScheduledEvent: (day: number, slot: TimeSlot) => {
        set((state) => ({
          calendar: {
            ...state.calendar,
            scheduledEvents: ScheduledEventManager.clearScheduledEvent(state.calendar.scheduledEvents, day, slot),
          },
        }));
      },

      // Get scheduled event for current time
      getScheduledEvent: (): ScheduledEvent | null => {
        const { calendar } = get();
        return ScheduledEventManager.getScheduledEvent(calendar.scheduledEvents, calendar);
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

        // Challenge persistence
        activeChallenges: state.activeChallenges,
        completedChallenges: state.completedChallenges,

        // Note: Tournament state and scheduled events are now part of calendar
        // and are persisted automatically via state.calendar

        // Opponent tier progression
        unlockedTiers: state.unlockedTiers,
      }),
    }
  )
);
