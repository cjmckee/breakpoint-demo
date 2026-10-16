/**
 * The end of the written story. Shown in place of the menu once the closing event
 * has played and the player's new season isn't written yet, so a promoted player
 * isn't left training on an empty calendar. The way on is a new career.
 */

import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePlayerAppearance } from '../hooks/usePlayerAppearance';
import { ScreenFrame } from './ui/ScreenFrame';
import { Button } from './ui/Button';
import { PixelSprite } from './sprites/PixelSprite';

export function ContentEnd(): React.JSX.Element {
  const playerName = useGameStore((state) => state.player?.name ?? '');
  const clearAllData = useGameStore((state) => state.clearAllData);
  const appearance = usePlayerAppearance();
  const [confirming, setConfirming] = useState(false);

  return (
    <ScreenFrame title="Thanks for playing!">
      <div
        className="bg-pixel-card border-4 border-pixel-border p-6 flex flex-col items-center gap-6 text-center"
        data-testid="content-end"
      >
        <PixelSprite appearance={appearance} pose="cheer" scale={6} />
        <p className="text-pixel-text">
          {playerName}'s story continues in the Regional season, coming soon.
        </p>
        {!confirming ? (
          <Button testId="content-end-new-career" onClick={() => setConfirming(true)}>
            Start a new career
          </Button>
        ) : (
          <div className="w-full max-w-md flex flex-col gap-2">
            <Button testId="content-end-confirm" variant="danger" fullWidth onClick={clearAllData}>
              Yes, delete this save
            </Button>
            <Button
              testId="content-end-cancel"
              variant="secondary"
              fullWidth
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
