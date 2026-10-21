/**
 * Stat icon lookup. The grids themselves are `STAT_ICONS` in src/data/pixelIcons.ts,
 * typed `Record<StatName, PixelGrid>` so a new stat without an icon fails the build.
 * Never re-skin a stat locally: if an icon reads badly somewhere, redraw it there so
 * every screen moves together.
 */

import type { StatName } from '../types';
import { STAT_ICONS, UNKNOWN_STAT_ICON, type PixelGrid } from '../data/pixelIcons';

/**
 * Icon lookup for stat keys that arrive as plain strings — e.g. `Object.entries()`
 * over a StatBoosts record, which widens keys to `string`.
 */
export function getStatIcon(stat: string): PixelGrid {
  return STAT_ICONS[stat as StatName] ?? UNKNOWN_STAT_ICON;
}

/** camelCase stat key → display label ('shotVariety' → 'Shot Variety'). */
export function formatStatName(stat: string): string {
  return stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
