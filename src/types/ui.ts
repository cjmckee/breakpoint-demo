/**
 * UI State Type Definitions
 * Types for modal queue and UI state management
 */

import type { TrainingResult } from './game';
import type { StoryEvent, StoryEventOption, StoryEventResult } from './storyEvents';

// ============================================================================
// MODAL QUEUE TYPES
// ============================================================================

/**
 * All modal types supported by the modal queue system
 */
export type ModalType =
  | 'training_result'
  | 'story_event'
  | 'story_event_result'
  | 'match_summary';

/**
 * Priority levels for modals (lower = higher priority, shown first)
 */
export const MODAL_PRIORITIES: Record<ModalType, number> = {
  training_result: 10,      // Results shown immediately
  story_event_result: 10,   // Results shown immediately
  match_summary: 10,        // Results shown immediately
  story_event: 20,          // Events shown after results
};

/**
 * Modal entry in the queue
 */
export interface ModalEntry {
  id: string;
  type: ModalType;
  priority: number;
  data: ModalData;
  timestamp: number;
  dismissible: boolean;
}

// ============================================================================
// MODAL DATA TYPES
// ============================================================================

export interface TrainingResultModalData {
  type: 'training_result';
  result: TrainingResult;
}

export interface StoryEventModalData {
  type: 'story_event';
  event: StoryEvent;
  availableOptions: StoryEventOption[];
}

export interface StoryEventResultModalData {
  type: 'story_event_result';
  result: StoryEventResult;
}

export interface MatchSummaryModalData {
  type: 'match_summary';
  // Match summary data will be added when we integrate MatchSummaryModal
}

/**
 * Union type for all modal data payloads
 */
export type ModalData =
  | TrainingResultModalData
  | StoryEventModalData
  | StoryEventResultModalData
  | MatchSummaryModalData;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique modal ID
 */
export function generateModalId(): string {
  return `modal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a modal entry with defaults
 */
export function createModalEntry(
  type: ModalType,
  data: ModalData,
  options?: { priority?: number; dismissible?: boolean }
): ModalEntry {
  return {
    id: generateModalId(),
    type,
    priority: options?.priority ?? MODAL_PRIORITIES[type],
    data,
    timestamp: Date.now(),
    dismissible: options?.dismissible ?? true,
  };
}

/**
 * Sort modal entries by priority (lower first), then by timestamp (older first)
 */
export function sortModalQueue(queue: ModalEntry[]): ModalEntry[] {
  return [...queue].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.timestamp - b.timestamp;
  });
}
