/**
 * Button Component
 * Pixel art styled button with different variants
 */

import React from 'react';
import { audioManager } from '../../audio/AudioManager';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
}) => {
  const baseStyles =
    'font-bold border-4 transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

  const variantStyles = {
    primary:
      'bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light active:translate-y-1',
    secondary:
      'bg-pixel-secondary border-pixel-secondary-dark text-white hover:bg-pixel-secondary-light active:translate-y-1',
    danger:
      'bg-red-600 border-red-800 text-white hover:bg-red-500 active:translate-y-1',
    success:
      'bg-green-600 border-green-800 text-white hover:bg-green-500 active:translate-y-1',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

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
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} truncate ${className}`}
    >
      {children}
    </button>
  );
};
