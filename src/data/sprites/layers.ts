/**
 * Sprite layer grids — the paper doll.
 *
 * Every character is a stack of layers drawn on the same 16×21 grid. There are two views:
 * front-facing (portraits, the creator) and side-on facing right (the court, where the
 * players face each other across the net). Front view is drawn right-handed: hair (back) → body → hair (front) → accessory → racquet. Left-handers are the same
 * stack mirrored. Each grid row is one string; each character is a palette symbol from
 * `palettes.ts`, and `.` leaves whatever is underneath.
 *
 * A layer only lists the rows it touches, starting at `top`, so a hairstyle is a few
 * lines rather than a full canvas. `spriteCheck` verifies widths and symbols.
 */

import type { Accessory, HairStyle, SpritePose } from '../../types/appearance';

export const SPRITE_WIDTH = 16;
export const SPRITE_HEIGHT = 21;

export interface SpriteLayer {
  /** Grid row the first string is drawn on. */
  top: number;
  rows: readonly string[];
}

// ─── Body ──────────────────────────────────────────────────────────────────

const HEAD: readonly string[] = [
  '................',
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '....KSSSSSSK....',
  '....KSESSESK....',
  '....KSSSSSSK....',
  '....KsSSSSsK....',
  '.....KKssKK.....',
];

const HEAD_BLINK: readonly string[] = HEAD.map((row, i) => (i === 5 ? '....KSsSSsSK....' : row));

const TORSO: readonly string[] = [
  '....KOOOOOOK....',
  '...KOOOOOOOOK...',
  '...KSOOOOOOSK...',
  '...KSOooooOSK...',
  '...KSKPPPPKSK...',
  '....KKPPPPKK....',
  '.....KPPPPK.....',
];

/** Racquet arm raised out to the side. */
const TORSO_SWING: readonly string[] = [
  '....KOOOOOOK....',
  '...KOOOOOOOOKKK.',
  '...KSOOOOOOOSSSK',
  '...KSOooooOKKKK.',
  '...KSKPPPPKK....',
  '....KKPPPPKK....',
  '.....KPPPPK.....',
];

const LEGS_STAND: readonly string[] = [
  '.....KSKKSK.....',
  '.....KSKKSK.....',
  '.....KWKKWK.....',
  '....KBBKKBBK....',
  '....KKKKKKKK....',
];

const LEGS_STRIDE: readonly string[] = [
  '....KSKKKKSK....',
  '...KSK....KSK...',
  '...KWK....KWK...',
  '..KBBK....KBBK..',
  '..KKK......KKK..',
];

const body = (...parts: (readonly string[])[]): SpriteLayer => ({ top: 0, rows: parts.flat() });

const BODY_IDLE = body(HEAD, TORSO, LEGS_STAND);
const BODY_BLINK = body(HEAD_BLINK, TORSO, LEGS_STAND);
const BODY_RUN = body(HEAD, TORSO, LEGS_STRIDE);
const BODY_SWING = body(HEAD, TORSO_SWING, LEGS_STRIDE);

/** Racquet arm thrown up beside the head: the point is won. */
const BODY_CHEER = body(
  [
    '................',
    '................',
    '.....KKKKKK.....',
    '....KSSSSSSK....',
    '....KSSSSSSK....',
    '....KSESSESK.KSK',
    '....KSSSSSSK.KSK',
    '....KsSSSSsK.KSK',
    '.....KKssKK..KOK',
    '....KOOOOOOKKOK.',
    '...KOOOOOOOOOK..',
    '...KSOOOOOOK....',
    '...KSOooooOK....',
    '...KSKPPPPKK....',
    '....KKPPPPKK....',
    '.....KPPPPK.....',
  ],
  LEGS_STAND,
);

/**
 * Head dropped a row and eyes down, shoulders gone: the point is lost. Hair follows the
 * head through the frame's `headDy`.
 */
const BODY_SLUMP = body(
  ['................', '................', '................'],
  HEAD_BLINK.slice(2),
  TORSO.slice(1),
  LEGS_STAND,
);

// Side view, facing right: the back of the head is on the left, the nose on the right.

