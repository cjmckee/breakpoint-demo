import React from 'react';

interface UnseenBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export const UnseenBadge: React.FC<UnseenBadgeProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <span
      className={`${sizeClass} bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-bounce ${className}`}
    >
      !
    </span>
  );
};
