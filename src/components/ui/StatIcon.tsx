/**
 * StatIcon
 *
 * Renders a stat as its pixel icon, with the stat's name revealed on hover or
 * keyboard focus. The icon says nothing to a screen reader, so the name is always
 * exposed via aria-label.
 *
 * Use `showLabel` when there's room for the name to sit alongside the icon; the
 * tooltip is then redundant and is suppressed.
 */

import React from 'react';
import type { StatName } from '../../types';
import { getStatIcon, formatStatName } from '../../config/statIcons';
import { PixelIcon } from './PixelIcon';

interface StatIconProps {
  stat: StatName | string;
  /** Render the stat name next to the icon instead of only on hover. */
  showLabel?: boolean;
  /**
   * Drop the icon out of the tab order and hide it from assistive tech, keeping the
   * hover tooltip. Use inside a button or link that already names its own contents —
   * a focusable element nested in a button is invalid and adds a stray tab stop.
   */
  decorative?: boolean;
  /** Extra classes for the wrapper (sizing, spacing). */
  className?: string;
}

export const StatIcon: React.FC<StatIconProps> = ({
  stat,
  showLabel = false,
  decorative = false,
  className = '',
}) => {
  const label = formatStatName(stat);
  const icon = getStatIcon(stat);

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <PixelIcon grid={icon} scale={1} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`group relative inline-flex cursor-help outline-none ${className}`}
      {...(decorative
        ? { 'aria-hidden': true as const }
        : { tabIndex: 0, role: 'img', 'aria-label': label })}
    >
      <PixelIcon grid={icon} scale={1} />
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap border-2 border-pixel-border bg-pixel-bg px-1.5 py-0.5 text-[11px] font-bold text-pixel-text opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {label}
      </span>
    </span>
  );
};
