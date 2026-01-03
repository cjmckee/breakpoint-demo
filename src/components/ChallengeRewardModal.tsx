/**
 * Challenge Reward Modal
 * Shows when a challenge is completed with rewards details
 */

import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Challenge } from '../types/challenges';
import { getCharacterName } from '../data/characters';
import { usePlayerName } from '../stores/gameStore';

interface ChallengeRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  onClaimRewards: (challengeId: string) => void;
}

export const ChallengeRewardModal: React.FC<ChallengeRewardModalProps> = ({
  isOpen,
  onClose,
  challenge,
  onClaimRewards,
}) => {
  const playerName = usePlayerName();

  if (!challenge) return null;

  const handleClaim = () => {
    onClaimRewards(challenge.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Challenge Complete!">
      <div className="space-y-4">
        {/* Challenge Name */}
        <div className="text-center">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold text-pixel-text mb-2">{challenge.name}</h2>
          <p className="text-sm text-pixel-text-muted">{challenge.description}</p>
        </div>

        {/* Rewards Section */}
        <div className="border-2 border-pixel-border p-4 bg-pixel-bg-alt">
          <h3 className="text-lg font-bold text-pixel-text mb-3 text-center">Rewards Earned</h3>

          <div className="space-y-3">
            {/* Stat Boosts */}
            {challenge.reward.modifiers?.statBoosts && (
              <div>
                <div className="text-xs font-bold text-pixel-text mb-2">Stat Boosts:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(challenge.reward.modifiers.statBoosts).map(([stat, value]) => (
                    <div
                      key={stat}
                      className="text-sm px-3 py-1 bg-green-500 bg-opacity-20 border-2 border-green-500 text-green-500 font-bold"
                    >
                      +{value} {stat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abilities */}
            {challenge.reward.abilities && challenge.reward.abilities.length > 0 && (
              <div>
                <div className="text-xs font-bold text-pixel-text mb-2">Abilities Gained:</div>
                <div className="flex flex-wrap gap-2">
                  {challenge.reward.abilities.map((ability) => (
                    <div
                      key={ability}
                      className="text-sm px-3 py-1 bg-orange-500 bg-opacity-20 border-2 border-orange-500 text-orange-500 font-bold"
                    >
                      ⭐ {ability}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {challenge.reward.items && challenge.reward.items.length > 0 && (
              <div>
                <div className="text-xs font-bold text-pixel-text mb-2">Items Received:</div>
                <div className="space-y-2">
                  {challenge.reward.items.map((item) => (
                    <div
                      key={item.name}
                      className="p-2 bg-purple-500 bg-opacity-10 border-2 border-purple-500"
                    >
                      <div className="font-bold text-purple-500">{item.name}</div>
                      <div className="text-xs text-pixel-text-muted">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationship Changes */}
            {challenge.reward.relationshipChanges && (
              <div>
                <div className="text-xs font-bold text-pixel-text mb-2">Relationships:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(challenge.reward.relationshipChanges).map(([char, change]) => (
                    <div
                      key={char}
                      className={`text-sm px-3 py-1 border-2 font-bold ${
                        change > 0
                          ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-500'
                          : 'bg-red-500 bg-opacity-20 border-red-500 text-red-500'
                      }`}
                    >
                      {getCharacterName(char, playerName)}: {change > 0 ? '+' : ''}
                      {change}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {challenge.reward.experience && challenge.reward.experience > 0 && (
              <div>
                <div className="text-xs font-bold text-pixel-text mb-2">Experience:</div>
                <div className="text-sm px-3 py-1 bg-blue-500 bg-opacity-20 border-2 border-blue-500 text-blue-500 font-bold inline-block">
                  +{challenge.reward.experience} XP
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="success" fullWidth onClick={handleClaim}>
            Claim Rewards
          </Button>
        </div>
      </div>
    </Modal>
  );
};
