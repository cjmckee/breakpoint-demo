/**
 * Training System
 *
 * Each time slot offers three of the six drills (trainingOffer), rolled from the
 * player, the day and the slot, so reopening the screen offers the same three. A
 * drill is a minigame and the pair of currencies it pays (TRAINING_MIXES): its mix
 * once, plus once more per clean rep. From silver, a focus swaps the mix's
 * secondary currency. Stats are bought with it on the Development screen.
 *
 * Pure logic, no React. Produces a TrainingResult for gameStore.applyTrainingResult().
 * Rates: config/economy.ts. Payout: CurrencyIncome.trainingPayout.
 */

import type { Currency, OpponentTier, TrainingResult, TrainingSessionTier } from '../types/game';
import type { DrillId } from '../minigames/types';
import { TimeSlot } from '../types/game';

import { random } from '../core/random';
import { seededRolls } from '../core/seededRoll';
import { trainingPayout } from './CurrencyIncome';

export interface DrillConfig {
  id: DrillId;
  name: string;
  /** What the drill works on, in a word or two, under its name. */
  theme: string;
}

/** The six drills. Each is its own minigame; TRAINING_MIXES says what it pays. */
export const DRILLS: Record<DrillId, DrillConfig> = {
  rally_rhythm: { id: 'rally_rhythm', name: 'Rally Rhythm', theme: 'Baseline' },
  split_step: { id: 'split_step', name: 'Split-Step Sprint', theme: 'Explosive' },
  corner_paint: { id: 'corner_paint', name: 'Corner Painter', theme: 'Placement' },
  touch_slice: { id: 'touch_slice', name: 'Touch & Slice', theme: 'Touch' },
  read_return: { id: 'read_return', name: 'Read & Return', theme: 'Reading' },
  toss_and_strike: { id: 'toss_and_strike', name: 'Toss & Strike', theme: 'Composure' },
};

/** Every drill, in a fixed order: the order an offer lists its drills in. */
export const DRILL_ORDER = Object.keys(DRILLS) as DrillId[];

/** Drills offered each time slot. An ability or item may raise it later. */
export const DRILLS_PER_SLOT = 3;

/**
 * One option on the training screen: a drill, and later the teammate who turns
 * up for it (a character id). Nothing sets a partner yet; the screen and the
 * offer carry it from the start so partners slot in without reshaping either.
 */
export interface TrainingOffer {
  drill: DrillId;
  partner?: string;
}

/**
 * The drills offered to `playerId` on career day `day` in `slot`: the same every
 * time it's asked, different from slot to slot, listed in DRILL_ORDER. Rolled
 * from its own seed, never the simulation's random stream.
 */
export function trainingOffer(
  playerId: string,
  day: number,
  slot: TimeSlot,
  count: number = DRILLS_PER_SLOT,
): TrainingOffer[] {
  const roll = seededRolls(`training:${playerId}:${day}:${slot}`);
  const pool = [...DRILL_ORDER];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = new Set(pool.slice(0, Math.min(count, pool.length)));
  return DRILL_ORDER.filter((d) => picked.has(d)).map((drill) => ({ drill }));
}

/** Flat energy cost per session, at every training tier. */
export const TRAINING_ENERGY_COST = 20;

/** Mood bump for completing a session. */
const SESSION_MOOD_CHANGE = 2;

/** The training tier a player's tier trains at: Club bronze, Regional silver, then gold. */
export function trainingTierFor(tier: OpponentTier): TrainingSessionTier {
  if (tier <= 1) return 'bronze';
  if (tier === 2) return 'silver';
  return 'gold';
}

/** Silver and up let a session pick a focus currency (CurrencyIncome.focusedMix). */
export function offersFocus(sessionTier: TrainingSessionTier): boolean {
  return sessionTier !== 'bronze';
}

/**
 * The minigame's per-attempt speed ramp at each training tier. Bronze is the
 * minigames' own default. Each tier runs a little faster, so a clean rep asks
 * more of the player as their career does — gently, because pay is flat across
 * tiers (docs/proposals/mid-late-progression.md §2.1) and a harder drill that
 * costs reps is a pay cut. Playtest before raising.
 */
export const TRAINING_SPEED_RAMPS: Record<TrainingSessionTier, number[]> = {
  bronze: [1, 1.1, 1.22],
  silver: [1.05, 1.16, 1.28],
  gold: [1.1, 1.22, 1.35],
};

/** How a session is played: the player's training tier and, from silver, a focus. */
export interface SessionOptions {
  sessionTier: TrainingSessionTier;
  focus?: Currency;
}

const BRONZE_SESSION: SessionOptions = { sessionTier: 'bronze' };

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

/** Produce a TrainingResult for a session of `drill` with `count` clean reps (0-3). */
export function buildTrainingResult(
  drill: DrillId,
  count: number,
  bonuses: TrainingBonuses = NO_TRAINING_BONUSES,
  session: SessionOptions = BRONZE_SESSION,
): TrainingResult {
  // Bronze has no focus, whatever a stale preference says.
  const focus = offersFocus(session.sessionTier) ? session.focus : undefined;
  const { name } = DRILLS[drill];
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
    drill,
    reps,
    currencyGained: trainingPayout(drill, reps, doubled, undefined, focus),
    focus,
    doubled,
    energyCost: TRAINING_ENERGY_COST,
    timeSlotsUsed: 1,
    trainingType: drill,
    trainingName: name,
    efficiency: 1.0,
    moodResult: SESSION_MOOD_CHANGE,
    moodChange: SESSION_MOOD_CHANGE,
    sessionTier: session.sessionTier,
    sessionType: drill,
    message: buildMessage(name, landed, bonusRep > 0) + (doubled ? ' Double gains!' : ''),
  };
}

/**
 * Reads off the reps the player actually landed, not counting a bonus rep —
 * which would otherwise let a 2-for-3 session claim "three for three".
 */
function buildMessage(drillName: string, reps: number, gotBonusRep: boolean): string {
  const bonus = gotBonusRep ? ' Lucky bounce — a bonus rep on top!' : '';
  if (reps >= 3) return `Perfect ${drillName} — three for three!${bonus || ' Keep it up!'}`;
  if (reps === 2) return `Strong ${drillName} — two clean reps.${bonus || ' Almost there!'}`;
  if (reps === 1) return `${drillName} — one clean rep.${bonus || ' Keep practicing!'}`;
  return `Tough ${drillName} — you hate to see it.`;
}

function generateId(): string {
  return `training-${Date.now()}-${random().toString(36).substring(2, 9)}`;
}
