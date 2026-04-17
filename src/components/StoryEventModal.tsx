/**
 * Story Event Modal
 * Modal for presenting story events and player choices
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { StoryEvent, StoryEventOption } from '../types/storyEvents';
import { AnimatedWords } from './AnimatedWords';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../hooks/usePlayerName';
import { useGameStore } from '../stores/gameStore';

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
  const {dialogue} = event;
  const hasDialogue = dialogue && dialogue.length > 0;
  const allDialogueShown = !hasDialogue || currentDialogueIndex >= dialogue.length - 1;

  // Only allow skipping before the user has started the event (clicked through any dialogue)
  const canSkip = event.skippable && currentDialogueIndex === 0;

  const advanceDialogue = () => {
    if (hasDialogue && currentDialogueIndex < dialogue!.length) {
      handleContinueDialogue(currentDialogueIndex + 1);
    }
  };

  const handleContinue = () => {
    if (isLinearEvent) {
      // Linear event - just execute with no option
      onSelectOption(event.id);
    } else {
      // Choice event - execute with selected option
      if (selectedOptionId) {
        onSelectOption(event.id, selectedOptionId);
      }
    }
  };

  if (!isOpen) return null;

  if (isHidden) {
    return (
      <>
        {/* Block all interaction with the menu behind */}
        <div className="fixed inset-0 z-40 pointer-events-auto" style={{ cursor: 'default' }} />
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.name} size="xl" showCloseButton={false} belowContent={hideButton}>
      {/* Tags and time slots */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {event.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-600 text-white rounded text-sm font-semibold">
            #{tag}
          </span>
        ))}
        <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm font-semibold">
          ⏱️ {event.timeSlotsRequired} time slot{event.timeSlotsRequired > 1 ? 's' : ''}
        </span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-lg">{event.description}</p>
      </div>

      {/* Dialogue */}
      {hasDialogue && currentDialogueIndex < dialogue!.length && (
        <div
          key={currentDialogueIndex}
          className="relative bg-pixel-primary border-4 border-pixel-border p-5 mb-6"
        >
          {/* Decorative accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-pixel-accent" />
          {(() => {
            const [characterId, text] = dialogue![currentDialogueIndex];
            const characterName = getCharacterName(characterId, playerName);
            const isCharacterSpeaking = !!characterName;

            return (
              <>
                {characterName && (
                  <div className="font-bold text-pixel-accent mb-2 text-lg">{characterName}</div>
                )}
                <p
                  className={`text-lg leading-relaxed ${isCharacterSpeaking ? 'ml-3 italic' : 'italic'}`}
                >
                  {isCharacterSpeaking ? '\u201c' : ''}
                  <AnimatedWords
                    content={text}
                    intensity={isCharacterSpeaking ? 'full' : 'subtle'}
                  />
                  {isCharacterSpeaking ? '\u201d' : ''}
                </p>
              </>
            );
          })()}
          {currentDialogueIndex < dialogue!.length - 1 && (
            <div className="text-xs text-pixel-text-muted mt-3">
              ({currentDialogueIndex + 1} / {dialogue!.length})
            </div>
          )}
        </div>
      )}

      {/* Show dialogue continue button if not all dialogue shown */}
      {!allDialogueShown ? (
        <div className="flex justify-between">
          {currentDialogueIndex > 0 ? (
            <Button onClick={() => handleContinueDialogue(currentDialogueIndex - 1)} variant="secondary">
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={advanceDialogue} variant="primary">
            Continue
          </Button>
        </div>
      ) : (
        <>
          {/* Options or Continue Button */}
          {isLinearEvent ? (
            // Linear event - just show continue button
            <div className="flex justify-between">
              {hasDialogue && dialogue!.length > 1 ? (
                <Button onClick={() => handleContinueDialogue(currentDialogueIndex - 1)} variant="secondary">
                  Back
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                {canSkip && (
                  <Button onClick={onClose} variant="secondary">
                    Skip Event
                  </Button>
                )}
                <Button onClick={handleContinue} variant="primary">
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            // Choice event - show options
            <div>
              <h3 className="font-bold mb-3 text-lg">Choose your action:</h3>
          <div className="space-y-3 mb-6">
            {event.options.map((option) => {
              const isAvailable = availableOptions.some((o) => o.id === option.id);
              const isSelected = selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => isAvailable && handleOptionSelect(option.id)}
                  disabled={!isAvailable}
                  className={`
                    w-full p-4 rounded border-2 text-left transition
                    ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-400 bg-white'}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50 cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {option.emoji && <span className="text-3xl">{option.emoji}</span>}
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900">{option.text}</div>
                      {option.description && (
                        <div className="text-sm text-gray-700 mt-1">{option.description}</div>
                      )}
                      {!isAvailable && (
                        <div className="text-sm text-red-700 mt-1 font-semibold">
                          ❌ Requirements not met
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between">
            {hasDialogue && dialogue!.length > 1 ? (
              <Button onClick={() => handleContinueDialogue(currentDialogueIndex - 1)} variant="secondary">
                Back
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {canSkip && (
                <Button onClick={onClose} variant="secondary">
                  Cancel
                </Button>
              )}
              <Button onClick={handleContinue} variant="primary" disabled={!selectedOptionId}>
                Confirm Choice
              </Button>
            </div>
          </div>
        </div>
          )}
        </>
      )}
    </Modal>
  );
};
