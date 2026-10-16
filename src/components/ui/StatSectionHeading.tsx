/**
 * A stat section's heading: its pixel icon and name in the section's colour,
 * over a rule of the same colour. The same on every screen that lists stats.
 */

import React from 'react';
import type { StatSectionInfo } from '../../config/statSections';
import { PixelIcon } from './PixelIcon';

interface StatSectionHeadingProps {
  section: StatSectionInfo;
  /** Anything to sit at the right end of the heading, such as the section's grade. */
  trailing?: React.ReactNode;
  className?: string;
}

export const StatSectionHeading: React.FC<StatSectionHeadingProps> = ({
  section,
  trailing,
  className = '',
}) => (
  <h2
    className={`flex items-center gap-2 pb-1.5 mb-2 border-b-2 text-xs font-bold uppercase tracking-wider ${className}`}
    style={{ color: section.color, borderColor: section.color }}
    data-testid={`stat-section-${section.id}`}
  >
    <PixelIcon grid={section.icon} scale={2} />
    <span className="flex-1">{section.label}</span>
    {trailing}
  </h2>
);
