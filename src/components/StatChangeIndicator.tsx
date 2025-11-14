/**
 * Stat Change Indicator Component
 * Shows floating notifications when stats change
 */

import React, { useEffect, useState } from 'react';

interface StatChange {
  stat: string;
  change: number;
  timestamp: number;
}

interface StatChangeIndicatorProps {
  changes: StatChange[];
}

export const StatChangeIndicator: React.FC<StatChangeIndicatorProps> = ({ changes }) => {
  const [visibleChanges, setVisibleChanges] = useState<
    Array<StatChange & { id: string; removing: boolean }>
  >([]);

  useEffect(() => {
    if (changes.length > 0) {
      const newChanges = changes.map((change) => ({
        ...change,
        id: `${change.stat}-${change.timestamp}-${Math.random()}`,
        removing: false,
      }));

      setVisibleChanges((prev) => [...prev, ...newChanges]);

      // Start removing after 2 seconds
      const removeTimer = setTimeout(() => {
        setVisibleChanges((prev) =>
          prev.map((item) =>
            newChanges.find((nc) => nc.id === item.id)
              ? { ...item, removing: true }
              : item
          )
        );
      }, 2000);

      // Actually remove after animation completes
      const clearTimer = setTimeout(() => {
        setVisibleChanges((prev) =>
          prev.filter((item) => !newChanges.find((nc) => nc.id === item.id))
        );
      }, 2500);

      return () => {
        clearTimeout(removeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [changes]);

  if (visibleChanges.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {visibleChanges.map((change, index) => (
        <div
          key={change.id}
          className={`
            px-4 py-2 border-4 font-bold text-lg
            ${change.change > 0 ? 'bg-green-500 border-green-700 text-white' : 'bg-red-500 border-red-700 text-white'}
            ${change.removing ? 'animate-fade-out' : 'animate-slide-in'}
          `}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          {change.change > 0 ? '+' : ''}
          {change.change} {change.stat}
        </div>
      ))}
    </div>
  );
};

// Helper hook to track stat changes
export const useStatChanges = () => {
  const [statChanges, setStatChanges] = useState<StatChange[]>([]);

  const addStatChange = (stat: string, change: number) => {
    setStatChanges((prev) => [...prev, { stat, change, timestamp: Date.now() }]);

    // Clear after adding to trigger useEffect
    setTimeout(() => {
      setStatChanges([]);
    }, 100);
  };

  return { statChanges, addStatChange };
};
