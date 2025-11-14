/**
 * Stat Card Component
 * Individual stat display with value and progress bar
 */

import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  max?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, max = 100 }) => {
  const percentage = Math.min(100, (value / max) * 100);

  // Color based on value
  const getColor = (val: number): string => {
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-blue-500';
    if (val >= 40) return 'bg-yellow-500';
    if (val >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-pixel-card border-2 border-pixel-border p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-pixel-text-muted uppercase tracking-wide">
          {label}
        </span>
        <span className="text-lg font-bold text-pixel-text">{value}</span>
      </div>
      <div className="h-2 bg-pixel-bg border-2 border-pixel-border">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
