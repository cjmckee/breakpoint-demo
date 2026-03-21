import { useEffect, useRef } from 'react';
import './App.css';
import { useGameStore } from './stores/gameStore';
import { useMatchStore } from './stores/matchStore';
import { audioManager } from './audio/AudioManager';
import type { MusicTrack, SfxKey } from './audio/sounds';
import { PlayerCreation } from './components/PlayerCreation';
import { MainMenu } from './components/MainMenu';
import { TrainingSelection } from './components/TrainingSelection';
import { MatchSetup } from './components/MatchSetup';
import { LiveMatchViewer } from './components/LiveMatchViewer';
import { Inventory } from './components/Inventory';
import { TournamentList } from './components/TournamentList';
import { TournamentMatch } from './components/TournamentMatch';
import { StoryMatch } from './components/StoryMatch';
import { KeyMomentModal } from './components/KeyMomentModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import { StoryEventModal } from './components/StoryEventModal';
import { StoryEventResultModal } from './components/StoryEventResultModal';

function App() {
  const { isInitialized, gamePhase, initializeGame } = useGameStore();
  const audioSettings = useGameStore((state) => state.audioSettings);
  const currentKeyMoment = useMatchStore((state) => state.currentKeyMoment);
  const isWaitingForChoice = useMatchStore((state) => state.isWaitingForChoice);
  const showKeyMomentResult = useMatchStore((state) => state.showKeyMomentResult);
  const audioInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
    }
  }, [isInitialized, initializeGame]);

  // Sync audio settings from store to AudioManager on startup and on change
  useEffect(() => {
    audioManager.setMusicVolume(audioSettings.musicVolume);
    audioManager.setSfxVolume(audioSettings.sfxVolume);
    audioManager.setMuteMusic(audioSettings.muteMusic);
    audioManager.setMuteSfx(audioSettings.muteSfx);
  }, [audioSettings]);

  // Metagame SFX — story events, overlays
  useEffect(() => {
    if (gamePhase.type === 'idle' && gamePhase.overlay?.type === 'story_event') {
      audioManager.playSfx('story_chime');
    }
    if (gamePhase.type === 'idle' && gamePhase.overlay?.type === 'training_result') {
      audioManager.playSfx('training_done');
    }
  }, [gamePhase]);

  // Match result SFX (fires once when transitioning to match_results)
  useEffect(() => {
    if (gamePhase.type === 'match_results') {
      const winner = gamePhase.finalScore.winner;
      const sfx: SfxKey = winner === 'player' ? 'match_win' : 'match_lose';
      // Short delay so it plays over the music transition
      setTimeout(() => audioManager.playSfx(sfx), 400);
      if (winner === 'player') {
        setTimeout(() => audioManager.playSfx('crowd_cheer'), 800);
      }
    }
  }, [gamePhase.type]);

  // Music transitions based on game phase
  useEffect(() => {
    // Start music on first user interaction to satisfy browser autoplay policy
    const startAudioOnInteraction = () => {
      if (!audioInitialized.current) {
        audioInitialized.current = true;
        transitionMusic();
      }
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
    };

    const transitionMusic = () => {
      let track: MusicTrack | null = null;

      // Check for story overlays on the idle screen
      const hasStoryOverlay =
        gamePhase.type === 'idle' &&
        gamePhase.overlay != null &&
        (gamePhase.overlay.type === 'story_event' || gamePhase.overlay.type === 'story_event_result');

      if (hasStoryOverlay || gamePhase.type === 'story_event' || gamePhase.type === 'story_event_result') {
        track = 'story_ambient';
      } else {
        switch (gamePhase.type) {
          case 'welcome':
          case 'player_creation':
          case 'idle':
          case 'tournament_list':
          case 'inventory':
          case 'training':
            track = 'menu_theme';
            break;
          case 'match_setup':
          case 'match_active':
          case 'match_results':
            track = 'match_tension';
            break;
          default:
            track = null;
        }
      }

      if (track) {
        audioManager.playMusic(track);
      }
    };

    if (audioInitialized.current) {
      transitionMusic();
    } else {
      document.addEventListener('click', startAudioOnInteraction);
      document.addEventListener('keydown', startAudioOnInteraction);
    }

    return () => {
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
    };
  }, [gamePhase.type, gamePhase.type === 'idle' ? gamePhase.overlay?.type : undefined]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎾</div>
          <p className="text-xl font-bold">Loading Tennis RPG...</p>
        </div>
      </div>
    );
  }

  switch (gamePhase.type) {
    case 'uninitialized':
      return (
        <div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎾</div>
            <p className="text-xl font-bold">Loading Tennis RPG...</p>
          </div>
        </div>
      );

    case 'welcome':
      return (
        <div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center p-4">
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl font-bold text-pixel-accent mb-4">
              🎾 Tennis RPG
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
      // Route to the appropriate setup screen based on matchType
      if (gamePhase.matchType === 'tournament') {
        return <TournamentMatch matchConfig={gamePhase.matchConfig} />;
      } else if (gamePhase.matchType === 'story') {
        return <StoryMatch matchConfig={gamePhase.matchConfig} />;
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
}

export default App;
