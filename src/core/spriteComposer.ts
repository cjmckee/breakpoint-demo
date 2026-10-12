/**
 * Sprite Composer
 *
 * Turns an appearance + pose into coloured pixel runs, ready for any renderer. Pure: the
 * React `PixelSprite` draws the runs as SVG rects, and nothing here knows about React.
 *
 * Composition is paper-doll: layers are stamped onto one grid in order (hair back → body
 * → hair front → racquet), each layer's symbols resolved through the appearance's
 * palette, and the result mirrored for a left-hander.
 */

import type {
  Appearance,
  HairColor,
  HairStyle,
  KitColor,
  SkinTone,
  SpritePose,
} from '../types/appearance';
import {
  ACCESSORIES,
  HAIR_STYLES,
  POSE_FRAMES,
  SIDE_POSE_FRAMES,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type SpriteLayer,
} from '../data/sprites/layers';
import { GEAR_LOOKS } from '../data/sprites/gearLooks';
import {
  FIXED_COLORS,
  HAIR_COLORS,
  KIT_COLORS,
  SKIN_TONES,
  type SpriteSymbol,
} from '../data/sprites/palettes';

/** A horizontal run of same-coloured pixels: `w` cells starting at (`x`, `y`). */
export interface PixelRun {
  x: number;
  y: number;
  w: number;
  color: string;
}

export const DEFAULT_APPEARANCE: Appearance = {
  skinTone: 'fair',
  hairStyle: 'short',
  hairColor: 'brown',
  kitColor: 'white',
  handedness: 'right',
};

/** Resolve every palette symbol to a colour for this appearance. */
function paletteFor(appearance: Appearance): Record<SpriteSymbol, string> {
  const skin = SKIN_TONES[appearance.skinTone].ramp;
  const hair = HAIR_COLORS[appearance.hairColor].ramp;
  const kit = KIT_COLORS[appearance.kitColor].ramp;
  return {
    ...FIXED_COLORS,
    S: skin.base,
    s: skin.shade,
    H: hair.base,
    h: hair.shade,
    L: hair.light,
    O: kit.base,
    o: kit.shade,
  };
}

function isSpriteSymbol(ch: string, palette: Record<SpriteSymbol, string>): ch is SpriteSymbol {
  return ch in palette;
}

function stamp(
  canvas: (string | null)[][],
  layer: SpriteLayer,
  palette: Record<SpriteSymbol, string>,
  dy = 0,
): void {
  layer.rows.forEach((row, r) => {
    const y = layer.top + r + dy;
    if (y < 0 || y >= canvas.length) return;
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (isSpriteSymbol(ch, palette)) canvas[y][x] = palette[ch];
    }
  });
}

/** Number of frames in a pose's loop. */
export function spriteFrameCount(pose: SpritePose): number {
  return POSE_FRAMES[pose].length;
}

export interface ComposeOptions {
  /** False draws empty hands, for people who don't play. */
  racquet?: boolean;
  /**
   * Draw side-on, facing this way, instead of front-facing. The side view ignores
   * handedness: which way they face decides the mirror.
   */
  facing?: 'left' | 'right';
}

/**
 * Compose one frame of a character into pixel runs. `frame` wraps, so a caller can pass
 * an ever-increasing tick.
 */
export function composeSprite(
  appearance: Appearance,
  pose: SpritePose,
  frame = 0,
  { racquet = true, facing }: ComposeOptions = {},
): PixelRun[] {
  const side = facing !== undefined;
  const frames = (side ? SIDE_POSE_FRAMES : POSE_FRAMES)[pose];
  const poseFrame = frames[((frame % frames.length) + frames.length) % frames.length];
  const hair = HAIR_STYLES[appearance.hairStyle];
  const accessory = appearance.accessory ? ACCESSORIES[appearance.accessory] : null;
  const palette = paletteFor(appearance);

  const canvas: (string | null)[][] = Array.from({ length: SPRITE_HEIGHT }, () =>
    Array<string | null>(SPRITE_WIDTH).fill(null),
  );
  const headDy = poseFrame.headDy ?? 0;
  if (side) {
    stamp(canvas, poseFrame.body, palette);
    stamp(canvas, hair.side, palette, headDy);
    if (accessory) stamp(canvas, accessory.side, palette, headDy);
  } else {
    if (hair.back) stamp(canvas, hair.back, palette, headDy);
    stamp(canvas, poseFrame.body, palette);
    stamp(canvas, hair.front, palette, headDy);
    if (accessory) stamp(canvas, accessory.layer, palette, headDy);
  }
  if (racquet) stamp(canvas, poseFrame.racquet, palette);

  // A hop moves the whole figure; rows pushed off the grid are dropped.
  const dy = poseFrame.dy ?? 0;
  if (dy !== 0) {
    const empty = (): (string | null)[] => Array<string | null>(SPRITE_WIDTH).fill(null);
    const shifted = canvas.map((_, y) => canvas[y - dy] ?? empty());
    canvas.splice(0, canvas.length, ...shifted);
  }

  const mirror = side ? facing === 'left' : appearance.handedness === 'left';
  if (mirror) canvas.forEach((row) => row.reverse());

  const runs: PixelRun[] = [];
  canvas.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = row[x];
      if (color === null) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === color) w++;
      runs.push({ x, y, w, color });
      x += w;
    }
  });
  return runs;
}

// ─── Appearance helpers ────────────────────────────────────────────────────

/**
 * The look with equipped gear on: a hat becomes the accessory, an outfit recolours the
 * kit. Items without a gear look leave it alone.
 */
export function appearanceWithGear(
  appearance: Appearance,
  equipped: readonly ({ id: string } | null)[],
): Appearance {
  return equipped.reduce<Appearance>(
    (look, item) => (item && GEAR_LOOKS[item.id] ? { ...look, ...GEAR_LOOKS[item.id] } : look),
    appearance,
  );
}

export const SKIN_TONE_KEYS = Object.keys(SKIN_TONES) as SkinTone[];
export const HAIR_STYLE_KEYS = Object.keys(HAIR_STYLES) as HairStyle[];
export const HAIR_COLOR_KEYS = Object.keys(HAIR_COLORS) as HairColor[];
export const KIT_COLOR_KEYS = Object.keys(KIT_COLORS) as KitColor[];

/**
 * A random appearance. `roll` returns [0, 1); pass `Math.random` for a UI shuffle or a
 * seeded stream for a stable look.
 */
export function randomAppearance(roll: () => number): Appearance {
  const pick = <T>(options: readonly T[]): T => options[Math.floor(roll() * options.length)];
  return {
    skinTone: pick(SKIN_TONE_KEYS),
    hairStyle: pick(HAIR_STYLE_KEYS),
    hairColor: pick(HAIR_COLOR_KEYS),
    kitColor: pick(KIT_COLOR_KEYS),
    // Roughly one player in ten is left-handed, as on tour.
    handedness: roll() < 0.1 ? 'left' : 'right',
  };
}

/**
 * A stable appearance derived from a string (an opponent's name or id), so a character
 * without authored art still looks the same every time they appear. Uses its own small
 * PRNG rather than the simulation stream, so drawing a sprite never shifts match dice.
 */
export function appearanceFromSeed(seed: string): Appearance {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  const roll = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return randomAppearance(roll);
}
