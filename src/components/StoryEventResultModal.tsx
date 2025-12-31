/**
 * Story Event Result Modal
 * Shows the outcome of a completed story event
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { StoryEventResult } from '../types/storyEvents';
import { FormattedText } from './FormattedText';
import { getCharacterName } from '../data/characters';

interface StoryEventResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StoryEventResult;
}

export const StoryEventResultModal: React.FC<StoryEventResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={result.eventName} size="lg">
      {/* Tags */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {result.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-600 text-white rounded text-sm font-semibold">
            #{tag}
          </span>
        ))}
      </div>

      {/* Selected choice (if applicable) */}
      {result.selectedOptionText && (
        <div className="mb-4 p-3 bg-blue-600 text-white border-l-4 border-blue-800 rounded">
          <span className="font-semibold">Your choice:</span> {result.selectedOptionText}
        </div>
      )}

      {/* Result text */}
      <div className="bg-gray-700 text-white p-4 rounded mb-6">
        <p className="text-lg">
          <FormattedText content={result.resultText} />
        </p>
      </div>

      {/* Effects */}
      {(Object.keys(result.statChanges).length > 0 ||
        Object.keys(result.relationshipChanges).length > 0 ||
        result.abilitiesGained.length > 0) && (
        <div className="space-y-4 mb-6">
          <h3 className="font-bold text-lg">Effects:</h3>

          {/* Stat changes */}
          {Object.keys(result.statChanges).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">📊 Stat Changes:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.statChanges).map(([stat, value]) => (
                  <div
                    key={stat}
                    className={`px-3 py-2 rounded font-semibold ${
                      value > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {stat}: {value > 0 ? '+' : ''}
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relationship changes */}
          {Object.keys(result.relationshipChanges).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">💜 Relationships:</h4>
              <div className="space-y-1">
                {Object.entries(result.relationshipChanges).map(([char, value]) => (
                  <div
                    key={char}
                    className={`px-3 py-2 rounded font-semibold ${
                      value > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getCharacterName(char) || char.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:{' '}
                    {value > 0 ? '+' : ''}
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abilities gained */}
          {result.abilitiesGained.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">🌟 New Abilities:</h4>
              <div className="space-y-2">
                {result.abilitiesGained.map((abilityName) => (
                  <div key={abilityName} className="px-3 py-2 bg-yellow-100 rounded font-semibold">
                    ⭐ {abilityName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood and Energy changes */}
          <div className="flex gap-4">
            {result.moodResult !== 0 && (
              <div
                className={`flex-1 px-3 py-2 rounded font-semibold ${
                  result.moodResult > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.moodResult > 0 ? '😊' : '😞'} Mood: {result.moodResult > 0 ? '+' : ''}
                {result.moodResult}
              </div>
            )}
            {result.energyCost > 0 && (
              <div className="flex-1 px-3 py-2 rounded font-semibold bg-orange-100 text-orange-800">
                ⚡ Energy: -{result.energyCost}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue button */}
      <div className="flex justify-center">
        <Button onClick={onClose} variant="primary">
          Continue
        </Button>
      </div>
    </Modal>
  );
};
