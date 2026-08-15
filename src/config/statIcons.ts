/**
 * Stat Icon Configuration
 *
 * The single source of truth for the emoji that represents each stat. A stat must
 * look the same everywhere it appears — a training card, an item's effect list, a
 * match summary — so this map is the only place a stat/emoji pairing is defined.
 *
 * Typing the map as `Record<StatName, string>` makes coverage a compile-time
 * guarantee: adding a stat to CoreStats/TechnicalStats/PhysicalStats/MentalStats
 * without giving it an icon fails the build.
 *
 * Two rules when editing:
 *   1. Every emoji must be unique — a glyph identifies exactly one stat.
 *   2. Never re-skin a stat locally. If an icon reads badly in some context, change
 *      it here so every screen moves together.
 */

import type { StatName } from '../types/index.js';

/** Canonical emoji for every stat. Unique per stat — see rules above. */
export const STAT_ICONS: Record<StatName, string> = {
  // Core — one per game phase
  serve: '🎾',
  forehand: '💪',
  backhand: '🤛',
  return: '↩️',
  net: '🥅',
  // Technical
  slice: '✂️',
  spin: '🌀',
  placement: '🎯',
  // Physical
  speed: '⚡',
  stamina: '🔋',
  strength: '🏋️',
  // Mental
  focus: '🧠',
  anticipation: '👁️',
  tactics: '♟️',
};

/** Placeholder for a stat key that isn't in the map (only reachable from untyped keys). */
export const UNKNOWN_STAT_ICON = '⭐';

/**
 * Icon lookup for stat keys that arrive as plain strings — e.g. `Object.entries()`
 * over a StatBoosts record, which widens keys to `string`.
 */
export function getStatIcon(stat: string): string {
  return STAT_ICONS[stat as StatName] ?? UNKNOWN_STAT_ICON;
}

/** camelCase stat key → display label ('shotVariety' → 'Shot Variety'). */
export function formatStatName(stat: string): string {
  return stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
