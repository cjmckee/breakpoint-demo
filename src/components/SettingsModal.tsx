/**
 * Settings Modal
 * Volume controls for music and SFX, plus audio credits.
 */

import React, { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { audioManager } from '../audio/AudioManager';
import { Button } from './ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const audioSettings = useGameStore((state) => state.audioSettings);
  const updateAudioSettings = useGameStore((state) => state.updateAudioSettings);

  // Keep AudioManager in sync whenever settings change
  useEffect(() => {
    audioManager.setMusicVolume(audioSettings.musicVolume);
    audioManager.setSfxVolume(audioSettings.sfxVolume);
    audioManager.setMuteMusic(audioSettings.muteMusic);
    audioManager.setMuteSfx(audioSettings.muteSfx);
  }, [audioSettings]);

  if (!isOpen) return null;

  const handleMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    updateAudioSettings({ musicVolume: v, muteMusic: v === 0 });
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    updateAudioSettings({ sfxVolume: v, muteSfx: v === 0 });
  };

  const toggleMuteMusic = () => {
    updateAudioSettings({ muteMusic: !audioSettings.muteMusic });
  };

  const toggleMuteSfx = () => {
    updateAudioSettings({ muteSfx: !audioSettings.muteSfx });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-pixel-card border-4 border-pixel-border w-full max-w-md mx-4 p-6">
        <h2 className="text-2xl font-bold text-pixel-text mb-6">Settings</h2>

        {/* Music Volume */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-pixel-text font-bold">Music Volume</label>
            <button
              onClick={toggleMuteMusic}
              className="text-sm px-2 py-1 border border-pixel-border text-pixel-text-muted hover:text-pixel-text"
            >
              {audioSettings.muteMusic ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioSettings.muteMusic ? 0 : audioSettings.musicVolume}
            onChange={handleMusicVolume}
            className="w-full accent-pixel-accent"
          />
          <div className="flex justify-between text-xs text-pixel-text-muted mt-1">
            <span>Off</span>
            <span>{Math.round((audioSettings.muteMusic ? 0 : audioSettings.musicVolume) * 100)}%</span>
            <span>Max</span>
          </div>
        </div>

        {/* SFX Volume */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-pixel-text font-bold">Sound Effects</label>
            <button
              onClick={toggleMuteSfx}
              className="text-sm px-2 py-1 border border-pixel-border text-pixel-text-muted hover:text-pixel-text"
            >
              {audioSettings.muteSfx ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioSettings.muteSfx ? 0 : audioSettings.sfxVolume}
            onChange={handleSfxVolume}
            className="w-full accent-pixel-accent"
          />
          <div className="flex justify-between text-xs text-pixel-text-muted mt-1">
            <span>Off</span>
            <span>{Math.round((audioSettings.muteSfx ? 0 : audioSettings.sfxVolume) * 100)}%</span>
            <span>Max</span>
          </div>
        </div>

        {/* Audio Credits */}
        <div className="border-t border-pixel-border pt-4 mb-6">
          <h3 className="text-sm font-bold text-pixel-text-muted mb-2 uppercase tracking-wider">
            Audio Credits
          </h3>
          <div className="text-xs text-pixel-text-muted space-y-1">
            <p>
              <span className="text-pixel-text">Music</span> by Kevin MacLeod (
              <a
                href="https://incompetech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pixel-accent hover:underline"
              >
                incompetech.com
              </a>
              ) — Licensed under{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pixel-accent hover:underline"
              >
                CC BY 4.0
              </a>
            </p>
            <p>
              <span className="text-pixel-text">Sound effects</span> by Kenney (
              <a
                href="https://kenney.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pixel-accent hover:underline"
              >
                kenney.nl
              </a>
              ) — CC0 / Public Domain
            </p>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
