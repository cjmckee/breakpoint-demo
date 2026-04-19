import { useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMenuStore } from './useMenuModal';

function isInputFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useGameKeyboardHandler() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const isShopUnlocked = useGameStore((state) => state.isShopUnlocked);
  const isMatchUnlocked = useGameStore((state) => state.isMatchUnlocked);
  const navigateTo = useGameStore((state) => state.navigateTo);
  const clearIndicator = useGameStore((state) => state.clearIndicator);
  const dismissMatchResults = useGameStore((state) => state.dismissMatchResults);
  const dismissStoryEventResult = useGameStore((state) => state.dismissStoryEventResult);
  const isMenuOpen = useMenuStore((state) => state.isOpen);
  const isCalendarOpen = useMenuStore((state) => state.isCalendarOpen);
  const openCalendar = useMenuStore((state) => state.openCalendar);
  const closeCalendar = useMenuStore((state) => state.closeCalendar);

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

      const phase = gamePhase.type;
      const onIdle = phase === 'idle' && !gamePhase.overlay;

      switch (key.toLowerCase()) {
        case 'c':
          if (onIdle || isCalendarOpen) {
            event.preventDefault();
            if (isCalendarOpen) closeCalendar(); else openCalendar();
          }
          break;
        case 't':
          if (onIdle) { event.preventDefault(); navigateTo('training'); }
          else if (phase === 'training') { event.preventDefault(); navigateTo('idle'); }
          break;
        case 'm':
          if (onIdle && isMatchUnlocked()) { event.preventDefault(); navigateTo('match_setup'); }
          else if (phase === 'match_setup') { event.preventDefault(); navigateTo('idle'); }
          break;
        case 'i':
          if (onIdle) { event.preventDefault(); clearIndicator('inventory'); navigateTo('inventory'); }
          else if (phase === 'inventory') { event.preventDefault(); navigateTo('idle'); }
          break;
        case 'r':
          if (onIdle) { event.preventDefault(); navigateTo('relationships'); }
          else if (phase === 'relationships') { event.preventDefault(); navigateTo('idle'); }
          break;
        case 's':
          if (onIdle && isShopUnlocked()) { event.preventDefault(); clearIndicator('shop'); navigateTo('shop'); }
          else if (phase === 'shop') { event.preventDefault(); navigateTo('idle'); }
          break;
      }
    },
    [gamePhase, isShopUnlocked, isMatchUnlocked, navigateTo, clearIndicator, dismissMatchResults, dismissStoryEventResult, isMenuOpen, isCalendarOpen, openCalendar, closeCalendar]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
