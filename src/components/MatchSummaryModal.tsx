/**
 * Match Summary Modal
 * Displays match results after completion
 */

import React, { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { MatchScore } from '../types/keyMoments';
import { useMatchStore } from '../stores/matchStore';
import { useGameStore } from '../stores/gameStore';
import type { OpponentTier, MatchReward } from '../types/game';
import { MatchRewardSystem } from '../game/MatchRewardSystem';

interface MatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalScore: MatchScore | null;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  isOpen,
  onClose,
  finalScore,
}) => {
  const setScreen = useGameStore((state) => state.setScreen);
  const addMatchResult = useGameStore((state) => state.addMatchResult);
  const completeTournamentMatch = useGameStore((state) => state.completeTournamentMatch);
  const completeStoryMatch = useGameStore((state) => state.completeStoryMatch);
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const keyMomentHistory = useMatchStore((state) => state.keyMomentHistory);
  const matchStatistics = useMatchStore((state) => state.matchStatistics);

  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const isWinner = finalScore?.winner === 'player';

  // Calculate rewards exactly once using a ref to avoid duplicate rolls
  // useMemo can re-run in StrictMode or on dependency changes, causing multiple random rolls
  const matchRewardsRef = useRef<MatchReward | null>(null);
  if (!matchRewardsRef.current && matchStatistics && matchConfig && finalScore) {
    const opponentTier = (matchConfig.opponentTier || 1) as OpponentTier;
    matchRewardsRef.current = MatchRewardSystem.calculateRewards(
      matchStatistics,
      opponentTier,
      isWinner
    );
  }
  const matchRewards = matchRewardsRef.current;

  // Early return AFTER all hooks have been called
  if (!finalScore) return null;

  const handleClose = () => {
    if (!finalScore || !matchStatistics || !matchConfig || !matchRewards) return;

    // Format score for display
    const formatScore = (score: MatchScore): string => {
      return score.sets.map(s => `${s.player}-${s.opponent}`).join(', ');
    };

    // Get opponent tier and name from match config
    const opponentTier = (matchConfig.opponentTier || 1) as OpponentTier;
    const opponentName = matchConfig.opponentName || 'Opponent';

    console.log('MatchSummaryModal handleClose called');
    console.log('Match statistics:', matchStatistics);
    console.log('Opponent tier:', opponentTier);
    console.log('Match config isTournamentMatch:', matchConfig.isTournamentMatch);
    console.log('Passing pre-calculated rewards:', matchRewards);

    // Check if this is a tournament match or story match using the flags in match config
    // These are the most reliable way as they're explicitly set when starting the match
    const isTournamentMatch = matchConfig.isTournamentMatch === true;
    const isStoryMatch = matchConfig.isStoryMatch === true;

    if (isTournamentMatch) {
      console.log('Tournament match detected - calling completeTournamentMatch');
      console.log('Passing rewards to completeTournamentMatch:', matchRewards);
      // Tournament matches use special handling
      completeTournamentMatch(
        isWinner ? 'win' : 'loss',
        formatScore(finalScore),
        matchStatistics,
        matchRewards
      );
    } else if (isStoryMatch) {
      console.log('Story match detected - calling completeStoryMatch');
      console.log('Passing rewards to completeStoryMatch:', matchRewards);
      // Story matches use special handling with post-match events
      completeStoryMatch(
        isWinner ? 'win' : 'loss',
        formatScore(finalScore),
        matchStatistics,
        matchRewards
      );
    } else {
      console.log('Regular match - calling addMatchResult');
      // Regular matches use standard handling with pre-calculated rewards
      addMatchResult(
        isWinner ? 'win' : 'loss',
        opponentName,
        opponentTier,
        formatScore(finalScore),
        matchConfig.surface,
        matchStatistics,
        matchRewards
      );
    }

    onClose();
    setScreen('main-menu');
  };

  const formatSetScore = (set: { player: number; opponent: number }): string => {
    return `${set.player}-${set.opponent}`;
  };

  // Helper function to get performance level color and label
  const getPerformanceDisplay = (score: number): { color: string; bgColor: string; label: string } => {
    if (score >= 75) return { color: 'text-green-500', bgColor: 'bg-green-500', label: 'Excellent' };
    if (score >= 60) return { color: 'text-blue-500', bgColor: 'bg-blue-500', label: 'Good' };
    if (score >= 45) return { color: 'text-yellow-500', bgColor: 'bg-yellow-500', label: 'Average' };
    return { color: 'text-red-500', bgColor: 'bg-red-500', label: 'Poor' };
  };

  // Helper function to get overall grade
  const getOverallGrade = (score: number): string => {
    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 45) return 'C';
    return 'D';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="lg">
      <div className="space-y-6">
        {/* Result Header */}
        <div
          className={`border-4 ${isWinner ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'} bg-opacity-20 p-6 text-center`}
        >
          <div className="text-6xl mb-4">{isWinner ? '🏆' : '😔'}</div>
          <h2 className="text-3xl font-bold text-pixel-text mb-2">
            {isWinner ? 'VICTORY!' : 'DEFEAT'}
          </h2>
          <p className="text-xl text-pixel-text-muted">
            {isWinner ? 'You won the match!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Final Score */}
        <div className="bg-pixel-card border-4 border-pixel-border p-4">
          <h3 className="text-lg font-bold text-pixel-text mb-4 text-center">
            📊 Final Score
          </h3>

          {/* Set-by-Set Scores */}
          <div className="space-y-3 mb-4">
            {finalScore.sets.map((set, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                <div className={`text-right font-bold ${set.player > set.opponent ? 'text-green-500' : 'text-pixel-text'}`}>
                  {set.player}
                </div>
                <div className="text-center text-sm text-pixel-text-muted">
                  Set {index + 1}
                </div>
                <div className={`text-left font-bold ${set.opponent > set.player ? 'text-red-500' : 'text-pixel-text'}`}>
                  {set.opponent}
                </div>
              </div>
            ))}
          </div>

          {/* Overall Score */}
          <div className="pt-4 border-t-2 border-pixel-border">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-right">
                <div className="text-sm text-pixel-text-muted mb-1">You</div>
                <div className="text-4xl font-bold text-green-500">
                  {finalScore.sets.filter(s => s.player > s.opponent).length}
                </div>
              </div>
              <div className="text-center text-2xl font-bold text-pixel-text-muted">-</div>
              <div className="text-left">
                <div className="text-sm text-pixel-text-muted mb-1">Opponent</div>
                <div className="text-4xl font-bold text-red-500">
                  {finalScore.sets.filter(s => s.opponent > s.player).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Highlights */}
        {matchStatistics && (
          <div className="bg-pixel-card border-4 border-yellow-500 p-4">
            <h3 className="text-lg font-bold text-pixel-text mb-4 text-center">
              Highlights
            </h3>
            <div className="space-y-2">
              {(() => {
                const highlights: Array<{ icon: string; text: string }> = [];

                // Aces
                if (matchStatistics.aces.player > 0) {
                  highlights.push({
                    icon: matchStatistics.aces.player >= 5 ? '🔥' : '🎾',
                    text: `${matchStatistics.aces.player} ace${matchStatistics.aces.player !== 1 ? 's' : ''} served`,
                  });
                }

                // Winners
                if (matchStatistics.winners.player > 0) {
                  highlights.push({
                    icon: matchStatistics.winners.player >= 20 ? '💥' : '🎯',
                    text: `${matchStatistics.winners.player} winner${matchStatistics.winners.player !== 1 ? 's' : ''} hit`,
                  });
                }

                // Break points
                if (matchStatistics.breakPointsConverted.player > 0) {
                  highlights.push({
                    icon: '⚡',
                    text: `${matchStatistics.breakPointsConverted.player}/${matchStatistics.breakPointOpportunities.player} break points converted`,
                  });
                }

                // Longest rally
                if (matchStatistics.longestRally > 10) {
                  highlights.push({
                    icon: '🔁',
                    text: `Epic ${matchStatistics.longestRally}-shot rally`,
                  });
                }

                // Key moments
                if (keyMomentHistory && keyMomentHistory.length > 0) {
                  const won = keyMomentHistory.filter(km => km.result.pointWinner === 'player').length;
                  highlights.push({
                    icon: won > keyMomentHistory.length / 2 ? '🏅' : '⚡',
                    text: `${won}/${keyMomentHistory.length} key moments won`,
                  });
                }

                // Low unforced errors
                if (matchStatistics.unforcedErrors.player < matchStatistics.unforcedErrors.opponent) {
                  highlights.push({
                    icon: '🧊',
                    text: `Fewer unforced errors (${matchStatistics.unforcedErrors.player} vs ${matchStatistics.unforcedErrors.opponent})`,
                  });
                }

                // First serve percentage
                if (matchStatistics.firstServePercentage.player >= 70) {
                  highlights.push({
                    icon: '📈',
                    text: `${Math.round(matchStatistics.firstServePercentage.player)}% first serve rate`,
                  });
                }

                // Net play
                if (matchStatistics.netPointsWon.player >= 3) {
                  highlights.push({
                    icon: '🥅',
                    text: `${matchStatistics.netPointsWon.player} net points won`,
                  });
                }

                // Comeback from deficit (only shown on wins)
                if (isWinner && matchStatistics.largestDeficit && matchStatistics.largestDeficit.deficitSize >= 2) {
                  const deficit = matchStatistics.largestDeficit;
                  const comebackText = deficit.gameScore
                    ? `Came back from ${deficit.games}, ${deficit.gameScore}`
                    : `Came back from ${deficit.games}`;
                  highlights.push({
                    icon: '💪',
                    text: comebackText,
                  });
                }

                if (highlights.length === 0) {
                  highlights.push({ icon: '🎾', text: 'Hard-fought match!' });
                }

                return highlights.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30">
                    <span className="text-xl">{h.icon}</span>
                    <span className="text-sm text-pixel-text">{h.text}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Performance & Rewards Section */}
        {matchRewards && (
          <>
            {/* Overall Performance Grade */}
            <div className="bg-pixel-card border-4 border-pixel-accent p-6 text-center">
              <h3 className="text-lg font-bold text-pixel-text mb-3">
                📊 Match Performance
              </h3>
              <div className="flex items-center justify-center gap-6">
                <div>
                  <div className={`text-6xl font-bold ${getPerformanceDisplay(matchRewards.performanceBreakdown.overallScore).color}`}>
                    {getOverallGrade(matchRewards.performanceBreakdown.overallScore)}
                  </div>
                  <div className="text-sm text-pixel-text-muted mt-2">Overall Grade</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-pixel-text">
                    {Math.round(matchRewards.performanceBreakdown.overallScore)}
                  </div>
                  <div className="text-sm text-pixel-text-muted mt-2">Performance Score</div>
                </div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-pixel-card border-2 border-pixel-border p-4">
              <h3 className="text-lg font-bold text-pixel-text mb-4 text-center">
                🎯 Performance Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Serving', score: matchRewards.performanceBreakdown.servingScore, icon: '🎾' },
                  { name: 'Returning', score: matchRewards.performanceBreakdown.returningScore, icon: '↩️' },
                  { name: 'Rally Play', score: matchRewards.performanceBreakdown.rallyScore, icon: '🔁' },
                  { name: 'Net Play', score: matchRewards.performanceBreakdown.netPlayScore, icon: '🥅' },
                  { name: 'Mental Game', score: matchRewards.performanceBreakdown.mentalScore, icon: '🧠' },
                ].map(({ name, score, icon }) => {
                  const display = getPerformanceDisplay(score);
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div className="text-2xl w-8">{icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-pixel-text">{name}</span>
                          <span className={`text-sm font-bold ${display.color}`}>
                            {Math.round(score)} - {display.label}
                          </span>
                        </div>
                        <div className="w-full bg-pixel-bg border-2 border-pixel-border h-4">
                          <div
                            className={`${display.bgColor} h-full bg-opacity-50 transition-all`}
                            style={{ width: `${Math.min(100, score)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rewards Earned */}
            <div className="bg-pixel-card border-4 border-pixel-accent p-4">
              <h3 className="text-lg font-bold text-pixel-text mb-4 text-center">
                🎁 Rewards Earned
              </h3>

              {/* Experience & Mood */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-500 bg-opacity-20 border-2 border-blue-500 p-3 text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Experience</div>
                  <div className="text-2xl font-bold text-blue-500">
                    +{matchRewards.experience}
                  </div>
                </div>
                <div className={`${matchRewards.moodChange >= 0 ? 'bg-green-500' : 'bg-red-500'} bg-opacity-20 border-2 ${matchRewards.moodChange >= 0 ? 'border-green-500' : 'border-red-500'} p-3 text-center`}>
                  <div className="text-xs text-pixel-text-muted mb-1">Mood</div>
                  <div className={`text-2xl font-bold ${matchRewards.moodChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {matchRewards.moodChange >= 0 ? '+' : ''}{matchRewards.moodChange}
                  </div>
                </div>
              </div>

              {/* Stat Boosts */}
              {Object.keys(matchRewards.statBoosts).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-pixel-text mb-3 text-center">
                    💪 Stat Improvements
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(matchRewards.statBoosts)
                      .filter(([_, value]) => value > 0)
                      .map(([stat, value]) => (
                        <div
                          key={stat}
                          className="bg-green-500 bg-opacity-20 border border-green-500 p-2 text-center"
                        >
                          <div className="text-lg font-bold text-green-500">+{value}</div>
                          <div className="text-xs text-pixel-text capitalize">
                            {stat.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Abilities Gained */}
              {matchRewards.abilitiesGained && matchRewards.abilitiesGained.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-pixel-text mb-3 text-center">
                    ⭐ Abilities Unlocked
                  </h4>
                  <div className="space-y-2">
                    {matchRewards.abilitiesGained.map((ability, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-2 ${
                          ability.rarity === 'legendary' ? 'border-purple-500 bg-purple-500' :
                          ability.rarity === 'rare' ? 'border-orange-500 bg-orange-500' :
                          ability.rarity === 'uncommon' ? 'border-blue-500 bg-blue-500' :
                          'border-gray-500 bg-gray-500'
                        } bg-opacity-20`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-pixel-text">{ability.name}</span>
                          <span className={`text-xs px-2 py-1 border ${
                            ability.rarity === 'legendary' ? 'border-purple-500 text-purple-500' :
                            ability.rarity === 'rare' ? 'border-orange-500 text-orange-500' :
                            ability.rarity === 'uncommon' ? 'border-blue-500 text-blue-500' :
                            'border-gray-500 text-gray-500'
                          } uppercase`}>
                            {ability.rarity}
                          </span>
                        </div>
                        <div className="text-xs text-pixel-text-muted mt-1">{ability.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Detailed Statistics (Expandable) */}
        <div className="bg-pixel-card border-2 border-pixel-border">
          <button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            className="w-full p-4 flex items-center justify-between hover:bg-pixel-bg transition-colors"
          >
            <h3 className="text-lg font-bold text-pixel-text">
              📊 Detailed Statistics
            </h3>
            <span className="text-2xl text-pixel-text">
              {showDetailedStats ? '▼' : '▶'}
            </span>
          </button>

          {showDetailedStats && (
            <div className="p-4 pt-0 space-y-4">
              {/* Key Moments */}
              {keyMomentHistory && keyMomentHistory.length > 0 && (
                <div className="border-t-2 border-pixel-border pt-4">
                  <h4 className="text-md font-bold text-pixel-text mb-3">⚡ Key Moments</h4>
                  <div className="space-y-2">
                    {keyMomentHistory.map((km, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-2 ${
                          km.result.pointWinner === 'player'
                            ? 'border-green-500 bg-green-500'
                            : 'border-red-500 bg-red-500'
                        } bg-opacity-10`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-pixel-text">
                            {km.keyMoment.type.replace(/-/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-pixel-text-muted">
                            {km.result.pointWinner === 'player' ? '✅ Won' : '❌ Lost'}
                          </span>
                        </div>
                        <div className="text-xs text-pixel-text-muted">
                          Choice: {km.chosenOption.name}
                        </div>
                        <div className="text-xs text-pixel-text-muted">
                          Result: {km.result.outcome} ({Math.round(km.result.finalProbability)}% chance)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Info */}
              <div className="border-t-2 border-pixel-border pt-4">
                <h4 className="text-md font-bold text-pixel-text mb-3">🎾 Match Info</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-pixel-text-muted">Surface:</span>
                    <span className="text-pixel-text font-bold capitalize">
                      {matchConfig?.surface || 'Hard'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pixel-text-muted">Format:</span>
                    <span className="text-pixel-text font-bold">
                      {matchConfig?.matchFormat === 'best-of-1' ? 'Best of 1' : 'Best of 3'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pixel-text-muted">Total Sets:</span>
                    <span className="text-pixel-text font-bold">{finalScore.sets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pixel-text-muted">Key Moments:</span>
                    <span className="text-pixel-text font-bold">
                      {keyMomentHistory?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Match Statistics */}
              {matchStatistics && (
                <>
                  {/* Serving Statistics */}
                  <div className="border-t-2 border-pixel-border pt-4">
                    <h4 className="text-md font-bold text-pixel-text mb-3">🎾 Serving</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Stat</div>
                        <div className="text-pixel-text font-bold text-center">You</div>
                        <div className="text-pixel-text font-bold text-center">Opponent</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Aces</div>
                        <div className="text-pixel-text text-center">{matchStatistics.aces.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.aces.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Double Faults</div>
                        <div className="text-pixel-text text-center">{matchStatistics.doubleFaults.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.doubleFaults.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">1st Serve %</div>
                        <div className="text-pixel-text text-center">{Math.round(matchStatistics.firstServePercentage.player)}%</div>
                        <div className="text-pixel-text text-center">{Math.round(matchStatistics.firstServePercentage.opponent)}%</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">1st Serve Points Won</div>
                        <div className="text-pixel-text text-center">{matchStatistics.firstServePointsWon.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.firstServePointsWon.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">2nd Serve Points Won</div>
                        <div className="text-pixel-text text-center">{matchStatistics.secondServePointsWon.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.secondServePointsWon.opponent}</div>
                      </div>
                    </div>
                  </div>

                  {/* Points and Errors */}
                  <div className="border-t-2 border-pixel-border pt-4">
                    <h4 className="text-md font-bold text-pixel-text mb-3">🎯 Points & Errors</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Stat</div>
                        <div className="text-pixel-text font-bold text-center">You</div>
                        <div className="text-pixel-text font-bold text-center">Opponent</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Total Points Won</div>
                        <div className="text-pixel-text text-center">{matchStatistics.totalPoints.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.totalPoints.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Winners</div>
                        <div className="text-pixel-text text-center">{matchStatistics.winners.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.winners.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Unforced Errors</div>
                        <div className="text-pixel-text text-center">{matchStatistics.unforcedErrors.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.unforcedErrors.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Forced Errors</div>
                        <div className="text-pixel-text text-center">{matchStatistics.forcedErrors.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.forcedErrors.opponent}</div>
                      </div>
                    </div>
                  </div>

                  {/* Break Points */}
                  <div className="border-t-2 border-pixel-border pt-4">
                    <h4 className="text-md font-bold text-pixel-text mb-3">⚡ Break Points</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Stat</div>
                        <div className="text-pixel-text font-bold text-center">You</div>
                        <div className="text-pixel-text font-bold text-center">Opponent</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Opportunities</div>
                        <div className="text-pixel-text text-center">{matchStatistics.breakPointOpportunities.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.breakPointOpportunities.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Converted</div>
                        <div className="text-pixel-text text-center">{matchStatistics.breakPointsConverted.player}</div>
                        <div className="text-pixel-text text-center">{matchStatistics.breakPointsConverted.opponent}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-pixel-text-muted">Conversion %</div>
                        <div className="text-pixel-text text-center">
                          {matchStatistics.breakPointOpportunities.player > 0
                            ? Math.round((matchStatistics.breakPointsConverted.player / matchStatistics.breakPointOpportunities.player) * 100)
                            : 0}%
                        </div>
                        <div className="text-pixel-text text-center">
                          {matchStatistics.breakPointOpportunities.opponent > 0
                            ? Math.round((matchStatistics.breakPointsConverted.opponent / matchStatistics.breakPointOpportunities.opponent) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rally Statistics */}
                  <div className="border-t-2 border-pixel-border pt-4">
                    <h4 className="text-md font-bold text-pixel-text mb-3">📊 Rally Stats</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-pixel-text-muted">Average Rally:</span>
                        <span className="text-pixel-text font-bold">
                          {matchStatistics.averageRallyLength.toFixed(1)} shots
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pixel-text-muted">Longest Rally:</span>
                        <span className="text-pixel-text font-bold">
                          {matchStatistics.longestRally} shots
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pixel-text-muted">Net Points Won:</span>
                        <span className="text-pixel-text font-bold">
                          {matchStatistics.netPointsWon.player}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pixel-text-muted">Opp. Net Points:</span>
                        <span className="text-pixel-text font-bold">
                          {matchStatistics.netPointsWon.opponent}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Shot Type Breakdown */}
              {matchStatistics && Object.keys(matchStatistics.shotTypeStats).length > 0 && (
                <div className="border-t-2 border-pixel-border pt-4">
                  <h4 className="text-md font-bold text-pixel-text mb-3">🏸 Shot Breakdown</h4>
                  <div className="space-y-2">
                    <div className="grid gap-2 text-xs text-pixel-text-muted font-bold mb-1" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                      <div>Shot Type</div>
                      <div className="text-center">Used</div>
                      <div className="text-center">Success %</div>
                      <div className="text-center">Winners</div>
                    </div>
                    {Object.entries(matchStatistics.shotTypeStats)
                      .filter(([_, stats]) => stats && stats.attempts.player > 0)
                      .sort(([, a], [, b]) => (b?.attempts.player ?? 0) - (a?.attempts.player ?? 0))
                      .slice(0, 10)
                      .map(([shotType, stats]) => {
                        if (!stats) return null;
                        const attempts = stats.attempts.player;
                        const successRate = attempts > 0 ? Math.round((stats.successful.player / attempts) * 100) : 0;
                        const displayName = shotType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <div key={shotType} className="grid gap-2 text-sm items-center" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                            <div className="text-pixel-text text-xs truncate">{displayName}</div>
                            <div className="text-pixel-text text-center">{attempts}</div>
                            <div className="text-center">
                              <span className={`font-bold ${successRate >= 70 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {successRate}%
                              </span>
                            </div>
                            <div className="text-pixel-text text-center">{stats.winners.player}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Stat Utilization - which stats are being used and how often */}
              {matchStatistics && Object.keys(matchStatistics.shotTypeStats).length > 0 && (() => {
                // Map shot types to their primary stat (same mapping as PlayerProfile.getStatForShot)
                const shotToStat: Record<string, string> = {};
                const assignStat = (prefix: string, stat: string) => {
                  Object.keys(matchStatistics.shotTypeStats).forEach(shotType => {
                    if (shotType.includes(prefix) && !shotToStat[shotType]) {
                      shotToStat[shotType] = stat;
                    }
                  });
                };
                // Order matters: more specific prefixes first
                assignStat('serve', 'serve');
                assignStat('return', 'return');
                assignStat('volley', 'volley');
                assignStat('half_volley', 'volley');
                assignStat('overhead', 'overhead');
                assignStat('drop_shot', 'dropShot');
                assignStat('short_angle', 'dropShot');
                assignStat('slice', 'slice');
                assignStat('defensive_slice', 'slice');
                assignStat('angle_shot', 'placement');
                assignStat('down_the_line', 'placement');
                assignStat('cross_court', 'placement');
                assignStat('lob', 'placement');
                assignStat('passing_shot', 'placement');
                assignStat('topspin_forehand', 'forehand');
                assignStat('topspin_backhand', 'backhand');
                assignStat('forehand', 'forehand');
                assignStat('backhand', 'backhand');

                // Aggregate by stat
                const statAgg: Record<string, { attempts: number; successful: number; winners: number; errors: number }> = {};
                let totalAttempts = 0;

                Object.entries(matchStatistics.shotTypeStats).forEach(([shotType, stats]) => {
                  if (!stats) return;
                  const stat = shotToStat[shotType] || 'other';
                  if (!statAgg[stat]) {
                    statAgg[stat] = { attempts: 0, successful: 0, winners: 0, errors: 0 };
                  }
                  statAgg[stat].attempts += stats.attempts.player;
                  statAgg[stat].successful += stats.successful.player;
                  statAgg[stat].winners += stats.winners.player;
                  statAgg[stat].errors += stats.errors.player;
                  totalAttempts += stats.attempts.player;
                });

                const statEntries = Object.entries(statAgg)
                  .filter(([_, data]) => data.attempts > 0)
                  .sort(([, a], [, b]) => b.attempts - a.attempts);

                if (statEntries.length === 0) return null;

                const displayNames: Record<string, string> = {
                  serve: 'Serve', forehand: 'Forehand', backhand: 'Backhand',
                  volley: 'Volley', overhead: 'Overhead', dropShot: 'Drop Shot',
                  slice: 'Slice', return: 'Return', placement: 'Placement', other: 'Other',
                };

                return (
                  <div className="border-t-2 border-pixel-border pt-4">
                    <h4 className="text-md font-bold text-pixel-text mb-3">📊 Stat Utilization</h4>
                    <p className="text-xs text-pixel-text-muted mb-3">How often each stat was used as the primary stat for shots</p>
                    <div className="space-y-2">
                      <div className="grid gap-2 text-xs text-pixel-text-muted font-bold mb-1" style={{ gridTemplateColumns: '10rem 1fr 3.5rem 3.5rem 3.5rem' }}>
                        <div>Stat</div>
                        <div>Usage</div>
                        <div className="text-center">Count</div>
                        <div className="text-center">Succ%</div>
                        <div className="text-center">W</div>
                      </div>
                      {statEntries.map(([stat, data]) => {
                        const pct = totalAttempts > 0 ? (data.attempts / totalAttempts) * 100 : 0;
                        const successRate = data.attempts > 0 ? Math.round((data.successful / data.attempts) * 100) : 0;
                        return (
                          <div key={stat} className="grid items-center gap-2" style={{ gridTemplateColumns: '10rem 1fr 3.5rem 3.5rem 3.5rem' }}>
                            <div className="text-sm font-bold text-pixel-text truncate">{displayNames[stat] || stat}</div>
                            <div className="bg-pixel-bg border border-pixel-border h-3 overflow-hidden">
                              <div
                                className="h-full bg-pixel-accent bg-opacity-60"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <div className="text-xs text-pixel-text text-center">{data.attempts}</div>
                            <div className="text-center">
                              <span className={`text-xs font-bold ${successRate >= 70 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {successRate}%
                              </span>
                            </div>
                            <div className="text-xs text-pixel-text text-center">{data.winners}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Key Moments Performance (if available) */}
              {keyMomentHistory && keyMomentHistory.length > 0 && (
                <div className="border-t-2 border-pixel-border pt-4">
                  <h4 className="text-md font-bold text-pixel-text mb-3">🔥 Key Moments</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-500 bg-opacity-10 border-2 border-green-500 p-3 text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {keyMomentHistory.filter(km => km.result.pointWinner === 'player').length}
                      </div>
                      <div className="text-xs text-pixel-text-muted mt-1">
                        Key Moments Won
                      </div>
                    </div>
                    <div className="bg-red-500 bg-opacity-10 border-2 border-red-500 p-3 text-center">
                      <div className="text-2xl font-bold text-red-500">
                        {keyMomentHistory.filter(km => km.result.pointWinner === 'opponent').length}
                      </div>
                      <div className="text-xs text-pixel-text-muted mt-1">
                        Key Moments Lost
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <Button variant="primary" fullWidth size="lg" onClick={handleClose}>
            {isWinner ? 'Continue Training 💪' : 'Train Harder 🔥'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
