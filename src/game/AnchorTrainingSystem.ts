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
  | 'load_and_fire' // backhand
  | 'read_and_react' // return
  | 'touch_carve'; // slice

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
  /** Emoji used as the anchor's icon. */
  icon: string;
}

/**
 * Per-core themed support pools. Every non-core stat appears in at least one pool
 * (full coverage), but each is gated behind the shot(s) it belongs to.
 */
export const CORE_ANCHORS: Record<CoreStat, CoreAnchorConfig> = {
  serve: {
    core: 'serve',
    name: 'Serve',
    minigame: 'toss_and_strike',
    playable: true,
    supportPool: ['strength', 'placement', 'overhead', 'volley', 'offensive', 'spin'],
    description: 'One explosive strike. Power and placement, with a look to the net.',
    icon: '🎾',
  },
  forehand: {
    core: 'forehand',
    name: 'Forehand',
    minigame: 'rally_rhythm',
    playable: false,
    supportPool: ['spin', 'strength', 'placement', 'offensive', 'speed', 'stamina'],
    description: 'Your topspin weapon from the baseline. Heavy, offensive, relentless.',
    icon: '💥',
  },
  backhand: {
    core: 'backhand',
    name: 'Backhand',
    minigame: 'load_and_fire',
    playable: false,
    supportPool: ['spin', 'placement', 'defensive', 'anticipation', 'agility', 'recovery'],
    description: 'The steady wing. Redirect pace, read the ball, stay balanced.',
    icon: '🔁',
  },
  return: {
    core: 'return',
    name: 'Return',
    minigame: 'read_and_react',
    playable: false,
    supportPool: ['anticipation', 'speed', 'agility', 'defensive', 'focus', 'recovery'],
    description: 'Read the serve, react, get it back deep. Pure reflex.',
    icon: '⚡',
  },
  slice: {
    core: 'slice',
    name: 'Slice',
    minigame: 'touch_carve',
    playable: false,
    supportPool: ['dropShot', 'volley', 'shotVariety', 'focus', 'defensive', 'placement'],
    description: 'Touch and variety. Carve it low, change the rhythm, come forward.',
    icon: '🪶',
  },
};

/** Ordered list of anchors for stable UI rendering. */
export const CORE_ANCHOR_ORDER: CoreStat[] = ['serve', 'forehand', 'backhand', 'return', 'slice'];

/** Flat energy cost per bronze session (DR via cost scaling is deferred). */
export const ANCHOR_TRAINING_ENERGY_COST = 20;

/** Mood bump for completing a bronze session. */
const BRONZE_MOOD_CHANGE = 2;

export type SupportCount = 1 | 2 | 3;

/**
 * Map a minigame performance score (0..1) to a support count.
 * Mostly juice: skill only moves you between 1, 2, and 3 — never zero.
 */
export function scoreToCount(score: number): SupportCount {
  if (score >= 0.75) return 3;
  if (score >= 0.4) return 2;
  return 1;
}

/**
 * Draw `count` supports from the anchor's themed pool.
 * De-prioritizes stats handed out very recently so repeat sessions stay fresh,
 * but never fails to fill the count (falls back to recent stats if the pool is small).
 */
export function resolveSupports(
  core: CoreStat,
  count: SupportCount,
  recentSupports: SupportStat[] = []
): SupportStat[] {
  const pool = CORE_ANCHORS[core].supportPool;
  const recent = new Set(recentSupports);

  const fresh = shuffle(pool.filter((stat) => !recent.has(stat)));
  const stale = shuffle(pool.filter((stat) => recent.has(stat)));

  // Prefer fresh picks, then backfill from recently-seen stats if needed.
  return [...fresh, ...stale].slice(0, Math.min(count, pool.length));
}

/**
 * Build the StatBoosts for a session: +1 core anchor, +1 per drawn support.
 */
export function buildAnchorStatBoosts(core: CoreStat, supports: SupportStat[]): StatBoosts {
  const boosts: StatBoosts = {};
  boosts[core] = 1;
  for (const stat of supports) {
    boosts[stat] = 1;
  }
  return boosts;
}

/**
 * Produce a TrainingResult for an anchor session. This is the only thing the redesign
 * changes about training — application (stats, mood, energy, history) is unchanged.
 */
export function buildAnchorTrainingResult(
  core: CoreStat,
  count: SupportCount,
  recentSupports: SupportStat[] = []
): TrainingResult {
  const anchor = CORE_ANCHORS[core];
  const supports = resolveSupports(core, count, recentSupports);
  const statBoosts = buildAnchorStatBoosts(core, supports);

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
    message: buildMessage(anchor.name, supports.length),
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

function buildMessage(anchorName: string, supportCount: number): string {
  if (supportCount >= 3) return `Clean ${anchorName.toLowerCase()} session — everything clicked!`;
  if (supportCount === 2) return `Solid ${anchorName.toLowerCase()} work today.`;
  return `${anchorName} session done. Room to sharpen it up.`;
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
