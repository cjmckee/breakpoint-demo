import type { GamePhase } from '../types/gamePhase';

/**
 * Identifies the full-page screen a phase renders, ignoring overlays.
 *
 * Two phases with the same key draw the same page (an idle overlay sits on top of
 * the menu; a key moment sits on top of the live match), so scroll position should
 * carry over. A new key is a new page and should open at the top. Match setup is
 * two pages — the tier picker and the opponent preview — split on whether a
 * config has been chosen yet.
 */
export function screenKey(phase: GamePhase): string {
  switch (phase.type) {
    case 'match_setup':
      return `match_setup:${phase.matchType}:${phase.matchConfig ? 'preview' : 'pick'}`;
    case 'development':
      return 'development';
    default:
      return phase.type;
  }
}
