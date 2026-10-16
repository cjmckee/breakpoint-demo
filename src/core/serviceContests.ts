/**
 * The two contests that decide service games, as the engine plays them.
 *
 * Raw stats answer "who has the better serve?", but a hold is decided by the
 * server's first-serve composite against the returner's return composite, which
 * draws on reading the serve, getting to it and the wings as well as the return
 * itself. Across the career identities the serve gap predicts hold % at r 0.96
 * and the return gap predicts break % at r 0.77, where OVR against the field
 * predicts point-win at 0.61 (driftProbe). So these, not the stat list, are what
 * tells a player where a match will be won and lost.
 */

import type { PlayerStats } from '../types';
import { PlayerProfile } from './PlayerProfile';

export interface Contest {
  /** The player's side: their composite in this contest. */
  mine: number;
  /** The opponent's side. */
  theirs: number;
}

export interface ServiceContests {
  /** On the player's serve: their first serve against the opponent's return. */
  serve: Contest;
  /** On the opponent's serve: the player's return against their first serve. */
  return: Contest;
}

export function serviceContests(player: PlayerStats, opponent: PlayerStats): ServiceContests {
  const me = new PlayerProfile('player', 'player', player);
  const them = new PlayerProfile('opponent', 'opponent', opponent);
  return {
    serve: {
      mine: Math.round(me.getStatForShot('serve_first')),
      theirs: Math.round(them.getReturnComposite()),
    },
    return: {
      mine: Math.round(me.getReturnComposite()),
      theirs: Math.round(them.getStatForShot('serve_first')),
    },
  };
}
