/**
 * Stat Card Component
 * Displays stats with A-F letter grades, animations, and visual effects
 */

import React, { useMemo } from 'react';
import { getLetterGrade } from '../utils/playerStats';

interface StatCardProps {
  label: string;
  value: number;
  max?: number;
  showChange?: boolean;
  changeValue?: number;
  boost?: number; // Persistent boost from items/abilities
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  max = 100,
  showChange = false,
  changeValue = 0,
  boost = 0,
}) => {
  // Memoize grade style calculation
  const gradeStyle = useMemo(() => {
    const { grade, color } = getLetterGrade(value);
    const glow = value >= 90;

    // Calculate pulse intensity based on value (0-1 scale)
    const pulseIntensity = Math.min(value / 100, 1);

    // Determine bounce animation based on stat value
    const getBounceAnimation = (val: number) => {
      if (val < 70) return null; // No bounce for grades below B
      if (val >= 95) return 'animate-bounce-intense'; // A+ (95-100)
      if (val >= 90) return 'animate-bounce-strong'; // A (90-94)
      if (val >= 80) return 'animate-bounce-medium'; // B+ and A- (80-89)
      return 'animate-bounce-subtle'; // B and B- (70-79)
    };

    const bounceAnimation = getBounceAnimation(value);

    // 3D effect intensity increases with value
    const threeDIntensity = Math.min(value / 100, 1);

    return {
      display: grade,
      color,
      textShadow: glow
        ? `0 0 8px ${color}`
        : `0 ${Math.floor(threeDIntensity * 3)}px ${Math.floor(threeDIntensity * 6)}px rgba(0,0,0,0.3)`,
      fontSize:
        value >= 90
          ? 'text-4xl'
          : value >= 80
            ? 'text-3xl'
            : value >= 70
              ? 'text-2xl'
              : 'text-xl',
      fontWeight:
        value >= 90
          ? 'font-black'
          : value >= 80
            ? 'font-bold'
            : 'font-semibold',
      pulseIntensity,
      bounceAnimation,
      threeDIntensity,
    };
  }, [value]);

  // Generate CSS custom properties for animations
  const cardStyle = {
    '--pulse-intensity': gradeStyle.pulseIntensity,
    '--three-d-intensity': gradeStyle.threeDIntensity,
    '--stat-color': gradeStyle.color,
  } as React.CSSProperties;

  return (
    <div
      className={`
        relative p-3 sm:p-4 rounded-lg border-2 border-pixel-border
        bg-pixel-card
        transition-all duration-300
        ${gradeStyle.bounceAnimation || ''}
      `}
      style={cardStyle}
    >
      {/* Stat Label */}
      <div className="text-center mb-2">
        <h4 className="text-xs sm:text-sm font-medium text-pixel-text-muted uppercase tracking-wide truncate">
          {label}
        </h4>
      </div>

      {/* Grade Display */}
      <div className="text-center mb-2">
        <span
          className={`
            ${gradeStyle.fontSize} ${gradeStyle.fontWeight}
            transition-all duration-300 inline-block transform-gpu
            ${gradeStyle.pulseIntensity > 0.7 ? 'animate-pulse-heartbeat' : ''}
          `}
          style={
            {
              color: gradeStyle.color,
              textShadow: gradeStyle.textShadow,
              transform: `perspective(100px) rotateX(${gradeStyle.threeDIntensity * 5}deg)`,
              '--pulse-intensity': gradeStyle.pulseIntensity,
            } as React.CSSProperties
          }
        >
          {gradeStyle.display}
        </span>
      </div>

      {/* Numerical Value */}
      <div className="text-center">
        <span className="text-xs text-pixel-text-muted font-mono">
          {value}
        </span>
        {boost > 0 && (
          <span className="text-xs font-bold text-cyan-400 ml-1 font-mono">
            +{boost}
          </span>
        )}
      </div>

      {/* Change Indicator */}
      {showChange && changeValue !== 0 && (
        <div className="absolute top-2 right-2">
          <span
            className={`text-xs font-bold transition-all duration-500 ${
              changeValue > 0
                ? 'animate-stat-increase text-green-500'
                : 'animate-stat-decrease text-red-500'
            }`}
          >
            {changeValue > 0 ? '+' : ''}
            {changeValue}
          </span>
        </div>
      )}
    </div>
  );
};
