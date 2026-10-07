/**
 * Story Event Modal
 * Modal for presenting story events and player choices
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { StoryEvent, StoryEventOption } from '../types/storyEvents';
import { AnimatedWords } from './AnimatedWords';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../hooks/usePlayerName';
import { useGameStore } from '../stores/gameStore';
import { directionFromKey, isActionKey } from '../utils/gameKeys';

interface StoryEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StoryEvent;
  availableOptions: StoryEventOption[];
  onSelectOption: (eventId: string, optionId?: string) => void;
}

export const StoryEventModal: React.FC<StoryEventModalProps> = ({
  isOpen,
  onClose,
  event,
  availableOptions,
  onSelectOption,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
  const [isHidden, setIsHidden] = useState(false);

  // Restore persisted state on mount
  useEffect(() => {
    const eventRecovery = useGameStore.getState().eventRecovery;
    if (eventRecovery.currentEventId === event.id) {
      // Restore dialogue index
      if (eventRecovery.currentDialogueIndex > 0) {
        setCurrentDialogueIndex(eventRecovery.currentDialogueIndex);
      }
      // Restore selected choice
      const previousChoice = eventRecovery.selectedChoices[event.id];
      if (previousChoice) {
        setSelectedOptionId(previousChoice);
      }
    } else {
      // New event - persist the event ID
      useGameStore.getState().updateEventRecovery({
        currentEventId: event.id,
        currentDialogueIndex: 0,
        selectedChoices: {},
      });
    }
  }, [event.id]);

  // Persist dialogue index changes
  const handleContinueDialogue = (newIndex: number) => {
    setCurrentDialogueIndex(newIndex);
    useGameStore.getState().updateEventRecovery({
      currentDialogueIndex: newIndex,
    });
  };

  // Persist option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
    useGameStore.getState().updateEventRecovery({
      selectedChoices: {
        ...useGameStore.getState().eventRecovery.selectedChoices,
        [event.id]: optionId,
      },
    });
  };

  // Get player name for dialogue attribution
  const playerName = usePlayerName();

  const isLinearEvent = event.options.length === 0;
  // One option is not a choice: the event runs it straight from a single button, so an
  // event can send the player into a minigame without offering a way out. Only when
  // that option is actually open to them — otherwise they see why it is locked.
  const onlyOption =
    event.options.length === 1 && availableOptions.some((o) => o.id === event.options[0].id)
      ? event.options[0]
      : null;
  const hasChoice = !isLinearEvent && !onlyOption;
  const { dialogue } = event;
  const hasDialogue = dialogue && dialogue.length > 0;
  const allDialogueShown = !hasDialogue || currentDialogueIndex >= dialogue.length - 1;

  // Only allow skipping before the user has started the event (clicked through any dialogue)
  const canSkip = event.skippable && currentDialogueIndex === 0;

  const advanceDialogue = () => {
    if (hasDialogue && currentDialogueIndex < dialogue!.length) {
      handleContinueDialogue(currentDialogueIndex + 1);
    }
  };

  const goBackDialogue = () => {
    if (currentDialogueIndex > 0) {
      handleContinueDialogue(currentDialogueIndex - 1);
    }
  };

  const handleContinue = () => {
    if (isLinearEvent) {
      // Linear event - just execute with no option
      onSelectOption(event.id);
    } else if (onlyOption) {
      onSelectOption(event.id, onlyOption.id);
    } else {
      // Choice event - execute with selected option
      if (selectedOptionId) {
        onSelectOption(event.id, selectedOptionId);
      }
    }
  };

  const availableOptionIds = availableOptions.map((o) => o.id);
  const selectableOptions = event.options.filter((o) => availableOptionIds.includes(o.id));

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || isHidden) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
        return;

      // Arrows and WASD are interchangeable; the guard above keeps WASD out of the way
      // of any focused text field.
      const dir = directionFromKey(e);
      if (e.key === 'Enter' || isActionKey(e)) {
        e.preventDefault();
        if (!allDialogueShown) {
          advanceDialogue();
        } else {
          handleContinue();
        }
      } else if (dir === 'right') {
        e.preventDefault();
        if (!allDialogueShown) {
          advanceDialogue();
        }
      } else if (dir === 'left') {
        e.preventDefault();
        goBackDialogue();
      } else if (dir === 'down') {
        if (allDialogueShown && hasChoice && selectableOptions.length > 0) {
          e.preventDefault();
          const currentIndex = selectableOptions.findIndex((o) => o.id === selectedOptionId);
          const nextIndex = currentIndex < selectableOptions.length - 1 ? currentIndex + 1 : 0;
          handleOptionSelect(selectableOptions[nextIndex].id);
        }
      } else if (dir === 'up') {
        if (allDialogueShown && hasChoice && selectableOptions.length > 0) {
          e.preventDefault();
          const currentIndex = selectableOptions.findIndex((o) => o.id === selectedOptionId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : selectableOptions.length - 1;
          handleOptionSelect(selectableOptions[prevIndex].id);
        }
      }
    },
    [
      isOpen,
      isHidden,
      allDialogueShown,
      hasChoice,
      selectableOptions,
      selectedOptionId,
      advanceDialogue,
      goBackDialogue,
      handleContinue,
      handleOptionSelect,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  if (isHidden) {
    return (
      <>
        {/* Block all interaction with the menu behind */}
        <div className="fixed inset-0 z-40 pointer-events-auto" style={{ cursor: 'default' }} />
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center pl-4 pr-20 sm:px-4">
          <button
            onClick={() => setIsHidden(false)}
            className="max-w-2xl w-full py-4 border-4 border-pixel-accent bg-pixel-card text-pixel-accent font-bold text-base hover:bg-pixel-accent hover:bg-opacity-20 transition-colors animate-pulse"
          >
            📜 Show Event
          </button>
        </div>
      </>
    );
  }

  const hideButton = (
    <button
      onClick={() => setIsHidden(true)}
      className="w-full py-3 border-4 border-pixel-border bg-pixel-card text-pixel-text font-bold text-base hover:border-pixel-accent transition-colors"
    >
      👁 Hide Event
    </button>
  );

  // Every step's buttons dock in the modal footer, so Continue and Confirm sit in the
  // same place on every line and choice, and never scroll off the bottom.
  const canGoBack = currentDialogueIndex > 0;
  const backButton = canGoBack ? (
    <Button onClick={goBackDialogue} variant="secondary">
      Back
    </Button>
  ) : (
    <div />
  );
  const footer = !allDialogueShown ? (
    <div className="flex justify-between gap-2">
      {backButton}
      <Button onClick={advanceDialogue} variant="primary" testId="story-advance">
        Continue
      </Button>
    </div>
  ) : !hasChoice ? (
    <div className="flex justify-between gap-2">
      {backButton}
      <div className="flex gap-2">
        {canSkip && (
          <Button onClick={onClose} variant="secondary">
            Skip Event
          </Button>
        )}
        {/* The no-choice path: its label is the option's own text, so the id is the
            only stable handle on it. */}
        <Button onClick={handleContinue} variant="primary" testId="story-resolve">
          {onlyOption ? onlyOption.text : 'Continue'}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex justify-between gap-2">
      {backButton}
      <div className="flex gap-2">
        {canSkip && (
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleContinue}
          variant="primary"
          disabled={!selectedOptionId}
          testId="story-confirm"
        >
          Confirm Choice
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.name}
      size="scene"
      showCloseButton={false}
      belowContent={hideButton}
      footer={footer}
      testId="story-event"
    >
      {/* Description */}
      <div className="mb-4">
        <p className="text-lg">{event.description}</p>
      </div>

      {/* Dialogue. Every line is laid out in the same grid cell and only the current
          one is visible, so the box is as tall as the event's longest line: it hugs
          short events, and the Continue button below never moves between lines. */}
      {hasDialogue && currentDialogueIndex < dialogue!.length && (
        <div className="relative bg-pixel-primary border-4 border-pixel-border p-5 mb-6">
          {/* Decorative accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-pixel-accent" />
          <div className="grid">
            {dialogue!.map(([characterId, text], index) => {
              const characterName = getCharacterName(characterId, playerName);
              const isCharacterSpeaking = !!characterName;
              const isCurrent = index === currentDialogueIndex;
              const quoted = (body: React.ReactNode): React.ReactNode =>
                isCharacterSpeaking ? (
                  <>
                    {'\u201c'}
                    {body}
                    {'\u201d'}
                  </>
                ) : (
                  body
                );

              return (
                <div
                  key={index}
                  className={`[grid-area:1/1] ${isCurrent ? '' : 'invisible'}`}
                  aria-hidden={!isCurrent || undefined}
                >
                  {characterName && (
                    <div className="font-bold text-pixel-accent mb-2 text-lg">{characterName}</div>
                  )}
                  <p
                    className={`text-lg leading-relaxed ${isCharacterSpeaking ? 'ml-3 italic' : 'italic'}`}
                  >
                    {/* Hidden lines render the same way so they size the box exactly. */}
                    {quoted(
                      <AnimatedWords
                        key={index}
                        content={text}
                        intensity={isCharacterSpeaking ? 'full' : 'subtle'}
                      />,
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          {dialogue!.length > 1 && (
            <div className="text-xs text-pixel-text-muted mt-3">
              {currentDialogueIndex + 1} / {dialogue!.length}
            </div>
          )}
        </div>
      )}

      {/* A single-option event says what its one button will do. */}
      {allDialogueShown && !hasChoice && onlyOption?.description && (
        <p className="mb-2 text-pixel-text-muted">
          {onlyOption.emoji && <span className="mr-2">{onlyOption.emoji}</span>}
          {onlyOption.description}
        </p>
      )}

      {allDialogueShown && hasChoice && (
        <div className="space-y-3" role="radiogroup" aria-label="Choices">
          {event.options.map((option) => {
            const isAvailable = availableOptions.some((o) => o.id === option.id);
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                role="radio"
                aria-checked={isSelected}
                data-testid={`story-option-${option.id}`}
                data-available={isAvailable}
                onClick={() => isAvailable && handleOptionSelect(option.id)}
                disabled={!isAvailable}
                className={`w-full p-4 border-4 text-left transition-colors ${
                  isSelected
                    ? 'border-pixel-accent bg-pixel-secondary'
                    : 'border-pixel-border bg-pixel-card'
                } ${
                  isAvailable
                    ? '[@media(hover:hover)]:hover:border-pixel-accent cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Fixed-width icon column, so titles line up with or without an emoji. */}
                  <span className="w-10 shrink-0 text-center text-3xl" aria-hidden="true">
                    {option.emoji ?? ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-pixel-text">{option.text}</div>
                    {option.description && (
                      <div className="text-sm text-pixel-text-muted mt-1">{option.description}</div>
                    )}
                    {!isAvailable && (
                      <div className="text-sm text-pixel-error mt-1 font-semibold">
                        🔒 Requirements not met
                      </div>
                    )}
                  </div>
                  <span
                    className={`w-6 h-6 shrink-0 border-4 flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'border-pixel-accent bg-pixel-accent text-pixel-on-accent'
                        : 'border-pixel-border'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
