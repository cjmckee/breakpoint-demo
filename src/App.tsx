import { useEffect } from 'react';
import './App.css';
import { useGameStore } from './stores/gameStore';
import { useMatchStore } from './stores/matchStore';
import { useAudioTransitions } from './audio/AudioTransitionManager';
import { PlayerCreation } from './components/PlayerCreation';
import { MainMenu } from './components/MainMenu';
import { TrainingSelection } from './components/TrainingSelection';
import { MatchSetup } from './components/MatchSetup';
import { LiveMatchViewer } from './components/LiveMatchViewer';
import { Inventory } from './components/Inventory';
import { Relationships } from './components/Relationships';
import { Shop } from './components/Shop';
import { TournamentList } from './components/TournamentList';
import { TournamentMatch } from './components/TournamentMatch';
import { StoryMatch } from './components/StoryMatch';
import { PracticeMatch } from './components/PracticeMatch';
import { KeyMomentModal } from './components/KeyMomentModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import { StoryEventModal } from './components/StoryEventModal';
import { StoryEventResultModal } from './components/StoryEventResultModal';
import { MenuModal } from './components/MenuModal';
import { FloatingMenuButtonWithPointerEvents } from './components/FloatingMenuButton';
import { useMenuKeyboardHandler } from './hooks/useMenuModal';
import { useGameKeyboardHandler } from './hooks/useGameKeyboardHandler';

function App() {
  const { isInitialized, gamePhase, initializeGame } = useGameStore();
  const currentKeyMoment = useMatchStore((state) => state.currentKeyMoment);
  const isWaitingForChoice = useMatchStore((state) => state.isWaitingForChoice);
  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);

  useAudioTransitions();
  useMenuKeyboardHandler();
  useGameKeyboardHandler();

  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
    }
  }, [isInitialized, initializeGame]);

  const renderScreen = () => {
    switch (gamePhase.type) {
      case 'uninitialized':
        return (
          <div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎾</div>
              <p className="text-xl font-bold">Loading Breakpoint...</p>
            </div>
          </div>
        );

      case 'welcome':
        return (
          <div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center p-4">
            <div className="text-center max-w-2xl">
              <h1 className="text-5xl font-bold text-pixel-accent mb-4">
                🎾 Breakpoint
              </h1>
              <p className="text-xl text-pixel-text-muted mb-8">
                Rise from the lowest ranks to become a tennis legend!
              </p>
              <div className="p-6 bg-pixel-card border-4 border-pixel-border">
                <p className="text-pixel-text mb-4">
                  Train, compete, and master your skills on the court.
                </p>
                <p className="text-sm text-pixel-text-muted">
                  Click below to begin your journey...
                </p>
              </div>
            </div>
          </div>
        );

      case 'player_creation':
        return <PlayerCreation />;

      case 'idle':
        return <MainMenu overlay={gamePhase.overlay} />;

      case 'training':
        return <TrainingSelection />;

      case 'match_setup':
        if (gamePhase.matchType === 'tournament') {
          return <TournamentMatch matchConfig={gamePhase.matchConfig} />;
        } else if (gamePhase.matchType === 'story') {
          return <StoryMatch matchConfig={gamePhase.matchConfig} />;
        } else if (gamePhase.matchConfig) {
          return <PracticeMatch matchConfig={gamePhase.matchConfig} />;
        } else {
          return <MatchSetup />;
        }

      case 'match_active':
        return (
          <>
            <LiveMatchViewer />
            <KeyMomentModal
              isOpen={isWaitingForChoice || showKeyMomentResult}
              keyMoment={currentKeyMoment}
            />
          </>
        );

      case 'match_results':
        return (
          <MatchSummaryModal
            isOpen={true}
            onClose={() => useGameStore.getState().dismissMatchResults()}
            finalScore={gamePhase.finalScore}
            matchRewards={gamePhase.rewards}
            matchStatistics={gamePhase.matchStatistics}
            keyMomentHistory={gamePhase.keyMomentHistory}
            matchConfig={gamePhase.matchConfig}
            accumulatedEffects={gamePhase.accumulatedEffects}
          />
        );

      case 'tournament_list':
        return <TournamentList />;

      case 'inventory':
        return <Inventory />;

      case 'relationships':
        return <Relationships />;

      case 'shop':
        return <Shop />;

      case 'story_event':
        return (
          <StoryEventModal
            isOpen={true}
            onClose={() => useGameStore.getState().cancelStoryEvent()}
            event={gamePhase.event}
            availableOptions={gamePhase.availableOptions}
            onSelectOption={(eventId, optionId) => useGameStore.getState().executeStoryEvent(eventId, optionId)}
          />
        );

      case 'story_event_result':
        return (
          <StoryEventResultModal
            isOpen={true}
            onClose={() => useGameStore.getState().dismissStoryEventResult()}
            result={gamePhase.result}
          />
        );

      default:
        return <MainMenu overlay={null} />;
    }
  };

  const showFloatingUI = isInitialized && gamePhase.type !== 'uninitialized' && gamePhase.type !== 'welcome';

  return (
    <>
      {renderScreen()}
      {showFloatingUI && <FloatingMenuButtonWithPointerEvents />}
      <MenuModal />
    </>
  );
}

export default App;
