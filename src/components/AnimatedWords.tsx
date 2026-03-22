/**
 * AnimatedWords Component
 * Wraps children text content so each word floats independently with staggered timing.
 * Intensity controls how much motion is applied — "full" for character speech, "subtle" for narration.
 */

import React from 'react';
import type { FormattedText as FormattedTextType, TextSegment } from '../types/storyEvents';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../hooks/usePlayerName';

interface AnimatedWordsProps {
  content: FormattedTextType;
  intensity: 'full' | 'subtle';
}

/**
 * Splits formatted text segments into individually animated word spans.
 * Character references are kept as single animated units.
 */
export const AnimatedWords: React.FC<AnimatedWordsProps> = ({ content, intensity }) => {
  const playerName = usePlayerName();
  const animationClass = intensity === 'full' ? 'animate-word-drift' : 'animate-word-drift-subtle';

  let wordIndex = 0;

  const renderWordSpan = (word: string, key: string, extraClass = '') => {
    const delay = (wordIndex++ % 8) * 0.3;
    return (
      <span
        key={key}
        className={`inline-block ${animationClass} ${extraClass}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {word}
      </span>
    );
  };

  return (
    <span>
      {content.map((segment: TextSegment, segIdx: number) => {
        if (typeof segment === 'string') {
          // Split on whitespace boundaries, keeping whitespace attached
          const parts = segment.split(/(\s+)/);
          return (
            <React.Fragment key={segIdx}>
              {parts.map((part, partIdx) => {
                // Whitespace chunks pass through without animation
                if (/^\s+$/.test(part)) {
                  return <React.Fragment key={`${segIdx}-${partIdx}`}>{part}</React.Fragment>;
                }
                return renderWordSpan(part, `${segIdx}-${partIdx}`);
              })}
            </React.Fragment>
          );
        }

        // Character reference — animate as a single unit
        const characterName = getCharacterName(segment.characterId, playerName);
        return renderWordSpan(
          characterName || segment.characterId,
          `${segIdx}-char`,
          'font-bold text-purple-600 dark:text-purple-400'
        );
      })}
    </span>
  );
};
