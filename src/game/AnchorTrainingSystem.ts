/**
 * Anchor Training System
 *
 * Redesigned training: the player picks a CORE stat to "anchor" on (this is their
 * build choice and grants +1 to that core), then plays a short themed minigame whose
 * performance decides how many SUPPORT stats ride along (1-3). Supports are drawn from
 * a pool themed to the anchored shot — coherent flavor, never a fixed bundle.
 *
 * Bronze-only for now: every grant is a flat +1. See docs/training-redesign.md.
 *
 * Pure logic, no React. Produces a TrainingResult that the existing
 * gameStore.applyTrainingResult() pipeline consumes unchanged.
 */

import type { CoreStats } from '../types';
import type { StatBoosts, TrainingResult } from '../types/game';

/** The five core stats a player can anchor a training session on. */
export type CoreStat = keyof CoreStats;

/** Non-core stat names eligible to appear as supports. */
export type SupportStat = Exclude<keyof StatBoosts, CoreStat>;

/** Identifier for the themed minigame a core anchor uses. */
export type MinigameId =
  | 'toss_and_strike' // serve
  | 'rally_rhythm' // forehand
  | 'corner_paint' // backhand
  | 'read_return' // return
  | 'touch_slice' // net (reuses the touch minigame until a net-specific one exists)

export interface CoreAnchorConfig {
  core: CoreStat;
  name: string;
  /** Minigame skin for this anchor. */
  minigame: MinigameId;
  /** Whether the minigame is actually playable yet (else routes to quick sim). */
  playable: boolean;
  /** Stats thematically related to this shot; supports are drawn from here. */
  supportPool: SupportStat[];
  /** One-liner shown on the anchor card. */
  description: string;
}

/**
 * Per-core themed support pools.
 *
 * Balanced so no stat accrues regardless of what you build (placement used to sit
 * in 4 of 5 pools, so it stopped being a build choice) and no stat is reachable
 * through only one anchor (a player who never trained that shot could not earn it
 * from training at all).
 *
 * Keep the invariant when editing: each pool holds 4 stats, and each support stat
 * appears in 2 or 3 pools — 9 supports across 5 pools of 4 is 20 slots, which does
 * not divide evenly. Currently `placement` and `anticipation` take the three-pool
 * slots. Pick the shots the stat most belongs to.
 *
 * Pools shrank from 6 to 4 with the consolidation, which also fixes the spread
 * the audit flagged: a specific support now accrues ~0.75 per session against
 * ~0.5 before, so it takes roughly 13 sessions to move a support 10 points
 * rather than 20.
 */
export const CORE_ANCHORS: Record<CoreStat, CoreAnchorConfig> = {
  serve: {
    core: 'serve',
    name: 'Serve',
    minigame: 'toss_and_strike',
    playable: true,
    supportPool: ['strength', 'placement', 'spin', 'focus'],
    description: 'One explosive strike. Power and placement, with a look to the net.',
  },
  forehand: {
    core: 'forehand',
    name: 'Forehand',
    minigame: 'rally_rhythm',
    playable: true,
    supportPool: ['spin', 'strength', 'slice', 'stamina'],
    description: 'Your topspin weapon from the baseline. Heavy, offensive, relentless.',
  },
  backhand: {
    core: 'backhand',
    name: 'Backhand',
    minigame: 'corner_paint',
    playable: true,
    supportPool: ['placement', 'slice', 'anticipation', 'stamina'],
    description: 'The steady wing. Redirect pace, read the ball, stay balanced.',
  },
  return: {
    core: 'return',
    name: 'Return',
    minigame: 'read_return',
    playable: true,
    supportPool: ['anticipation', 'speed', 'focus', 'tactics'],
    description: 'Anticipate the serve, read it off the bounce, step across and block it back.',
  },
  net: {
    core: 'net',
    name: 'Net',
    minigame: 'touch_slice',
    playable: true,
    supportPool: ['speed', 'anticipation', 'tactics', 'placement'],
    description: 'Close the court and finish. Volleys, half-volleys and the smash.',
  },
};

/** Ordered list of anchors for stable UI rendering. */
export const CORE_ANCHOR_ORDER: CoreStat[] = ['serve', 'forehand', 'backhand', 'return', 'net'];

/** Flat energy cost per bronze session (DR via cost scaling is deferred). */
export const ANCHOR_TRAINING_ENERGY_COST = 20;

/** Mood bump for completing a bronze session. */
const BRONZE_MOOD_CHANGE = 2;

/** Supports earned in a session: 0-3, one per minigame success. */
export type SupportCount = 0 | 1 | 2 | 3;

/**
 * Effect-driven improvements to a session's payout, aggregated from the player's
 * items and abilities. Passed in rather than read off the player so this module
 * stays free of store/effect dependencies and testable on its own.
 */
