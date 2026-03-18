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
  StoryMatchMetadata,
  TIME_SLOT_NAMES,
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
import { StoryMatchManager } from '../game/StoryMatchManager';
import { CalendarService } from '../game/CalendarService';
import { DEFAULT_MATCH_ENERGY_COST } from '../config/matchRewards';
import { EffectAggregator } from '../core/EffectAggregator';
import { EffectKey } from '../types/game';
import type { ModalEntry, ModalData, ModalType, StoryEventModalData } from '../types/ui';
import { createModalEntry, sortModalQueue } from '../types/ui';

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
  currentScreen: 'welcome' | 'player-creation' | 'main-menu' | 'training' | 'match' | 'rest' | 'inventory' | 'tournaments' | 'tournament-match' | 'story-match';
  showTrainingResultModal: boolean;  // DEPRECATED: Use modal queue instead

  // Modal queue state (replaces useEffect-based modal triggering)
  modalQueue: ModalEntry[];
  currentModal: ModalEntry | null;

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
    preCalculatedRewards?: MatchReward,
    accumulatedEffects?: { energyDelta: number; moodDelta: number }
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
  startTournament: (tournamentId: string, options?: { skipCeremony?: boolean }) => void;
  scheduleNextTournamentMatch: () => void;
  completeTournamentMatch: (result: 'win' | 'loss', score: string, matchStats: MatchStatistics, rewards: MatchReward, accumulatedEffects?: { energyDelta: number; moodDelta: number }) => void;
  cancelTournament: () => void;
  checkTournamentEligibility: () => string[];
  getScheduledTournamentMatch: () => ScheduledEvent | null;
  isTournamentMatchScheduled: () => boolean;

  // Story match actions
  getScheduledStoryMatch: () => ScheduledEvent | null;
  isStoryMatchScheduled: () => boolean;
  completeStoryMatch: (result: 'win' | 'loss', score: string, matchStats: MatchStatistics, rewards: MatchReward, accumulatedEffects?: { energyDelta: number; moodDelta: number }) => void;

  // Player flag actions
  setFlag: (key: string, value: boolean | number | string) => void;
  getFlag: (key: string) => boolean | number | string | undefined;

  // Generic scheduled event actions
  scheduleEvent: (event: ScheduledEvent) => void;
  clearScheduledEvent: (day: number, slot: TimeSlot) => void;
  getScheduledEvent: () => ScheduledEvent | null;

  // Modal queue actions
  queueModal: (type: ModalType, data: ModalData, options?: { priority?: number; dismissible?: boolean }) => void;
  dismissCurrentModal: () => void;
  clearModalQueue: () => void;
  hasModalOfType: (type: ModalType) => boolean;
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

      // Modal queue initial state
      modalQueue: [],
      currentModal: null,

      // Initialize game (Zustand auto-loads persisted state)
      initializeGame: () => {
        const state = get();

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

        set({
          isInitialized: true,
          currentScreen: state.player ? 'main-menu' : 'player-creation',
        });
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
          { eventType: 'story', scheduledDay: 5, scheduledTimeSlot: TimeSlot.AFTERNOON, metadata: { storyEventId: 'training_session_intro' } },
          { eventType: 'story', scheduledDay: 6, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'relationship_basics' } },
          { eventType: 'story', scheduledDay: 7, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'abilities_basics' } },
          // Post-tutorial storyline events
          { eventType: 'story', scheduledDay: 8, scheduledTimeSlot: TimeSlot.AFTERNOON, metadata: { storyEventId: 'rival_first_encounter' } },
          { eventType: 'story', scheduledDay: 9, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'club_team_intro' } },
          { eventType: 'story', scheduledDay: 10, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'coach_first_meeting' } },
          { eventType: 'story', scheduledDay: 11, scheduledTimeSlot: TimeSlot.AFTERNOON, metadata: { storyEventId: 'club_team_first_practice' } },
          { eventType: 'story', scheduledDay: 12, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'coach_training_focus' } },
          // First tournament trigger - pushes the player to improve by day 15
          { eventType: 'story', scheduledDay: 15, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'riverside_open_prep' } },
          // Continue coach and team storylines
          { eventType: 'story', scheduledDay: 16, scheduledTimeSlot: TimeSlot.MORNING, metadata: { storyEventId: 'coach_balanced_development' } }
        ];

        set({
          player,
          currentTrainingSessions: initialSessions,
          currentScreen: 'main-menu',
          calendar: {
            ...get().calendar,
            scheduledEvents: [
              ...get().calendar.scheduledEvents,
              ...initialStorySchedule,
            ],
          },
        });

        // Trigger welcome event (guaranteed, no probability roll)
        // No setTimeout needed - modal queue handles this cleanly
        get().checkForStoryEventById('welcome_to_tennis_rpg');
      },

      // Select training session (doesn't execute yet)
      selectTraining: (session: TrainingSession) => {
        set({ currentScreen: 'training' });
      },

      // Execute training
      executeTraining: () => {
        const { player, currentStatus, calendar } = get();
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

        // Queue training result modal
        get().queueModal('training_result', {
          type: 'training_result',
          result,
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

        // Check for random story event at start of new slot (except NIGHT)
        // BUT: Don't trigger if there's a scheduled event for this time slot
        if (newCalendar.currentTimeSlot !== TimeSlot.NIGHT) {
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

        // Check for milestone events (deferred from match completion to next time slot)
        get().checkForStoryEventByTag('milestone', 100);

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
        preCalculatedRewards?: MatchReward,
        accumulatedEffects?: { energyDelta: number; moodDelta: number }
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

        // Update energy: base match cost + accumulated energy effects from key moment choices
        const baseEnergyCost = DEFAULT_MATCH_ENERGY_COST;
        const keyMomentEnergyCost = accumulatedEffects ? accumulatedEffects.energyDelta : 0;
        const newEnergy = Math.max(0, currentStatus.energy - baseEnergyCost + keyMomentEnergyCost);

        // Update mood from rewards + accumulated mood effects from key moment choices
        const keyMomentMoodChange = accumulatedEffects ? accumulatedEffects.moodDelta : 0;
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + rewards.moodChange + keyMomentMoodChange));

        // Tier unlocks are now handled by story events (e.g., Riverside Open victory)
        const tierUnlocked: OpponentTier | null = null;

        // Generate match highlights from statistics
        const highlights: string[] = [];
        highlights.push(`Final Score: ${score}`);
        if (matchStatistics.aces.player > 5) {
          highlights.push(`${matchStatistics.aces.player} aces served`);
        }
        if (matchStatistics.longestRally > 15) {
          highlights.push(`Longest rally: ${matchStatistics.longestRally} shots`);
        }
        if (matchStatistics.breakPointsConverted.player > 0) {
          highlights.push(`${matchStatistics.breakPointsConverted.player} break points converted`);
        }
        if (matchStatistics.winners.player > 20) {
          highlights.push(`${matchStatistics.winners.player} winners hit`);
        }
        if (matchStatistics.keyMomentsWon.player > 0) {
          highlights.push(`${matchStatistics.keyMomentsWon.player} key moments won`);
        }

        // Create match activity result with rewards
        const matchActivity: ActivityResult = {
          id: `match-${Date.now()}`,
          type: 'match',
          source: 'match_activity',
          timestamp: new Date().toISOString(),
          timeSlotsUsed: 1,
          energyCost: DEFAULT_MATCH_ENERGY_COST,
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
          highlights,
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
        const { player } = get();

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
          // Don't queue if this event is already showing or queued
          const { currentModal: cm, modalQueue: mq } = get();
          const isAlreadyQueued =
            (cm?.type === 'story_event' && (cm.data as StoryEventModalData).event.id === eventId) ||
            mq.some(m => m.type === 'story_event' && (m.data as StoryEventModalData).event.id === eventId);
          if (isAlreadyQueued) {
            console.log(`[Story Event] ⏭️ Already queued: "${event.name}"`);
            return;
          }

          console.log(`[Story Event] ✅ Triggered: "${event.name}"`);
          // Queue modal instead of setting pendingStoryEvent
          const availableOptions = PrerequisiteChecker.getAvailableOptions(event, player, {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          });
          get().queueModal('story_event', {
            type: 'story_event',
            event,
            availableOptions,
          });
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
        const { player, storyEventTriggerChance } = get();

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger (apply event trigger bonus from items/abilities)
        const { effects } = EffectAggregator.getActiveEffects(player);
        const triggerBonus = EffectAggregator.getEffect(effects, EffectKey.EVENT_TRIGGER_BONUS);
        const chance = (customChance ?? storyEventTriggerChance) + triggerBonus;
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
          // Queue modal instead of setting pendingStoryEvent
          const availableOptions = PrerequisiteChecker.getAvailableOptions(selectedEvent, player, {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          });
          get().queueModal('story_event', {
            type: 'story_event',
            event: selectedEvent,
            availableOptions,
          });
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
        const { player, storyEventTriggerChance } = get();

        // Don't trigger if story_event modal already queued or showing
        if (get().hasModalOfType('story_event')) return;

        // Don't trigger if no player
        if (!player) return;

        // Roll for trigger (apply event trigger bonus from items/abilities)
        const { effects } = EffectAggregator.getActiveEffects(player);
        const triggerBonus = EffectAggregator.getEffect(effects, EffectKey.EVENT_TRIGGER_BONUS);
        const chance = (customChance ?? storyEventTriggerChance) + triggerBonus;
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
          // Queue modal instead of setting pendingStoryEvent
          const availableOptions = PrerequisiteChecker.getAvailableOptions(selectedEvent, player, {
            completedStoryEvents: gameState.completedStoryEvents,
            completedStoryEventChoices: gameState.completedStoryEventChoices,
            relationships: gameState.relationships,
            calendar: gameState.calendar,
            activeTournament: gameState.calendar.activeTournament,
          });
          get().queueModal('story_event', {
            type: 'story_event',
            event: selectedEvent,
            availableOptions,
          });
        } else {
          console.log(`[Story Event] No eligible events available`);
        }
      },

      // Execute story event with player's choice
      executeStoryEvent: (eventId: string, optionId?: string) => {
        const { player, currentModal, calendar } = get();

        // Get event from modal queue
        if (!player || !currentModal || currentModal.type !== 'story_event') return;
        const storyEventData = currentModal.data as StoryEventModalData;
        const storyEvent = storyEventData.event;
        if (storyEvent.id !== eventId) return;

        // Get selected option (if any)
        const selectedOption = optionId
          ? storyEvent.options.find((opt) => opt.id === optionId) || null
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

        // Update state (no longer setting pendingStoryEvent - using modal queue)
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

        // Dismiss the story event modal and queue the result modal
        get().dismissCurrentModal();
        get().queueModal('story_event_result', {
          type: 'story_event_result',
          result,
        });

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
        const { currentModal, completedStoryEvents } = get();

        // Get event from modal queue if it's a story event
        if (currentModal && currentModal.type === 'story_event') {
          const storyEventData = currentModal.data as StoryEventModalData;
          set({
            completedStoryEvents: [...completedStoryEvents, storyEventData.event.id],
          });
        }

        // Dismiss the current modal
        get().dismissCurrentModal();
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
        const { player, currentModal } = get();

        // Get options from modal data if it's a story event modal
        if (!player || !currentModal || currentModal.type !== 'story_event') return [];

        const storyEventData = currentModal.data as StoryEventModalData;
        return storyEventData.availableOptions;
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
            setTimeout(() => {
              get().scheduleNextTournamentMatch();
            }, 100);
          } else {
            // Queue opening ceremony story event (which will schedule the match)
            setTimeout(() => {
              get().checkForStoryEventById(config.openingCeremonyEventId);
            }, 100);
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

      // Complete a tournament match
      completeTournamentMatch: (result: 'win' | 'loss', score: string, matchStats: MatchStatistics, rewards: MatchReward, accumulatedEffects?: { energyDelta: number; moodDelta: number }) => {
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
        const isLastRound = activeTournament.currentRound + 1 >= config.rounds.length;
        if (result === 'loss' && activeTournament.currentBracket === 'winner') {
          // Move to loser bracket, continue to next round (don't replay opponents)
          updatedTournament.currentBracket = 'loser';
          updatedTournament.currentRound = activeTournament.currentRound + 1;

          // Queue elimination event only if there are more rounds (no consolation bracket in the finals)
          if (config.eliminationEventId && !isLastRound) {
            setTimeout(() => {
              get().checkForStoryEventById(config.eliminationEventId!);
            }, 100);
          }
        } else {
          // Increment round for: win in any bracket, or loss in loser bracket
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

          // Schedule consolation event if didn't win (fires a few days later)
          if (!wonChampionship && config.consolationEventId) {
            const consolationDay = calendar.currentDay + 3;
            const { updatedEvents } = ScheduledEventManager.scheduleEventWithConflictResolution(
              get().calendar.scheduledEvents,
              'story',
              consolationDay,
              TimeSlot.MORNING,
              { storyEventId: config.consolationEventId }
            );
            set((state) => ({
              calendar: {
                ...state.calendar,
                scheduledEvents: updatedEvents,
              },
            }));
          }
        }

        // Deduct energy (variable cost + accumulated key moment effects)
        const energyCost = TournamentManager.calculateMatchEnergyCost(currentStatus.energy);
        const keyMomentEnergyCost = accumulatedEffects ? accumulatedEffects.energyDelta : 0;
        const newEnergy = Math.max(0, currentStatus.energy - energyCost + keyMomentEnergyCost);

        // Update mood from rewards + accumulated key moment effects
        const keyMomentMoodChange = accumulatedEffects ? accumulatedEffects.moodDelta : 0;
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + rewards.moodChange + keyMomentMoodChange));

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

      // Complete a story match
      completeStoryMatch: (result: 'win' | 'loss', score: string, matchStats: MatchStatistics, rewards: MatchReward, accumulatedEffects?: { energyDelta: number; moodDelta: number }) => {
        const { calendar, currentStatus, player } = get();
        if (!player) return;

        // Get scheduled story match
        const scheduledMatch = StoryMatchManager.getScheduledStoryMatch(calendar.scheduledEvents, calendar);
        if (!scheduledMatch) {
          console.warn('completeStoryMatch called but no story match scheduled');
          return;
        }

        const metadata = StoryMatchManager.getStoryMatchMetadata(scheduledMatch);
        if (!metadata) {
          console.warn('completeStoryMatch called but metadata is invalid');
          return;
        }

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

        // Clear scheduled story match event
        const updatedScheduledEvents = ScheduledEventManager.clearScheduledEvent(
          calendar.scheduledEvents,
          calendar.currentDay,
          calendar.currentTimeSlot
        );

        // Deduct energy + accumulated key moment effects
        const energyCost = StoryMatchManager.calculateMatchEnergyCost(currentStatus.energy);
        const keyMomentEnergyCost = accumulatedEffects ? accumulatedEffects.energyDelta : 0;
        const newEnergy = Math.max(0, currentStatus.energy - energyCost + keyMomentEnergyCost);

        // Update mood from rewards + accumulated key moment effects
        const keyMomentMoodChange = accumulatedEffects ? accumulatedEffects.moodDelta : 0;
        const newMood = Math.max(-100, Math.min(100, currentStatus.mood + rewards.moodChange + keyMomentMoodChange));

        // Update state
        set({
          player: updatedPlayer,
          calendar: {
            ...calendar,
            scheduledEvents: updatedScheduledEvents,
          },
          currentStatus: {
            ...currentStatus,
            energy: newEnergy,
            mood: newMood,
          },
        });

        // Check for challenge completion after stat changes
        get().checkChallengeCompletion();

        // Queue post-match event
        const postMatchEventId = StoryMatchManager.getPostMatchEventId(metadata, result);
        console.log('Story match complete - queuing post-match event:', postMatchEventId);
        setTimeout(() => {
          get().checkForStoryEventById(postMatchEventId);
        }, 100);
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

      // ========================================================================
      // MODAL QUEUE ACTIONS
      // ========================================================================

      /**
       * Add a modal to the queue. If no modal is currently showing, display immediately.
       * Modals are sorted by priority (lower = higher priority) then by timestamp.
       */
      queueModal: (type: ModalType, data: ModalData, options?: { priority?: number; dismissible?: boolean }) => {
        const { modalQueue, currentModal } = get();

        const entry = createModalEntry(type, data, options);

        // If no modal currently showing, show this one immediately
        if (!currentModal) {
          set({ currentModal: entry });
          return;
        }

        // Otherwise add to queue and sort
        const newQueue = sortModalQueue([...modalQueue, entry]);
        set({ modalQueue: newQueue });
      },

      /**
       * Dismiss the current modal and show the next one from the queue (if any).
       */
      dismissCurrentModal: () => {
        const { modalQueue } = get();

        if (modalQueue.length === 0) {
          set({ currentModal: null });
          return;
        }

        // Pop the first modal from queue and show it
        const [next, ...rest] = modalQueue;
        set({
          currentModal: next,
          modalQueue: rest,
        });
      },

      /**
       * Clear all modals (current and queued).
       */
      clearModalQueue: () => {
        set({ modalQueue: [], currentModal: null });
      },

      /**
       * Check if a modal of the specified type is currently showing or queued.
       */
      hasModalOfType: (type: ModalType): boolean => {
        const { modalQueue, currentModal } = get();
        if (currentModal?.type === type) return true;
        return modalQueue.some((m) => m.type === type);
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
