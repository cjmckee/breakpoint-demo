/**
 * Anchor Training System
 *
 * The player picks a CORE stat to "anchor" a session on, then plays that shot's
 * themed minigame. The session pays training currency: a base amount plus more
 * per clean rep, mostly in the anchor's recipe currencies (serve pays Power,
 * return pays Quickness), with a general share and a Mind share on top. Stats
 * are bought with it on the Development screen.
 *
 * Pure logic, no React. Produces a TrainingResult for gameStore.applyTrainingResult().
 * Rates: config/economy.ts. Payout: CurrencyIncome.trainingPayout.
 */

import type { CoreStats } from '../types';
import type { TrainingResult } from '../types/game';
import type { MinigameId } from '../minigames/types';

import { random } from '../core/random';
import { trainingPayout } from './CurrencyIncome';

/** The five core stats a player can anchor a training session on. */
export type CoreStat = keyof CoreStats;

export interface CoreAnchorConfig {
  core: CoreStat;
  name: string;
  /** Minigame skin for this anchor. */
  minigame: MinigameId;
  /** Whether the minigame is actually playable yet (else routes to quick sim). */
  playable: boolean;
  /** One-liner shown on the anchor card. */
  description: string;
}

/** The five anchors: the shot, its minigame, and the card copy. */
export const CORE_ANCHORS: Record<CoreStat, CoreAnchorConfig> = {
  serve: {
    core: 'serve',
    name: 'Serve',
    minigame: 'toss_and_strike',
    playable: true,
    description: 'One explosive strike. Power and placement, with a look to the net.',
  },
  forehand: {
    core: 'forehand',
    name: 'Forehand',
    minigame: 'rally_rhythm',
    playable: true,
    description: 'Your topspin weapon from the baseline. Heavy, offensive, relentless.',
  },
  backhand: {
    core: 'backhand',
    name: 'Backhand',
    minigame: 'corner_paint',
    playable: true,
    description: 'The steady wing. Redirect pace, read the ball, stay balanced.',
  },
  return: {
    core: 'return',
    name: 'Return',
    minigame: 'read_return',
    playable: true,
    description: 'Anticipate the serve, read it off the bounce, step across and block it back.',
  },
  net: {
    core: 'net',
    name: 'Net',
    minigame: 'touch_slice',
    playable: true,
    description: 'Close the court and finish. Volleys, half-volleys and the smash.',
  },
};

/** Ordered list of anchors for stable UI rendering. */
export const CORE_ANCHOR_ORDER: CoreStat[] = ['serve', 'forehand', 'backhand', 'return', 'net'];

/** Flat energy cost per bronze session (DR via cost scaling is deferred). */
export const ANCHOR_TRAINING_ENERGY_COST = 20;

/** Mood bump for completing a bronze session. */
const BRONZE_MOOD_CHANGE = 2;

/**
 * Effect-driven improvements to a session's payout, aggregated from the player's
 * items and abilities. Passed in rather than read off the player so this module
 * stays free of store/effect dependencies and testable on its own.
 */
export interface TrainingBonuses {
  /** 0-1 chance the session pays double. */
  doubleChance: number;
  /** 0-1 chance to count one extra rep beyond the reps the minigame earned. */
  bonusRepChance: number;
}

export const NO_TRAINING_BONUSES: TrainingBonuses = {
  doubleChance: 0,
  bonusRepChance: 0,
};

/** Produce a TrainingResult for an anchor session with `count` clean reps (0-3). */
export function buildAnchorTrainingResult(
  core: CoreStat,
  count: number,
  bonuses: TrainingBonuses = NO_TRAINING_BONUSES,
): TrainingResult {
  const anchor = CORE_ANCHORS[core];
  const landed = Math.min(Math.max(0, Math.floor(count)), 3);

  // A bonus rep rides along on a session that landed something. A session where
  // every attempt missed stays a miss — otherwise the "tough session" message
  // would ship alongside a rep the player never earned.
  const bonusRep = landed > 0 && random() < bonuses.bonusRepChance ? 1 : 0;
  const reps = landed + bonusRep;
  const doubled = random() < bonuses.doubleChance;

  return {
    id: generateId(),
    type: 'training',
    source: 'training_activity',
    timestamp: new Date().toISOString(),
    anchor: core,
    reps,
    currencyGained: trainingPayout(core, reps, doubled),
    doubled,
    energyCost: ANCHOR_TRAINING_ENERGY_COST,
    timeSlotsUsed: 1,
    trainingType: `${core}_anchor`,
    trainingName: `${anchor.name} Training`,
    efficiency: 1.0,
    moodResult: BRONZE_MOOD_CHANGE,
    moodChange: BRONZE_MOOD_CHANGE,
    sessionTier: 'bronze',
    tier: 'bronze',
    sessionType: `${core}_anchor`,
    message: buildMessage(anchor.name, landed, bonusRep > 0) + (doubled ? ' Double gains!' : ''),
  };
}

/**
 * Reads off the reps the player actually landed, not counting a bonus rep —
 * which would otherwise let a 2-for-3 session claim "three for three".
 */
function buildMessage(anchorName: string, reps: number, gotBonusRep: boolean): string {
  const shot = anchorName.toLowerCase();
  const bonus = gotBonusRep ? ' Lucky bounce — a bonus rep on top!' : '';
  if (reps >= 3) return `Perfect ${shot} session — three for three!${bonus || ' Keep it up!'}`;
  if (reps === 2) return `Strong ${shot} work — two clean reps.${bonus || ' Almost there!'}`;
  if (reps === 1) return `${anchorName} session — one clean rep.${bonus || ' Keep practicing!'}`;
  return `Tough ${shot} session — you hate to see it.`;
}

function generateId(): string {
  return `anchor-training-${Date.now()}-${random().toString(36).substring(2, 9)}`;
}
