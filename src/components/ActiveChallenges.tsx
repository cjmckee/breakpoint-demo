/**
 * Active Challenges Component
 * Displays player's active challenges with expand/collapse functionality
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { UnseenBadge } from './ui/UnseenBadge';
import { Button } from './ui/Button';
import { ChallengeRewardChips } from './ChallengeRewardChips';
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
      <Card padding="sm">
        <div className="text-center py-8">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm text-pixel-text-muted">
            No active challenges — new quests will appear here as you play.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <div className="space-y-2">
        {activeChallenges.map((challenge) => {
          const isExpanded = expandedChallenges.has(challenge.id);
          const isCompleted = challenge.status === 'completed';
          const pct = Math.round(challenge.progress.completionPercentage);

          return (
            <div
              key={challenge.id}
              className={`border-2 p-2.5 transition-all ${
                isCompleted
                  ? 'bg-green-500 bg-opacity-10 border-green-500'
                  : 'bg-blue-500 bg-opacity-10 border-blue-500'
              }`}
            >
              {/* Collapsed View: name + inline progress bar */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => toggleChallenge(challenge.id)}
              >
                <span className="text-xl relative shrink-0">
                  {isCompleted ? '✅' : '📋'}
                  {!seenIds.includes(challenge.id) && (
                    <UnseenBadge size="sm" className="absolute -top-2 -right-3" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-bold text-pixel-text text-sm truncate">
                      {challenge.name}
                    </span>
                    <span className={`text-xs shrink-0 ${isCompleted ? 'text-green-500 font-bold' : 'text-pixel-text-muted'}`}>
                      {isCompleted ? 'Complete!' : `${pct}%`}
                    </span>
                  </div>
                  <div className="w-full bg-pixel-border h-2">
                    <div
                      className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
                {isCompleted && !isExpanded && (
                  <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleClaimReward(challenge.id)}
                    >
                      Collect
                    </Button>
                  </span>
                )}
                <div className="text-pixel-text-muted text-sm shrink-0">{isExpanded ? '▼' : '▶'}</div>
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
                    <div className="mt-2">
                      <ChallengeRewardChips reward={challenge.reward} />
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
