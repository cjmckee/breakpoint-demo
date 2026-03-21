/**
 * Game Store
 * Central state management for player, calendar, training, and game progression
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  PlayerFlag,
  GameCalendar,
  TrainingSession,
  TrainingResult,
  RestResult,
  ActivityResult,
  CurrentStatus,
  TimeSlot,
  OpponentTier,
  ScheduledEvent,
  PlayerStats,
  TIME_SLOT_NAMES,
} from '../types/game';
import type { StoryEvent, StoryEventTag, StoryEventOption } from '../types/storyEvents';
import type { Challenge } from '../types/challenges';
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
import { StoryMatchManager } from '../game/StoryMatchManager';
import { DEFAULT_MATCH_ENERGY_COST } from '../config/matchRewards';
import { EffectAggregator } from '../core/EffectAggregator';
import { EffectKey } from '../types/game';
import type { GamePhase, MatchType, PreMatchConfig, PhaseContinuation, IdlePhase, MatchCompletionData } from '../types/gamePhase';
import type { InteractiveMatchConfig } from '../types/keyMoments';

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

  // Challenge state
  activeChallenges: Challenge[];
  completedChallenges: string[];

  // Opponent tier progression
  unlockedTiers: OpponentTier[];

  // UI state
  isInitialized: boolean;
  gamePhase: GamePhase;

  // Actions
  initializeGame: () => void;
  createPlayer: (name: string, playstyle: 'offensive' | 'defensive' | 'balanced') => void;
  selectTraining: (session: TrainingSession) => void;
  executeTraining: () => void;
  applyTrainingResult: (result: TrainingResult) => Player;
  advanceTime: () => void;
  rest: () => void;
  updateMood: (change: number) => void;
  unlockNextTier: () => OpponentTier | null;
  exportSave: () => string;
  importSave: (jsonData: string) => boolean;
  clearAllData: () => void;
  getAvailableTrainingSessions: () => TrainingSession[];

  // Phase transition actions
  navigateTo: (target: 'idle' | 'training' | 'match_setup' | 'tournament_list' | 'inventory') => void;
  navigateToScheduledMatch: (matchType: 'tournament' | 'story') => void;
  beginMatch: (config: InteractiveMatchConfig, matchType: MatchType) => void;
  onMatchComplete: (data: MatchCompletionData) => void;
  dismissMatchResults: () => void;
  dismissStoryEventResult: () => void;
  dismissOverlay: () => void;

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
  startTournament: (tournamentId: string, options?: { skipCeremony?: boolean }) => void;
  scheduleNextTournamentMatch: () => void;
  cancelTournament: () => void;
  checkTournamentEligibility: () => string[];
  getScheduledTournamentMatch: () => ScheduledEvent | null;
  isTournamentMatchScheduled: () => boolean;

  // Story match actions
  getScheduledStoryMatch: () => ScheduledEvent | null;
  isStoryMatchScheduled: () => boolean;
  // Player flag actions
  setFlag: (key: string, value: boolean | number | string) => void;
  getFlag: (key: string) => boolean | number | string | undefined;

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
      // Challenge initial state
      activeChallenges: [],
      completedChallenges: [],

      // Opponent tier progression initial state
      unlockedTiers: [1],  // Start with only tier 1 unlocked

      isInitialized: false,
      gamePhase: { type: 'uninitialized' },

      // Initialize game (Zustand auto-loads persisted state)
      initializeGame: () => {
        const state = get();
        if (state.isInitialized) {
          console.log('[initializeGame] Already initialized, skipping');
          return;
        }
        console.log('[initializeGame] Running initialization');

        // Reconcile all missed events on load
        // Matches get rescheduled, story events get cleared (they'll re-trigger via normal flow)
        if (state.player && state.calendar.scheduledEvents.length > 0) {
          let events = state.calendar.scheduledEvents;
          let missedEvents = ScheduledEventManager.getMissedEvents(events, state.calendar);

          while (missedEvents.length > 0) {
            const missed = missedEvents[0];
            const action = missed.eventType === 'tournament_match' || missed.eventType === 'story_match'
              ? `Rescheduling to Day ${state.calendar.currentDay + 1} ${TIME_SLOT_NAMES[missed.scheduledTimeSlot]}`
              : missed.eventType === 'story' ? 'Clearing (will re-check via normal flow)' : 'Discarding';
            console.warn(
              `[EventReconciliation:Load] Missed ${missed.eventType} event ` +
              `scheduled for Day ${missed.scheduledDay} ${TIME_SLOT_NAMES[missed.scheduledTimeSlot]}` +
              `${missed.metadata ? ` (${JSON.stringify(missed.metadata)})` : ''}. ${action}.`
            );

            const { updatedEvents } = ScheduledEventManager.reconcileMissedEvent(
              events,
              missed,
              state.calendar
            );
            events = updatedEvents;
            missedEvents = ScheduledEventManager.getMissedEvents(events, state.calendar);
          }

          if (events !== state.calendar.scheduledEvents) {
            console.warn(`[EventReconciliation:Load] Reconciliation complete — updated scheduled events on load.`);
            set({
              calendar: {
                ...state.calendar,
                scheduledEvents: events,
              },
            });
          }
        }

        set({ isInitialized: true });

        if (state.player) {
          // Use navigateTo so it checks for scheduled matches/pre-match events
          get().navigateTo('idle');
        } else {
          set({ gamePhase: { type: 'player_creation' } });
        }
      },

      // Create new player
      createPlayer: (name: string, playstyle: 'offensive' | 'defensive' | 'balanced') => {
        const player = PlayerManager.createPlayer(name, playstyle);

        // Generate initial training sessions
        const { effects: initialEffects } = EffectAggregator.getActiveEffects(player);
        const initialSessions = TrainingSystem.getAvailableTrainingSessions(player, 0, undefined, 4, initialEffects);

        // Schedule initial story events so they fire reliably in the correct order
        // rather than relying on random chance triggers
        const initialStorySchedule: ScheduledEvent[] = [
          // Tutorial events - spaced out so the player has time to explore between them
          { eventType: 'story', scheduledDay: 2, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'making_connections' } },
          { eventType: 'story', scheduledDay: 3, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'food_hall_gossip' } },
          { eventType: 'story', scheduledDay: 4, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'player_tier_intro' } },
          { eventType: 'story', scheduledDay: 5, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'match_play_basics'}},
          { eventType: 'story', scheduledDay: 5, scheduledTimeSlot: TimeSlot.AFTERNOON, metadata: { storyEventId: 'training_session_intro' } },
          { eventType: 'story', scheduledDay: 6, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'relationship_basics' } },
          { eventType: 'story', scheduledDay: 7, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'abilities_basics' } },
          // Post-tutorial storyline events
          { eventType: 'story', scheduledDay: 8, scheduledTimeSlot: TimeSlot.AFTERNOON, metadata: { storyEventId: 'rival_first_encounter' } },
          { eventType: 'story', scheduledDay: 9, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'club_team_intro' } },
          { eventType: 'story', scheduledDay: 10, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'coach_first_meeting' } },
          { eventType: 'story', scheduledDay: 11, scheduledTimeSlot: TimeSlot.AFTERNOON, metadata: { storyEventId: 'club_team_first_practice' } },
          { eventType: 'story', scheduledDay: 12, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'coach_training_focus' } },
          { eventType: 'story', scheduledDay: 13, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'first_team_match_scheduled' } },
          // Continue coach storyline between matches
          { eventType: 'story', scheduledDay: 16, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'coach_balanced_development' } },
          // Team matches 2-5 - all before the Riverside Open
          // Each announcement fires 2 days before the match plays (relativeDays: 2 in each event)
          { eventType: 'story', scheduledDay: 17, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'second_team_match_scheduled' } },
          { eventType: 'story', scheduledDay: 21, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'third_team_match_scheduled' } },
          { eventType: 'story', scheduledDay: 25, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'fourth_team_match_scheduled' } },
          { eventType: 'story', scheduledDay: 29, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'fifth_team_match_scheduled' } },
          // Tournament trigger - after all 5 team matches (day 31 is last match, prep on day 33, ceremony day 36)
          { eventType: 'story', scheduledDay: 33, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'riverside_open_prep' } }
        ];

        set({
          player,
          currentTrainingSessions: initialSessions,
          gamePhase: { type: 'idle', overlay: null },
          calendar: {
            ...get().calendar,
            scheduledEvents: [
              ...get().calendar.scheduledEvents,
              ...initialStorySchedule,
            ],
          },
        });

        // Trigger welcome event (guaranteed, no probability roll)
        get().checkForStoryEventById('welcome_to_tennis_rpg');
      },

      // Select training session (doesn't execute yet)
      selectTraining: (_session: TrainingSession) => {
        set({ gamePhase: { type: 'training' } });
      },

      // Execute training
      executeTraining: () => {
        const { player, currentStatus } = get();
        if (!player) return;

        // Get active effects from items/abilities
        const { effects: activeEffects } = EffectAggregator.getActiveEffects(player);

        // Get available training sessions
        const sessions = TrainingSystem.getAvailableTrainingSessions(
          player,
          currentStatus.mood,
          undefined,
          4,
          activeEffects
        );

        if (sessions.length === 0) return;

        // For now, execute the first session (UI will handle selection)
        const session = sessions[0];

        const result = TrainingSystem.executeTraining(
          player,
          session,
          currentStatus.energy,
          activeEffects
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
          gamePhase: { type: 'idle', overlay: null },
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

        // Apply energy/mood effects from items/abilities
        const { effects: trainingEffects } = EffectAggregator.getActiveEffects(finalPlayer);
        const energyCostReduction = EffectAggregator.getEffect(trainingEffects, EffectKey.ENERGY_COST_REDUCTION);
        const moodGainBonus = result.moodChange > 0
          ? EffectAggregator.getEffect(trainingEffects, EffectKey.MOOD_GAIN_BONUS)
          : 0;

        // Update energy and mood
        const newEnergy = Math.max(0, currentStatus.energy - Math.max(0, result.energyCost - energyCostReduction));
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + result.moodChange + moodGainBonus));

        set({
          player: finalPlayer,
          currentStatus: {
            energy: newEnergy,
            mood: newMood,
            lastActivity: result,
          },
          activityHistory: [result, ...get().activityHistory].slice(0, 10),
        });

        // Show training result as overlay on idle screen
        set({ gamePhase: { type: 'idle', overlay: { type: 'training_result', result } } });

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
          ? TrainingSystem.getAvailableTrainingSessions(
              player, newMood, undefined, 4,
              EffectAggregator.getActiveEffects(player).effects
            )
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

        // Reconcile any missed events before checking the current slot
        // Process one missed event per advanceTime call to avoid modal stacking
        const missedEvents = ScheduledEventManager.getMissedEvents(
          get().calendar.scheduledEvents,
          newCalendar
        );

        if (missedEvents.length > 0) {
          const missed = missedEvents[0];
          console.warn(
            `[EventReconciliation] Missed ${missed.eventType} event ` +
            `scheduled for Day ${missed.scheduledDay} ${TIME_SLOT_NAMES[missed.scheduledTimeSlot]}` +
            `${missed.metadata ? ` (${JSON.stringify(missed.metadata)})` : ''}` +
            ` — now Day ${newCalendar.currentDay} ${TIME_SLOT_NAMES[newCalendar.currentTimeSlot]}.` +
            ` ${missed.eventType === 'tournament_match' || missed.eventType === 'story_match'
              ? `Rescheduling to Day ${newCalendar.currentDay + 1} ${TIME_SLOT_NAMES[missed.scheduledTimeSlot]}.`
              : missed.eventType === 'story' ? 'Triggering now.' : 'Discarding.'
            }` +
            ` (${missedEvents.length} total missed event(s) remaining)`
          );

          const { updatedEvents, storyEventToTrigger } = ScheduledEventManager.reconcileMissedEvent(
            get().calendar.scheduledEvents,
            missed,
            newCalendar
          );

          set({
            calendar: {
              ...get().calendar,
              scheduledEvents: updatedEvents,
            },
          });

          if (storyEventToTrigger) {
            const storyEventId = (storyEventToTrigger.metadata as Record<string, unknown>)?.storyEventId as string | undefined;
            if (storyEventId) {
              get().checkForStoryEventById(storyEventId);
            }
          }
        }

        // Check for story events at start of new slot — but only if no overlay is
        // already showing (e.g. training result).  When the overlay is dismissed,
        // navigateTo('idle') will re-check for pending events.
        const currentOverlay = get().gamePhase.type === 'idle' && (get().gamePhase as IdlePhase).overlay;
        if (!currentOverlay && newCalendar.currentTimeSlot !== TimeSlot.NIGHT) {
          const scheduledEvent = ScheduledEventManager.getScheduledEvent(
            get().calendar.scheduledEvents,
            get().calendar
          );

          if (scheduledEvent && scheduledEvent.eventType === 'story') {
            // Scheduled story event: trigger by ID and clear the slot
            const storyEventId = (scheduledEvent.metadata as Record<string, unknown>)?.storyEventId as string | undefined;
            if (storyEventId) {
              get().clearScheduledEvent(get().calendar.currentDay, get().calendar.currentTimeSlot);
              get().checkForStoryEventById(storyEventId);
            }
          } else if (!scheduledEvent) {
            get().checkForRandomStoryEvent();
          }
        }

        // Milestone events are checked in dismissMatchResults(), not here.

        // Unlock "Play Match" once the player reaches day 5
        if (newCalendar.currentDay >= 5 && !get().getFlag(PlayerFlag.MATCH_UNLOCKED)) {
          get().setFlag(PlayerFlag.MATCH_UNLOCKED, true);
        }
      },

      // Rest (restore energy)
      rest: () => {
        const { player, currentStatus, calendar } = get();

        // Apply energy/mood bonuses from items/abilities
        const activeEffects = player ? EffectAggregator.getActiveEffects(player).effects : {};
        const energyBonus = EffectAggregator.getEffect(activeEffects, EffectKey.ENERGY_GAIN_BONUS);
        const moodBonus = EffectAggregator.getEffect(activeEffects, EffectKey.MOOD_GAIN_BONUS);

        // Regular rest gives 20 energy
        // If it's night time (which will advance to next day), add 30 bonus for sleeping
        const isNightTime = calendar.currentTimeSlot === TimeSlot.NIGHT;
        const restEnergy = defaultRestEnergy;
        const sleepBonus = isNightTime ? defaultSleepBonus : 0;
        const totalEnergyRestored = restEnergy + sleepBonus + energyBonus;
        const newEnergy = Math.min(100, currentStatus.energy + totalEnergyRestored);
        const restMoodGain = defaultMoodBonus + moodBonus;

        const restResult: RestResult = {
          id: `rest-${Date.now()}`,
          type: 'rest',
          source: 'rest_activity',
          timestamp: new Date().toISOString(),
          timeSlotsUsed: 1,
          energyCost: 0,
          moodResult: restMoodGain,
          restType: isNightTime ? 'deep' : 'moderate',
          energyRestored: totalEnergyRestored,
        };

        set({
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: Math.min(100, currentStatus.mood + restMoodGain),
            lastActivity: restResult,
          },
          activityHistory: [restResult, ...get().activityHistory].slice(0, 10),
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
            gamePhase: { type: 'idle', overlay: null },
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
          isInitialized: true,
          gamePhase: { type: 'player_creation' },
        });

        // Also clear localStorage to ensure clean slate
        localStorage.clear();
        console.log('All game data cleared');
      },

      // Phase transition actions

      navigateTo: (target) => {
        if (target === 'idle') {
          // Check for scheduled matches with pre-match events
          const state = get();
          const { calendar, completedStoryEvents, completedStoryEventChoices, relationships, player } = state;

          console.log(`[navigateTo:idle] Day ${calendar.currentDay}, slot ${calendar.currentTimeSlot}`);

          // Check tournament match first
          const tournamentMatch = state.getScheduledTournamentMatch();
          if (tournamentMatch && calendar.activeTournament) {
            const config = TournamentRegistry.getTournament(calendar.activeTournament.tournamentId);
            if (config) {
              const prematchEventId = TournamentManager.getPrematchEventId(
                config,
                calendar.activeTournament.currentRound,
                calendar.activeTournament.currentBracket
              );
              if (prematchEventId && player) {
                const event = StoryEventManager.getEligibleEventById(prematchEventId, player, {
                  completedStoryEvents, completedStoryEventChoices, relationships, calendar,
                  activeTournament: calendar.activeTournament,
                });
                if (event) {
                  const round = TournamentManager.getCurrentRound(config, calendar.activeTournament!.currentRound);
                  const opponent = round?.opponent;
                  const matchConfig: PreMatchConfig = {
                    opponentName: opponent?.name || 'Opponent',
                    opponentStats: opponent?.stats || ({} as PlayerStats),
                    opponentTier: (opponent?.tier || 1) as OpponentTier,
                    opponentDescription: opponent?.description,
                    surface: config.surface || 'hard',
                    matchFormat: 'best-of-1',
                    matchTitle: `${config.name} - Round ${calendar.activeTournament!.currentRound + 1}`,
                  };
                  const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, {
                    completedStoryEvents, completedStoryEventChoices, relationships, calendar,
                    activeTournament: calendar.activeTournament,
                  });
                  set({
                    gamePhase: {
                      type: 'story_event',
                      event,
                      availableOptions,
                      continuation: { type: 'match_setup', matchType: 'tournament', matchConfig },
                    },
                  });
                  return;
                }
              }
            }
          }

          // Check story match
          const storyMatch = state.getScheduledStoryMatch();
          console.log(`[navigateTo:idle] Story match scheduled:`, storyMatch ? `Day ${storyMatch.scheduledDay} slot ${storyMatch.scheduledTimeSlot}` : 'none');
          if (storyMatch && player) {
            const metadata = StoryMatchManager.getStoryMatchMetadata(storyMatch);
            console.log(`[navigateTo:idle] Story match metadata:`, metadata ? `prematchEventId=${metadata.prematchEventId}` : 'none');
            if (metadata) {
              const matchConfig: PreMatchConfig = {
                opponentName: metadata.opponentName,
                opponentStats: metadata.opponentStats,
                opponentTier: metadata.opponentTier as OpponentTier,
                opponentDescription: metadata.opponentDescription,
                surface: metadata.surface || 'hard',
                matchFormat: metadata.matchFormat || 'best-of-1',
                matchTitle: metadata.matchTitle,
                matchDescription: metadata.matchDescription,
                storyMatchMetadata: metadata,
              };
              if (metadata.prematchEventId) {
                const event = StoryEventManager.getEligibleEventById(metadata.prematchEventId, player, {
                  completedStoryEvents, completedStoryEventChoices, relationships, calendar,
                  activeTournament: calendar.activeTournament,
                });
                console.log(`[navigateTo:idle] Pre-match event "${metadata.prematchEventId}" eligible:`, !!event);
                if (event) {
                  const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, {
                    completedStoryEvents, completedStoryEventChoices, relationships, calendar,
                    activeTournament: calendar.activeTournament,
                  });
                  set({
                    gamePhase: {
                      type: 'story_event',
                      event,
                      availableOptions,
                      continuation: { type: 'match_setup', matchType: 'story', matchConfig },
                    },
                  });
                  return;
                }
              }
              // Story match scheduled but no prematch event — go to setup directly
              set({ gamePhase: { type: 'match_setup', matchType: 'story', matchConfig } });
              return;
            }
          }

          // Check for scheduled story events in the current time slot
          const scheduledEvent = ScheduledEventManager.getScheduledEvent(
            calendar.scheduledEvents,
            calendar
          );
          if (scheduledEvent && scheduledEvent.eventType === 'story') {
            const storyEventId = (scheduledEvent.metadata as Record<string, unknown>)?.storyEventId as string | undefined;
            if (storyEventId) {
              set({ gamePhase: { type: 'idle', overlay: null } });
              get().clearScheduledEvent(calendar.currentDay, calendar.currentTimeSlot);
              get().checkForStoryEventById(storyEventId);
              return;
            }
          }

          // No scheduled matches or events — plain idle
          set({ gamePhase: { type: 'idle', overlay: null } });

          // Roll for random story event (same as advanceTime does)
          if (calendar.currentTimeSlot !== TimeSlot.NIGHT) {
            get().checkForRandomStoryEvent();
          }
          return;
        }

        // Simple screen navigation
        switch (target) {
          case 'training':
            set({ gamePhase: { type: 'training' } });
            break;
          case 'match_setup':
            set({ gamePhase: { type: 'match_setup', matchType: 'regular', matchConfig: null } });
            break;
          case 'tournament_list':
            set({ gamePhase: { type: 'tournament_list' } });
            break;
          case 'inventory':
            set({ gamePhase: { type: 'inventory' } });
            break;
        }
      },

      navigateToScheduledMatch: (matchType) => {
        console.log(`[navigateToScheduledMatch] matchType=${matchType}`);
        const state = get();
        const { completedStoryEvents, completedStoryEventChoices, relationships, calendar, player } = state;
        const eventContext = { completedStoryEvents, completedStoryEventChoices, relationships, calendar, activeTournament: calendar.activeTournament };

        if (matchType === 'tournament') {
          const tournamentMatch = state.getScheduledTournamentMatch();
          if (tournamentMatch && calendar.activeTournament) {
            const config = TournamentRegistry.getTournament(calendar.activeTournament.tournamentId);
            if (config) {
              const round = TournamentManager.getCurrentRound(config, calendar.activeTournament!.currentRound);
              const opponent = round?.opponent;
              const matchConfig: PreMatchConfig = {
                opponentName: opponent?.name || 'Opponent',
                opponentStats: opponent?.stats || ({} as PlayerStats),
                opponentTier: (opponent?.tier || 1) as OpponentTier,
                opponentDescription: opponent?.description,
                surface: config.surface || 'hard',
                matchFormat: 'best-of-1',
                matchTitle: `${config.name} - Round ${calendar.activeTournament!.currentRound + 1}`,
              };

              // Check for pre-match event before going to match setup
              const prematchEventId = TournamentManager.getPrematchEventId(
                config, calendar.activeTournament.currentRound, calendar.activeTournament.currentBracket
              );
              if (prematchEventId && player) {
                const event = StoryEventManager.getEligibleEventById(prematchEventId, player, eventContext);
                if (event) {
                  const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, eventContext);
                  set({
                    gamePhase: {
                      type: 'story_event',
                      event,
                      availableOptions,
                      continuation: { type: 'match_setup', matchType: 'tournament', matchConfig },
                    },
                  });
                  return;
                }
              }

              set({ gamePhase: { type: 'match_setup', matchType: 'tournament', matchConfig } });
            }
          }
        } else if (matchType === 'story') {
          const storyMatch = state.getScheduledStoryMatch();
          if (storyMatch) {
            const metadata = StoryMatchManager.getStoryMatchMetadata(storyMatch);
            if (metadata) {
              const matchConfig: PreMatchConfig = {
                opponentName: metadata.opponentName,
                opponentStats: metadata.opponentStats,
                opponentTier: metadata.opponentTier as OpponentTier,
                opponentDescription: metadata.opponentDescription,
                surface: metadata.surface || 'hard',
                matchFormat: metadata.matchFormat || 'best-of-1',
                matchTitle: metadata.matchTitle,
                matchDescription: metadata.matchDescription,
                storyMatchMetadata: metadata,
              };

              // Check for pre-match event before going to match setup
              if (metadata.prematchEventId && player) {
                const event = StoryEventManager.getEligibleEventById(metadata.prematchEventId, player, eventContext);
                if (event) {
                  const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, eventContext);
                  set({
                    gamePhase: {
                      type: 'story_event',
                      event,
                      availableOptions,
                      continuation: { type: 'match_setup', matchType: 'story', matchConfig },
                    },
                  });
                  return;
                }
              }

              set({ gamePhase: { type: 'match_setup', matchType: 'story', matchConfig } });
            }
          }
        }
      },

      beginMatch: (config, matchType) => {
        // Preserve storyMatchMetadata from setup phase
        const currentPhase = get().gamePhase;
        const storyMatchMetadata = currentPhase.type === 'match_setup' && currentPhase.matchConfig?.storyMatchMetadata;
        set({
          gamePhase: {
            type: 'match_active',
            matchType,
            matchConfig: config,
            ...(storyMatchMetadata ? { storyMatchMetadata } : {}),
          },
        });

        // Match orchestrator is started by the component — it calls
        // matchStore.startMatch() and passes a callback that calls gameStore.onMatchComplete().
      },

      onMatchComplete: (data) => {
        const { finalScore, matchStatistics, accumulatedEffects, keyMomentHistory } = data;
        const state = get();
        const phase = state.gamePhase;
        if (phase.type !== 'match_active') {
          console.warn('onMatchComplete called but gamePhase is not match_active:', phase.type);
          return;
        }

        if (!state.player) {
          console.warn('onMatchComplete: missing player');
          return;
        }

        const { matchType, matchConfig } = phase;
        const isWin = finalScore.winner === 'player';
        const opponentTier = (matchConfig.opponentTier || 1) as OpponentTier;

        // Calculate rewards
        const rewards = MatchRewardSystem.calculateRewards(matchStatistics, opponentTier, isWin);

        // Apply rewards to player
        let updatedPlayer = PlayerManager.applyStatBoosts(state.player, rewards.statBoosts);
        if (rewards.abilitiesGained && rewards.abilitiesGained.length > 0) {
          for (const ability of rewards.abilitiesGained) {
            updatedPlayer = PlayerManager.addAbility(updatedPlayer, ability);
          }
        }
        if (rewards.itemsGained && rewards.itemsGained.length > 0) {
          for (const item of rewards.itemsGained) {
            updatedPlayer = ItemManager.addItem(updatedPlayer, item);
          }
        }

        // Update match counts
        updatedPlayer.matchesPlayed = (updatedPlayer.matchesPlayed || 0) + 1;
        if (isWin) {
          updatedPlayer.matchesWon = (updatedPlayer.matchesWon || 0) + 1;
        }
        const currentResults = updatedPlayer.latestMatchResults || [];
        updatedPlayer.latestMatchResults = ([isWin ? 'win' : 'loss', ...currentResults] as ('win' | 'loss')[]).slice(0, 10);

        // Calculate energy and mood changes
        const keyMomentEnergyCost = accumulatedEffects ? accumulatedEffects.energyDelta : 0;
        const keyMomentMoodChange = accumulatedEffects ? accumulatedEffects.moodDelta : 0;

        let energyCost: number;
        if (matchType === 'tournament') {
          energyCost = TournamentManager.calculateMatchEnergyCost(state.currentStatus.energy);
        } else if (matchType === 'story') {
          energyCost = StoryMatchManager.calculateMatchEnergyCost(state.currentStatus.energy);
        } else {
          energyCost = DEFAULT_MATCH_ENERGY_COST;
        }

        const newEnergy = Math.max(0, state.currentStatus.energy - energyCost + keyMomentEnergyCost);
        const newMood = Math.max(-100, Math.min(100, state.currentStatus.mood + rewards.moodChange + keyMomentMoodChange));

        // Match-type-specific state updates
        let calendarUpdate = { ...state.calendar };

        if (matchType === 'story') {
          // Clear scheduled story match event
          calendarUpdate = {
            ...calendarUpdate,
            scheduledEvents: ScheduledEventManager.clearScheduledEvent(
              calendarUpdate.scheduledEvents,
              calendarUpdate.currentDay,
              calendarUpdate.currentTimeSlot
            ),
          };
        }

        if (matchType === 'tournament' && calendarUpdate.activeTournament) {
          // Update tournament bracket progression
          const tournament = calendarUpdate.activeTournament;
          const config = TournamentRegistry.getTournament(tournament.tournamentId);
          if (config) {
            let updatedTournament = { ...tournament };
            const totalRounds = config.rounds.length;

            if (!isWin && tournament.currentBracket === 'winner') {
              // Loss in winner bracket -> move to loser bracket
              updatedTournament = {
                ...updatedTournament,
                currentBracket: 'loser' as const,
                currentRound: 0,
              };
            } else if (isWin || tournament.currentBracket === 'loser') {
              // Win -> advance round
              updatedTournament = {
                ...updatedTournament,
                currentRound: tournament.currentRound + 1,
              };
            }

            // Check if tournament is complete
            const isEliminated = !isWin && tournament.currentBracket === 'loser';
            const isChampion = isWin && tournament.currentRound + 1 >= totalRounds && tournament.currentBracket === 'winner';
            const isConsolationWinner = isWin && tournament.currentRound + 1 >= config.rounds.length && tournament.currentBracket === 'loser';

            if (isEliminated || isChampion || isConsolationWinner) {
              // Tournament over
              const completedTournaments = [...(calendarUpdate.completedTournaments || [])];
              completedTournaments.push({
                tournamentId: tournament.tournamentId,
                won: isChampion,
                completedAt: new Date().toISOString(),
              });
              calendarUpdate = {
                ...calendarUpdate,
                activeTournament: null,
                completedTournaments,
              };
            } else {
              calendarUpdate = {
                ...calendarUpdate,
                activeTournament: updatedTournament,
              };
            }
          }

          // Clear the tournament match scheduled event
          calendarUpdate = {
            ...calendarUpdate,
            scheduledEvents: ScheduledEventManager.clearScheduledEvent(
              calendarUpdate.scheduledEvents,
              calendarUpdate.currentDay,
              calendarUpdate.currentTimeSlot
            ),
          };
        }

        // Advance time slot (match consumes a time slot)
        const advancedCalendar = TimeManager.advanceTimeSlot(calendarUpdate);

        // Update state atomically
        set({
          player: updatedPlayer,
          calendar: advancedCalendar,
          currentStatus: {
            ...state.currentStatus,
            energy: newEnergy,
            mood: newMood,
          },
          gamePhase: {
            type: 'match_results',
            matchType,
            finalScore,
            matchStatistics,
            rewards,
            matchConfig,
            accumulatedEffects: accumulatedEffects || null,
            keyMomentHistory: keyMomentHistory || [],
            ...(phase.storyMatchMetadata ? { storyMatchMetadata: phase.storyMatchMetadata } : {}),
          },
        });

        // Check challenge completion
        get().checkChallengeCompletion();
      },

      dismissMatchResults: () => {
        const phase = get().gamePhase;
        if (phase.type !== 'match_results') return;

        const { matchType, finalScore } = phase;
        const isWin = finalScore.winner === 'player';
        const result = isWin ? 'win' : 'loss';
        const state = get();

        if (matchType === 'story') {
          // Check for post-match story event
          const storyMeta = phase.storyMatchMetadata;
          if (storyMeta) {
            const postMatchEventId = StoryMatchManager.getPostMatchEventId(storyMeta, result);
            if (postMatchEventId && state.player) {
              const event = StoryEventManager.getEligibleEventById(postMatchEventId, state.player, {
                completedStoryEvents: state.completedStoryEvents,
                completedStoryEventChoices: state.completedStoryEventChoices,
                relationships: state.relationships,
                calendar: state.calendar,
                activeTournament: state.calendar.activeTournament,
              });
              if (event) {
                const availableOptions = PrerequisiteChecker.getAvailableOptions(event, state.player, {
                  completedStoryEvents: state.completedStoryEvents,
                  completedStoryEventChoices: state.completedStoryEventChoices,
                  relationships: state.relationships,
                  calendar: state.calendar,
                  activeTournament: state.calendar.activeTournament,
                });
                set({
                  gamePhase: {
                    type: 'story_event',
                    event,
                    availableOptions,
                    continuation: { type: 'idle' },
                  },
                });
                return;
              }
            }
          }
        }

        if (matchType === 'tournament') {
          const { calendar } = state;
          const tournament = calendar.activeTournament;

          if (tournament) {
            const config = TournamentRegistry.getTournament(tournament.tournamentId);
            if (config) {
              // Check for post-match event
              const postMatchEventId = TournamentManager.getPostMatchEventId(config, tournament.currentRound, result);
              if (postMatchEventId && state.player) {
                const event = StoryEventManager.getEligibleEventById(postMatchEventId, state.player, {
                  completedStoryEvents: state.completedStoryEvents,
                  completedStoryEventChoices: state.completedStoryEventChoices,
                  relationships: state.relationships,
                  calendar: state.calendar,
                  activeTournament: tournament,
                });
                if (event) {
                  const availableOptions = PrerequisiteChecker.getAvailableOptions(event, state.player, {
                    completedStoryEvents: state.completedStoryEvents,
                    completedStoryEventChoices: state.completedStoryEventChoices,
                    relationships: state.relationships,
                    calendar: state.calendar,
                    activeTournament: tournament,
                  });
                  set({
                    gamePhase: {
                      type: 'story_event',
                      event,
                      availableOptions,
                      continuation: { type: 'idle' },
                    },
                  });
                  // Schedule next tournament match if tournament still active
                  if (calendar.activeTournament) {
                    get().scheduleNextTournamentMatch();
                  }
                  return;
                }
              }

              // Schedule next tournament match if tournament still active
              if (calendar.activeTournament) {
                get().scheduleNextTournamentMatch();
              }
            }
          }

          // Check for elimination/victory/consolation events
          if (!calendar.activeTournament) {
            // Tournament just ended — check for completion events
            const completedTournaments = calendar.completedTournaments || [];
            const lastCompleted = completedTournaments[completedTournaments.length - 1];
            if (lastCompleted && state.player) {
              const config = TournamentRegistry.getTournament(lastCompleted.tournamentId);
              if (config) {
                let completionEventId: string | undefined;
                if (lastCompleted.won && config.victoryEventId) {
                  completionEventId = config.victoryEventId;
                } else if (!lastCompleted.won && config.eliminationEventId) {
                  completionEventId = config.eliminationEventId;
                }
                if (completionEventId) {
                  const event = StoryEventManager.getEligibleEventById(completionEventId, state.player, {
                    completedStoryEvents: state.completedStoryEvents,
                    completedStoryEventChoices: state.completedStoryEventChoices,
                    relationships: state.relationships,
                    calendar: state.calendar,
                    activeTournament: null,
                  });
                  if (event) {
                    const availableOptions = PrerequisiteChecker.getAvailableOptions(event, state.player, {
                      completedStoryEvents: state.completedStoryEvents,
                      completedStoryEventChoices: state.completedStoryEventChoices,
                      relationships: state.relationships,
                      calendar: state.calendar,
                      activeTournament: null,
                    });
                    set({
                      gamePhase: {
                        type: 'story_event',
                        event,
                        availableOptions,
                        continuation: { type: 'idle' },
                      },
                    });
                    return;
                  }
                }
              }
            }
          }
        }

        // Check for milestone events (e.g. "won first match", "hit 10 winners")
        // These only trigger after match completion, never during regular time advancement.
        get().checkForStoryEventByTag('milestone', 100);
        // If a milestone event was triggered, checkForStoryEventByTag already set the phase
        if (get().gamePhase.type !== 'match_results') return;

        // Default: go to idle
        get().navigateTo('idle');
      },

      dismissStoryEventResult: () => {
        const phase = get().gamePhase;
        if (phase.type === 'story_event_result') {
          const { continuation } = phase;
          if (continuation.type === 'idle') {
            get().navigateTo('idle');
          } else if (continuation.type === 'match_setup') {
            set({ gamePhase: { type: 'match_setup', matchType: continuation.matchType, matchConfig: continuation.matchConfig } });
          }
          return;
        }
        // Handle overlay dismissal
        const currentPhase = get().gamePhase;
        if (currentPhase.type === 'idle' && currentPhase.overlay?.type === 'story_event_result') {
          const { continuation } = currentPhase.overlay;
          if (continuation.type === 'idle') {
            get().navigateTo('idle');
          } else if (continuation.type === 'match_setup') {
            set({ gamePhase: { type: 'match_setup', matchType: continuation.matchType, matchConfig: continuation.matchConfig } });
          }
        }
      },

      dismissOverlay: () => {
        // Use navigateTo('idle') so it re-checks for scheduled events
        // that were deferred while the overlay was showing
        get().navigateTo('idle');
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
        const { player, gamePhase } = get();
        if (!player) return;

        const gameState = get();
        const event = StoryEventManager.getEligibleEventById(eventId, player, {
          completedStoryEvents: gameState.completedStoryEvents,
          completedStoryEventChoices: gameState.completedStoryEventChoices,
          relationships: gameState.relationships,
          calendar: gameState.calendar,
          activeTournament: gameState.calendar.activeTournament,
        });

        if (event) {
          console.log(`[Story Event] Triggered: "${event.name}"`);
          const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          });

          if (gamePhase.type === 'idle') {
            // Show as overlay on idle screen
            set({
              gamePhase: {
                ...gamePhase,
                overlay: {
                  type: 'story_event',
                  event,
                  availableOptions,
                  continuation: { type: 'idle' },
                },
              },
            });
          } else {
            // Show as full-screen phase
            set({
              gamePhase: {
                type: 'story_event',
                event,
                availableOptions,
                continuation: { type: 'idle' },
              },
            });
          }
        } else {
          console.log(`[Story Event] Event not eligible: ${eventId}`);
        }
      },

      /**
       * Check for story events matching a specific tag
       * Randomly selects from eligible events with that tag
       * Use case: Tag-specific random events (e.g., coach events, romance events)
       */
      checkForStoryEventByTag: (tag: StoryEventTag, customChance?: number) => {
        const { player, storyEventTriggerChance, gamePhase } = get();

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger (apply event trigger bonus from items/abilities)
        const { effects } = EffectAggregator.getActiveEffects(player);
        const triggerBonus = EffectAggregator.getEffect(effects, EffectKey.EVENT_TRIGGER_BONUS);
        const chance = (customChance ?? storyEventTriggerChance) + triggerBonus;
        const roll = Math.random() * 100;
        const triggered = roll < chance;

        console.log(`[Story Event] Tag: ${tag} | Roll: ${roll.toFixed(2)} vs ${chance}% - ${triggered ? 'TRIGGERED' : 'Not triggered'}`);

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
          const availableOptions = PrerequisiteChecker.getAvailableOptions(selectedEvent, player, {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          });

          if (gamePhase.type === 'idle') {
            set({
              gamePhase: {
                ...gamePhase,
                overlay: {
                  type: 'story_event',
                  event: selectedEvent,
                  availableOptions,
                  continuation: { type: 'idle' },
                },
              },
            });
          } else {
            set({
              gamePhase: {
                type: 'story_event',
                event: selectedEvent,
                availableOptions,
                continuation: { type: 'idle' },
              },
            });
          }
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
        const { player, storyEventTriggerChance, gamePhase } = get();

        // Don't trigger if overlay already showing
        if (gamePhase.type === 'idle' && gamePhase.overlay !== null) return;

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger (apply event trigger bonus from items/abilities)
        const { effects } = EffectAggregator.getActiveEffects(player);
        const triggerBonus = EffectAggregator.getEffect(effects, EffectKey.EVENT_TRIGGER_BONUS);
        const chance = (customChance ?? storyEventTriggerChance) + triggerBonus;
        const roll = Math.random() * 100;
        const triggered = roll < chance;

        console.log(`[Story Event] Random | Roll: ${roll.toFixed(2)} vs ${chance}% - ${triggered ? 'TRIGGERED' : 'Not triggered'}`);

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
          const availableOptions = PrerequisiteChecker.getAvailableOptions(selectedEvent, player, {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          });

          if (gamePhase.type === 'idle') {
            set({
              gamePhase: {
                ...gamePhase,
                overlay: {
                  type: 'story_event',
                  event: selectedEvent,
                  availableOptions,
                  continuation: { type: 'idle' },
                },
              },
            });
          } else {
            set({
              gamePhase: {
                type: 'story_event',
                event: selectedEvent,
                availableOptions,
                continuation: { type: 'idle' },
              },
            });
          }
        } else {
          console.log(`[Story Event] No eligible events available`);
        }
      },

      // Execute story event with player's choice
      executeStoryEvent: (eventId: string, optionId?: string) => {
        const { player, calendar } = get();
        if (!player) return;

        // Read event from gamePhase (either story_event phase or idle overlay)
        let storyEvent: StoryEvent | null = null;
        let continuation: PhaseContinuation = { type: 'idle' };
        let isOverlay = false;

        const { gamePhase } = get();
        if (gamePhase.type === 'story_event') {
          storyEvent = gamePhase.event;
          continuation = gamePhase.continuation;
        } else if (gamePhase.type === 'idle' && gamePhase.overlay?.type === 'story_event') {
          storyEvent = gamePhase.overlay.event;
          continuation = gamePhase.overlay.continuation;
          isOverlay = true;
        }

        if (!storyEvent || storyEvent.id !== eventId) return;

        // Get selected option (if any)
        const selectedOption = optionId
          ? storyEvent.options.find((opt: StoryEventOption) => opt.id === optionId) || null
          : null;

        // Get outcome for applying effects
        const outcome = StoryEventManager.getOutcome(storyEvent, selectedOption);

        // Handle time slot consumption with overflow protection
        // Check both NIGHT overflow AND scheduled event conflicts
        const slotsToAdvance = storyEvent.timeSlotsRequired;
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
          storyEvent,
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

        // Apply items
        if (outcome.effects.itemsGained) {
          for (const item of outcome.effects.itemsGained) {
            updatedPlayer = ItemManager.addItem(updatedPlayer, item);
          }
        }

        // Apply tier change
        if (outcome.effects.tierChange !== undefined) {
          const newTier = outcome.effects.tierChange as OpponentTier;
          updatedPlayer = PlayerManager.updateTier(updatedPlayer, newTier);
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

        // Add scheduled events if any (resolve relative days to absolute days with conflict resolution)
        let updatedScheduledEvents = [...get().calendar.scheduledEvents];
        if (outcome.effects.scheduledEvents) {
          for (const template of outcome.effects.scheduledEvents) {
            const preferredDay = calendar.currentDay + template.relativeDays;
            const { updatedEvents } = ScheduledEventManager.scheduleEventWithConflictResolution(
              updatedScheduledEvents,
              template.eventType,
              preferredDay,
              template.scheduledTimeSlot,
              template.metadata
            );
            updatedScheduledEvents = updatedEvents;
          }
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
        });

        // Transition to story event result
        if (isOverlay) {
          set({
            gamePhase: {
              type: 'idle',
              overlay: {
                type: 'story_event_result',
                result,
                continuation,
              },
            },
          });
        } else {
          set({
            gamePhase: {
              type: 'story_event_result',
              result,
              continuation,
            },
          });
        }

        // Check for challenge completion after state changes
        get().checkChallengeCompletion();

        // Start tournament if requested by event effects (must happen before scheduling match)
        if (outcome.effects.startTournament) {
          get().startTournament(outcome.effects.startTournament, { skipCeremony: true });
        }

        // Schedule next tournament match if requested by the event outcome
        if (shouldScheduleTournamentMatch) {
          get().scheduleNextTournamentMatch();
        }
      },

      // Cancel/dismiss pending story event
      // When skipping an event, mark it as completed so it doesn't show up again
      cancelStoryEvent: () => {
        const { gamePhase } = get();

        let event: StoryEvent | null = null;
        let continuation: PhaseContinuation = { type: 'idle' };

        if (gamePhase.type === 'story_event') {
          event = gamePhase.event;
          continuation = gamePhase.continuation;
        } else if (gamePhase.type === 'idle' && gamePhase.overlay?.type === 'story_event') {
          event = gamePhase.overlay.event;
          continuation = gamePhase.overlay.continuation;
        }

        if (event) {
          // Mark as completed
          set({ completedStoryEvents: [...get().completedStoryEvents, event.id] });
        }

        // Follow continuation
        if (continuation.type === 'match_setup') {
          set({ gamePhase: { type: 'match_setup', matchType: continuation.matchType, matchConfig: continuation.matchConfig } });
        } else {
          get().navigateTo('idle');
        }
      },

      // Update character relationship
      updateRelationship: (character: string, change: number) => {
        const { player } = get();
        const relationships = { ...get().relationships };
        const current = relationships[character] || 0;

        // Apply relationship gain bonus from items/abilities (only on positive changes)
        let finalChange = change;
        if (change > 0 && player) {
          const { effects } = EffectAggregator.getActiveEffects(player);
          finalChange += EffectAggregator.getEffect(effects, EffectKey.RELATIONSHIP_GAIN_BONUS);
        }

        relationships[character] = Math.max(0, Math.min(100, current + finalChange));

        set({ relationships });

        // Check for challenge completion after relationship change
        get().checkChallengeCompletion();
      },

      // Set story event trigger chance
      setStoryEventTriggerChance: (chance: number) => {
        set({ storyEventTriggerChance: Math.max(0, Math.min(100, chance)) });
      },

      // Get available options for pending event (from modal queue)
      getAvailableEventOptions: (): StoryEventOption[] => {
        const { gamePhase, player } = get();
        let event: StoryEvent | null = null;

        if (gamePhase.type === 'story_event') {
          event = gamePhase.event;
        } else if (gamePhase.type === 'idle' && gamePhase.overlay?.type === 'story_event') {
          event = gamePhase.overlay.event;
        }

        if (!event || !player) return [];

        const state = get();
        return PrerequisiteChecker.getAvailableOptions(event, player, {
          completedStoryEvents: state.completedStoryEvents,
          completedStoryEventChoices: state.completedStoryEventChoices,
          relationships: state.relationships,
          calendar: state.calendar,
          activeTournament: state.calendar.activeTournament,
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
      startTournament: (tournamentId: string, options?: { skipCeremony?: boolean }) => {
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

        // Unlock the Tournaments card once a tournament has been started
        if (!get().getFlag(PlayerFlag.TOURNAMENTS_UNLOCKED)) {
          get().setFlag(PlayerFlag.TOURNAMENTS_UNLOCKED, true);
        }

        // Skip ceremony handling when called from an event that already IS the ceremony
        if (!options?.skipCeremony) {
          // Check if opening ceremony already completed
          const completedStoryEvents = get().completedStoryEvents;
          const ceremonyAlreadyCompleted = completedStoryEvents.includes(config.openingCeremonyEventId);

          if (ceremonyAlreadyCompleted) {
            // Skip ceremony and schedule first match directly
            console.log('Opening ceremony already completed, scheduling first match directly');
            get().scheduleNextTournamentMatch();
          } else {
            // Trigger opening ceremony as story_event phase with idle continuation
            // (idle will pick up the scheduled match)
            const player = get().player;
            if (player) {
              const gameState = get();
              const event = StoryEventManager.getEligibleEventById(config.openingCeremonyEventId, player, {
                completedStoryEvents: gameState.completedStoryEvents,
                completedStoryEventChoices: gameState.completedStoryEventChoices,
                relationships: gameState.relationships,
                calendar: gameState.calendar,
                activeTournament: gameState.calendar.activeTournament,
              });
              if (event) {
                const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, {
                  completedStoryEvents: gameState.completedStoryEvents,
                  completedStoryEventChoices: gameState.completedStoryEventChoices,
                  relationships: gameState.relationships,
                  calendar: gameState.calendar,
                  activeTournament: gameState.calendar.activeTournament,
                });
                set({
                  gamePhase: {
                    type: 'story_event',
                    event,
                    availableOptions,
                    continuation: { type: 'idle' },
                  },
                });
              }
            }
          }
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

        // Preferred: next day at afternoon slot (will auto-resolve conflicts)
        const preferredDay = calendar.currentDay + 1;
        const preferredSlot = TimeSlot.AFTERNOON;

        const metadata: TournamentMatchMetadata = {
          tournamentId: activeTournament.tournamentId,
          tournamentName: activeTournament.tournamentName,
          roundNumber: round.roundNumber,
          opponentId: round.opponent.characterId,
          opponentName: round.opponent.name,
          bracket: activeTournament.currentBracket,
        };

        console.log('Metadata for scheduled event:', metadata);

        // Schedule with conflict resolution
        const { event: scheduledEvent, actualDay, actualSlot, updatedEvents } =
          ScheduledEventManager.scheduleEventWithConflictResolution(
            calendar.scheduledEvents,
            'tournament_match',
            preferredDay,
            preferredSlot,
            metadata
          );

        console.log('Scheduled event created:', scheduledEvent, 'at day:', actualDay, 'slot:', actualSlot);

        set((state) => ({
          calendar: {
            ...state.calendar,
            scheduledEvents: updatedEvents,
          },
        }));
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
            if (config.consolationEventId) {
              eventIdsToRemove.push(config.consolationEventId);
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
            // Clear tournament_match scheduled events
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
      // STORY MATCH ACTIONS
      // ========================================================================

      // Get scheduled story match for current time
      getScheduledStoryMatch: (): ScheduledEvent | null => {
        const { calendar } = get();
        return StoryMatchManager.getScheduledStoryMatch(calendar.scheduledEvents, calendar);
      },

      // Check if story match is scheduled for current time
      isStoryMatchScheduled: (): boolean => {
        return get().getScheduledStoryMatch() !== null;
      },

      // ========================================================================
      // GENERIC SCHEDULED EVENT ACTIONS
      // ========================================================================

      // Schedule any event
      // ========================================================================
      // PLAYER FLAG ACTIONS
      // ========================================================================

      setFlag: (key: string, value: boolean | number | string) => {
        const { player } = get();
        if (!player) return;
        set({
          player: {
            ...player,
            flags: { ...player.flags, [key]: value },
          },
        });
      },

      getFlag: (key: string) => {
        const { player } = get();
        return player?.flags?.[key];
      },

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

// Log every phase transition for debugging
let _prevPhaseType: string | null = null;
useGameStore.subscribe((state) => {
  const phaseType = state.gamePhase.type;
  if (phaseType !== _prevPhaseType) {
    console.log(`[GamePhase] ${_prevPhaseType ?? '(init)'} → ${phaseType}`, state.gamePhase);
    _prevPhaseType = phaseType;
  }
});
