/**
 * Match Summary Modal
 * Displays match results after completion
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { MatchScore } from '../types/keyMoments';
import { useMatchStore } from '../stores/matchStore';
import { useGameStore } from '../stores/gameStore';

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
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const keyMomentHistory = useMatchStore((state) => state.keyMomentHistory);
  const matchStatistics = useMatchStore((state) => state.matchStatistics);

  const [showDetailedStats, setShowDetailedStats] = useState(false);

  if (!finalScore) return null;

  const isWinner = finalScore.winner === 'player';

  const handleClose = () => {
    // Add match result to activity history
    const formatScore = (score: MatchScore): string => {
      return score.sets.map(s => `${s.player}-${s.opponent}`).join(', ');
    };

    console.log('MatchSummaryModal handleClose called');
    console.log('Match config:', matchConfig);
    console.log('Final score:', finalScore);

    addMatchResult(
      isWinner ? 'win' : 'loss',
      'Opponent', // TODO: Get actual opponent name from config
      formatScore(finalScore),
      matchConfig?.surface || 'hard'
    );

    console.log('addMatchResult called');

    onClose();
    setScreen('main-menu');
  };

  const formatSetScore = (set: { player: number; opponent: number }): string => {
    return `${set.player}-${set.opponent}`;
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

        {/* Match Stats Summary */}
        <div className="bg-pixel-card border-2 border-pixel-border p-4">
          <h3 className="text-lg font-bold text-pixel-text mb-3 text-center">
            📈 Match Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-500 bg-opacity-20 border-2 border-blue-500 p-3">
              <div className="text-xs text-pixel-text-muted mb-1">Experience</div>
              <div className="text-2xl font-bold text-blue-500">
                +{isWinner ? 50 : 25}
              </div>
            </div>
            <div className="bg-green-500 bg-opacity-20 border-2 border-green-500 p-3">
              <div className="text-xs text-pixel-text-muted mb-1">Match Experience</div>
              <div className="text-2xl font-bold text-green-500">
                +{isWinner ? 3 : 1}
              </div>
            </div>
          </div>
        </div>

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
