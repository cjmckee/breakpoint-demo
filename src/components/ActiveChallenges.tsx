/**
 * Active Challenges Component
 * Displays player's active challenges with expand/collapse functionality
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { Challenge } from '../types/challenges';

export const ActiveChallenges: React.FC = () => {
  const activeChallenges = useGameStore((state) => state.activeChallenges);
  const completeChallenge = useGameStore((state) => state.completeChallenge);
  const player = useGameStore((state) => state.player);
  const markChallengeSeen = useGameStore((state) => state.markChallengeSeen);

  const seenIds = player?.seenChallengeIds ?? [];

  // Track expanded state for each challenge
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(new Set());

  const toggleChallenge = (challengeId: string) => {
    setExpandedChallenges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
    markChallengeSeen(challengeId);
  };

  const handleClaimReward = (challengeId: string) => {
    completeChallenge(challengeId);
  };

  const getRequirementDescription = (requirement: Challenge['requirements'][0]): string => {
    return requirement.description;
  };

  const getRequirementProgress = (
    requirement: Challenge['requirements'][0],
    progress: Challenge['progress']['requirementProgress'][0]
  ): { current: number; target: number; percentage: number } => {
    switch (progress.type) {
      case 'statThreshold':
        return {
          current: progress.progress.currentValue,
          target: progress.progress.targetValue,
          percentage: progress.progress.percentage,
        };
      case 'matchStat':
        return {
          current: progress.progress.currentCount,
          target: progress.progress.targetCount,
          percentage: progress.progress.percentage,
        };
      case 'matchCount':
        return {
          current: progress.progress.currentWins,
          target: progress.progress.targetWins,
          percentage: progress.progress.percentage,
        };
      case 'relationshipLevel':
        return {
          current: progress.progress.currentLevel,
          target: progress.progress.targetLevel,
          percentage: progress.progress.percentage,
        };
      case 'abilityUnlock':
        return {
          current: progress.progress.hasAbility ? 1 : 0,
          target: 1,
          percentage: progress.progress.hasAbility ? 100 : 0,
        };
      default:
        return { current: 0, target: 1, percentage: 0 };
    }
  };

  const getRewardSummary = (challenge: Challenge): string => {
    const parts: string[] = [];

    if (challenge.reward.modifiers?.statBoosts) {
      const statCount = Object.keys(challenge.reward.modifiers.statBoosts).length;
      parts.push(`+${statCount} stats`);
    }

    if (challenge.reward.abilities && challenge.reward.abilities.length > 0) {
      parts.push(`${challenge.reward.abilities.length} ability(s)`);
    }

    if (challenge.reward.items && challenge.reward.items.length > 0) {
      parts.push(`${challenge.reward.items.length} item(s)`);
    }

    if (challenge.reward.experience) {
      parts.push(`+${challenge.reward.experience} XP`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Rewards';
  };

  if (activeChallenges.length === 0) {
    return (
      <Card title="Active Challenges" padding="md">
        <p className="text-pixel-text-muted text-center py-8">No active challenges</p>
      </Card>
    );
  }

  return (
    <Card title="Active Challenges" padding="md">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeChallenges.map((challenge) => {
          const isExpanded = expandedChallenges.has(challenge.id);
          const isCompleted = challenge.status === 'completed';

          return (
            <div
              key={challenge.id}
              className={`border-2 p-3 transition-all ${
                isCompleted
                  ? 'bg-green-500 bg-opacity-10 border-green-500'
                  : 'bg-blue-500 bg-opacity-10 border-blue-500'
              }`}
            >
              {/* Collapsed View */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleChallenge(challenge.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl relative">
                    {isCompleted ? '✓' : '📋'}
                    {!seenIds.includes(challenge.id) && (
                      <span className="absolute -top-2 -right-3 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-bounce">
                        !
                      </span>
                    )}
                  </span>
                  <div>
                    <div className="font-bold text-pixel-text text-sm">{challenge.name}</div>
                    <div className="text-xs text-pixel-text-muted">
                      {Math.round(challenge.progress.completionPercentage)}% complete
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCompleted && !isExpanded && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleClaimReward(challenge.id)}
                      >
                        Collect
                      </Button>
                    </span>
                  )}
                  <div className="text-pixel-text text-xl">{isExpanded ? '▼' : '▶'}</div>
                </div>
              </div>

              {/* Expanded View */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t-2 border-pixel-border">
                  <p className="text-sm text-pixel-text mb-3">{challenge.description}</p>

                  {/* Requirements */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs font-bold text-pixel-text">Requirements:</div>
                    {challenge.requirements.map((req, idx) => {
                      const reqProgress = challenge.progress.requirementProgress[idx];
                      const progress = getRequirementProgress(req, reqProgress);

                      return (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between text-pixel-text-muted mb-1">
                            <span>{getRequirementDescription(req)}</span>
                            <span>
                              {progress.current}/{progress.target}
                            </span>
                          </div>
                          <div className="w-full bg-pixel-border h-2">
                            <div
                              className={`h-full ${
                                progress.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, progress.percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rewards */}
                  <div className="mb-3">
                    <div className="text-xs font-bold text-pixel-text mb-1">Rewards:</div>
                    <div className="text-xs text-pixel-text-muted">
                      {getRewardSummary(challenge)}
                    </div>

                    {/* Show detailed rewards */}
                    <div className="mt-2 space-y-1">
                      {challenge.reward.modifiers?.statBoosts &&
                        Object.entries(challenge.reward.modifiers.statBoosts).map(([stat, value]) => (
                          <div
                            key={stat}
                            className="text-xs px-2 py-0.5 bg-green-500 bg-opacity-20 border border-green-500 text-green-500 font-bold inline-block mr-1"
                          >
                            +{value} {stat}
                          </div>
                        ))}

                      {challenge.reward.abilities?.map((ability) => (
                        <div
                          key={ability}
                          className="text-xs px-2 py-0.5 bg-orange-500 bg-opacity-20 border border-orange-500 text-orange-500 font-bold inline-block mr-1"
                        >
                          {ability}
                        </div>
                      ))}

                      {challenge.reward.items?.map((item) => (
                        <div
                          key={item.name}
                          className="text-xs px-2 py-0.5 bg-purple-500 bg-opacity-20 border border-purple-500 text-purple-500 font-bold inline-block mr-1"
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Claim button for completed challenges */}
                  {isCompleted && (
                    <Button
                      variant="success"
                      fullWidth
                      onClick={() => handleClaimReward(challenge.id)}
                    >
                      Claim Rewards
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