const HEAD_SIDE: readonly string[] = [
  '................',
  '................',
  '......KKKKK.....',
  '.....KSSSSSK....',
  '.....KSSSSSK....',
  '.....KSSSSEK....',
  '.....KSSSSSSK...',
  '.....KsSSSSK....',
  '......KKssK.....',
];

const HEAD_SIDE_BLINK: readonly string[] = HEAD_SIDE.map((row, i) =>
  i === 5 ? '.....KSSSSsK....' : row,
);

const TORSO_SIDE: readonly string[] = [
  '......KOOOK.....',
  '.....KOOOOOK....',
  '.....KOOOOSK....',
  '.....KoooOSK....',
  '.....KPPPPSK....',
  '.....KPPPPKK....',
  '......KPPK......',
];

/** Racquet arm reaching forward, toward the net. */
const TORSO_SIDE_SWING: readonly string[] = [
  '......KOOOK.....',
  '.....KOOOOOKKKK.',
  '.....KOOOOOSSSSK',
  '.....KoooOKKKKK.',
  '.....KPPPPK.....',
  '.....KPPPPK.....',
  '......KPPK......',
];

const LEGS_SIDE_STAND: readonly string[] = [
  '......KSSK......',
  '......KSSK......',
  '......KWWK......',
  '......KBBBK.....',
  '......KKKKK.....',
];

const LEGS_SIDE_STRIDE: readonly string[] = [
  '.....KSKKSK.....',
  '....KSK..KSK....',
  '....KWK...KWK...',
  '...KBBK...KBBBK.',
  '...KKK....KKKKK.',
];

const SIDE_IDLE = body(HEAD_SIDE, TORSO_SIDE, LEGS_SIDE_STAND);
const SIDE_BLINK = body(HEAD_SIDE_BLINK, TORSO_SIDE, LEGS_SIDE_STAND);
const SIDE_RUN = body(HEAD_SIDE, TORSO_SIDE, LEGS_SIDE_STRIDE);
const SIDE_SWING = body(HEAD_SIDE, TORSO_SIDE_SWING, LEGS_SIDE_STRIDE);

const SIDE_CHEER = body(
  [
    '................',
    '................',
    '......KKKKK.....',
    '.....KSSSSSK....',
    '.....KSSSSSK....',
    '.....KSSSSEK.KSK',
    '.....KSSSSSSKKSK',
    '.....KsSSSSK.KSK',
    '......KKssK..KOK',
    '......KOOOKKKOK.',
    '.....KOOOOOOOK..',
    '.....KOOOOOK....',
    '.....KoooOOK....',
    '.....KPPPPK.....',
    '.....KPPPPK.....',
    '......KPPK......',
  ],
  LEGS_SIDE_STAND,
);

const SIDE_SLUMP = body(
  ['................', '................', '................'],
  HEAD_SIDE_BLINK.slice(2),
  TORSO_SIDE.slice(1),
  LEGS_SIDE_STAND,
);

// ─── Racquet ───────────────────────────────────────────────────────────────

const RACQUET_DOWN: SpriteLayer = {
  top: 14,
  rows: [
    '............T...',
    '............RR..',
    '...........RGGR.',
    '...........RGGR.',
    '...........RGGR.',
    '............RR..',
  ],
};

const RACQUET_UP: SpriteLayer = {
  top: 3,
  rows: [
    '.............RR.',
    '............RGGR',
    '............RGGR',
    '............RGGR',
    '.............RR.',
    '..............T.',
    '..............T.',
  ],
};

const RACQUET_SIDE_DOWN: SpriteLayer = {
  top: 14,
  rows: [
    '...........T....',
    '...........RR...',
    '..........RGGR..',
    '..........RGGR..',
    '..........RGGR..',
    '...........RR...',
  ],
};

const RACQUET_SIDE_UP: SpriteLayer = {
  top: 4,
  rows: [
    '.............RR.',
    '............RGGR',
    '............RGGR',
    '............RGGR',
    '.............RR.',
    '..............T.',
  ],
};

