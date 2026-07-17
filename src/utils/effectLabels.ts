/**
 * Human-readable presentation for Modifiers.additional effect keys.
 *
 * Items and abilities store passive effects as raw keys in `modifiers.additional`
 * (e.g. { energy_cost_reduction: 2 }). This module turns those into a label, an
 * icon, and a formatted value string so the UI can render digestible chips
 * instead of dumping raw keys.
 */

import { EffectKey } from '../types/game';

/**
 * How an effect's numeric value should be turned into display text.
 *   flat     — plain +N / -N (e.g. mood gain +2)
 *   reduction— cost/penalty reductions, shown as -N (e.g. energy cost -2)
 *   percent  — value is already a percentage (15 -> +15%)
 *   fraction — value is a 0-1 fraction (0.1 -> +10%)
 *   tier     — small integer levels (+1 tier)
 */
type EffectValueKind = 'flat' | 'reduction' | 'percent' | 'fraction' | 'tier';

interface EffectMeta {
  label: string;
  icon: string;
  kind: EffectValueKind;
}

const EFFECT_META: Record<string, EffectMeta> = {
  [EffectKey.ENERGY_COST_REDUCTION]: { label: 'Energy Cost', icon: '🔋', kind: 'reduction' },
  [EffectKey.MOOD_GAIN_BONUS]: { label: 'Mood Gain', icon: '😊', kind: 'flat' },
  [EffectKey.ENERGY_GAIN_BONUS]: { label: 'Energy Gain', icon: '⚡', kind: 'flat' },
  [EffectKey.EXPERIENCE_GAIN_BONUS]: { label: 'Match XP', icon: '📈', kind: 'fraction' },
  [EffectKey.WIN_EXP_BONUS]: { label: 'Win XP', icon: '🏆', kind: 'flat' },
  [EffectKey.LOSS_EXP_BONUS]: { label: 'Loss XP', icon: '📚', kind: 'flat' },
  [EffectKey.MINIGAME_WINDOW_BONUS]: { label: 'Training Timing', icon: '🎯', kind: 'fraction' },
  [EffectKey.EVENT_TRIGGER_BONUS]: { label: 'Event Chance', icon: '❗', kind: 'percent' },
  [EffectKey.RELATIONSHIP_GAIN_BONUS]: { label: 'Relationship Gain', icon: '🤝', kind: 'flat' },
  [EffectKey.FOCUS_DURATION]: { label: 'Focus Duration', icon: '🧘', kind: 'tier' },
  [EffectKey.CLUTCH_PERFORMANCE]: { label: 'Clutch Performance', icon: '🔥', kind: 'tier' },
  [EffectKey.MENTAL_RESILIENCE]: { label: 'Mental Resilience', icon: '🛡️', kind: 'tier' },
  // Keys used in item data that aren't in EffectKey enum yet:
  training_stat_multiplier: { label: 'Training Gains', icon: '💪', kind: 'fraction' },
  ability_chance_bonus: { label: 'Ability Trigger', icon: '✨', kind: 'percent' },
  training_tier_bonus: { label: 'Training Tier', icon: '⭐', kind: 'tier' },
};

function titleCaseKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: number, kind: EffectValueKind): string {
  switch (kind) {
    case 'reduction':
      // A positive value is a reduction, so it reads as a negative cost.
      return `-${Math.abs(value)}`;
    case 'percent':
      return `${value >= 0 ? '+' : ''}${value}%`;
    case 'fraction':
      return `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
    case 'tier':
      return `${value >= 0 ? '+' : ''}${value}`;
    case 'flat':
    default:
      return `${value >= 0 ? '+' : ''}${value}`;
  }
}

export interface DisplayEffect {
  key: string;
  label: string;
  icon: string;
  /** Formatted value, e.g. "+2", "-3", "+10%" */
  value: string;
  /** Whether this effect is beneficial (drives coloring). Reductions are good. */
  positive: boolean;
}

/**
 * Convert a Modifiers.additional record into a display-ready list of effects.
 */
export function describeEffects(additional: Record<string, number> | undefined): DisplayEffect[] {
  if (!additional) return [];

  return Object.entries(additional)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => {
      const meta = EFFECT_META[key];
      const kind = meta?.kind ?? 'flat';
      return {
        key,
        label: meta?.label ?? titleCaseKey(key),
        icon: meta?.icon ?? '⭐',
        value: formatValue(value, kind),
        // Reductions of cost/penalty are beneficial when the raw value is positive.
        positive: kind === 'reduction' ? value > 0 : value >= 0,
      };
    });
}
