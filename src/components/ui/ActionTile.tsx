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
  /** Show the attention badge in the top-right corner */
  badge?: boolean;
  size?: 'lg' | 'sm';
  variant?: 'primary' | 'secondary' | 'success';
  className?: string;
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
      className={`relative flex flex-col items-center justify-center border-4 text-white font-bold transition-all duration-150 ease-in-out cursor-pointer active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {badge && <UnseenBadge className="absolute -top-2 -right-2 z-10" />}
      <span className={`${iconStyles} leading-none`}>{icon}</span>
      <span className={`${labelStyles} leading-tight text-center`}>{label}</span>
      {caption && (
        <span className={`${captionStyles} font-normal opacity-90 leading-tight text-center`}>
          {caption}
        </span>
      )}
    </button>
  );
};
