/**
 * useNowPlaying
 * Subscribes to the AudioManager's current song so UI can display it.
 */

import { useSyncExternalStore } from 'react';
import { audioManager } from '../audio/AudioManager';
import type { NowPlaying } from '../audio/AudioManager';

const subscribe = (listener: () => void): (() => void) =>
  audioManager.subscribeNowPlaying(listener);

const getSnapshot = (): NowPlaying | null => audioManager.getNowPlaying();

export function useNowPlaying(): NowPlaying | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
