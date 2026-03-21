/**
 * Game Progress Tracker
 * Manually updated to reflect current implementation status.
 * Displayed in the welcome overlay for transparency with players.
 */

export interface ProgressItem {
  label: string;
  percent: number;
  notes?: string;
}

export interface ProgressSection {
  title: string;
  items: ProgressItem[];
}

export const GAME_PROGRESS: ProgressSection[] = [
  {
    title: 'Core Gameplay',
    items: [
      { label: 'Match simulation', percent: 70 },
      { label: 'Training system', percent: 60 },
      { label: 'Player progression', percent: 55 },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Story events', percent: 30 },
      { label: 'Team matches', percent: 30 },
      { label: 'Tournaments', percent: 25 },
      { label: 'Relationships', percent: 10 },
    ],
  },
  {
    title: 'Polish',
    items: [
      { label: 'UI / visuals', percent: 40 },
      { label: 'Audio', percent: 20 },
      { label: 'Balance tuning', percent: 15 },
    ],
  },
];
