/**
 * Live Match Viewer Component
 * Displays real-time match simulation with scores, stats, and key moments
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useMatchStore } from '../stores/matchStore';
import { Card } from './ui/Card';
import { CourtVisualization } from './CourtVisualization';
import { audioManager } from '../audio/AudioManager';
import type { SfxKey } from '../audio/sounds';
import { useTutorialSpotlight, TutorialStep } from '../hooks/useTutorialSpotlight';
import { TutorialCallout } from './tutorial/TutorialCallout';
import { TUTORIAL_MOCK_SCORE, TUTORIAL_MOCK_STATS, TUTORIAL_MOCK_LOG } from '../data/tutorialMockData';

type LiveMatchTarget = 'court' | 'log' | 'your-stats';

// Court is shown LAST so the player is looking at it when they click "Let's Play!"
const TUTORIAL_STEPS: TutorialStep<LiveMatchTarget>[] = [
  {
    target: 'log',
    title: 'Match Log',
    body: 'Every point is narrated here in real time — aces, winners, errors, and rallies. Scroll up to review earlier points.',
  },
  {
    target: 'your-stats',
    title: 'Your Stats',
    body: 'Aces, winners, double faults, and errors update as the match progresses. Keep an eye on these to gauge how you are playing.',
  },
  {
    target: 'court',
    title: 'The Court',
    body: 'The court shows the live score, who is serving, the momentum bar (green = your favor, red = theirs), and your stamina. The match is about to begin — good luck!',
  },
];

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

  const { currentStep, activeStep, isSpotlit, next: handleTutorialNext } = useTutorialSpotlight(
    TUTORIAL_STEPS,
    isTutorialPaused,
    resumeFromTutorial,
  );

  // Lifts a spotlit section above the dark overlay; keeps others at z-0
  const spotlightClass = (target: LiveMatchTarget) =>
    isSpotlit(target)
      ? 'relative z-[60] ring-4 ring-yellow-400 ring-offset-2 ring-offset-black rounded transition-all duration-300'
      : 'relative z-0 transition-all duration-300';

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

        {/* Two-column layout: Court + Log | Abilities + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left column: 2/3 width */}
          <div className="md:col-span-2 space-y-4">
            {/* Court Visualization */}
            <div className={spotlightClass('court')}>
              {matchConfig && (
                <CourtVisualization
                  courtSurface={matchConfig.surface}
                  score={currentScore ?? TUTORIAL_MOCK_SCORE}
                  server={(currentScore ?? TUTORIAL_MOCK_SCORE).server}
                  momentum={(currentScore ?? TUTORIAL_MOCK_SCORE).momentum ?? 0}
                  stamina={(currentScore ?? TUTORIAL_MOCK_SCORE).energy ?? matchConfig.energy}
                  maxStamina={100}
                  playerName={matchConfig.playerName || 'You'}
                  opponentName={matchConfig.opponentName || 'Opponent'}
                />
              )}
            </div>

            {/* Match Log */}
            <div className={spotlightClass('log')}>
              <Card title="Match Progress">
                <div ref={logContainerRef} className="bg-pixel-bg border-2 border-pixel-border p-4 h-64 overflow-y-auto">
                  {visibleLog.length === 0 ? (
                    <p className="text-pixel-text-muted text-center py-8">
                      Match starting... Key moments will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {visibleLog.slice(-50).map((log, index) => (
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
            </div>
          </div>

          {/* Right column: 1/3 width */}
          <div className="space-y-4">
            {/* Player Stats */}
            <div className={spotlightClass('your-stats')}>
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
            </div>

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
        </div>

      </div>
    </div>
  );
};
