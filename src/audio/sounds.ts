/**
 * Audio asset manifest
 * Maps logical sound keys to file paths in /public/audio/
 */

/** Resolve an absolute /audio/... path against Vite's base URL. */
export function resolveAudioPath(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  // path starts with '/', base ends with '/' — strip leading slash from path
  return base + path.replace(/^\//, '');
}

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
  | 'main_menu'
  | 'menu_theme'
  | 'match_tension'
  | 'story_ambient'
  | 'prematch_buildup'
  | 'romance';

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

export type MusicArtist = 'Tim Kulig' | 'Dopestuff' | 'Grand Project';

/** Attribution links for an artist, rendered by the in-game credits. */
export interface ArtistCredit {
  url?: string;
  licenseLabel?: string;
  licenseUrl?: string;
  imdbUrl?: string;
}

export const MUSIC_ARTISTS: Record<MusicArtist, ArtistCredit> = {
  'Tim Kulig': {
    url: 'https://timkulig.com',
    licenseLabel: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    imdbUrl: 'https://www.imdb.com/name/nm0997280/',
  },
  'Dopestuff': {},
  'Grand Project': {},
};

export interface MusicEntry {
  path: string;
  /** Human-readable track title, shown in the Now Playing panel and logs. */
  title: string;
  /** Credited artist — resolves to attribution links via MUSIC_ARTISTS. */
  artist: MusicArtist;
  /** Per-track gain multiplier to normalize perceived loudness (0–1). */
  gain: number;
}

/** Player-facing name for each track pool, describing when it plays. */
export const MUSIC_TRACK_LABELS: Record<MusicTrack, string> = {
  main_menu:        'Title Screen',
  menu_theme:       'Daily Life',
  match_tension:    'Match',
  story_ambient:    'Story Events',
  prematch_buildup: 'Pre-Match',
  romance:          'Romance',
};

// Music track pools — Tim Kulig (timkulig.com), CC BY 4.0
// Download instructions: see scripts/download-music.sh
//
// Each track key maps to a pool of MusicEntry items.
// On each play/crossfade a random entry is selected from the pool.
// Adjust `gain` values to equalize perceived volume across tracks.
// 1.0 = full volume, lower values attenuate louder tracks.
export const MUSIC_POOLS: Record<MusicTrack, MusicEntry[]> = {
  main_menu: [
    { path: '/audio/music/main_theme.mp3',      title: 'Main Theme',       artist: 'Tim Kulig', gain: 0.2 },
  ],
  menu_theme: [
    { path: '/audio/music/main_theme.mp3',      title: 'Main Theme',       artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/renegade.mp3',         title: 'Renegade',         artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/have_a_good_time.mp3',         title: 'Have a Good Time',         artist: 'Tim Kulig', gain: 0.2 },
  ],
  match_tension: [
    { path: '/audio/music/8_bit_open_world.mp3', title: '8-Bit Open World', artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/the_bunny_song.mp3',   title: 'The Bunny Song',   artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/on_the_run.mp3',        title: 'On The Run',       artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/feel_the_burn.mp3',     title: 'Feel the Burn',    artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/assembly_montage.mp3', title: 'Assembly Montage', artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/lady_of_the_80s.mp3',   title: 'Lady of the 80s',  artist: 'Grand Project', gain: 0.2 },
  ],
  story_ambient: [
    { path: '/audio/music/beep_boopity_exploration.mp3', title: 'Beep Boopity Exploration', artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/arcadia_remembers.mp3',        title: 'Arcadia Remembers',        artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/computing.mp3',                 title: 'Computing',                artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/neon.mp3',                       title: 'Neon',                      artist: 'Dopestuff', gain: 0.2 },
  ],
  prematch_buildup: [
    { path: '/audio/music/spelunker_pete.mp3',  title: 'Spelunker Pete',  artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/pixelated_drive.mp3', title: 'Pixelated Drive', artist: 'Tim Kulig', gain: 0.2 },
  ],
  romance: [
    { path: '/audio/music/keys_are_in_it.mp3', title: 'Keys Are In It', artist: 'Tim Kulig', gain: 0.2 },
    { path: '/audio/music/lambo.mp3',           title: 'Lambo',           artist: 'Tim Kulig', gain: 0.2 },
  ],
};

// Tracks that ship with the game but are not in any pool right now — parked
// here so they stay downloaded, credited, and easy to drop back into a pool.
// Move an entry into MUSIC_POOLS to put it back in rotation.
export const UNUSED_MUSIC: MusicEntry[] = [
  { path: '/audio/music/music_box_mayhem.mp3', title: 'Music Box Mayhem', artist: 'Tim Kulig', gain: 0.2 },
];

/**
 * Every music file the game ships, deduplicated by path — pooled tracks first
 * (in pool order), then benched ones. Single source of truth for attribution.
 */
export function getAllMusicEntries(): MusicEntry[] {
  const byPath = new Map<string, MusicEntry>();
  for (const pool of Object.values(MUSIC_POOLS)) {
    for (const entry of pool) {
      if (!byPath.has(entry.path)) byPath.set(entry.path, entry);
    }
  }
  for (const entry of UNUSED_MUSIC) {
    if (!byPath.has(entry.path)) byPath.set(entry.path, entry);
  }
  return [...byPath.values()];
}
