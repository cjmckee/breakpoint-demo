/**
 * Sprite layer grids — the paper doll.
 *
 * Every character is a stack of layers drawn on the same 16×21 grid, front-facing and
 * right-handed: hair (back) → body → hair (front) → accessory → racquet. Left-handers are the same
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
  '....KooKKooK....',
  '....KKKKKKKK....',
];

const LEGS_STRIDE: readonly string[] = [
  '....KSKKKKSK....',
  '...KSK....KSK...',
  '...KWK....KWK...',
  '..KooK....KooK..',
  '..KKK......KKK..',
];

const body = (...parts: (readonly string[])[]): SpriteLayer => ({ top: 0, rows: parts.flat() });

const BODY_IDLE = body(HEAD, TORSO, LEGS_STAND);
const BODY_BLINK = body(HEAD_BLINK, TORSO, LEGS_STAND);
const BODY_RUN = body(HEAD, TORSO, LEGS_STRIDE);
const BODY_SWING = body(HEAD, TORSO_SWING, LEGS_STRIDE);

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

// ─── Poses ─────────────────────────────────────────────────────────────────

export interface PoseFrame {
  body: SpriteLayer;
  racquet: SpriteLayer;
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
};

// ─── Hair ──────────────────────────────────────────────────────────────────

export interface HairLayers {
  label: string;
  /** Drawn before the body, so it shows only around the silhouette (a ponytail). */
  back?: SpriteLayer;
  front: SpriteLayer;
}

const FRINGE: readonly string[] = [
  '.....KKKKKK.....',
  '....KHHLLHHK....',
  '...KHHHHHHHHK...',
  '...KHHhHHhHHK...',
];

export const HAIR_STYLES: Record<HairStyle, HairLayers> = {
  short: {
    label: 'Short',
    front: { top: 1, rows: [...FRINGE, '...KH......HK...'] },
  },
  buzz: {
    label: 'Buzz',
    front: {
      top: 2,
      rows: ['.....KKKKKK.....', '....KHHLHHHK....', '....KhSSSShK....'],
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
  },
};

// ─── Accessories ───────────────────────────────────────────────────────────

export interface AccessoryLayer {
  label: string;
  layer: SpriteLayer;
}

/** Signature items. Hats take the kit colour, so a character's look stays one palette. */
export const ACCESSORIES: Record<Accessory, AccessoryLayer> = {
  glasses: {
    label: 'Glasses',
    layer: { top: 5, rows: ['.....KlKKlK.....'] },
  },
  cap: {
    label: 'Cap',
    layer: {
      top: 1,
      rows: ['.....KKKKKK.....', '....KOOWWOOK....', '....KOOOOOOK....', '...KooooooooK...'],
    },
  },
  headband: {
    label: 'Headband',
    layer: { top: 3, rows: ['...KWWWWWWWWK...'] },
  },
  visor: {
    label: 'Visor',
    layer: { top: 3, rows: ['...KOOOOOOOOK...', '...KooooooooK...'] },
  },
};
