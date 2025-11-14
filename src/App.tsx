import React, { useEffect } from 'react';
import './App.css';
import { useGameStore } from './stores/gameStore';
import { PlayerCreation } from './components/PlayerCreation';
import { MainMenu } from './components/MainMenu';
import { TrainingSelection } from './components/TrainingSelection';

function App() {
  const { isInitialized, currentScreen, initializeGame } = useGameStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
    }
  }, [isInitialized, initializeGame]);

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

  // Render current screen
  switch (currentScreen) {
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

    case 'player-creation':
      return <PlayerCreation />;

    case 'main-menu':
      return <MainMenu />;

    case 'training':
      return <TrainingSelection />;

    case 'match':
      return (
        <div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎾</div>
            <p className="text-xl font-bold">Match Mode Coming Soon!</p>
            <p className="text-pixel-text-muted mt-2">
              Interactive matches with key moments will be available in Phase 5
            </p>
          </div>
        </div>
      );

    case 'rest':
      return <MainMenu />;

    default:
      return <MainMenu />;
  }
}

export default App;
