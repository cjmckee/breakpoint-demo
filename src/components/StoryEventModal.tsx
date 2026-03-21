/**
 * Story Event Modal
 * Modal for presenting story events and player choices
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { StoryEvent, StoryEventOption } from '../types/storyEvents';
import { FormattedText } from './FormattedText';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../hooks/usePlayerName';

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

  // Get player name for dialogue attribution
  const playerName = usePlayerName();

  const isLinearEvent = event.options.length === 0;
  const {dialogue} = event;
  const hasDialogue = dialogue && dialogue.length > 0;
  const allDialogueShown = !hasDialogue || currentDialogueIndex >= dialogue.length - 1;

  // Only allow skipping before the user has started the event (clicked through any dialogue)
  const canSkip = event.skippable && currentDialogueIndex === 0;

  const handleContinueDialogue = () => {
    if (hasDialogue && currentDialogueIndex < dialogue!.length) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.name} size="xl" showCloseButton={false}>
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
        <div className="bg-gray-700 text-white p-4 rounded mb-6 border-l-4 border-blue-500">
          {(() => {
            const [characterId, text] = dialogue![currentDialogueIndex];
            const characterName = getCharacterName(characterId, playerName);

            return (
              <>
                {characterName && (
                  <div className="font-bold text-blue-300 mb-2">{characterName}</div>
                )}
                <p className={characterName ? 'ml-2' : 'italic'} style={{ whiteSpace: 'pre-line' }}>
                  {characterName ? '"' : ''}
                  <FormattedText content={text} />
                  {characterName ? '"' : ''}
                </p>
              </>
            );
          })()}
          {currentDialogueIndex < dialogue!.length - 1 && (
            <div className="text-xs text-gray-400 mt-2">
              ({currentDialogueIndex + 1} / {dialogue!.length})
            </div>
          )}
        </div>
      )}

      {/* Characters */}
      {event.characters.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">Characters:</h3>
          <div className="flex gap-2 flex-wrap">
            {event.characters.map((char) => (
              <span key={char} className="px-3 py-1 bg-purple-600 text-white rounded font-semibold">
                {getCharacterName(char, playerName)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Show dialogue continue button if not all dialogue shown */}
      {!allDialogueShown ? (
        <div className="flex justify-end gap-2">
          <Button onClick={handleContinueDialogue} variant="primary">
            Continue
          </Button>
        </div>
      ) : (
        <>
          {/* Options or Continue Button */}
          {isLinearEvent ? (
            // Linear event - just show continue button
            <div className="flex justify-end gap-2">
              {canSkip && (
                <Button onClick={onClose} variant="secondary">
                  Skip Event
                </Button>
              )}
              <Button onClick={handleContinue} variant="primary">
                Continue
              </Button>
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
                  onClick={() => isAvailable && setSelectedOptionId(option.id)}
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

          <div className="flex justify-end gap-2">
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
          )}
        </>
      )}
    </Modal>
  );
};
