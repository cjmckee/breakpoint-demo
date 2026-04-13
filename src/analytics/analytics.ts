/**
 * Analytics module — thin wrapper around Mixpanel.
 *
 * Set VITE_MIXPANEL_TOKEN in your .env file to enable tracking.
 * All functions are no-ops when the token is absent, so nothing
 * breaks in local dev or if you haven't configured it yet.
 */

import mixpanel from 'mixpanel-browser';
import type { Player } from '../types/game';
import type { TrainingResult } from '../types/game';
import type { MatchStatistics } from '../types';
import type { KeyMoment } from '../types/keyMoments';
import type { TacticalOption } from '../data/tacticalOptions';
import type { KeyMomentResult } from '../game/KeyMomentResolver';
import type { MatchScore } from '../types/keyMoments';
import type { OpponentTier } from '../types/game';

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;
const ENABLED = Boolean(TOKEN && TOKEN !== 'your-mixpanel-token-here');

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initAnalytics(): void {
  if (!ENABLED) return;
  mixpanel.init(TOKEN!, {
    track_pageview: true,
    persistence: 'localStorage',
    // Batch events in localStorage before sending so GitHub Pages refreshes
    // don't lose events mid-session.
    batch_requests: true,
  });
  // Assign a stable anonymous ID so events from the same browser session
  // stay linked across page reloads (no login required).
  const storageKey = 'bp_analytics_uid';
  let uid = localStorage.getItem(storageKey);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(storageKey, uid);
  }
  mixpanel.identify(uid);
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function track(event: string, props?: Record<string, unknown>): void {
  if (!ENABLED) return;
  try {
    mixpanel.track(event, props);
  } catch {
    // Never let analytics errors crash the game.
  }
}

/** Full snapshot of all 20 player stats plus derived averages for progression analysis. */
function statsSnapshot(player: Player): Record<string, number> {
  const { core, technical, physical, mental } = player.stats;

  const avg = (vals: number[]) => vals.reduce((s, v) => s + v, 0) / vals.length;

  const coreAvg     = avg(Object.values(core));
  const technicalAvg = avg(Object.values(technical));
  const physicalAvg  = avg(Object.values(physical));
  const mentalAvg    = avg(Object.values(mental));

  // Simple mean of all 20 stats
  const statAverage = avg([coreAvg, technicalAvg, physicalAvg, mentalAvg]);

  // Weighted overall rating — mirrors PlayerProfile.overallRating
  // Core has the most impact on match outcomes
  const overallRating = Math.round(
    coreAvg * 0.45 +
    technicalAvg * 0.15 +
    physicalAvg * 0.25 +
    mentalAvg * 0.15
  );

  return {
    // Derived summaries
    stat_average: Math.round(statAverage * 10) / 10,
    overall_rating: overallRating,
    // Core (5)
    stat_serve: core.serve,
    stat_forehand: core.forehand,
    stat_backhand: core.backhand,
    stat_return: core.return,
    stat_slice: core.slice,
    // Technical (5)
    stat_volley: technical.volley,
    stat_overhead: technical.overhead,
    stat_drop_shot: technical.dropShot,
    stat_spin: technical.spin,
    stat_placement: technical.placement,
    // Physical (5)
    stat_speed: physical.speed,
    stat_stamina: physical.stamina,
    stat_strength: physical.strength,
    stat_agility: physical.agility,
    stat_recovery: physical.recovery,
    // Mental (5)
    stat_focus: mental.focus,
    stat_anticipation: mental.anticipation,
    stat_shot_variety: mental.shotVariety,
    stat_offensive: mental.offensive,
    stat_defensive: mental.defensive,
  };
}

// ---------------------------------------------------------------------------
// Player lifecycle
// ---------------------------------------------------------------------------

/**
 * Call once after a new player is created.
 * Updates the Mixpanel profile with high-level metadata.
 */
