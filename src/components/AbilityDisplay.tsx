/**
 * Ability Display Component
 * Shows player abilities with rarity-based styling and hover tooltips
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Ability, AbilityRarity } from '../types/game';

interface AbilityDisplayProps {
  abilities: Ability[];
}

// Get rarity-specific styling
const getRarityStyle = (rarity: AbilityRarity = 'common') => {
  switch (rarity) {
    case 'legendary':
      return {
        borderColor: 'border-orange-500',
        bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
        darkBgColor: 'dark:from-orange-900/30 dark:to-orange-800/30',
        textColor: 'text-orange-700 dark:text-orange-300',
        shadow: 'shadow-lg shadow-orange-500/25',
        animation: 'animate-pixel-glow',
        hoverEffect: 'hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.3] hover:z-50',
      };
    case 'rare':
      return {
        borderColor: 'border-purple-500',
        bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
        darkBgColor: 'dark:from-purple-900/30 dark:to-purple-800/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        shadow: 'shadow-md shadow-purple-500/25',
        animation: '',
        hoverEffect: 'hover:shadow-lg hover:shadow-purple-500/35 hover:scale-105 hover:z-50',
      };
    case 'uncommon':
      return {
        borderColor: 'border-green-500',
        bgColor: 'bg-gradient-to-br from-green-100 to-green-200',
        darkBgColor: 'dark:from-green-900/30 dark:to-green-800/30',
        textColor: 'text-green-700 dark:text-green-300',
        shadow: 'shadow-sm shadow-green-500/25',
        animation: '',
        hoverEffect: 'hover:shadow-md hover:shadow-green-500/30 hover:scale-105 hover:z-50',
      };
    default: // common
      return {
        borderColor: 'border-blue-500',
        bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
        darkBgColor: 'dark:from-blue-900/30 dark:to-blue-800/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        shadow: 'shadow-sm shadow-blue-500/25',
        animation: '',
        hoverEffect: 'hover:shadow-md hover:shadow-blue-500/30 hover:scale-105 hover:z-50',
      };
  }
};

// Get rarity label for display
const getRarityLabel = (rarity: AbilityRarity = 'common') => {
  switch (rarity) {
    case 'legendary':
      return 'Legendary';
    case 'rare':
      return 'Rare';
    case 'uncommon':
      return 'Uncommon';
    default:
      return 'Common';
  }
};

export const AbilityDisplay: React.FC<AbilityDisplayProps> = ({ abilities }) => {
  const [hoveredAbility, setHoveredAbility] = useState<Ability | null>(null);

  // Memoize ability hover handlers
  const handleAbilityHover = useCallback((ability: Ability | null) => {
    setHoveredAbility(ability);
  }, []);

  // Memoize ability cards to prevent unnecessary re-renders
  const abilityCards = useMemo(() => {
    return abilities.map((ability, idx) => {
      const style = getRarityStyle(ability.rarity);

      return (
        <div
          key={idx}
          className={`
            p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-out
            ${style.borderColor} ${style.bgColor} ${style.darkBgColor} ${style.shadow} ${style.animation}
            ${style.hoverEffect}
            transform-gpu will-change-transform
          `}
          onMouseEnter={() => handleAbilityHover(ability)}
          onMouseLeave={() => handleAbilityHover(null)}
        >
          <div className="flex justify-between items-start mb-2">
            <h5 className={`font-bold text-sm ${style.textColor} transition-colors duration-200`}>
              {ability.name}
            </h5>
            <span
              className={`text-xs px-2 py-1 rounded ${style.textColor} font-mono bg-pixel-bg/50`}
            >
              Lv.{ability.level || 1}
            </span>
          </div>
          <div className={`text-xs ${style.textColor} opacity-75 transition-opacity duration-200 capitalize`}>
            {getRarityLabel(ability.rarity)}
          </div>
        </div>
      );
    });
  }, [abilities, handleAbilityHover]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {abilityCards}
      </div>

      {/* Enhanced Ability Tooltip */}
      {hoveredAbility && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={`
              bg-pixel-primary/95 backdrop-blur-sm border-4 p-6 max-w-lg pointer-events-auto animate-pixel-scale shadow-xl
              rounded-lg
              ${
                hoveredAbility.rarity === 'legendary'
                  ? 'border-orange-500'
                  : hoveredAbility.rarity === 'rare'
                    ? 'border-purple-500'
                    : hoveredAbility.rarity === 'uncommon'
                      ? 'border-green-500'
                      : 'border-blue-500'
              }
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-bold text-pixel-text text-lg">
                {hoveredAbility.name}
              </h5>
              <span
                className={`text-xs px-2 py-1 rounded text-white font-bold`}
                style={{
                  backgroundColor:
                    hoveredAbility.rarity === 'legendary'
                      ? '#ea580c'
                      : hoveredAbility.rarity === 'rare'
                        ? '#a855f7'
                        : hoveredAbility.rarity === 'uncommon'
                          ? '#22c55e'
                          : '#3b82f6',
                }}
              >
                Lv.{hoveredAbility.level || 1}
              </span>
            </div>
            <div className="text-xs text-pixel-text-muted mb-3 capitalize">
              {getRarityLabel(hoveredAbility.rarity)} rarity
            </div>
            {hoveredAbility.description && (
              <p className="text-sm text-pixel-text mb-3 leading-relaxed">
                {hoveredAbility.description}
              </p>
            )}
            {hoveredAbility.effects && (
              <div className="text-xs text-pixel-text-muted">
                <span className="font-semibold">Effects:</span> {hoveredAbility.effects}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
