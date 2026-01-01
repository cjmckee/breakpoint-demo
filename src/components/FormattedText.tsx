/**
 * Formatted Text Component
 * Renders text with character name references highlighted
 */

import React from 'react';
import type { FormattedText as FormattedTextType, TextSegment } from '../types/storyEvents';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../hooks/usePlayerName';

interface FormattedTextProps {
  content: FormattedTextType;
  className?: string;
}

/**
 * Renders formatted text with highlighted character names
 *
 * @example
 * <FormattedText content={[
 *   "You meet ",
 *   { characterId: "coach_gonzalez" },
 *   " at the courts."
 * ]} />
 *
 * Renders: "You meet Coach Gonzalez at the courts." (with name highlighted)
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ content, className = '' }) => {
  // Get player name for character references
  const playerName = usePlayerName();

  return (
    <span className={className}>
      {content.map((segment: TextSegment, index: number) => {
        // Plain text segment
        if (typeof segment === 'string') {
          return <React.Fragment key={index}>{segment}</React.Fragment>;
        }

        // Character reference segment
        const characterName = getCharacterName(segment.characterId, playerName);
        return (
          <span
            key={index}
            className="font-bold text-purple-600 dark:text-purple-400"
            title={`Character: ${segment.characterId}`}
          >
            {characterName || segment.characterId}
          </span>
        );
      })}
    </span>
  );
};