export function trackPlayerCreated(
  playstyle: 'offensive' | 'defensive' | 'balanced',
  player: Player,
): void {
  if (ENABLED) {
    // Register player_name as a super property so it's included on every
    // subsequent event automatically, persisted across page reloads.
    mixpanel.register({ player_name: player.name });
    mixpanel.people.set({
      $name: player.name,
      playstyle,
      created_at: player.createdAt,
    });
  }
  track('player_created', {
    playstyle,
    player_level: player.level,
    player_tier: player.tier,
  });
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

export function trackTrainingCompleted(
  result: TrainingResult,
  player: Player,
): void {
  // Find the stat with the largest boost for "primary stat trained" label
  const boostEntries = Object.entries(result.statBoosts);
  const primaryStat =
    boostEntries.length > 0
      ? boostEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : 'none';
  const totalGain = boostEntries.reduce((sum, [, v]) => sum + v, 0);

  track('training_completed', {
    training_name: result.trainingName,
    training_type: result.trainingType,
    session_tier: result.sessionTier ?? result.tier ?? 'unknown',
    primary_stat_trained: primaryStat,
    total_stat_gain: totalGain,
    ability_gained: result.abilityGained ?? null,
    mood_change: result.moodChange,
    player_level: player.level,
    player_tier: player.tier,
    ...statsSnapshot(player),
  });
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export function trackMatchCompleted(
  finalScore: MatchScore,
  stats: MatchStatistics,
  matchType: string,
  opponentName: string,
  opponentTier: OpponentTier,
  player: Player,
  gameDay: number,
  timeSlot: string,
): void {
  const isWin = finalScore.winner === 'player';

  track('match_completed', {
    result: isWin ? 'win' : 'loss',
    match_type: matchType,
    opponent_name: opponentName,
    opponent_tier: opponentTier,
    game_day: gameDay,
    time_slot: timeSlot,

    // Serve
    aces: stats.aces.player,
    double_faults: stats.doubleFaults.player,
    first_serve_pct: Math.round(stats.firstServePercentage.player),

    // Errors
    unforced_errors: stats.unforcedErrors.player,
    forced_errors: stats.forcedErrors.player,
    winners: stats.winners.player,

    // Break points
    break_point_opportunities: stats.breakPointOpportunities.player,
    break_points_converted: stats.breakPointsConverted.player,

    // Rallies
    avg_rally_length: Math.round(stats.averageRallyLength * 10) / 10,

    // Key moments
    key_moments_won: stats.keyMomentsWon.player,
    key_moments_lost: stats.keyMomentsWon.opponent,

    // Total points
    total_points: stats.totalPoints.player + stats.totalPoints.opponent,
    points_won: stats.totalPoints.player,

    // Player state
    player_level: player.level,
    player_tier: player.tier,
    matches_played: player.matchesPlayed ?? 0,
    ...statsSnapshot(player),
  });
}

// ---------------------------------------------------------------------------
// Key moments
// ---------------------------------------------------------------------------

export function trackKeyMomentDecided(
  keyMoment: KeyMoment,
  chosenOption: TacticalOption,
  result: KeyMomentResult,
): void {
  track('key_moment_decided', {
    moment_type: keyMoment.type,
    opponent_archetype: keyMoment.opponentArchetype,
    option_id: chosenOption.id,
    option_name: chosenOption.name,

    // Context at decision time
    pressure: keyMoment.matchContext.pressure,
    momentum: keyMoment.matchContext.momentum,
    energy: keyMoment.matchContext.energy,
    mood: keyMoment.matchContext.mood,
    score: keyMoment.matchContext.score,
    server: keyMoment.matchContext.server,

    // Outcome
    outcome: result.outcome,
    point_won: result.pointWinner === 'player',
    base_probability: Math.round(result.baseProbability),
    final_probability: Math.round(result.finalProbability),
    is_counter: result.isCounter,
    is_weak_choice: result.isWeakChoice,
  });
}

// ---------------------------------------------------------------------------
// Story events
// ---------------------------------------------------------------------------

export function trackStoryEventChoice(
  eventId: string,
  optionId: string | undefined,
  gameDay: number,
  player: Player,
): void {
  track('story_event_choice', {
    event_id: eventId,
    option_id: optionId ?? 'no_choice',
    game_day: gameDay,
    player_level: player.level,
    player_tier: player.tier,
  });
}
