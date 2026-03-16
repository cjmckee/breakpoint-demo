/**
 * Live Match Viewer Component
 * Displays real-time match simulation with scores, stats, and key moments
 */

import React, { useEffect, useState } from 'react';
import { useMatchStore } from '../stores/matchStore';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { KeyMomentResultToast } from './KeyMomentResultToast';
import { CourtVisualization } from './CourtVisualization';
import { AbilityDisplay } from './AbilityDisplay';

interface MatchStats {
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  firstServePercentage: number;
  pointsWon: number;
}

export const LiveMatchViewer: React.FC = () => {
  const isMatchActive = useMatchStore((state) => state.isMatchActive);
  const currentKeyMoment = useMatchStore((state) => state.currentKeyMoment);
  const isWaitingForChoice = useMatchStore((state) => state.isWaitingForChoice);
  const currentScore = useMatchStore((state) => state.currentScore);
  const matchHistory = useMatchStore((state) => state.matchHistory);
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const matchStatistics = useMatchStore((state) => state.matchStatistics);
  const endMatch = useMatchStore((state) => state.endMatch);
  const setScreen = useGameStore((state) => state.setScreen);
  const player = useGameStore((state) => state.player);

  // Default score if not available
  const score = currentScore || {
    sets: [],
    currentSet: { player: 0, opponent: 0 },
    currentGame: { player: 0, opponent: 0 },
    server: 'player' as const,
    isComplete: false,
  };

  const [matchLog, setMatchLog] = useState<string[]>([]);

  // Derive stats from matchStatistics store
  const playerStats: MatchStats = {
    aces: matchStatistics?.aces.player ?? 0,
    doubleFaults: matchStatistics?.doubleFaults.player ?? 0,
    winners: matchStatistics?.winners.player ?? 0,
    unforcedErrors: matchStatistics?.unforcedErrors.player ?? 0,
    firstServePercentage: Math.round(matchStatistics?.firstServePercentage.player ?? 0),
    pointsWon: matchStatistics?.totalPoints.player ?? 0,
  };

  const opponentStats: MatchStats = {
    aces: matchStatistics?.aces.opponent ?? 0,
    doubleFaults: matchStatistics?.doubleFaults.opponent ?? 0,
    winners: matchStatistics?.winners.opponent ?? 0,
    unforcedErrors: matchStatistics?.unforcedErrors.opponent ?? 0,
    firstServePercentage: Math.round(matchStatistics?.firstServePercentage.opponent ?? 0),
    pointsWon: matchStatistics?.totalPoints.opponent ?? 0,
  };

  useEffect(() => {
    if (!isMatchActive) {
      // Match ended, return to main menu
      // This will be triggered by matchStore when match completes
      setScreen('main-menu');
    }
  }, [isMatchActive, setScreen]);

  const formatPoints = (points: number): string => {
    if (points === 0) return '0';
    if (points === 1) return '15';
    if (points === 2) return '30';
    if (points === 3) return '40';
    return 'AD';
  };

  const getServerIndicator = (side: 'player' | 'opponent'): string => {
    return score.server === side ? '🎾' : '';
  };

  // Calculate total sets won
  const setsWon = {
    player: score.sets.filter(s => s.player > s.opponent).length,
    opponent: score.sets.filter(s => s.opponent > s.player).length,
  };

  const handleQuitMatch = () => {
    if (window.confirm('Are you sure you want to quit this match? Progress will not be saved.')) {
      endMatch(); // Cancel the ongoing match simulation
      setScreen('main-menu');
    }
  };

  if (!isMatchActive) {
    return (
      <div className="min-h-screen bg-pixel-bg p-4 flex items-center justify-center">
        <Card title="No Active Match">
          <p className="text-pixel-text-muted mb-4">
            There is no active match. Return to the main menu to start a new match.
          </p>
          <Button variant="primary" fullWidth onClick={() => setScreen('main-menu')}>
            Return to Main Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <KeyMomentResultToast />
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pixel-text">🎾 Live Match</h1>
          <Button variant="secondary" onClick={handleQuitMatch}>
            Quit Match
          </Button>
        </div>

        {/* Score Display */}
        <Card title="Match Score" className="bg-gradient-to-b from-pixel-card to-pixel-bg">
          <div className="space-y-4">
            {/* Player Score */}
            <div className="flex items-center justify-between p-4 bg-pixel-bg border-4 border-pixel-accent">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{getServerIndicator('player')}</span>
                <span className="text-xl font-bold text-pixel-text">You</span>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Sets</div>
                  <div className="text-3xl font-bold text-green-500">{setsWon.player}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Games</div>
                  <div className="text-3xl font-bold text-pixel-text">{score.currentSet.player}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Points</div>
                  <div className="text-3xl font-bold text-pixel-accent">
                    {formatPoints(score.currentGame.player)}
                  </div>
                </div>
              </div>
            </div>

            {/* Opponent Score */}
            <div className="flex items-center justify-between p-4 bg-pixel-bg border-4 border-red-500">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{getServerIndicator('opponent')}</span>
                <span className="text-xl font-bold text-pixel-text">Opponent</span>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Sets</div>
                  <div className="text-3xl font-bold text-red-500">{setsWon.opponent}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Games</div>
                  <div className="text-3xl font-bold text-pixel-text">{score.currentSet.opponent}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pixel-text-muted mb-1">Points</div>
                  <div className="text-3xl font-bold text-red-500">
                    {formatPoints(score.currentGame.opponent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Court Visualization */}
        {matchConfig && currentScore && (
          <CourtVisualization
            courtSurface={matchConfig.surface}
            score={currentScore}
            server={currentScore.server}
            momentum={currentScore.momentum ?? 0}
            stamina={currentScore.energy ?? matchConfig.energy}
            maxStamina={100}
            opponentName={matchConfig.opponentStats?.name || 'Opponent'}
          />
        )}

        {/* Active Abilities */}
        {player?.abilities && player.abilities.length > 0 && (
          <Card title="Active Abilities" className="bg-pixel-accent bg-opacity-10 border-pixel-accent">
            <p className="text-sm text-pixel-text-muted mb-4">
              These abilities are currently boosting your stats during this match.
            </p>
            <AbilityDisplay abilities={player.abilities} />
          </Card>
        )}

        {/* Match Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player Stats */}
          <Card title="Your Stats" className="bg-green-500 bg-opacity-10 border-green-500">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Aces</span>
                <span className="font-bold text-pixel-text">{playerStats.aces}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Double Faults</span>
                <span className="font-bold text-pixel-text">{playerStats.doubleFaults}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Winners</span>
                <span className="font-bold text-pixel-text">{playerStats.winners}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Unforced Errors</span>
                <span className="font-bold text-pixel-text">{playerStats.unforcedErrors}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">1st Serve %</span>
                <span className="font-bold text-pixel-text">{playerStats.firstServePercentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Points Won</span>
                <span className="font-bold text-green-500">{playerStats.pointsWon}</span>
              </div>
            </div>
          </Card>

          {/* Opponent Stats */}
          <Card title="Opponent Stats" className="bg-red-500 bg-opacity-10 border-red-500">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Aces</span>
                <span className="font-bold text-pixel-text">{opponentStats.aces}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Double Faults</span>
                <span className="font-bold text-pixel-text">{opponentStats.doubleFaults}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Winners</span>
                <span className="font-bold text-pixel-text">{opponentStats.winners}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">Unforced Errors</span>
                <span className="font-bold text-pixel-text">{opponentStats.unforcedErrors}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b-2 border-pixel-border">
                <span className="text-pixel-text-muted">1st Serve %</span>
                <span className="font-bold text-pixel-text">{opponentStats.firstServePercentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-pixel-text-muted">Points Won</span>
                <span className="font-bold text-red-500">{opponentStats.pointsWon}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Match Log */}
        <Card title="Match Progress">
          <div className="bg-pixel-bg border-2 border-pixel-border p-4 h-64 overflow-y-auto">
            {matchLog.length === 0 ? (
              <p className="text-pixel-text-muted text-center py-8">
                Match starting... Key moments will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {matchLog.map((log, index) => (
                  <div
                    key={index}
                    className="text-sm text-pixel-text pb-2 border-b border-pixel-border last:border-0"
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Key Moment Indicator */}
        {isWaitingForChoice && currentKeyMoment && (
          <div className="fixed bottom-4 right-4 bg-orange-500 border-4 border-orange-700 p-4 animate-pulse">
            <p className="text-white font-bold text-lg">⚡ KEY MOMENT!</p>
            <p className="text-white text-sm mt-1">Make your tactical decision...</p>
          </div>
        )}
      </div>
    </div>
  );
};