/** Held high in a raised fist, for a cheer. Front and side share it. */
const RACQUET_RAISED: SpriteLayer = {
  top: 0,
  rows: [
    '.............RR.',
    '............RGGR',
    '............RGGR',
    '.............RR.',
    '..............T.',
  ],
};

/** Head of the racquet resting on the ground, for a slump. */
const RACQUET_DRAGGED: SpriteLayer = { ...RACQUET_DOWN, top: RACQUET_DOWN.top + 1 };
const RACQUET_SIDE_DRAGGED: SpriteLayer = {
  ...RACQUET_SIDE_DOWN,
  top: RACQUET_SIDE_DOWN.top + 1,
};

// ─── Poses ─────────────────────────────────────────────────────────────────

export interface PoseFrame {
  body: SpriteLayer;
  racquet: SpriteLayer;
  /** Rows the head sits below its usual place; hair and accessories follow it. */
  headDy?: number;
  /** Rows the whole frame is raised (negative) or lowered, for a hop. */
  dy?: number;
}

/**
 * Frames per pose, played in order and looped. Idle repeats its open-eyed frame so the
 * blink is occasional rather than a flicker.
 */
export const POSE_FRAMES: Record<SpritePose, readonly PoseFrame[]> = {
  idle: [
    { body: BODY_IDLE, racquet: RACQUET_DOWN },
    { body: BODY_IDLE, racquet: RACQUET_DOWN },
    { body: BODY_IDLE, racquet: RACQUET_DOWN },
    { body: BODY_IDLE, racquet: RACQUET_DOWN },
    { body: BODY_IDLE, racquet: RACQUET_DOWN },
    { body: BODY_BLINK, racquet: RACQUET_DOWN },
  ],
  run: [
    { body: BODY_RUN, racquet: RACQUET_DOWN },
    { body: BODY_IDLE, racquet: RACQUET_DOWN },
  ],
  swing: [{ body: BODY_SWING, racquet: RACQUET_UP }],
  cheer: [
    { body: BODY_CHEER, racquet: RACQUET_RAISED },
    { body: BODY_CHEER, racquet: RACQUET_RAISED, dy: -1 },
  ],
  slump: [{ body: BODY_SLUMP, racquet: RACQUET_DRAGGED, headDy: 1 }],
};

/** The same poses side-on, facing right. */
export const SIDE_POSE_FRAMES: Record<SpritePose, readonly PoseFrame[]> = {
  idle: [
    { body: SIDE_IDLE, racquet: RACQUET_SIDE_DOWN },
    { body: SIDE_IDLE, racquet: RACQUET_SIDE_DOWN },
    { body: SIDE_IDLE, racquet: RACQUET_SIDE_DOWN },
    { body: SIDE_IDLE, racquet: RACQUET_SIDE_DOWN },
    { body: SIDE_IDLE, racquet: RACQUET_SIDE_DOWN },
    { body: SIDE_BLINK, racquet: RACQUET_SIDE_DOWN },
  ],
  run: [
    { body: SIDE_RUN, racquet: RACQUET_SIDE_DOWN },
    { body: SIDE_IDLE, racquet: RACQUET_SIDE_DOWN },
  ],
  swing: [{ body: SIDE_SWING, racquet: RACQUET_SIDE_UP }],
  cheer: [
    { body: SIDE_CHEER, racquet: RACQUET_RAISED },
    { body: SIDE_CHEER, racquet: RACQUET_RAISED, dy: -1 },
  ],
  slump: [{ body: SIDE_SLUMP, racquet: RACQUET_SIDE_DRAGGED, headDy: 1 }],
};

// ─── Hair ──────────────────────────────────────────────────────────────────

export interface HairLayers {
  label: string;
  /** Drawn before the body, so it shows only around the silhouette (a ponytail). */
  back?: SpriteLayer;
  front: SpriteLayer;
  /** Side-on, facing right. Drawn over the body, so it carries the back of the head too. */
  side: SpriteLayer;
}

const FRINGE: readonly string[] = [
  '.....KKKKKK.....',
  '....KHHLLHHK....',
  '...KHHHHHHHHK...',
  '...KHHhHHhHHK...',
];

const SIDE_CROWN: readonly string[] = [
  '......KKKKK.....',
  '.....KHHLHHK....',
  '....KHHHHHHHK...',
  '....KHHHHHhHK...',
];

