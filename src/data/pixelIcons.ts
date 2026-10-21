/**
 * Small pixel-art icons drawn in code, like the character sprites: each is a
 * 12×12 grid where `#` is a lit pixel. Render with `<PixelIcon grid colour />`.
 */

import type { DrillId } from '../minigames/types';
import { TimeSlot } from '../types/game';

export type PixelGrid = readonly string[];

/** The four stat sections, drawn by what the section is about rather than one stat. */
export const SECTION_ICONS = {
  // A racquet: the strokes everyone hits.
  core: [
    '....####....',
    '...#....#...',
    '..#.#..#.#..',
    '..#..##..#..',
    '..#.#..#.#..',
    '...#....#...',
    '....####....',
    '.....##.....',
    '.....##.....',
    '.....##.....',
    '....####....',
    '....####....',
  ],
  // A ball with a curl of spin: feel and shotmaking.
  technical: [
    '............',
    '...####.....',
    '..#....#....',
    '.#.#....#...',
    '.#..#...#...',
    '.#...#..#.##',
    '..#....#..#.',
    '...####...#.',
    '.........#..',
    '.......##...',
    '............',
    '............',
  ],
  // A sneaker: legs, lungs and strength.
  physical: [
    '............',
    '............',
    '..###.......',
    '..#.##......',
    '..#..##.....',
    '..#...####..',
    '..#......##.',
    '.##.......#.',
    '############',
    '#..........#',
    '############',
    '............',
  ],
  // A thought bubble: reading and decisions.
  mental: [
    '....####....',
    '..##....##..',
    '.#........#.',
    '.#..#..#..#.',
    '.#........#.',
    '..##....##..',
    '....####....',
    '.......##...',
    '........#...',
    '...........#',
    '............',
    '............',
  ],
} satisfies Record<string, PixelGrid>;

/** The four time slots, for the status bar and the beat between slots. */
export const TIME_SLOT_ICONS = {
  // The sun coming up over the horizon.
  [TimeSlot.MORNING]: [
    '............',
    '.....##.....',
    '.#...##...#.',
    '..#......#..',
    '....####....',
    '...######...',
    '#.########.#',
    '..########..',
    '############',
    '............',
    '..########..',
    '....####....',
  ],
  // The full sun.
  [TimeSlot.AFTERNOON]: [
    '.....##.....',
    '.#...##...#.',
    '..#......#..',
    '....####....',
    '...######...',
    '##.######.##',
    '##.######.##',
    '...######...',
    '....####....',
    '..#......#..',
    '.#...##...#.',
    '.....##.....',
  ],
  // The sun going down, and its reflection.
  [TimeSlot.EVENING]: [
    '............',
    '............',
    '............',
    '............',
    '....####....',
    '..########..',
    '.##########.',
    '############',
    '............',
    '..########..',
    '............',
    '....####....',
  ],
  // A crescent moon and a star.
  [TimeSlot.NIGHT]: [
    '...####.....',
    '..###.......',
    '.###.....#..',
    '.##.....###.',
    '###......#..',
    '###.........',
    '###.........',
    '###.........',
    '.##.........',
    '.###........',
    '..###.......',
    '...####.....',
  ],
} satisfies Record<TimeSlot, PixelGrid>;

/** Each slot icon's colour: from dawn gold to the moon's pale blue. */
export const TIME_SLOT_COLOURS: Record<TimeSlot, string> = {
  [TimeSlot.MORNING]: '#ffcf4a',
  [TimeSlot.AFTERNOON]: '#ffe066',
  [TimeSlot.EVENING]: '#fb923c',
  [TimeSlot.NIGHT]: '#c9d4ff',
};

/** One icon per training drill, drawn for what the drill tests rather than a shot. */
export const DRILL_ICONS = {
  // Notes: rhythm.
  rally_rhythm: [
    '............',
    '.....#####..',
    '.....#...#..',
    '.....#...#..',
    '.....#...#..',
    '.....#...#..',
    '.....#...#..',
    '..###...###.',
    '.#####.#####',
    '.#####.#####',
    '..###...###.',
    '............',
  ],
  // Footprints: the sprint.
  split_step: [
    '............',
    '..##........',
    '.####.......',
    '.####.......',
    '.####...##..',
    '..##...####.',
    '..##...####.',
    '........###.',
    '..##....##..',
    '..##........',
    '............',
    '............',
  ],
  // A corner with a target dot.
  corner_paint: [
    '############',
    '#...........',
    '#...........',
    '#.....##....',
    '#....####...',
    '#....####...',
    '#.....##....',
    '#...........',
    '#...........',
    '#...........',
    '#...........',
    '............',
  ],
  // A feather: touch.
  touch_slice: [
    '.........##.',
    '........###.',
    '.......####.',
    '......####..',
    '.....####...',
    '....####....',
    '...####.....',
    '..###.......',
    '..##........',
    '.#..........',
    '#...........',
    '............',
  ],
  // An eye: reading the serve.
  read_return: [
    '............',
    '............',
    '...######...',
    '..#......#..',
    '.#...##...#.',
    '#...####...#',
    '#...####...#',
    '.#...##...#.',
    '..#......#..',
    '...######...',
    '............',
    '............',
  ],
  // A ball over an upward arrow: the toss.
  toss_and_strike: [
    '.....##.....',
    '....####....',
    '....####....',
    '.....##.....',
    '............',
    '.....#......',
    '....###.....',
    '...#.#.#....',
    '.....#......',
    '.....#......',
    '.....#......',
    '............',
  ],
} satisfies Record<DrillId, PixelGrid>;

/**
 * Colours for the multi-colour icons below, by symbol. `k` is the outline, drawn in
 * the page's own dark so an icon reads on the green and the navy tiles alike.
 */
