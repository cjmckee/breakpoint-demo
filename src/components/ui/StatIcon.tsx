/**
 * StatIcon
 *
 * Renders a stat as its canonical emoji, with the stat's name revealed on hover or
 * keyboard focus. Emoji alone is ambiguous to a screen reader (🩹 announces as
 * "adhesive bandage", not "Recovery"), so the name is always exposed via aria-label
 * and the raw glyph is hidden from the accessibility tree.
 *
 * Use `showLabel` when there's room for the name to sit alongside the icon; the
 * tooltip is then redundant and is suppressed.
 */

import React from 'react';
import type { StatName } from '../../types';
import { getStatIcon, formatStatName } from '../../config/statIcons';

interface StatIconProps {
  stat: StatName | string;
  /** Render the stat name next to the icon instead of only on hover. */
  showLabel?: boolean;
  /** Extra classes for the wrapper (sizing, spacing). */
  className?: string;
}

export const StatIcon: React.FC<StatIconProps> = ({ stat, showLabel = false, className = '' }) => {
  const label = formatStatName(stat);
  const icon = getStatIcon(stat);

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`group relative inline-flex cursor-help outline-none ${className}`}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap border-2 border-pixel-border bg-pixel-bg px-1.5 py-0.5 text-[11px] font-bold text-pixel-text opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {label}
      </span>
    </span>
  );
};
