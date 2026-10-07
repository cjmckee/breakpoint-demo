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
import { usePlayerName } from '../hooks/usePlayerName';
import { CurrencyAmounts } from './currency/CurrencyAmounts';
import { formatStatName, getStatIcon } from '../config/statIcons';

/** One effect of the outcome. Gold marks something new to own, not a number. */
const EffectChip: React.FC<{
  children: React.ReactNode;
  tone?: 'plain' | 'gold';
  testId?: string;
}> = ({ children, tone = 'plain', testId }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 text-sm font-bold ${
      tone === 'gold'
        ? 'border-yellow-600 bg-yellow-950/50 text-yellow-300'
        : 'border-pixel-border bg-pixel-card'
    }`}
    data-testid={testId}
  >
    {children}
  </span>
);

/** A signed amount: gains green, losses red. */
const Signed: React.FC<{ value: number }> = ({ value }) => (
  <span className={value < 0 ? 'text-pixel-error' : 'text-pixel-success'}>
    {value > 0 ? '+' : ''}
    {value}
  </span>
);

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
  // Get player name for character references
  const playerName = usePlayerName();

  const hasEffects =
    Object.keys(result.currency).length > 0 ||
    Object.keys(result.statChanges).length > 0 ||
    Object.keys(result.relationshipChanges).length > 0 ||
    result.abilitiesGained.length > 0 ||
    result.itemsGained.length > 0 ||
    result.moodResult !== 0 ||
    result.energyCost > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={result.eventName}
      size="scene"
      testId="story-result"
    >
      {/* What you picked, quietly — the result text is the point. */}
      {result.selectedOptionText && (
        <div className="mb-3 text-sm text-pixel-text-muted">
          You chose <span className="font-bold text-pixel-text">{result.selectedOptionText}</span>
        </div>
      )}

      {/* Result text */}
      <div className="bg-pixel-primary border-4 border-pixel-border p-4 mb-6">
        <p className="text-lg leading-relaxed">
          <FormattedText content={result.resultText} />
        </p>
      </div>

      {/* Effects, as one row of chips in the dark palette every other result uses */}
      {hasEffects && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-pixel-text-muted mb-2">
            Effects
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Currency: losses clamp each currency at zero when applied */}
            {Object.keys(result.currency).length > 0 && (
              <EffectChip testId="story-result-currency">
                <CurrencyAmounts amounts={result.currency} signed labelled />
              </EffectChip>
            )}

            {/* Direct stat changes: rare outcomes only. Gains green, losses red. */}
            {Object.keys(result.statChanges).length > 0 && (
              <EffectChip testId="story-result-stats">
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {Object.entries(result.statChanges).map(([stat, value]) => (
                    <span
                      key={stat}
                      className="inline-flex items-center gap-1 font-bold"
                      data-stat={stat}
                      data-amount={value}
                    >
                      <span aria-hidden="true">{getStatIcon(stat)}</span>
                      <span className="font-normal text-pixel-text-muted">
                        {formatStatName(stat)}
                      </span>
                      <Signed value={value ?? 0} />
                    </span>
                  ))}
                </span>
              </EffectChip>
            )}

            {Object.entries(result.relationshipChanges).map(([char, value]) => (
              <EffectChip key={char}>
                <span aria-hidden="true">{value >= 0 ? '💜' : '💔'}</span>
                <span className="text-pixel-text">
                  {getCharacterName(char, playerName) ||
                    char.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <Signed value={value} />
              </EffectChip>
            ))}

            {result.moodResult !== 0 && (
              <EffectChip>
                <span aria-hidden="true">{result.moodResult > 0 ? '😊' : '😞'}</span>
                <span className="text-pixel-text">Mood</span>
                <Signed value={result.moodResult} />
              </EffectChip>
            )}

            {result.energyCost > 0 && (
              <EffectChip>
                <span aria-hidden="true">⚡</span>
                <span className="text-pixel-text">Energy</span>
                <Signed value={-result.energyCost} />
              </EffectChip>
            )}

            {result.abilitiesGained.map((abilityName) => (
              <EffectChip key={abilityName} tone="gold">
                <span aria-hidden="true">⭐</span>
                {abilityName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </EffectChip>
            ))}

            {result.itemsGained.map((item) => (
              <EffectChip key={item.id} tone="gold">
                <span aria-hidden="true">🎒</span>
                {item.name}
              </EffectChip>
            ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      <div className="flex justify-center">
        <Button onClick={onClose} variant="primary" testId="story-result-dismiss">
          Continue
        </Button>
      </div>
    </Modal>
  );
};