export interface TrainingBonuses {
  /** 0-1 chance each stat the session grants is worth +2 instead of +1. */
  statUpgradeChance: number;
  /** 0-1 chance to draw one extra support beyond the reps the minigame earned. */
  bonusSupportChance: number;
}

export const NO_TRAINING_BONUSES: TrainingBonuses = {
  statUpgradeChance: 0,
  bonusSupportChance: 0,
};

/**
 * Draw `count` supports from the anchor's themed pool.
 * De-prioritizes stats handed out very recently so repeat sessions stay fresh,
 * but never fails to fill the count (falls back to recent stats if the pool is small).
 * A count of 0 (missed the first attempt) yields no supports — the core +1 still applies.
 *
 * Counts above the minigame's 3 are reachable via TRAINING_BONUS_SUPPORT_CHANCE,
 * so the ceiling here is the pool size, not the rep cap.
 */
export function resolveSupports(
  core: CoreStat,
  count: number,
  recentSupports: SupportStat[] = []
): SupportStat[] {
  const poolSize = CORE_ANCHORS[core].supportPool.length;
  const clamped = Math.max(0, Math.min(poolSize, Math.floor(count)));
  if (clamped === 0) return [];

  const pool = CORE_ANCHORS[core].supportPool;
  const recent = new Set(recentSupports);

  const fresh = shuffle(pool.filter((stat) => !recent.has(stat)));
  const stale = shuffle(pool.filter((stat) => recent.has(stat)));

  // Prefer fresh picks, then backfill from recently-seen stats if needed.
  return [...fresh, ...stale].slice(0, Math.min(clamped, pool.length));
}

/**
 * Build the StatBoosts for a session: +1 core anchor, +1 per drawn support.
 *
 * Each grant rolls independently against `statUpgradeChance` for a +2 instead.
 * Rolling per stat rather than once per session keeps the expected gain linear
 * in the chance, which is what makes "+10%" on the item card literally true.
 */
export function buildAnchorStatBoosts(
  core: CoreStat,
  supports: SupportStat[],
  statUpgradeChance: number = 0
): StatBoosts {
  const grant = (): number => (Math.random() < statUpgradeChance ? 2 : 1);

  const boosts: StatBoosts = {};
  boosts[core] = grant();
  for (const stat of supports) {
    boosts[stat] = grant();
  }
  return boosts;
}

/**
 * Produce a TrainingResult for an anchor session. This is the only thing the redesign
 * changes about training — application (stats, mood, energy, history) is unchanged.
 */
export function buildAnchorTrainingResult(
  core: CoreStat,
  count: number,
  recentSupports: SupportStat[] = [],
  bonuses: TrainingBonuses = NO_TRAINING_BONUSES
): TrainingResult {
  const anchor = CORE_ANCHORS[core];

  // A bonus rep rides along on a session that landed something. A session where
  // every attempt missed stays a miss — otherwise the "tough session" message
  // would ship alongside a support the player never earned.
  const bonusSupport = count > 0 && Math.random() < bonuses.bonusSupportChance ? 1 : 0;

  const supports = resolveSupports(core, count + bonusSupport, recentSupports);
  const statBoosts = buildAnchorStatBoosts(core, supports, bonuses.statUpgradeChance);

  return {
    id: generateId(),
    type: 'training',
    source: 'training_activity',
    timestamp: new Date().toISOString(),
    statBoosts,
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
    message: buildMessage(anchor.name, Math.min(Math.max(0, Math.floor(count)), 3), bonusSupport > 0),
  };
}

/**
 * Pull the support-stat names from the most recent training result, so the next
 * draw can bias away from them. Core stats are excluded.
 */
export function recentSupportsFrom(lastStatBoosts: StatBoosts | undefined): SupportStat[] {
  if (!lastStatBoosts) return [];
  const coreSet = new Set(CORE_ANCHOR_ORDER as string[]);
  return Object.entries(lastStatBoosts)
    .filter(([stat, value]) => value && !coreSet.has(stat))
    .map(([stat]) => stat as SupportStat);
}

/**
 * Reads off the reps the player actually landed, not the supports handed out —
 * a bonus rep would otherwise let a 2-for-3 session claim "three for three".
 */
function buildMessage(anchorName: string, reps: number, gotBonusRep: boolean): string {
  const shot = anchorName.toLowerCase();
  const bonus = gotBonusRep ? ' Lucky bounce — a bonus rep on top!' : '';
  if (reps >= 3) return `Perfect ${shot} session — three for three!${bonus || ' Keep it up!'}`;
  if (reps === 2) return `Strong ${shot} work — two clean reps.${bonus || ' Almost there!'}`;
  if (reps === 1) return `${anchorName} session — one clean rep.${bonus || ' Keep practicing!'}`;
  return `Tough ${shot} session — you hate to see it.`;
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateId(): string {
  return `anchor-training-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
