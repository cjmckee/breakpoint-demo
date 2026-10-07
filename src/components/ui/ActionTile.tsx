/**
 * Action Tile Component
 * Pixel-styled hub button: icon, label, and a status caption (energy cost/gain,
 * or the reason it's unavailable) baked into the tile so the state is visible
 * without reading button text elsewhere.
 */

import React from 'react';
import { audioManager } from '../../audio/AudioManager';
import { UnseenBadge } from './UnseenBadge';

interface ActionTileProps {
  icon: string;
  label: string;
  /** Status line under the label: cost, gain, or reason unavailable */
  caption?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Show the "new" dot in the top-right corner. Never shown on a disabled tile. */
  badge?: boolean;
  size?: 'lg' | 'sm';
  variant?: 'primary' | 'secondary' | 'success';
  className?: string;
  /** Pointer or focus entered (true) or left (false) — drives the energy preview. */
  onHoverChange?: (hovering: boolean) => void;
  /** Stable hook for e2e. See the test id convention in CLAUDE.md. */
  testId?: string;
}

export const ActionTile: React.FC<ActionTileProps> = ({
  icon,
  label,
  caption,
  onClick,
  disabled = false,
  badge = false,
  size = 'lg',
  variant = 'primary',
  className = '',
  onHoverChange,
  testId,
}) => {
  const variantStyles = {
    primary: 'bg-pixel-accent border-pixel-accent-dark hover:bg-pixel-accent-light',
    secondary: 'bg-pixel-secondary border-pixel-secondary-dark hover:bg-pixel-secondary-light',
    success: 'bg-green-600 border-green-800 hover:bg-green-500',
  };

  const sizeStyles = size === 'lg' ? 'p-3 sm:p-4 gap-1.5' : 'p-2 sm:p-2.5 gap-1';
  const iconStyles = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl';
  const labelStyles = size === 'lg' ? 'text-sm sm:text-base' : 'text-[10px] sm:text-sm';
  const captionStyles = size === 'lg' ? 'text-[10px] sm:text-xs' : 'text-[9px] sm:text-[10px]';

  const handleClick = () => {
    if (!disabled) {
      audioManager.playSfx('ui_click');
      onClick?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      data-testid={testId}
      // Disabled tiles drop their colour altogether: a faded red Play Match still read
      // as a primary action. Grey says "not now"; the caption says why.
      className={`relative flex flex-col items-center justify-center border-4 font-bold transition-all duration-150 ease-in-out ${
        disabled
          ? 'cursor-not-allowed bg-pixel-card border-pixel-border text-pixel-text-muted'
          : `cursor-pointer text-white active:translate-y-1 ${variantStyles[variant]}`
      } ${sizeStyles} ${className}`}
    >
      {badge && !disabled && <UnseenBadge className="absolute top-1.5 right-1.5 z-10" />}
      <span className={`${iconStyles} leading-none ${disabled ? 'grayscale opacity-60' : ''}`}>
        {icon}
      </span>
      <span className={`${labelStyles} leading-tight text-center`}>{label}</span>
      {caption && (
        <span className={`${captionStyles} font-normal opacity-90 leading-tight text-center`}>
          {caption}
        </span>
      )}
    </button>
  );
};
