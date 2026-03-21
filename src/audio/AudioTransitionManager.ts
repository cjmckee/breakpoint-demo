/**
 * AudioTransitionManager
 *
 * Manages music transitions and metagame SFX based on GamePhase changes.
 * Extracted from App.tsx to keep routing/rendering separate from audio concerns.
 *
 * Usage: call `useAudioTransitions()` once at the top-level App component.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { audioManager } from './AudioManager';
import type { MusicTrack, SfxKey } from './sounds';
import type { GamePhase, PhaseContinuation } from '../types/gamePhase';

function getMusicTrackForPhase(gamePhase: GamePhase): MusicTrack | null {
  // Check for story overlays on the idle screen
  const hasStoryOverlay =
    gamePhase.type === 'idle' &&
    gamePhase.overlay != null &&
    (gamePhase.overlay.type === 'story_event' || gamePhase.overlay.type === 'story_event_result');

  if (hasStoryOverlay || gamePhase.type === 'story_event' || gamePhase.type === 'story_event_result') {
    const continuation: PhaseContinuation | null =
      gamePhase.type === 'story_event' ? gamePhase.continuation
      : gamePhase.type === 'story_event_result' ? gamePhase.continuation
      : gamePhase.type === 'idle' && gamePhase.overlay &&
        (gamePhase.overlay.type === 'story_event' || gamePhase.overlay.type === 'story_event_result')
        ? gamePhase.overlay.continuation
        : null;

    return continuation?.type === 'match_setup' ? 'prematch_buildup' : 'story_ambient';
  }

  switch (gamePhase.type) {
    case 'welcome':
    case 'player_creation':
    case 'idle':
    case 'tournament_list':
    case 'inventory':
    case 'training':
      return 'menu_theme';
    case 'match_active':
    case 'match_results':
      return 'match_tension';
    case 'match_setup':
      // Continue pre-match buildup for story and tournament matches
      return (gamePhase.matchType === 'story' || gamePhase.matchType === 'tournament') ? 'prematch_buildup' : 'match_tension'
    default:
      return null;
  }
}

export function useAudioTransitions(): void {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const audioSettings = useGameStore((state) => state.audioSettings);
  const audioInitialized = useRef(false);

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
    const startAudioOnInteraction = () => {
      if (!audioInitialized.current) {
        audioInitialized.current = true;
        const track = getMusicTrackForPhase(gamePhase);
        if (track) audioManager.playMusic(track);
      }
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
    };

    if (audioInitialized.current) {
      const track = getMusicTrackForPhase(gamePhase);
      if (track) audioManager.playMusic(track);
    } else {
      document.addEventListener('click', startAudioOnInteraction);
      document.addEventListener('keydown', startAudioOnInteraction);
    }

    return () => {
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
    };
  }, [gamePhase.type, gamePhase.type === 'idle' ? gamePhase.overlay?.type : undefined]);
}
