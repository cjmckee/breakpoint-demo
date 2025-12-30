/**
 * Story Event Modal
 * Modal for presenting story events and player choices
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { StoryEvent, StoryEventOption } from '../types/storyEvents';

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

  const isLinearEvent = event.options.length === 0;

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
    <Modal isOpen={isOpen} onClose={onClose} title={event.name} size="lg" showCloseButton={false}>
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
      {event.dialogue && (
        <div className="bg-gray-700 text-white p-4 rounded mb-6 border-l-4 border-blue-500">
          <p className="italic">"{event.dialogue}"</p>
        </div>
      )}

      {/* Characters */}
      {event.characters.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">Characters:</h3>
          <div className="flex gap-2 flex-wrap">
            {event.characters.map((char) => (
              <span key={char} className="px-3 py-1 bg-purple-600 text-white rounded font-semibold">
                {char.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Options or Continue Button */}
      {isLinearEvent ? (
        // Linear event - just show continue button
        <div className="flex justify-end gap-2">
          {event.skippable && (
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

                  {/* Preview effects when selected */}
                  {isSelected && option.outcome.effects && (
                    <div className="mt-3 pt-3 border-t border-gray-300 text-sm">
                      <div className="font-semibold mb-2 text-gray-900">Effects Preview:</div>
                      <div className="grid grid-cols-1 gap-1">
                        {option.outcome.effects.statBoosts &&
                          Object.keys(option.outcome.effects.statBoosts).length > 0 && (
                            <div className="text-green-700 font-medium">
                              📈 Stats: +
                              {Object.entries(option.outcome.effects.statBoosts)
                                .map(([k, v]) => `${k}: +${v}`)
                                .join(', ')}
                            </div>
                          )}
                        {option.outcome.effects.moodChange !== undefined &&
                          option.outcome.effects.moodChange !== 0 && (
                            <div
                              className={
                                option.outcome.effects.moodChange > 0
                                  ? 'text-green-700 font-medium'
                                  : 'text-red-700 font-medium'
                              }
                            >
                              {option.outcome.effects.moodChange > 0 ? '😊' : '😞'} Mood:{' '}
                              {option.outcome.effects.moodChange > 0 ? '+' : ''}
                              {option.outcome.effects.moodChange}
                            </div>
                          )}
                        {option.outcome.effects.energyChange !== undefined &&
                          option.outcome.effects.energyChange !== 0 && (
                            <div
                              className={
                                option.outcome.effects.energyChange > 0
                                  ? 'text-green-700 font-medium'
                                  : 'text-orange-700 font-medium'
                              }
                            >
                              ⚡ Energy:{' '}
                              {option.outcome.effects.energyChange > 0 ? '+' : ''}
                              {option.outcome.effects.energyChange}
                            </div>
                          )}
                        {option.outcome.effects.relationshipChanges &&
                          Object.keys(option.outcome.effects.relationshipChanges).length > 0 && (
                            <div className="text-purple-700 font-medium">
                              💜 Relationships:{' '}
                              {Object.entries(option.outcome.effects.relationshipChanges)
                                .map(([char, val]) => `${char}: ${val > 0 ? '+' : ''}${val}`)
                                .join(', ')}
                            </div>
                          )}
                        {option.outcome.effects.abilitiesGained &&
                          option.outcome.effects.abilitiesGained.length > 0 && (
                            <div className="text-yellow-700 font-semibold">
                              🌟 New Abilities:{' '}
                              {option.outcome.effects.abilitiesGained.join(', ')}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            {event.skippable && (
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
    </Modal>
  );
};
