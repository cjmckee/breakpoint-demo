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
      { label: 'Match simulation', percent: 80, notes: 'Every shot is individually calculated, just check the logs. I\'m using chained sigmoid functions to give proper variance to each shot and give us a wide array of outcomes.' },
      { label: 'Training system', percent: 60, notes: 'Still missing the improved tiers beyond silver. I will probably rework silver as well.'},
      { label: 'Player progression', percent: 75, notes: 'Still need a meaningful outlet for player experience and match experience. Events have been a fun way to control player stats.' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Story events', percent: 30, notes: 'Much more content to come.' },
      { label: 'Team matches', percent: 20, notes: 'Need to keep fleshing out team matches for additional tiers.' },
      { label: 'Tournaments', percent: 25, notes: 'At least 3 more tournaments. :)' },
      { label: 'Relationships', percent: 10, notes: 'This is pretty barebones for now. Lots of room to improve. More characters too.' },
    ],
  },
  {
    title: 'Polish',
    items: [
      { label: 'UI / visuals', percent: 70, notes: 'Shy of getting an artist, we are pretty close on the UI to how much I\'m willing to invest.' },
      { label: 'Audio', percent: 70, notes: 'More music, better sound effects.' },
      { label: 'Balance tuning', percent: 15, notes: 'Much, much more to do here. Limiting the scope on story content to the first tournament lets me focus on balancing some core mechanics for now.' },
    ],
  },
];
