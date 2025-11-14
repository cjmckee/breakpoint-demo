/**
 * Recent Activities Component
 * Displays activity history with icons and details
 */

import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Card } from './ui/Card';

export const RecentActivities: React.FC = () => {
  const activityHistory = useGameStore((state) => state.activityHistory);

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'training':
        return '🏋️';
      case 'match':
        return '🎾';
      case 'rest':
        return '😴';
      case 'tournament':
        return '🏆';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'training':
        return 'bg-blue-500 bg-opacity-10 border-blue-500';
      case 'match':
        return 'bg-green-500 bg-opacity-10 border-green-500';
      case 'rest':
        return 'bg-purple-500 bg-opacity-10 border-purple-500';
      case 'tournament':
        return 'bg-orange-500 bg-opacity-10 border-orange-500';
      default:
        return 'bg-gray-500 bg-opacity-10 border-gray-500';
    }
  };

  return (
    <Card title="Recent Activities" padding="md">
      {!activityHistory || activityHistory.length === 0 ? (
        <p className="text-pixel-text-muted text-center py-8">No recent activities</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activityHistory.slice(-10).reverse().map((activity, idx) => (
            <div
              key={`${activity.timestamp}-${idx}`}
              className={`border-2 ${getActivityColor(activity.type)} p-3 transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div>
                    <div className="font-bold text-pixel-text text-sm">
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </div>
                    {activity.type === 'training' && 'message' in activity && activity.message && (
                      <div className="text-xs text-pixel-text-muted">
                        {activity.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-pixel-text-muted">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Training specific details */}
              {activity.type === 'training' && 'statBoosts' in activity && (
                <div className="mt-2 pt-2 border-t-2 border-pixel-border">
                  <div className="text-xs text-pixel-text-muted mb-1">Stat Gains:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(activity.statBoosts)
                      .filter(([_, value]) => (value as number) > 0)
                      .map(([stat, value]) => (
                        <span
                          key={stat}
                          className="text-xs px-2 py-0.5 bg-green-500 bg-opacity-20 border border-green-500 text-green-500 font-bold"
                        >
                          +{value as number} {stat}
                        </span>
                      ))}
                  </div>
                  {activity.abilityGained && (
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-orange-500 bg-opacity-20 border border-orange-500 text-orange-500 font-bold">
                        🌟 Ability Gained: {activity.abilityGained}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Rest specific details */}
              {activity.type === 'rest' && 'energyRestored' in activity && (
                <div className="mt-2 pt-2 border-t-2 border-pixel-border">
                  <span className="text-xs text-green-500 font-bold">
                    +{activity.energyRestored} Energy Restored
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
