/**
 * Card Component
 * Pixel art styled card container
 */

import React, { useState } from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  padding = 'md',
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

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
        collapsible ? (
          <button
            className={`w-full flex items-center justify-between border-b-4 border-pixel-border pb-2 ${collapsed ? '' : 'mb-4'}`}
            onClick={() => setCollapsed((c) => !c)}
          >
            <h2 className="text-2xl font-bold text-pixel-text">{title}</h2>
            <span className="text-pixel-text-muted text-sm ml-2">{collapsed ? '▼' : '▲'}</span>
          </button>
        ) : (
          <h2 className="text-2xl font-bold mb-4 text-pixel-text border-b-4 border-pixel-border pb-2">
            {title}
          </h2>
        )
      )}
      {(!collapsible || !collapsed) && children}
    </div>
  );
};
