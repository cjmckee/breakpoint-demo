/**
 * Moving success windows for the training minigames.
 *
 * The success target moves each of the three attempts so the player has to re-time
 * every rep rather than muscle-memory one spot. Positions are randomized per session
 * for freshness, within a reachable band. See docs/training-redesign.md.
 */

export interface Band {
  lo: number;
  hi: number;
  center: number;
}

/**
 * Generate `count` success bands with randomized centers inside
 * [minCenter, maxCenter], each `width` wide.
 */
export function movingBands(
  minCenter: number,
  maxCenter: number,
  width: number,
  count = 3
): Band[] {
  const bands: Band[] = [];
  for (let i = 0; i < count; i++) {
    const center = minCenter + Math.random() * (maxCenter - minCenter);
    bands.push({ center, lo: center - width / 2, hi: center + width / 2 });
  }
  return bands;
}
