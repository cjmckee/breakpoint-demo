/**
 * Ability Display Component
 * Shows player abilities as a rarity-styled matrix. Hovering an ability (desktop) or
 * tapping it (mobile) opens a focused centered detail overlay — tap outside or press
 * Escape to dismiss on touch devices.
 */

import React, { useEffect, useState } from 'react';
import type { Ability } from '../types/game';
import { AbilityRarity } from '../types/game';

interface AbilityDisplayProps {
  abilities: Ability[];
}

export function formatAbilityName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Touch-only devices can't hover, so they toggle the detail overlay on tap instead.
const canHover =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover)').matches;

// Get rarity-specific styling
const getRarityStyle = (rarity: AbilityRarity = AbilityRarity.COMMON) => {
  switch (rarity) {
    case AbilityRarity.LEGENDARY:
      return {
        borderColor: 'border-orange-500',
        bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
        darkBgColor: 'dark:from-orange-900/30 dark:to-orange-800/30',
        textColor: 'text-orange-700 dark:text-orange-300',
        shadow: 'shadow-lg shadow-orange-500/25',
        animation: 'animate-pixel-glow',
        hoverEffect: 'hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.3] hover:z-50',
      };
    case AbilityRarity.RARE:
      return {
        borderColor: 'border-purple-500',
        bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
        darkBgColor: 'dark:from-purple-900/30 dark:to-purple-800/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        shadow: 'shadow-md shadow-purple-500/25',
        animation: '',
        hoverEffect: 'hover:shadow-lg hover:shadow-purple-500/35 hover:scale-105 hover:z-50',
      };
    case AbilityRarity.UNCOMMON:
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
const getRarityLabel = (rarity: AbilityRarity = AbilityRarity.COMMON) => {
  switch (rarity) {
    case AbilityRarity.LEGENDARY:
      return 'Legendary';
    case AbilityRarity.RARE:
      return 'Rare';
    case AbilityRarity.UNCOMMON:
      return 'Uncommon';
    default:
      return 'Common';
  }
};

export const AbilityDisplay: React.FC<AbilityDisplayProps> = ({ abilities }) => {
  const [selected, setSelected] = useState<Ability | null>(null);

  // On touch devices, dismiss the overlay on Escape (outside taps are handled by the
  // backdrop). Hover devices clear it naturally on mouse-leave.
  useEffect(() => {
    if (!selected || canHover) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selected]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {abilities.map((ability, idx) => {
          const style = getRarityStyle(ability.rarity);

          const interactionHandlers = canHover
            ? {
                onMouseEnter: () => setSelected(ability),
                onMouseLeave: () => setSelected(null),
                onFocus: () => setSelected(ability),
                onBlur: () => setSelected(null),
              }
            : {
                onClick: () => setSelected((prev) => (prev === ability ? null : ability)),
              };

          return (
            <button
              key={idx}
              type="button"
              aria-label={`${formatAbilityName(ability.name)} — ${getRarityLabel(ability.rarity)}`}
              className={`
                text-left p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-out
                ${style.borderColor} ${style.bgColor} ${style.darkBgColor} ${style.shadow} ${style.animation}
                ${style.hoverEffect}
                transform-gpu will-change-transform
                focus:outline-none focus-visible:ring-2 focus-visible:ring-pixel-accent
              `}
              {...interactionHandlers}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h5 className={`font-bold text-sm ${style.textColor} transition-colors duration-200`}>
                  {formatAbilityName(ability.name)}
                </h5>
                <span
                  className={`text-xs px-2 py-1 rounded ${style.textColor} font-mono bg-pixel-bg/50 shrink-0`}
                >
                  Lv.{ability.level || 1}
                </span>
              </div>
              <div className={`text-xs ${style.textColor} opacity-75 transition-opacity duration-200 capitalize`}>
                {getRarityLabel(ability.rarity)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Focused detail overlay */}
      {selected && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 ${
            canHover ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          onClick={canHover ? undefined : () => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`
              bg-pixel-primary/95 backdrop-blur-sm border-4 p-6 max-w-lg pointer-events-auto animate-pixel-scale shadow-xl
              rounded-lg mx-4
              ${
                selected.rarity === AbilityRarity.LEGENDARY
                  ? 'border-orange-500'
                  : selected.rarity === AbilityRarity.RARE
                    ? 'border-purple-500'
                    : selected.rarity === AbilityRarity.UNCOMMON
                      ? 'border-green-500'
                      : 'border-blue-500'
              }
            `}
          >
            <div className="flex justify-between items-start mb-2 gap-3">
              <h5 className="font-bold text-pixel-text text-lg">
                {formatAbilityName(selected.name)}
              </h5>
              <span
                className="text-xs px-2 py-1 rounded text-white font-bold shrink-0"
                style={{
                  backgroundColor:
                    selected.rarity === AbilityRarity.LEGENDARY
                      ? '#ea580c'
                      : selected.rarity === AbilityRarity.RARE
                        ? '#a855f7'
                        : selected.rarity === AbilityRarity.UNCOMMON
                          ? '#22c55e'
                          : '#3b82f6',
                }}
              >
                Lv.{selected.level || 1}
              </span>
            </div>
            <div className="text-xs text-pixel-text-muted mb-3 capitalize">
              {getRarityLabel(selected.rarity)} rarity
            </div>
            {selected.description && (
              <p className="text-sm text-pixel-text mb-3 leading-relaxed">
                {selected.description}
              </p>
            )}
            {selected.effects && (
              <div className="text-xs text-pixel-text-muted">
                <span className="font-semibold">Effects:</span> {selected.effects}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
