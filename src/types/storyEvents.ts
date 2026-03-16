/**
 * Story Event Type Definitions
 * Comprehensive types for the story event system
 */

import type { Activity, StatBoosts, ScheduledEventTemplate } from './game';
import type { Challenge } from './challenges';
import type { StatName } from './index';
import type { Item } from './items';

// ============================================================================
// TEXT FORMATTING SYSTEM
// ============================================================================

/**
 * Formatted text segment - either plain text or a character reference
 */
export type TextSegment = string | { characterId: string };

/**
 * Formatted text - array of text segments with character references
 * Example: ["You meet ", { characterId: "coach_gonzalez" }, " at the courts."]
 * Renders as: "You meet Coach Gonzalez at the courts." (with name highlighted)
 */
export type FormattedText = TextSegment[];

// ============================================================================
// DIALOGUE SYSTEM
// ============================================================================

/**
 * Dialogue line with speaker and formatted text
 * [characterId, text] - characterId can be null for narration
 */
export type DialogueLine = [string | null, FormattedText];

// ============================================================================
// STORY EVENT TAGS
// ============================================================================

export type StoryEventTag =
  // Relationships
  | 'coach'
  | 'rival'
  | 'family'
  | 'romance'
  | 'friend'

  // Career
  | 'sponsor'
  | 'media'
  | 'story_match'
  | 'tournament_match'      // For match-specific events
  | 'tournament_ceremony'   // For opening/closing ceremonies
  | 'agent'
  | 'team'

  // Development
  | 'training'
  | 'injury'
  | 'mental'
  | 'equipment'

  // Narrative
  | 'intro'
  | 'decision'
  | 'milestone'
  | 'conflict'
  | 'celebration'

  // Random Events
  | 'misc';

// ============================================================================
// STORY EVENT PREREQUISITES
// ============================================================================

export interface StoryEventPrerequisite {
  // Stat requirements
  stats?: {
    [K in StatName]?: {
      min?: number;
      max?: number;
    };
  };

  // Relationship requirements
  relationships?: {
    [characterId: string]: {
      min?: number;
      max?: number;
    };
  };

  // Event completion requirements
  completedEvents?: string[];      // Must have completed these events
  excludedEvents?: string[];       // Must NOT have completed these events

  // Choice-based requirements (for branching storylines)
  completedEventChoices?: Record<string, string | string[]>;  // eventId -> optionId(s) that must have been chosen (array = OR)
  excludedEventChoices?: Record<string, string | string[]>;   // eventId -> optionId(s) that blocks this event (array = OR)

  // Time/season requirements
  minDay?: number;
  maxDay?: number;
  minSeason?: number;

  // Ability requirements
  hasAbilities?: string[];
  lacksAbilities?: string[];

  // Match history requirements
  minMatchesPlayed?: number;
  minMatchesWon?: number;
  minWinStreak?: number;           // Minimum consecutive wins (from latestMatchResults)

  // Tournament requirements
  activeTournament?: string;           // Must be in specific tournament
  tournamentBracket?: 'winner' | 'loser';  // Must be in specific bracket
  tournamentRound?: number;            // Must be at specific round (0-based index)
}

// ============================================================================
// STORY EVENT OUTCOME
// ============================================================================

export interface StoryEventOutcome {
  // Narrative text shown after choice
  resultText: FormattedText;           // Formatted text with character references
  dialogue?: DialogueLine[];           // Optional additional dialogue with speakers

  // Effects applied to player
  effects: {
    statChanges?: StatBoosts;
    moodChange?: number;
    energyChange?: number;
    relationshipChanges?: Record<string, number>;
    abilitiesGained?: string[];
    itemsGained?: Item[];
    scheduledEvents?: ScheduledEventTemplate[];
    scheduleNextTournamentMatch?: boolean;  // Trigger tournament match scheduling
    startTournament?: string;  // Tournament ID to activate when this event completes
    tierChange?: number;  // Set player tier to this value (e.g., 2 for Regional)
  };

  // Challenges assigned by this outcome
  challengesAssigned?: Challenge[];
}

// ============================================================================
// STORY EVENT OPTION (PLAYER CHOICES)
// ============================================================================

export interface StoryEventOption {
  id: string;                      // Unique within the event (e.g., 'accept_offer', 'decline')
  text: string;                    // Button text
  description?: string;            // Tooltip/subtitle explaining the choice
  emoji?: string;                  // Optional emoji for visual distinction

  // Requirements to show this option
  prerequisites?: StoryEventPrerequisite;

  // Outcome when selected
  outcome: StoryEventOutcome;
}

// ============================================================================
// STORY EVENT (MAIN DEFINITION)
// ============================================================================

export interface StoryEvent {
  id: string;
  name: string;
  tags: StoryEventTag[];           // Multiple tags for flexible categorization

  // Timing
  timeSlotsRequired: 0 | 1 | 2 | 3;

  // Availability
  prerequisites: StoryEventPrerequisite;
  skippable: boolean;              // Whether player can skip this event

  // Narrative content
  description: string;
  dialogue?: DialogueLine[];       // Dialogue lines with speaker and text

  // Characters involved
  characters: string[];

  // Player choices (if any)
  options: StoryEventOption[];     // Empty array = linear event with only defaultOutcome

  // For linear events (no choices)
  defaultOutcome?: StoryEventOutcome;  // Used when options.length === 0
}

// ============================================================================
// STORY EVENT RESULT (ACTIVITY RESULT)
// ============================================================================

export interface StoryEventResult extends Activity {
  type: 'story';
  source: 'story_event';

  // Event details
  eventId: string;
  eventName: string;
  tags: StoryEventTag[];

  // Choice made (if applicable)
  selectedOptionId?: string;
  selectedOptionText?: string;

  // Outcome applied
  resultText: FormattedText;

  // Effects (for display in history/modal)
  statChanges: StatBoosts;
  relationshipChanges: Record<string, number>;
  abilitiesGained: string[];
  itemsGained: Item[];
}
