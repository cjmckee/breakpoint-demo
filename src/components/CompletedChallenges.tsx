/**
 * Completed Challenges Component
 * Shows challenges the player has already finished and claimed. Claimed
 * challenges are stored as IDs only, so details are looked up from the
 * challenge template registry. Rendered green and slightly muted to read as
 * "done", and click-through to review the requirements and rewards.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { ChallengeRewardChips } from './ChallengeRewardChips';
import { CHALLENGE_TEMPLATES } from '../data/challengeTemplates';

export const CompletedChallenges: React.FC = () => {
  const completedChallenges = useGameStore((state) => state.completedChallenges);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Resolve claimed IDs to their templates; skip any that no longer exist.
  const completed = completedChallenges
    .map((id) => CHALLENGE_TEMPLATES[id])
    .filter((template): template is (typeof CHALLENGE_TEMPLATES)[string] => Boolean(template));

  // Nothing to show yet — hide the section entirely.
  if (completed.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-green-500 mb-2 flex items-center gap-2">
        <span>✅</span>
        <span>Completed</span>
        <span className="text-sm font-normal text-pixel-text-muted">({completed.length})</span>
      </h2>

      <Card padding="sm">
        <div className="space-y-2">
          {completed.map((template) => {
            const isExpanded = expanded.has(template.id);

            return (
              <div
                key={template.id}
                className="border-2 border-green-600 bg-green-500 bg-opacity-5 opacity-75 hover:opacity-100 transition-opacity p-2.5"
              >
                {/* Collapsed header */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggle(template.id)}
                >
                  <span className="text-xl shrink-0">🏆</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-pixel-text text-sm truncate block">
                      {template.name}
                    </span>
                  </div>
                  <span className="text-xs text-green-500 font-bold shrink-0">Done</span>
                  <div className="text-pixel-text-muted text-sm shrink-0">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t-2 border-green-600/40">
                    <p className="text-sm text-pixel-text mb-3">{template.description}</p>

                    {/* Requirements (all satisfied) */}
                    <div className="space-y-1 mb-3">
                      <div className="text-xs font-bold text-pixel-text">Requirements:</div>
                      {template.requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-pixel-text-muted"
                        >
                          <span className="text-green-500 shrink-0">✓</span>
                          <span>{req.description}</span>
                        </div>
                      ))}
                    </div>

                    {/* Rewards earned */}
                    <div>
                      <div className="text-xs font-bold text-pixel-text mb-1">Rewards earned:</div>
                      <ChallengeRewardChips reward={template.reward} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
