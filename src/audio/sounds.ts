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
  | 'match_intense'
  | 'training_theme'
  | 'story_ambient';

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

// Music tracks — Kevin MacLeod (incompetech.com), CC BY 4.0
// Download instructions: see scripts/download-music.sh
export const MUSIC_PATHS: Record<MusicTrack, string> = {
  menu_theme:     '/audio/music/sneaky_snitch.mp3',
  match_tension:  '/audio/music/investigations.mp3',
  match_intense:  '/audio/music/cipher.mp3',
  training_theme: '/audio/music/scheming_weasel.mp3',
  story_ambient:  '/audio/music/local_forecast.mp3',
};
