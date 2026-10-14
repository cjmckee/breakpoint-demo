/**
 * Appearance types for pixel-art characters.
 *
 * An appearance is a handful of keys, not colours or pixels: the keys index into the
 * palettes and layer grids in `src/data/sprites/`, so a save stores intent ("auburn
 * ponytail") and the art can be redrawn without touching anyone's save.
 */

export type SkinTone = 'porcelain' | 'fair' | 'tan' | 'brown' | 'deep';

export type HairStyle = 'short' | 'buzz' | 'ponytail' | 'long';

export type HairColor = 'black' | 'brown' | 'auburn' | 'blonde' | 'ginger' | 'silver';

export type KitColor = 'white' | 'navy' | 'crimson' | 'forest' | 'sky' | 'violet';

export type Handedness = 'right' | 'left';

/**
 * An item drawn over the head: a key character's signature, or the player's equipped hat.
 * Not offered in the creator.
 */
export type Accessory = 'glasses' | 'cap' | 'headband' | 'visor' | 'chef_hat';

/** Colours for gear that shows on the sprite: racquet frames and shoes. */
export type GearColor =
  'red' | 'black' | 'white' | 'gold' | 'blue' | 'green' | 'orange' | 'silver' | 'clay';

export interface Appearance {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  kitColor: KitColor;
  /** Which hand holds the racquet; mirrors the racquet layer. */
  handedness: Handedness;
  accessory?: Accessory;
  /** Racquet frame colour from equipped gear; the classic red when unset. */
  racquetColor?: GearColor;
  /** Shoe colour from equipped gear; a shade of the kit when unset. */
  shoeColor?: GearColor;
}

/** A sprite pose. Each pose has one or more frames that the renderer cycles through. */
export type SpritePose = 'idle' | 'run' | 'swing' | 'cheer' | 'slump';
