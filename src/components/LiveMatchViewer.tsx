/**
 * Live Match Viewer Component
 * Displays real-time match simulation with scores, stats, and key moments
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { MatchCockpit } from './match/MatchCockpit';
import { MatchStatsCompare } from './match/MatchStatsCompare';
import { MatchToasts } from './match/MatchToasts';
import { audioManager } from '../audio/AudioManager';
import type { SfxKey } from '../audio/sounds';
import { useTutorialSpotlight } from '../hooks/useTutorialSpotlight';
import { TutorialCallout } from './tutorial/TutorialCallout';
import { TUTORIAL_MOCK_SCORE, TUTORIAL_MOCK_STATS, TUTORIAL_MOCK_LOG } from '../data/tutorialMockData';
import { LIVE_MATCH_TUTORIAL_STEPS as TUTORIAL_STEPS, LiveMatchTarget } from '../data/tutorialSteps';

interface MatchStats {
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  firstServePercentage: number;
  pointsWon: number;
}

export const LiveMatchViewer: React.FC = () => {
  const isWaitingForChoice = useMatchStore((state) => state.isWaitingForChoice);
  const currentScore = useMatchStore((state) => state.currentScore);
  const matchConfig = useMatchStore((state) => state.matchConfig);
  const matchStatistics = useMatchStore((state) => state.matchStatistics);
  const isTutorialPaused = useMatchStore((state) => state.isTutorialPaused);
  const resumeFromTutorial = useMatchStore((state) => state.resumeFromTutorial);

  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const lastKeyMomentResult = useMatchStore((state) => state.lastKeyMomentResult);
  const matchHistory = useMatchStore((state) => state.matchHistory);

  const matchLog = useMatchStore((state) => state.matchLog);

  const {
    currentStep,
    activeStep,
    isSpotlit,
    next: handleTutorialNext,
    back: handleTutorialBack,
    canGoBack: canGoBackTutorial,
  } = useTutorialSpotlight(
    TUTORIAL_STEPS,
    isTutorialPaused,
    resumeFromTutorial,
  );

  // Lifts a spotlit section above the dark overlay; keeps others at z-0
  const spotlightClass = (target: LiveMatchTarget) =>
    isSpotlit(target)
      ? 'relative z-[60] ring-4 ring-yellow-400 ring-offset-2 ring-offset-black rounded transition-all duration-300'
      : 'relative z-0 transition-all duration-300';

  // ─── Scroll page to top when match screen mounts ──────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ─── Match log auto-scroll (contained within the log box) ─────────────────
  const logContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [matchLog.length]);

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
        const sfx: SfxKey = Math.random() < 0.5 ? 'hit_ground' : 'hit_ground_alt';
        audioManager.playSfx(sfx);
      } else {
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
      const setWonByPlayer = curr.sets.length > prev.sets.length &&
        (curr.sets[curr.sets.length - 1]?.player ?? 0) > (curr.sets[curr.sets.length - 1]?.opponent ?? 0);
      const setWonByOpp = curr.sets.length > prev.sets.length && !setWonByPlayer;

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
        const lastEntry = matchHistory[matchHistory.length - 1];
        if (lastEntry) {
          audioManager.playSfx(lastEntry.winner === 'player' ? 'point_win' : 'point_lose');
        }
      }
    }

    prevScore.current = curr;
    prevHistoryLen.current = historyLen;
  }, [currentScore, matchHistory]);

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

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);

  // During the tutorial pause use mock data so sections aren't empty
  const statsSource = (isTutorialPaused && !matchStatistics) ? TUTORIAL_MOCK_STATS : matchStatistics;

  const playerStats: MatchStats = {
    aces: statsSource?.aces.player ?? 0,
    doubleFaults: statsSource?.doubleFaults.player ?? 0,
    winners: statsSource?.winners.player ?? 0,
    unforcedErrors: statsSource?.unforcedErrors.player ?? 0,
    firstServePercentage: Math.round(statsSource?.firstServePercentage.player ?? 0),
    pointsWon: statsSource?.totalPoints.player ?? 0,
  };

  const opponentStats: MatchStats = {
    aces: statsSource?.aces.opponent ?? 0,
    doubleFaults: statsSource?.doubleFaults.opponent ?? 0,
    winners: statsSource?.winners.opponent ?? 0,
    unforcedErrors: statsSource?.unforcedErrors.opponent ?? 0,
    firstServePercentage: Math.round(statsSource?.firstServePercentage.opponent ?? 0),
    pointsWon: statsSource?.totalPoints.opponent ?? 0,
  };

  // Show mock log entries when the log is spotlit during the tutorial and the real log is empty
  const visibleLog = (isTutorialPaused && matchLog.length === 0) ? TUTORIAL_MOCK_LOG : matchLog;

  return (
    <div className="min-h-screen bg-pixel-bg p-4">
      {/* ── Tutorial spotlight overlay ─────────────────────────────────────────── */}
      {activeStep !== null && (
        <>
          {/* Dark backdrop — sits above normal content (z-50) but below spotlit sections (z-60) */}
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 pointer-events-none" />

          {/* Callout card — docked at bottom-center, above everything */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] w-full max-w-md px-4 pointer-events-auto">
            <TutorialCallout
              step={currentStep!}
              totalSteps={TUTORIAL_STEPS.length}
              title={activeStep.title}
              body={activeStep.body}
              onNext={handleTutorialNext}
              onBack={handleTutorialBack}
              canGoBack={canGoBackTutorial}
              finalLabel="Let's Play!"
            />
          </div>
        </>
      )}

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-pixel-text">🎾 Live Match</h1>
        </div>

        {/* Tier 1: Cockpit — scoreboard + court + stamina/momentum (full width) */}
        <div className={spotlightClass('court')}>
          {matchConfig && (
            <MatchCockpit
              courtSurface={matchConfig.surface}
              score={currentScore ?? TUTORIAL_MOCK_SCORE}
              playerName={matchConfig.playerName || 'You'}
              opponentName={matchConfig.opponentName || 'Opponent'}
              matchFormat={matchConfig.matchFormat}
              overlay={
                <MatchToasts
                  playerName={matchConfig.playerName || 'You'}
                  opponentName={matchConfig.opponentName || 'Opponent'}
                />
              }
            />
          )}
        </div>

        {/* Tier 3: merged live stats (you | stat | them), flashes on change */}
        <div className={spotlightClass('your-stats')}>
          <MatchStatsCompare
            player={playerStats}
            opponent={opponentStats}
            playerName={matchConfig?.playerName || 'You'}
            opponentName={matchConfig?.opponentName || 'Opponent'}
          />
        </div>

        {/* Commentary — demoted to a compact ticker; the flavour-text narrator still drives it */}
        <div className={spotlightClass('log')}>
          <Card title="Commentary">
            <div ref={logContainerRef} className="bg-pixel-bg border-2 border-pixel-border p-3 h-24 overflow-y-auto">
              {visibleLog.length === 0 ? (
                <p className="text-pixel-text-muted text-center py-6 text-sm">Match starting…</p>
              ) : (
                <div className="space-y-1.5">
                  {visibleLog.slice(-30).map((log, index, arr) => (
                    <div
                      key={index}
                      className={`text-sm ${index === arr.length - 1 ? 'text-pixel-text' : 'text-pixel-text-muted'}`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
