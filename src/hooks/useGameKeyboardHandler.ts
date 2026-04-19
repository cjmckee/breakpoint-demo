import { useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { PlayerFlag } from '../types/game';
import { useMenuStore } from './useMenuModal';

function isInputFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useGameKeyboardHandler() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const player = useGameStore((state) => state.player);
  const isShopUnlocked = useGameStore((state) => state.isShopUnlocked);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const clearIndicator = useGameStore((state) => state.clearIndicator);
  const dismissMatchResults = useGameStore((state) => state.dismissMatchResults);
  const dismissStoryEventResult = useGameStore((state) => state.dismissStoryEventResult);
  const isMenuOpen = useMenuStore((state) => state.isOpen);
  const openCalendar = useMenuStore((state) => state.openCalendar);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isInputFocused() || isMenuOpen) return;

      const key = event.key;

      if (gamePhase.type === 'match_results') {
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          dismissMatchResults();
        }
        return;
      }

      if (gamePhase.type === 'story_event_result') {
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          dismissStoryEventResult();
        }
        return;
      }

      if (gamePhase.type === 'idle' && !gamePhase.overlay) {
        const matchUnlocked = player?.flags?.[PlayerFlag.MATCH_UNLOCKED] === true;

        switch (key.toLowerCase()) {
          case 't':
            event.preventDefault();
            navigateTo('training');
            break;
          case 'm':
            if (matchUnlocked) {
              event.preventDefault();
              navigateTo('match_setup');
            }
            break;
          case 'i':
            event.preventDefault();
            clearIndicator('inventory');
            navigateTo('inventory');
            break;
          case 'r':
            event.preventDefault();
            navigateTo('relationships');
            break;
          case 's':
            if (isShopUnlocked()) {
              event.preventDefault();
              clearIndicator('shop');
              navigateTo('shop');
            }
            break;
          case 'c':
            event.preventDefault();
            openCalendar();
            break;
        }
      }
    },
    [gamePhase, player, isShopUnlocked, navigateTo, clearIndicator, dismissMatchResults, dismissStoryEventResult, isMenuOpen, openCalendar]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
