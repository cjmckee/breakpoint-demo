/**
 * Small pixel-art icons drawn in code, like the character sprites: each is a
 * 12×12 grid where `#` is a lit pixel. Render with `<PixelIcon grid colour />`.
 */

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
