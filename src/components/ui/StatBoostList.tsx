import React from 'react';

export const STAT_ICONS: Record<string, string> = {
  serve: '🎯',
  forehand: '🏃',
  backhand: '🏃',
  volley: '🖐️',
  overhead: '🙌',
  dropShot: '📉',
  slice: '🔪',
  return: '🔙',
  spin: '🔄',
  placement: '🎯',
  speed: '⚡',
  stamina: '💪',
  strength: '💪',
  agility: '🦘',
  focus: '🎯',
  anticipation: '👁️',
  shotVariety: '🎨',
  recovery: '🔄',
  offensive: '⚔️',
  defensive: '🛡️',
};

export function formatStatName(stat: string): string {
  return stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

interface StatBoostListProps {
  statBoosts: Record<string, number>;
  /**
   * compact — inline colored pills (+1 Forehand +1 Spin ...)
   * list    — single-col rows with icon + name + value
   * grid    — two-col rows with icon + name + value
   * result  — two-col green highlight boxes (training result modal style)
   */
  variant?: 'compact' | 'list' | 'grid' | 'result';
  showTotal?: boolean;
}

export const StatBoostList: React.FC<StatBoostListProps> = ({
  statBoosts,
  variant = 'list',
  showTotal = false,
}) => {
  const entries = Object.entries(statBoosts).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        {entries.map(([stat, value]) => (
          <span key={stat} className="text-green-500 font-bold">
            +{value} {formatStatName(stat)}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'result') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {entries.map(([stat, value]) => (
          <div
            key={stat}
            className="bg-green-500 bg-opacity-20 border-2 border-green-500 p-3 text-center"
          >
            <div className="text-2xl font-bold text-green-500">+{value}</div>
            <div className="text-sm text-pixel-text mt-1">{formatStatName(stat)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-1">
          {entries.map(([stat, value]) => (
            <div key={stat} className="flex items-center gap-1 text-sm">
              <span>{STAT_ICONS[stat] || '⭐'}</span>
              <span className="text-gray-300">{formatStatName(stat)}</span>
              <span className="text-green-400 ml-auto">+{value}</span>
            </div>
          ))}
        </div>
        {showTotal && (
          <div className="pt-2 border-t border-gray-700 flex justify-between text-sm">
            <span className="text-gray-400">Total Improvement</span>
            <span className="text-green-400">+{total}</span>
          </div>
        )}
      </div>
    );
  }

  // list (default)
  return (
    <div className="flex flex-col gap-1">
      {entries.map(([stat, value]) => (
        <div key={stat} className="flex items-center gap-2 text-sm">
          <span>{STAT_ICONS[stat] || '⭐'}</span>
          <span className="text-gray-300">{formatStatName(stat)}</span>
          <span className="text-green-400 ml-auto">+{value}</span>
        </div>
      ))}
    </div>
  );
};
