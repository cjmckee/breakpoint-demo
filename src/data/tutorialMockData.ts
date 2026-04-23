/**
 * Fake data used during the tutorial pause in LiveMatchViewer.
 * Shown before the match simulation starts so the UI sections look populated
 * when the spotlight walks the player through them.
 */

import type { MatchScore } from '../types/keyMoments';
import type { MatchStatistics } from '../types';

export const TUTORIAL_MOCK_SCORE: MatchScore = {
  sets: [],
  currentSet: { player: 4, opponent: 2 },
  currentGame: { player: 2, opponent: 1 },
  server: 'player',
  isComplete: false,
  momentum: 25,
  energy: 41,
};

export const TUTORIAL_MOCK_STATS: Pick<
  MatchStatistics,
  'aces' | 'doubleFaults' | 'winners' | 'unforcedErrors' | 'firstServePercentage' | 'totalPoints'
> = {
  aces:                 { player: 2,  opponent: 1  },
  doubleFaults:         { player: 1,  opponent: 3  },
  winners:              { player: 5,  opponent: 4  },
  unforcedErrors:       { player: 4,  opponent: 6  },
  firstServePercentage: { player: 68, opponent: 54 },
  totalPoints:          { player: 11, opponent: 9  },
};

export const TUTORIAL_MOCK_LOG: string[] = [
  'Game 1 — You serve. Keith returns long — unforced error. 15-Love.',
  'Powerful serve down the T — ace! 30-Love.',
  'Long rally, 8 shots. Forehand winner down the line. 40-Love.',
];
