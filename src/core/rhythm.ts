/**
 * In-match rhythm — how a player's form moves from game to game.
 *
 * Match-day form (PlayerProfile.rollMatchForm) sets where a player starts.
 * Rhythm lets it wander during the match: after each game it takes a random
 * step and is pulled part of the way back toward that roll, so form runs in
 * spells instead of being fixed for the whole match. MatchSimulator and
 * MatchOrchestrator both call this at every game end. See MATCH_RHYTHM.
 */

import { MATCH_RHYTHM } from '../config/shotThresholds';
import { random } from './random';

/** Roughly standard normal, from three uniforms (bounded at ±3). */
const normalish = (): number => (random() + random() + random() - 1.5) * 2;

/** Form after a game, given the match-day roll it reverts toward and the player's focus. */
export function formAfterGame(current: number, matchDayRoll: number, focus: number): number {
  if (MATCH_RHYTHM.swing <= 0) return current;
  const steadiness = 1 - MATCH_RHYTHM.focusDamping * (focus / 100);
  return (
    current -
    MATCH_RHYTHM.reversion * (current - matchDayRoll) +
    MATCH_RHYTHM.swing * steadiness * normalish()
  );
}
