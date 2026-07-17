/**
 * ItemEffects — renders everything an item *does* in a digestible, scannable
 * format: stat boosts as icon pills, passive "additional" effects as labelled
 * chips, and consumable effects broken out by instant vs. next-activity.
 */

import React from 'react';
import type { Item } from '../../types/items';
import type { StatBoosts } from '../../types/game';
import { STAT_ICONS, formatStatName } from '../ui/StatBoostList';
import { describeEffects } from '../../utils/effectLabels';

/** A single stat boost pill, e.g. 🎾 Serve +5 */
export const StatPill: React.FC<{ stat: string; value: number }> = ({ stat, value }) => (
  <span className="inline-flex items-center gap-1 bg-pixel-bg border-2 border-pixel-border px-2 py-1 text-xs">
    <span>{STAT_ICONS[stat] ?? '⭐'}</span>
    <span className="text-pixel-text-muted">{formatStatName(stat)}</span>
    <span className={value >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
      {value >= 0 ? '+' : ''}
      {value}
    </span>
  </span>
);

export const StatPills: React.FC<{ statBoosts: StatBoosts }> = ({ statBoosts }) => {
  const entries = Object.entries(statBoosts).filter((e): e is [string, number] => (e[1] ?? 0) !== 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([stat, value]) => (
        <StatPill key={stat} stat={stat} value={value} />
      ))}
    </div>
  );
};

/** Labelled chips for Modifiers.additional (energy cost, mood gain, etc.) */
export const EffectChips: React.FC<{ additional?: Record<string, number> }> = ({ additional }) => {
  const effects = describeEffects(additional);
  if (effects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {effects.map((effect) => (
        <span
          key={effect.key}
          className="inline-flex items-center gap-1 bg-pixel-secondary/40 border-2 border-pixel-secondary px-2 py-1 text-xs"
        >
          <span>{effect.icon}</span>
          <span className="text-pixel-text-muted">{effect.label}</span>
          <span className={effect.positive ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {effect.value}
          </span>
        </span>
      ))}
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs font-bold uppercase tracking-wide text-pixel-text-muted mb-1.5">
    {children}
  </div>
);

interface ItemEffectsProps {
  item: Item;
  /** When true, hides section labels for a more compact inline render. */
  compact?: boolean;
}

export const ItemEffects: React.FC<ItemEffectsProps> = ({ item, compact = false }) => {
  const statBoosts = item.modifiers?.statBoosts;
  const additional = item.modifiers?.additional;
  const consumable = item.consumableEffect;

  const hasStatBoosts = statBoosts && Object.values(statBoosts).some((v) => (v ?? 0) !== 0);
  const hasAdditional = describeEffects(additional).length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasStatBoosts && (
        <div>
          {!compact && <SectionLabel>Stat Boosts</SectionLabel>}
          <StatPills statBoosts={statBoosts!} />
        </div>
      )}

      {hasAdditional && (
        <div>
          {!compact && <SectionLabel>Passive Effects</SectionLabel>}
          <EffectChips additional={additional} />
        </div>
      )}

      {consumable && (
        <div>
          {!compact && <SectionLabel>Effect</SectionLabel>}
          <div className="flex flex-col gap-2">
            {consumable.instantEffects && (
              <div className="flex flex-wrap gap-1.5">
                {typeof consumable.instantEffects.energyChange === 'number' &&
                  consumable.instantEffects.energyChange !== 0 && (
                    <StatPill stat="stamina" value={consumable.instantEffects.energyChange} />
                  )}
                {typeof consumable.instantEffects.moodChange === 'number' &&
                  consumable.instantEffects.moodChange !== 0 && (
                    <span className="inline-flex items-center gap-1 bg-pixel-bg border-2 border-pixel-border px-2 py-1 text-xs">
                      <span>😊</span>
                      <span className="text-pixel-text-muted">Mood</span>
                      <span
                        className={
                          consumable.instantEffects.moodChange >= 0
                            ? 'text-green-400 font-bold'
                            : 'text-red-400 font-bold'
                        }
                      >
                        {consumable.instantEffects.moodChange >= 0 ? '+' : ''}
                        {consumable.instantEffects.moodChange}
                      </span>
                    </span>
                  )}
                {typeof consumable.instantEffects.respecTokens === 'number' &&
                  consumable.instantEffects.respecTokens > 0 && (
                    <span className="inline-flex items-center gap-1 bg-pixel-bg border-2 border-pixel-border px-2 py-1 text-xs">
                      <span>🔄</span>
                      <span className="text-pixel-text-muted">Respec Token</span>
                      <span className="text-green-400 font-bold">
                        +{consumable.instantEffects.respecTokens}
                      </span>
                    </span>
                  )}
              </div>
            )}

            {consumable.nextActivityBuffs && (
              <div>
                <div className="text-xs text-pixel-accent mb-1.5">Buffs your next activity:</div>
                <div className="flex flex-col gap-2">
                  {consumable.nextActivityBuffs.statBoosts && (
                    <StatPills statBoosts={consumable.nextActivityBuffs.statBoosts} />
                  )}
                  <EffectChips additional={consumable.nextActivityBuffs.additional} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