export const HAIR_STYLES: Record<HairStyle, HairLayers> = {
  short: {
    label: 'Short',
    front: { top: 1, rows: [...FRINGE, '...KH......HK...'] },
    side: {
      top: 1,
      rows: [...SIDE_CROWN, '....KHHh........', '....KHHh........', '.....KHK........'],
    },
  },
  buzz: {
    label: 'Buzz',
    front: {
      top: 2,
      rows: ['.....KKKKKK.....', '....KHHLHHHK....', '....KhSSSShK....'],
    },
    side: {
      top: 2,
      rows: ['......KKKKK.....', '.....KHHLHHK....', '.....KHhhSSK....', '.....KHh........'],
    },
  },
  ponytail: {
    label: 'Ponytail',
    back: {
      top: 5,
      rows: ['.............KHK', '.............KHK', '.............KhK', '..............K.'],
    },
    front: {
      top: 1,
      rows: [
        '.....KKKKKK.....',
        '....KHHLLHHK....',
        '...KHHHHHHHHKKK.',
        '...KHhSSSShHHHHK',
        '...KH......HK...',
      ],
    },
    side: {
      top: 1,
      rows: [
        '......KKKKK.....',
        '.....KHHLHHK....',
        '..KKKHHHHHHHK...',
        '.KHHHHHHHHhHK...',
        '.KHhKHHh........',
        '..KHKHHh........',
        '..KhK.K.........',
        '...K............',
      ],
    },
  },
  long: {
    label: 'Long',
    front: {
      top: 1,
      rows: [
        ...FRINGE,
        '...KH......HK...',
        '...KH......HK...',
        '...KH......HK...',
        '...KHK....KHK...',
        '...KHK....KHK...',
        '...KKK....KKK...',
      ],
    },
    side: {
      top: 1,
      rows: [
        ...SIDE_CROWN,
        '...KHHHh........',
        '...KHHHh........',
        '...KHHHh........',
        '...KHHHK........',
        '...KHHK.........',
        '...KhK..........',
        '....K...........',
      ],
    },
  },
};

// ─── Accessories ───────────────────────────────────────────────────────────

export interface AccessoryLayer {
  label: string;
  layer: SpriteLayer;
  /** Side-on, facing right: brims point forward. */
  side: SpriteLayer;
}

/** Signature items. Hats take the kit colour, so a character's look stays one palette. */
export const ACCESSORIES: Record<Accessory, AccessoryLayer> = {
  glasses: {
    label: 'Glasses',
    layer: { top: 5, rows: ['.....KlKKlK.....'] },
    side: { top: 5, rows: ['........KKlK....'] },
  },
  cap: {
    label: 'Cap',
    layer: {
      top: 1,
      rows: ['.....KKKKKK.....', '....KOOWWOOK....', '....KOOOOOOK....', '...KooooooooK...'],
    },
    side: {
      top: 1,
      rows: ['......KKKKK.....', '.....KOOWOOK....', '....KOOOOOOOK...', '....KOOOOOooooK.'],
    },
  },
  headband: {
    label: 'Headband',
    layer: { top: 3, rows: ['...KWWWWWWWWK...'] },
    side: { top: 3, rows: ['....KWWWWWWWK...'] },
  },
  visor: {
    label: 'Visor',
    layer: { top: 3, rows: ['...KOOOOOOOOK...', '...KooooooooK...'] },
    side: { top: 3, rows: ['....KOOOOOOOK...', '..........oooK..'] },
  },
  chef_hat: {
    label: "Chef's Hat",
    layer: {
      top: 0,
      rows: [
        '....KKKKKKKK....',
        '...KWWWWWWWWK...',
        '...KWWWWWWWWK...',
        '....KWWWWWWK....',
        '....KWWWWWWK....',
      ],
    },
    side: {
      top: 0,
      rows: [
        '.....KKKKKKK....',
        '....KWWWWWWWK...',
        '....KWWWWWWWK...',
        '.....KWWWWWK....',
        '.....KWWWWWK....',
      ],
    },
  },
};
