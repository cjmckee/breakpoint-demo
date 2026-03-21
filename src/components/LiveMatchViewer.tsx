/**
 * Live Match Viewer Component
 * Displays real-time match simulation with scores, stats, and key moments
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMatchStore } from '../stores/matchStore';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CourtVisualization } from './CourtVisualization';
import { AbilityDisplay } from './AbilityDisplay';
import { audioManager } from '../audio/AudioManager';
import type { SfxKey } from '../audio/sounds';

interface MatchStats {
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  firstServePercentage: number;
  pointsWon: number;
}

export const LiveMatchViewer: React.FC = () => {
  const currentKeyMoment = useMatchStore((state) => state.currentKeyMoment);
  const isWaitingForChoice = useMatchStore((state) => state.isWaitingForChoice);
  const currentScore = useMatchStore((state) => state.currentScore);
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const matchStatistics = useMatchStore((state) => state.matchStatistics);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const player = useGameStore((state) => state.player);

  // Default score if not available
  const score = currentScore || {
    sets: [],
    currentSet: { player: 0, opponent: 0 },
    currentGame: { player: 0, opponent: 0 },
    server: 'player' as const,
    isComplete: false,
  };

  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const lastKeyMomentResult = useMatchStore((state) => state.lastKeyMomentResult);
  const matchHistory = useMatchStore((state) => state.matchHistory);

  const [matchLog, setMatchLog] = useState<string[]>([]);

  // ─── Audio: track previous stat/score snapshots to detect changes ──────────
  const prevMatchStats = useRef<typeof matchStatistics>(null);
  const prevScore = useRef<typeof currentScore>(null);
  const prevHistoryLen = useRef(0);
  const prevWaitingForChoice = useRef(false);
  const prevShowKeyMomentResult = useRef(false);

  useEffect(() => {
    const prev = prevMatchStats.current;
    const curr = matchStatistics;

    if (prev && curr) {
      const playerAcesDelta   = (curr.aces?.player ?? 0)          - (prev.aces?.player ?? 0);
      const playerFaultsDelta = (curr.doubleFaults?.player ?? 0)   - (prev.doubleFaults?.player ?? 0);
      const playerWinsDelta   = (curr.winners?.player ?? 0)        - (prev.winners?.player ?? 0);
      const oppFaultsDelta    = (curr.doubleFaults?.opponent ?? 0) - (prev.doubleFaults?.opponent ?? 0);
      const oppWinsDelta      = (curr.winners?.opponent ?? 0)      - (prev.winners?.opponent ?? 0);

      if (playerAcesDelta > 0) {
        audioManager.playSfx('ace');
      } else if (playerFaultsDelta > 0 || oppFaultsDelta > 0) {
        audioManager.playSfx('fault');
      } else if (playerWinsDelta > 0) {
        audioManager.playSfx('winner');
      } else if (oppWinsDelta > 0) {
        // Alternate between groundstroke sounds for variety
        const sfx: SfxKey = Math.random() < 0.5 ? 'hit_ground' : 'hit_ground_alt';
        audioManager.playSfx(sfx);
      } else {
        // Regular rally shot
        const sfx: SfxKey = Math.random() < 0.4 ? 'hit_volley' : Math.random() < 0.5 ? 'hit_ground' : 'serve';
        audioManager.playSfx(sfx);
      }
    }

    prevMatchStats.current = curr;
  }, [matchStatistics]);

  useEffect(() => {
    const prev = prevScore.current;
    const curr = currentScore;
    const historyLen = matchHistory.length;
    const pointScored = historyLen > prevHistoryLen.current;

    if (prev && curr && pointScored) {
      // Detect set won (sets array grew)
      const setWonByPlayer = curr.sets.length > prev.sets.length &&
        (curr.sets[curr.sets.length - 1]?.player ?? 0) > (curr.sets[curr.sets.length - 1]?.opponent ?? 0);
      const setWonByOpp = curr.sets.length > prev.sets.length && !setWonByPlayer;

      // Detect game won (set game count grew)
      const gameWonByPlayer = !setWonByPlayer && !setWonByOpp &&
        curr.currentSet.player > prev.currentSet.player;
      const gameWonByOpp = !setWonByPlayer && !setWonByOpp &&
        curr.currentSet.opponent > prev.currentSet.opponent;

      if (setWonByPlayer) {
        audioManager.playSfx('set_win');
        audioManager.playSfx('crowd_cheer');
      } else if (setWonByOpp) {
        audioManager.playSfx('point_lose');
      } else if (gameWonByPlayer) {
        audioManager.playSfx('game_win');
      } else if (gameWonByOpp) {
        audioManager.playSfx('point_lose');
      } else {
        // Plain point — last entry in matchHistory tells us who won
        const lastEntry = matchHistory[matchHistory.length - 1];
        if (lastEntry) {
          audioManager.playSfx(lastEntry.winner === 'player' ? 'point_win' : 'point_lose');
        }
      }
    }

    prevScore.current = curr;
    prevHistoryLen.current = historyLen;
  }, [currentScore, matchHistory]);

  // Key moment SFX
  useEffect(() => {
    if (isWaitingForChoice && !prevWaitingForChoice.current) {
      audioManager.playSfx('key_moment_in');
    }
    prevWaitingForChoice.current = isWaitingForChoice;
  }, [isWaitingForChoice]);

  useEffect(() => {
    if (showKeyMomentResult && !prevShowKeyMomentResult.current && lastKeyMomentResult) {
      const won = lastKeyMomentResult.pointWinner === 'player';
      audioManager.playSfx(won ? 'key_moment_win' : 'key_moment_lose');
      if (won) audioManager.playSfx('crowd_cheer');
    }
    prevShowKeyMomentResult.current = showKeyMomentResult;
  }, [showKeyMomentResult, lastKeyMomentResult]);
  // ───────────────────────────────────────────────────────────────────────────

  // Warn the player if they try to close/refresh mid-match
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);

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

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pixel-text">🎾 Live Match</h1>
        </div>

        {/* Score Display */}
        <Card title="Match Score" className="bg-gradient-to-b from-pixel-card to-pixel-bg">
          <div className="space-y-4">
            {/* Player Score */}
            <div className="flex items-center justify-between p-4 bg-pixel-bg border-4 border-pixel-accent">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{getServerIndicator('player')}</span>
                <span className="text-xl font-bold text-pixel-text">{player?.name ?? 'You'}</span>
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
                <span className="text-xl font-bold text-pixel-text">{matchConfig?.opponentName ?? 'Opponent'}</span>
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
