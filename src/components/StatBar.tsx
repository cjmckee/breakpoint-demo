/**
 * Stat Bar Component
 * Horizontal progress bar for experience stats
 */

import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  isExperience?: boolean;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  max = 1000,
  isExperience = false,
}) => {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="bg-pixel-card border-2 border-pixel-border p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-pixel-text">{label}</span>
        <span className="text-sm font-bold text-pixel-text-muted">
          {value} / {max}
        </span>
      </div>
      <div className="h-4 bg-pixel-bg border-2 border-pixel-border">
        <div
          className="h-full bg-pixel-accent transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
