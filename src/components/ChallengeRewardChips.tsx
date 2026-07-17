/**
 * ChallengeRewardChips
 * Shared presentational list of a challenge's rewards as colored chips
 * (stat boosts, abilities, items, XP). Used by both active and completed
 * challenge views so they stay visually consistent.
 */

import React from 'react';
import type { ChallengeReward } from '../types/challenges';

interface ChallengeRewardChipsProps {
  reward: ChallengeReward;
}

export const ChallengeRewardChips: React.FC<ChallengeRewardChipsProps> = ({ reward }) => {
  return (
    <div className="space-y-1">
      {reward.modifiers?.statBoosts &&
        Object.entries(reward.modifiers.statBoosts).map(([stat, value]) => (
          <div
            key={stat}
            className="text-xs px-2 py-0.5 bg-green-500 bg-opacity-20 border border-green-500 text-green-500 font-bold inline-block mr-1"
          >
            +{value} {stat}
          </div>
        ))}

      {reward.abilities?.map((ability) => (
        <div
          key={ability}
          className="text-xs px-2 py-0.5 bg-orange-500 bg-opacity-20 border border-orange-500 text-orange-500 font-bold inline-block mr-1"
        >
          {ability}
        </div>
      ))}

      {reward.items?.map((item) => (
        <div
          key={item.name}
          className="text-xs px-2 py-0.5 bg-purple-500 bg-opacity-20 border border-purple-500 text-purple-500 font-bold inline-block mr-1"
        >
          {item.name}
        </div>
      ))}

      {reward.experience ? (
        <div className="text-xs px-2 py-0.5 bg-blue-500 bg-opacity-20 border border-blue-500 text-blue-400 font-bold inline-block mr-1">
          +{reward.experience} XP
        </div>
      ) : null}
    </div>
  );
};
