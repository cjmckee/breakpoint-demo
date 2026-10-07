import React from 'react';

interface UnseenBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Marks something new to look at: an item, a hangout, a menu section.
 *
 * A still dot in the ball colour rather than a bouncing red "!". Red is the app's
 * accent and its loss colour, so a screen full of red markers read as a screen full
 * of problems, and seven bouncing badges at once pointed nowhere. Things the player
 * can actually claim say so in their own words ("2 ready to collect").
 */
export const UnseenBadge: React.FC<UnseenBadgeProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span
      className={`${sizeClass} block rounded-full bg-pixel-ball ring-2 ring-pixel-bg ${className}`}
      data-testid="unseen-badge"
      aria-label="New"
      role="img"
    />
  );
};
