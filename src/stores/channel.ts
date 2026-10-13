/**
 * Which build this is: the live game, or the staging build served from `/staging/` on the
 * same GitHub Pages site. Set at build time with `VITE_CHANNEL=staging`.
 *
 * Staging shares the live game's origin, and so its localStorage. Anything the game keeps
 * there is keyed per channel, so a staging build on a newer save version can never migrate
 * — or reset — a player's real save.
 */
export type Channel = 'production' | 'staging';

export const CHANNEL: Channel =
  import.meta.env?.VITE_CHANNEL === 'staging' ? 'staging' : 'production';

/** The persisted game store's localStorage key for this channel. */
export const GAME_STORE_KEY =
  CHANNEL === 'staging' ? 'tennis-rpg-game-store-staging' : 'tennis-rpg-game-store';
