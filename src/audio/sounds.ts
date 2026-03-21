/**
 * Audio asset manifest
 * Maps logical sound keys to file paths in /public/audio/
 */

export type SfxKey =
  | 'ui_click'
  | 'story_chime'
  | 'key_moment_in'
  | 'key_moment_win'
  | 'key_moment_lose'
  | 'training_done'
  | 'ability_unlock'
  | 'item_get'
  | 'stat_up'
  | 'tournament_win'
  | 'point_win'
  | 'point_lose'
  | 'game_win'
  | 'set_win'
  | 'match_win'
  | 'match_lose'
  | 'serve'
  | 'ace'
  | 'fault'
  | 'net'
  | 'hit_ground'
  | 'hit_ground_alt'
  | 'hit_volley'
  | 'smash'
  | 'winner'
  | 'crowd_cheer';

export type MusicTrack =
  | 'menu_theme'
  | 'match_tension'
  | 'training_theme'
  | 'story_ambient'
  | 'prematch_buildup';

export const SFX_PATHS: Record<SfxKey, string> = {
  ui_click:        '/audio/sfx/ui_click.wav',
  story_chime:     '/audio/sfx/story_chime.wav',
  key_moment_in:   '/audio/sfx/key_moment_in.wav',
  key_moment_win:  '/audio/sfx/key_moment_win.wav',
  key_moment_lose: '/audio/sfx/key_moment_lose.wav',
  training_done:   '/audio/sfx/training_done.wav',
  ability_unlock:  '/audio/sfx/ability_unlock.wav',
  item_get:        '/audio/sfx/item_get.wav',
  stat_up:         '/audio/sfx/stat_up.wav',
  tournament_win:  '/audio/sfx/tournament_win.wav',
  point_win:       '/audio/sfx/point_win.wav',
  point_lose:      '/audio/sfx/point_lose.wav',
  game_win:        '/audio/sfx/game_win.wav',
  set_win:         '/audio/sfx/set_win.wav',
  match_win:       '/audio/sfx/match_win.wav',
  match_lose:      '/audio/sfx/match_lose.wav',
  serve:           '/audio/sfx/serve.ogg',
  ace:             '/audio/sfx/ace.ogg',
  fault:           '/audio/sfx/fault.wav',
  net:             '/audio/sfx/net.wav',
  hit_ground:      '/audio/sfx/hit_ground.ogg',
  hit_ground_alt:  '/audio/sfx/hit_ground_alt.ogg',
  hit_volley:      '/audio/sfx/hit_volley.ogg',
  smash:           '/audio/sfx/smash.ogg',
  winner:          '/audio/sfx/winner.ogg',
  crowd_cheer:     '/audio/sfx/crowd_cheer.ogg',
};

export interface MusicEntry {
  path: string;
  /** Human-readable track title for logging. */
  title: string;
  /** Per-track gain multiplier to normalize perceived loudness (0–1). */
  gain: number;
}

// Music track pools — Tim Kulig (timkulig.com), CC BY 4.0
// Download instructions: see scripts/download-music.sh
//
// Each track key maps to a pool of MusicEntry items.
// On each play/crossfade a random entry is selected from the pool.
// Adjust `gain` values to equalize perceived volume across tracks.
// 1.0 = full volume, lower values attenuate louder tracks.
export const MUSIC_POOLS: Record<MusicTrack, MusicEntry[]> = {
  menu_theme: [
    { path: '/audio/music/main_theme.mp3',      title: 'Main Theme',       gain: 0.2 },
    { path: '/audio/music/renegade.mp3',         title: 'Renegade',         gain: 0.2 },
    { path: '/audio/music/music_box_mayhem.mp3', title: 'Music Box Mayhem', gain: 0.2 },
  ],
  match_tension: [
    { path: '/audio/music/8_bit_open_world.mp3', title: '8-Bit Open World', gain: 0.2 },
  ],
  training_theme: [
    { path: '/audio/music/pixelated_drive.mp3', title: 'Pixelated Drive', gain: 0.2 },
  ],
  story_ambient: [
    { path: '/audio/music/beep_boopity_exploration.mp3', title: 'Beep Boopity Exploration', gain: 0.2 },
    { path: '/audio/music/have_a_good_time.mp3',         title: 'Have a Good Time',         gain: 0.2 },
  ],
  prematch_buildup: [
    { path: '/audio/music/spelunker_pete.mp3', title: 'Spelunker Pete', gain: 0.2 },
  ],
};
