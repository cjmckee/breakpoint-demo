/**
 * Menu Modal
 * Tabbed modal for settings, encyclopedia, and feedback
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../stores/gameStore';
import { useMenuModal } from '../hooks/useMenuModal';
import { useNowPlaying } from '../hooks/useNowPlaying';
import { audioManager } from '../audio/AudioManager';
import { MUSIC_ARTISTS, MUSIC_TRACK_LABELS, getAllMusicEntries } from '../audio/sounds';
import { Button } from './ui/Button';
import { UnseenBadge } from './ui/UnseenBadge';
import { Encyclopedia } from './Encyclopedia';
import { TutorialGuideModal } from './tutorial/TutorialGuideModal';

const GISCUS_CONFIG = {
  repo: 'cjmckee/breakpoint-demo',
  repoId: 'R_kgDOQQI31w',
  category: 'General',
  categoryId: 'DIC_kwDOQQI3184C6sQg',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  theme: 'dark_dimmed',
  lang: 'en',
} as const;

function AudioCredits() {
  const [expanded, setExpanded] = useState(false);
  const tracks = useMemo(() => getAllMusicEntries(), []);

  return (
    <div className="border-t border-pixel-border pt-4 mb-6">
      <h3 className="text-sm font-bold text-pixel-text-muted mb-2 uppercase tracking-wider">
        Audio Credits
      </h3>
      <div className="text-xs text-pixel-text-muted space-y-1">
        <p>
          <span className="text-pixel-text">Music</span> mostly by Tim Kulig (
          <a
            href="https://timkulig.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pixel-accent hover:underline"
          >
            timkulig.com
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
          , plus additional tracks — see full attribution below
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

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-pixel-accent hover:underline cursor-pointer flex items-center gap-1"
      >
        <span className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        Full music attribution
      </button>

      {expanded && (
        <div className="mt-2 text-xs text-pixel-text-muted bg-pixel-bg-dark bg-opacity-75 rounded p-3 space-y-2 max-h-48 overflow-y-auto">
          {tracks.map((track) => {
            const credit = MUSIC_ARTISTS[track.artist];
            return (
              <div key={track.path}>
                <span className="text-pixel-text">"{track.title}"</span> —{' '}
                {credit.url ? (
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pixel-accent hover:underline"
                  >
                    {track.artist}
                  </a>
                ) : (
                  track.artist
                )}
                {credit.licenseLabel && (
                  <>
                    {' · '}
                    {credit.licenseUrl ? (
                      <a
                        href={credit.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pixel-accent hover:underline"
                      >
                        {credit.licenseLabel}
                      </a>
                    ) : (
                      credit.licenseLabel
                    )}
                  </>
                )}
                {credit.imdbUrl && (
                  <>
                    {' · '}
                    <a
                      href={credit.imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pixel-accent hover:underline"
                    >
                      IMDB
                    </a>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NowPlayingPanel() {
  const nowPlaying = useNowPlaying();
  const muteMusic = useGameStore((state) => state.audioSettings.muteMusic);

  const cycle = (delta: number) => {
    audioManager.playSfx('ui_click');
    audioManager.cycleMusic(delta);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-pixel-text-muted uppercase tracking-wider">
          Now Playing
        </h3>
        {nowPlaying && (
          <span className="text-xs px-2 py-0.5 border border-pixel-border text-pixel-text-muted">
            {MUSIC_TRACK_LABELS[nowPlaying.track]}
          </span>
        )}
      </div>

      <div className="bg-pixel-bg-dark bg-opacity-75 border-2 border-pixel-border p-3 flex items-center gap-3">
        <div
          className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-pixel-border text-pixel-accent text-xl"
          aria-hidden="true"
        >
          ♪
        </div>

        {nowPlaying ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-pixel-text font-bold truncate">{nowPlaying.entry.title}</div>
              <div className="text-xs text-pixel-text-muted truncate">{nowPlaying.entry.artist}</div>
              {muteMusic && (
                <div className="text-xs text-pixel-text-muted italic mt-0.5">Music is muted</div>
              )}
            </div>

            {nowPlaying.poolSize > 1 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => cycle(-1)}
                  aria-label="Previous track"
                  className="px-2 py-1 border border-pixel-border text-pixel-text-muted hover:text-pixel-text"
                >
                  ◀
                </button>
                <span className="text-xs text-pixel-text-muted tabular-nums">
                  {nowPlaying.index + 1}/{nowPlaying.poolSize}
                </span>
                <button
                  onClick={() => cycle(1)}
                  aria-label="Next track"
                  className="px-2 py-1 border border-pixel-border text-pixel-text-muted hover:text-pixel-text"
                >
                  ▶
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-pixel-text-muted">Nothing playing yet</div>
        )}
      </div>

      <p className="text-xs text-pixel-text-muted mt-1">
        Pick any song from the current scene's playlist — the next scene change goes back to
        shuffling on its own.
      </p>
    </div>
  );
}

interface SettingsContentProps {
  onOpenTutorialGuide: () => void;
}

function SettingsContent({ onOpenTutorialGuide }: SettingsContentProps) {
  const audioSettings = useGameStore((state) => state.audioSettings);
  const updateAudioSettings = useGameStore((state) => state.updateAudioSettings);
  const clearAllData = useGameStore((state) => state.clearAllData);
  const currentDay = useGameStore((state) => state.calendar.currentDay);
  const { closeMenu } = useMenuModal();
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    audioManager.setMusicVolume(audioSettings.musicVolume);
    audioManager.setSfxVolume(audioSettings.sfxVolume);
    audioManager.setMuteMusic(audioSettings.muteMusic);
    audioManager.setMuteSfx(audioSettings.muteSfx);
  }, [audioSettings]);

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
    <div className="space-y-6">
      <NowPlayingPanel />

      <div>
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

      <div>
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

      <AudioCredits />

      {currentDay >= 5 && (
        <div className="border-t border-pixel-border pt-4">
          <h3 className="text-sm font-bold text-pixel-text-muted mb-2 uppercase tracking-wider">
            Tutorial
          </h3>
          <Button variant="secondary" fullWidth onClick={onOpenTutorialGuide}>
            Replay Match Tutorial
          </Button>
        </div>
      )}

      <div className="border-t border-pixel-border pt-4">
        <h3 className="text-sm font-bold text-pixel-text-muted mb-2 uppercase tracking-wider">
          Data
        </h3>
        {!confirmingReset ? (
          <Button
            variant="danger"
            fullWidth
            onClick={() => setConfirmingReset(true)}
          >
            Clear All Progress
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-pixel-text-muted text-center">
              This will permanently delete your save data. Are you sure?
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  clearAllData();
                  setConfirmingReset(false);
                  closeMenu();
                }}
              >
                Yes, Delete Everything
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', GISCUS_CONFIG.repo);
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
    script.setAttribute('data-category', GISCUS_CONFIG.category);
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
    script.setAttribute('data-mapping', GISCUS_CONFIG.mapping);
    script.setAttribute('data-strict', GISCUS_CONFIG.strict);
    script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled);
    script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata);
    script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
    script.setAttribute('data-theme', GISCUS_CONFIG.theme);
    script.setAttribute('data-lang', GISCUS_CONFIG.lang);

    container.appendChild(script);
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-sm text-pixel-text-muted space-y-2">
        <p>
          Have a bug to report, an idea for the game, or just want to say hi?
          Leave a comment below — you'll need a free GitHub account to post.
        </p>
        <p>
          Comments are public and stored in this project's GitHub Discussions.
        </p>
      </div>

      <div
        ref={containerRef}
        className="bg-pixel-card border-2 border-pixel-border p-3 min-h-[200px]"
      />
    </div>
  );
}

export const MenuModal: React.FC = () => {
  const { isOpen, activeTab, setActiveTab, closeMenu, hasAnyNewSection, encyclopediaSections } = useMenuModal();
  const [isTutorialGuideOpen, setIsTutorialGuideOpen] = useState(false);

  const openTutorialGuide = () => {
    closeMenu();
    setIsTutorialGuideOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <SettingsContent onOpenTutorialGuide={openTutorialGuide} />;
      case 'encyclopedia':
        return <Encyclopedia />;
      case 'feedback':
        return <FeedbackContent />;
      default:
        return <SettingsContent onOpenTutorialGuide={openTutorialGuide} />;
    }
  };

  const tabs = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    ...(encyclopediaSections.some(s => s.isRevealed) 
      ? [{ id: 'encyclopedia', label: 'Encyclopedia', icon: '📚', hasNew: hasAnyNewSection } as const]
      : []),
    { id: 'feedback', label: 'Feedback', icon: '💬' },
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90"
      style={{ zIndex: 99998, pointerEvents: 'auto' }}
    >
      <div 
        className="bg-pixel-card border-4 border-pixel-border w-full max-w-2xl mx-4 p-6 max-h-[90vh] flex flex-col"
        style={{ pointerEvents: 'auto' }}
      >
        <h2 className="text-2xl font-bold text-pixel-text mb-4">Menu</h2>

        <div className="flex gap-2 mb-6 border-b border-pixel-border pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-bold transition-colors relative ${
                activeTab === tab.id
                  ? 'bg-pixel-accent text-white'
                  : 'bg-pixel-bg-dark text-pixel-text-muted hover:text-pixel-text'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.hasNew && <UnseenBadge size="sm" className="absolute -top-1 -right-1" />}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderTabContent()}
        </div>

        <Button variant="primary" fullWidth onClick={closeMenu} className="mt-4 shrink-0">
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && createPortal(modalContent, document.body)}
      <TutorialGuideModal isOpen={isTutorialGuideOpen} onClose={() => setIsTutorialGuideOpen(false)} />
    </>
  );
};