export const ICON_PALETTE: Record<string, string> = {
  k: '#1a1a2e', // outline
  w: '#eeeeee', // white
  g: '#9ca3af', // steel
  y: '#ccff00', // tennis ball
  o: '#fb923c', // orange
  n: '#a16207', // wood, leather
  t: '#fed7aa', // skin, plaster
  b: '#60a5fa', // blue
  c: '#a5f3fc', // glass, highlight
  p: '#f472b6', // pink
  m: '#fde047', // moon
  e: '#2ecc71', // gain green
};

/** The main menu's actions, 16×16, coloured with ICON_PALETTE. */
export const MENU_ICONS = {
  // A dumbbell.
  training: [
    '................',
    '................',
    '................',
    '.kkk........kkk.',
    'kbbbk......kbbbk',
    'kbcbk......kbcbk',
    'kbcbkkkkkkkkbcbk',
    'kbcbkggggggkbcbk',
    'kbcbkggggggkbcbk',
    'kbcbkkkkkkkkbcbk',
    'kbcbk......kbcbk',
    'kbbbk......kbbbk',
    '.kkk........kkk.',
    '................',
    '................',
    '................',
  ],
  // A racquet and a ball.
  match: [
    '...kkkk.....kyk.',
    '..kwgwgk...kyyyk',
    '.kwgwgwgk..kyyyk',
    '.kgwgwgwk...kyk.',
    '.kwgwgwgk.......',
    '.kgwgwgwk.......',
    '..kgwgwk........',
    '...kkkkk........',
    '.....kok........',
    '......kok.......',
    '.......kok......',
    '........kok.....',
    '.........knk....',
    '..........knk...',
    '...........kk...',
    '................',
  ],
  // A bed, and a Zz.
  rest: [
    '........wwww....',
    '..........w.....',
    '.........w......',
    '........wwww.www',
    '..............w.',
    '.............www',
    '................',
    '.kkk............',
    '.knk............',
    '.knkwwkkkkkkkkk.',
    '.knkwwbbbbbbbbbk',
    '.knkkkkkkkkkkkkk',
    '.knk.........knk',
    '.kkk.........kkk',
    '................',
    '................',
  ],
  // A crescent moon and stars: Rest becomes Sleep at night.
  sleep: [
    '......kkkk......',
    '....kkmmmk...w..',
    '...kmmmkk.......',
    '..kmmmk.........',
    '..kmmk.......w..',
    '.kmmmk..........',
    '.kmmk...........',
    '.kmmk.......w...',
    '.kmmmk..........',
    '..kmmk..........',
    '..kmmmk.........',
    '...kmmmkk.......',
    '....kkmmmk...w..',
    '......kkkk......',
    '................',
    '................',
  ],
  // Two friends.
  relationships: [
    '................',
    '................',
    '..kkkk....kkkk..',
    '.knnnnk..kooook.',
    '.knttnk..kottok.',
    '.kttttk..kttttk.',
    '..kkkk....kkkk..',
    '................',
    '.kkkkkk..kkkkkk.',
    'kbbbbbbkkppppppk',
    'kbbbbbbkkppppppk',
    'kbbbbbbkkppppppk',
    'kkkkkkkkkkkkkkkk',
    '................',
    '................',
    '................',
  ],
  // A backpack: top handle, flap and a buckled pocket.
  inventory: [
    '................',
    '......kkkk......',
    '.....k....k.....',
    '....kkkkkkkk....',
    '...kooooooook...',
    '..kooooooooook..',
    '..kooooooooook..',
    '..kkkkkkkkkkkk..',
    '..kookkkkkkook..',
    '..kooknyynkook..',
    '..kooknnnnkook..',
    '..kookkkkkkook..',
    '..kooooooooook..',
    '...kkkkkkkkkk...',
    '................',
    '................',
  ],
  // A shopfront under a striped awning.
  shop: [
    '................',
    '.kkkkkkkkkkkkkk.',
    'kwwppwwppwwppwwk',
    'kwwppwwppwwppwwk',
    '.kkkkkkkkkkkkkk.',
    '.kttttttttttttk.',
    '.ktkkkkttkkkktk.',
    '.ktkcckttkbbktk.',
    '.ktkcckttkbbktk.',
    '.ktkkkkttkbbktk.',
    '.ktttttttkbyktk.',
    '.ktttttttkbbktk.',
    '.ktttttttkbbktk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ],
  // Bars rising under an arrow.
  develop: [
    '...........ee...',
    '..........eeee..',
    '.........eeeeee.',
    '...........ee...',
    '...........ee...',
    '..........kkkk..',
    '..........kbbk..',
    '..........kbbk..',
    '.....kkkk.kbbk..',
    '.....kbbk.kbbk..',
    '.....kbbk.kbbk..',
    'kkkk.kbbk.kbbk..',
    'kbbk.kbbk.kbbk..',
    'kbbk.kbbk.kbbk..',
    'kkkkkkkkkkkkkkk.',
    '................',
  ],
  // A clipboard with a list.
  challenges: [
    '.....kkkkkk.....',
    '..kkkkggggkkkk..',
    '.knnkkkkkkkknnk.',
    '.knwwwwwwwwwwnk.',
    '.knwkkwwwwwwwnk.',
    '.knwkkwgggggwnk.',
    '.knwwwwwwwwwwnk.',
    '.knwkkwwwwwwwnk.',
    '.knwkkwgggggwnk.',
    '.knwwwwwwwwwwnk.',
    '.knwkkwwwwwwwnk.',
    '.knwkkwgggggwnk.',
    '.knwwwwwwwwwwnk.',
    '.knnnnnnnnnnnnk.',
    '.kkkkkkkkkkkkkk.',
    '................',
  ],
} satisfies Record<string, PixelGrid>;
