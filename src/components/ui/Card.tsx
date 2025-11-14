/**
 * Card Component
 * Pixel art styled card container
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  padding = 'md',
}) => {
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-pixel-card border-4 border-pixel-border ${paddingStyles[padding]} ${className}`}
    >
      {title && (
        <h2 className="text-2xl font-bold mb-4 text-pixel-text border-b-4 border-pixel-border pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};
