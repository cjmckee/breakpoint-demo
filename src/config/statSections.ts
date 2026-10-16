/**
 * The four sections the fourteen stats sit in, in the fixed order every screen
 * lists them: Development, the Player Stats card. Each section has its own pixel
 * icon and colour. The colour is a cue, not a meaning: no four colours stay clear
 * of the currency colours and the reserved greens and red, so the icon and the
 * name carry the section.
 */

import type { StatName } from '../types';
import { SECTION_ICONS, type PixelGrid } from '../data/pixelIcons';

export type StatSection = 'core' | 'technical' | 'physical' | 'mental';

export interface StatSectionInfo {
  id: StatSection;
  label: string;
  stats: readonly StatName[];
  /** Hex: blue, pink, peach, slate. */
  color: string;
  icon: PixelGrid;
}

export const STAT_SECTIONS: readonly StatSectionInfo[] = [
  {
    id: 'core',
    label: 'Core',
    stats: ['serve', 'forehand', 'backhand', 'return', 'net'],
    color: '#60a5fa',
    icon: SECTION_ICONS.core,
  },
  {
    id: 'technical',
    label: 'Technical',
    stats: ['slice', 'spin', 'placement'],
    color: '#f472b6',
    icon: SECTION_ICONS.technical,
  },
  {
    id: 'physical',
    label: 'Physical',
    stats: ['speed', 'stamina', 'strength'],
    color: '#fed7aa',
    icon: SECTION_ICONS.physical,
  },
  {
    id: 'mental',
    label: 'Mental',
    stats: ['focus', 'anticipation', 'tactics'],
    color: '#cbd5e1',
    icon: SECTION_ICONS.mental,
  },
];

export const SECTION_BY_ID = Object.fromEntries(STAT_SECTIONS.map((s) => [s.id, s])) as Record<
  StatSection,
  StatSectionInfo
>;
