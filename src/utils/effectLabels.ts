/**
 * Human-readable presentation for Modifiers.additional effect keys.
 *
 * Items and abilities store passive effects as raw keys in `modifiers.additional`
 * (e.g. { energy_cost_reduction: 2 }). This module turns those into a label, an
 * icon, and a formatted value string so the UI can render digestible chips
 * instead of dumping raw keys.
 */

import { EffectKey } from '../types/game';
import type { EffectKeyValue } from '../types/game';
import {
  DRILL_ICONS,
  GLYPHS,
  STAT_ICONS,
  UNKNOWN_STAT_ICON,
  type PixelGrid,
} from '../data/pixelIcons';

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
  icon: PixelGrid;
  kind: EffectValueKind;
}

/**
 * Every effect key, with the text and icon the UI shows for it. An effect about a
 * stat (Side Spin, Net Game) shares that stat's icon, so the two read as one idea.
 *
 * Keyed on `EffectKeyValue` rather than `string`, so adding an EffectKey without
 * display text is a compile error. This is the *only* such registry — a second
 * one drifts, which is how three shipped effects ended up rendering as raw keys.
 */
const EFFECT_META: Record<EffectKeyValue, EffectMeta> = {
  // --- Training ---
  [EffectKey.MINIGAME_WINDOW_BONUS]: {
    label: 'Training Timing',
    icon: GLYPHS.timer,
    kind: 'fraction',
  },
  // The chance a training session pays double.
  [EffectKey.TRAINING_STAT_UPGRADE_CHANCE]: {
    label: 'Double Training Chance',
    icon: GLYPHS.double,
    kind: 'fraction',
  },
  [EffectKey.TRAINING_BONUS_SUPPORT_CHANCE]: {
    label: 'Bonus Rep Chance',
    icon: GLYPHS.clover,
    kind: 'fraction',
  },

  // --- Events ---
  [EffectKey.EVENT_TRIGGER_BONUS]: { label: 'Event Chance', icon: GLYPHS.exclaim, kind: 'percent' },

  // --- Mood / energy / XP ---
  [EffectKey.MOOD_GAIN_BONUS]: { label: 'Mood Gain', icon: GLYPHS.smile, kind: 'flat' },
  [EffectKey.ENERGY_GAIN_BONUS]: { label: 'Energy Gain', icon: GLYPHS.energy_up, kind: 'flat' },
  [EffectKey.ENERGY_COST_REDUCTION]: {
    label: 'Energy Cost',
    icon: GLYPHS.energy_down,
    kind: 'reduction',
  },
  [EffectKey.EXPERIENCE_GAIN_BONUS]: { label: 'Match XP', icon: GLYPHS.xp, kind: 'fraction' },
  [EffectKey.WIN_EXP_BONUS]: { label: 'Win XP', icon: GLYPHS.trophy, kind: 'flat' },
  [EffectKey.LOSS_EXP_BONUS]: { label: 'Loss XP', icon: GLYPHS.book, kind: 'flat' },

  // --- Drops ---
  [EffectKey.ABILITY_DROP_BONUS]: {
    label: 'Ability Find Rate',
    icon: GLYPHS.sparkle,
    kind: 'fraction',
  },

  // --- Relationships ---
  [EffectKey.RELATIONSHIP_GAIN_BONUS]: {
    label: 'Relationship Gain',
    icon: GLYPHS.heart,
    kind: 'flat',
  },

  // --- Match: shot quality ---
  [EffectKey.PACE]: { label: 'Shot Pace', icon: GLYPHS.burst, kind: 'flat' },
  [EffectKey.SIDE_SPIN]: { label: 'Side Spin', icon: STAT_ICONS.spin, kind: 'flat' },
  [EffectKey.TOUCH]: { label: 'Touch & Finesse', icon: DRILL_ICONS.touch_slice, kind: 'flat' },
  [EffectKey.SMASH_POWER]: { label: 'Smash Power', icon: GLYPHS.hammer, kind: 'flat' },
  [EffectKey.NET_GAME]: { label: 'Net Game', icon: STAT_ICONS.net, kind: 'flat' },
  [EffectKey.PERFECT_TIMING]: { label: 'Timing Precision', icon: GLYPHS.timer, kind: 'flat' },
  [EffectKey.RALLY_MOMENTUM]: { label: 'Rally Momentum', icon: GLYPHS.loop, kind: 'flat' },
  [EffectKey.LOB_QUALITY]: { label: 'Lob Quality', icon: GLYPHS.lob, kind: 'flat' },
  [EffectKey.FIRST_POINT_STAT_BOOST]: {
    label: 'First Point Boost',
    icon: GLYPHS.rocket,
    kind: 'flat',
  },

  // --- Match: positioning ---
  [EffectKey.REACH]: { label: 'Extended Reach', icon: GLYPHS.reach, kind: 'flat' },
  [EffectKey.COURT_COVERAGE]: { label: 'Court Coverage', icon: STAT_ICONS.speed, kind: 'flat' },
  [EffectKey.RECOVERY_SPEED]: { label: 'Recovery Speed', icon: STAT_ICONS.return, kind: 'flat' },

  // --- Match: momentum / fatigue ---
  [EffectKey.UNSTOPPABLE_MOMENTUM]: { label: 'Momentum Swing', icon: GLYPHS.wave, kind: 'tier' },
  [EffectKey.FOCUS_DURATION]: { label: 'Focus Duration', icon: STAT_ICONS.focus, kind: 'tier' },
  [EffectKey.CHAMPION_AURA]: { label: 'Champion Aura', icon: GLYPHS.crown, kind: 'tier' },
  [EffectKey.MOMENTUM_SHIELD]: { label: 'Momentum Shield', icon: GLYPHS.anchor, kind: 'tier' },

  // --- Match: key moments ---
  [EffectKey.CLUTCH_PERFORMANCE]: { label: 'Clutch Performance', icon: GLYPHS.flame, kind: 'tier' },
  [EffectKey.MENTAL_RESILIENCE]: { label: 'Mental Resilience', icon: GLYPHS.shield, kind: 'tier' },

  // --- Archetype behavior biases ---
  // Authored on archetype paths, which present themselves as prose, so these are
  // not rendered today. They carry labels so that an item or ability granting one
  // reads as English rather than as a raw key.
  [EffectKey.RALLY_WINNER_BIAS]: {
    label: 'Winner Attempts',
    icon: STAT_ICONS.placement,
    kind: 'flat',
  },
  [EffectKey.NET_APPROACH_BIAS]: { label: 'Net Approaches', icon: STAT_ICONS.net, kind: 'flat' },
  [EffectKey.RALLY_PATIENCE]: { label: 'Rally Patience', icon: GLYPHS.hourglass, kind: 'flat' },
  [EffectKey.RETURN_AGGRESSION]: { label: 'Return Aggression', icon: GLYPHS.swords, kind: 'flat' },
  [EffectKey.SECOND_SERVE_AGGRESSION]: {
    label: 'Second Serve Aggression',
    icon: STAT_ICONS.serve,
    kind: 'flat',
  },
  [EffectKey.FIRST_SERVE_AGGRESSION]: {
    label: 'First Serve Aggression',
    icon: GLYPHS.bomb,
    kind: 'flat',
  },
  [EffectKey.FAULT_RISK]: { label: 'Fault Risk', icon: GLYPHS.warning, kind: 'flat' },
  [EffectKey.SERVE_SPEED]: { label: 'Serve Speed', icon: GLYPHS.rocket, kind: 'flat' },
  [EffectKey.POWER_VARIANCE]: { label: 'Power Variance', icon: GLYPHS.die, kind: 'flat' },
  [EffectKey.SLICE_PREFERENCE_FOREHAND]: {
    label: 'Forehand Slice',
    icon: STAT_ICONS.slice,
    kind: 'flat',
  },
  [EffectKey.SLICE_PREFERENCE_BACKHAND]: {
    label: 'Backhand Slice',
    icon: STAT_ICONS.slice,
    kind: 'flat',
  },
  [EffectKey.SERVE_AND_VOLLEY_BIAS]: {
    label: 'Serve & Volley',
    icon: STAT_ICONS.net,
    kind: 'flat',
  },
  [EffectKey.DROP_SHOT_BIAS]: { label: 'Drop Shots', icon: DRILL_ICONS.touch_slice, kind: 'flat' },
  [EffectKey.LOB_BIAS]: { label: 'Lobs', icon: GLYPHS.lob, kind: 'flat' },
  [EffectKey.PUTAWAY_VOLLEY_BIAS]: { label: 'Putaway Volleys', icon: GLYPHS.hammer, kind: 'flat' },
};

/**
 * Widened view for lookup. Data can carry a key that is not (yet) an EffectKey,
 * so callers look up by plain string and fall back to a title-cased key.
 */
const META_LOOKUP: Readonly<Record<string, EffectMeta | undefined>> = EFFECT_META;

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
  icon: PixelGrid;
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
      const meta = META_LOOKUP[key];
      const kind = meta?.kind ?? 'flat';
      return {
        key,
        label: meta?.label ?? titleCaseKey(key),
        icon: meta?.icon ?? UNKNOWN_STAT_ICON,
        value: formatValue(value, kind),
        // Reductions of cost/penalty are beneficial when the raw value is positive.
        positive: kind === 'reduction' ? value > 0 : value >= 0,
      };
    });
}
