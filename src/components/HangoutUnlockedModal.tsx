/**
 * Hangout Unlocked Modal
 * Shown (one per character) after a story event unlocks hangout eligibility.
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../hooks/usePlayerName';

interface HangoutUnlockedModalProps {
  isOpen: boolean;
  characterId: string;
  hasMore: boolean;
  onClose: () => void;
}

export const HangoutUnlockedModal: React.FC<HangoutUnlockedModalProps> = ({
  isOpen,
  characterId,
  hasMore,
  onClose,
}) => {
  const playerName = usePlayerName();
  const characterName = getCharacterName(characterId, playerName)
    ?? characterId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hangout Unlocked" size="sm">
      <div className="text-center space-y-6 py-2">
        <div className="text-5xl">🎾</div>
        <p className="text-lg font-semibold text-pixel-text">
          You can now hang out with{' '}
          <span className="text-pixel-accent">{characterName}</span>!
        </p>
        <p className="text-sm text-pixel-text-muted">
          Visit the Hang Out option from the main menu to spend time together.
        </p>
      </div>
      <div className="flex justify-center mt-6">
        <Button onClick={onClose} variant="primary">
          {hasMore ? 'Next' : 'Got it'}
        </Button>
      </div>
    </Modal>
  );
};
