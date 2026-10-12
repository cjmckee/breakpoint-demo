/**
 * Sprite palettes.
 *
 * Layer grids (see `layers.ts`) are drawn in placeholder symbols, not colours. A symbol is
 * either fixed (outline, socks, racquet) or a slot that the character's appearance fills
 * in — so one hairstyle drawing covers every hair colour, and one body covers every skin
 * tone and kit.
 */

import type { HairColor, KitColor, SkinTone } from '../../types/appearance';

/** Placeholder symbols used in layer grids. `.` is transparent. */
export type SpriteSymbol =
  | 'K' // outline
  | 'E' // eye
  | 'S' // skin
  | 's' // skin shade
  | 'H' // hair
  | 'h' // hair shade
  | 'L' // hair highlight
  | 'O' // kit
  | 'o' // kit shade
  | 'P' // shorts
  | 'W' // socks
  | 'R' // racquet frame
  | 'G' // racquet strings
  | 'T' // racquet grip
  | 'l'; // glasses lens

interface Ramp {
  base: string;
  shade: string;
}

interface HairRamp extends Ramp {
  light: string;
}

/** A labelled colour choice, as offered by the player creator. */
interface PaletteEntry<R> {
  label: string;
  ramp: R;
}

export const SKIN_TONES: Record<SkinTone, PaletteEntry<Ramp>> = {
  porcelain: { label: 'Porcelain', ramp: { base: '#f6dcc8', shade: '#e0b49a' } },
  fair: { label: 'Fair', ramp: { base: '#f1c27d', shade: '#d49c5e' } },
  tan: { label: 'Tan', ramp: { base: '#d39b6a', shade: '#ad744a' } },
  brown: { label: 'Brown', ramp: { base: '#a86b45', shade: '#83502f' } },
  deep: { label: 'Deep', ramp: { base: '#6e4129', shade: '#4f2d1b' } },
};

export const HAIR_COLORS: Record<HairColor, PaletteEntry<HairRamp>> = {
  black: { label: 'Black', ramp: { base: '#3b3b4c', shade: '#26262f', light: '#62627a' } },
  brown: { label: 'Brown', ramp: { base: '#6b4226', shade: '#4e2f1a', light: '#8f5c37' } },
  auburn: { label: 'Auburn', ramp: { base: '#8f3a24', shade: '#6b2818', light: '#b8553b' } },
  blonde: { label: 'Blonde', ramp: { base: '#e3bf5f', shade: '#c09a40', light: '#f6e3a0' } },
  ginger: { label: 'Ginger', ramp: { base: '#d9762b', shade: '#ad571b', light: '#f29d55' } },
  silver: { label: 'Silver', ramp: { base: '#c3c7d3', shade: '#989cab', light: '#eef0f5' } },
};

export const KIT_COLORS: Record<KitColor, PaletteEntry<Ramp>> = {
  white: { label: 'White', ramp: { base: '#f2f2f2', shade: '#c4c8d4' } },
  navy: { label: 'Navy', ramp: { base: '#34499c', shade: '#233371' } },
  crimson: { label: 'Crimson', ramp: { base: '#c8392b', shade: '#922a20' } },
  forest: { label: 'Forest', ramp: { base: '#2e8b57', shade: '#1f6640' } },
  sky: { label: 'Sky', ramp: { base: '#4fb3e8', shade: '#3389b8' } },
  violet: { label: 'Violet', ramp: { base: '#8e5cc8', shade: '#6a3fa0' } },
};

/** Symbols whose colour never changes with appearance. */
export const FIXED_COLORS = {
  K: '#1b1b2a',
  E: '#1b1b2a',
  P: '#2b2d42',
  W: '#f4f4f4',
  R: '#e94560',
  G: '#e8e8e8',
  T: '#3b3b4f',
  l: '#cfe6ff',
} as const satisfies Partial<Record<SpriteSymbol, string>>;
