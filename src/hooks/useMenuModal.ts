/**
 * Menu Modal Hook
 * Global state management for the tabbed menu modal with ESC key support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useCallback } from 'react';

export type EncyclopediaSectionId = 
  | 'tennis-terms' 
  | 'stats-guide' 
  | 'surface-guide' 
  | 'scoring'
  | 'relationships';

export interface EncyclopediaSection {
  id: EncyclopediaSectionId;
  label: string;
  icon: string;
  isRevealed: boolean;
  isNew: boolean;
}

interface MenuState {
  isOpen: boolean;
  activeTab: string;
  encyclopediaSections: EncyclopediaSection[];
  isCalendarOpen: boolean;
  openMenu: (tab?: string) => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  setActiveTab: (tabId: string) => void;
  revealEncyclopediaSection: (sectionId: EncyclopediaSectionId) => void;
  markSectionSeen: (sectionId: EncyclopediaSectionId) => void;
  openCalendar: () => void;
  closeCalendar: () => void;
}

const DEFAULT_SECTIONS: EncyclopediaSection[] = [
  { id: 'scoring', label: 'Scoring', icon: '🎯', isRevealed: false, isNew: false },
  { id: 'tennis-terms', label: 'Lingo', icon: '📖', isRevealed: false, isNew: false },
  { id: 'stats-guide', label: 'Stats', icon: '📊', isRevealed: false, isNew: false },
  { id: 'surface-guide', label: 'Surfaces', icon: '🏟️', isRevealed: false, isNew: false },
  { id: 'relationships', label: 'Relationships', icon: '💝', isRevealed: false, isNew: false },
];

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      isOpen: false,
      activeTab: 'settings',
      encyclopediaSections: DEFAULT_SECTIONS,
      isCalendarOpen: false,

      openMenu: (tab?: string) => {
        set({
          isOpen: true,
          activeTab: tab || 'settings',
        });
      },

      closeMenu: () => {
        set({ isOpen: false });
      },

      toggleMenu: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      setActiveTab: (tabId: string) => {
        set({ activeTab: tabId });
      },

      revealEncyclopediaSection: (sectionId: EncyclopediaSectionId) => {
        set((state) => ({
          encyclopediaSections: state.encyclopediaSections.map((section) =>
            section.id === sectionId
              ? { ...section, isRevealed: true, isNew: true }
              : section
          ),
        }));
      },

      markSectionSeen: (sectionId: EncyclopediaSectionId) => {
        set((state) => ({
          encyclopediaSections: state.encyclopediaSections.map((section) =>
            section.id === sectionId ? { ...section, isNew: false } : section
          ),
        }));
      },

      openCalendar: () => set({ isCalendarOpen: true }),
      closeCalendar: () => set({ isCalendarOpen: false }),
    }),
    { name: 'menu-storage' }
  )
);

export function useMenuKeyboardHandler() {
  const { isOpen, openMenu, closeMenu } = useMenuStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      }
    },
    [isOpen, openMenu, closeMenu]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export function useMenuModal() {
  const encyclopediaSections = useMenuStore((state) => state.encyclopediaSections);
  
  return {
    isOpen: useMenuStore((state) => state.isOpen),
    activeTab: useMenuStore((state) => state.activeTab),
    encyclopediaSections,
    hasAnyNewSection: encyclopediaSections.some((s) => s.isNew),
    openMenu: useMenuStore((state) => state.openMenu),
    closeMenu: useMenuStore((state) => state.closeMenu),
    toggleMenu: useMenuStore((state) => state.toggleMenu),
    setActiveTab: useMenuStore((state) => state.setActiveTab),
    revealEncyclopediaSection: useMenuStore((state) => state.revealEncyclopediaSection),
    markSectionSeen: useMenuStore((state) => state.markSectionSeen),
  };
}
