/**
 * ShotSelector - Situation-aware shot selection system
 *
 * Replaces rally-length-based shot selection with a contextual system that:
 * - Favors stronger shots (FH vs BH based on stat differential)
 * - Tracks and exploits opponent position
 * - Uses hybrid stat + situation approach for tactical decisions
 * - Creates distinct playstyle behaviors
 */

import type {
  ShotType,
  RallyState,
  MatchState,
  ShotPreference,
  TacticalOpportunity,
  CourtPosition,
  CourtSurface,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { TacticalAnalyzer } from './TacticalAnalyzer.js';
import { getQualityThresholds } from '../utils/qualityThresholds.js';
import { SURFACE_EFFECTS } from '../config/shotThresholds.js';
import { EffectKey } from '../types/game.js';

/** Archetype behavior effects threaded from the active-effects map. */
type BehaviorEffects = Record<string, number>;


export class ShotSelector {
  private tacticalAnalyzer: TacticalAnalyzer;

  constructor() {
    this.tacticalAnalyzer = new TacticalAnalyzer();
  }

  /**
   * Main entry point - select appropriate shot based on full context
   */
  public selectShot(
    shooter: PlayerProfile,
    opponent: PlayerProfile,
    rallyState: RallyState,
    matchState: MatchState,
    behaviorEffects: BehaviorEffects = {}
  ): ShotType {
    const { rallyLength, opponentPosition, shooterPosition } = rallyState;

    // Calculate preferences and opportunities using unified tactical analyzer
    const shotPreference = this.calculateShotPreference(shooter);
    const opportunity = this.tacticalAnalyzer.evaluateTacticalSituation(rallyState, shooterPosition);

    // Patience drives both the defensive slice option and the long-rally shift.
    const patience = behaviorEffects[EffectKey.RALLY_PATIENCE] ?? 0;

    // SPECIAL CASE: Return of serve (rallyLength === 1)
    if (rallyLength === 1) {
      const returnAgg = behaviorEffects[EffectKey.RETURN_AGGRESSION] ?? 0;
      const winnerBias = behaviorEffects[EffectKey.RALLY_WINNER_BIAS] ?? 0;
      // Neutral ~12%; RETURN_AGGRESSION is the primary driver, RALLY_WINNER_BIAS secondary
      const powerReturnChance = 0.12 + (returnAgg / 100) * 0.55 + (winnerBias / 100) * 0.10;
      if (Math.random() < powerReturnChance) {
        return Math.random() < shotPreference.forehandProbability
          ? 'return_forehand_power'
          : 'return_backhand_power';
      }
      return Math.random() < shotPreference.forehandProbability
        ? 'return_forehand'
        : 'return_backhand';
    }

    // SPECIAL CASE: Shooter at net - must volley
    if (shooterPosition === 'at_net') {
      return this.selectVolley(shooter, shotPreference, rallyState, behaviorEffects);
    }

    // SPECIAL CASE: Opponent at net - must pass or lob.
    // Under time pressure (a strong approach) the defender lobs to reset the point;
    // with time, they go for the pass. Lobbing is the reliable counter to net-rushing.
    if (opponentPosition === 'at_net') {
      const rushed = rallyState.ballQuality.timeAvailable === 'rushed';
      const lobBias = behaviorEffects[EffectKey.LOB_BIAS] ?? 0;
      const baseLobChance = rushed ? 0.6 : 0.35;
      const lobChance = Math.min(0.90, baseLobChance + (lobBias / 100) * 0.40);
      if (Math.random() < lobChance) {
        return Math.random() < shotPreference.forehandProbability
          ? 'lob_forehand'
          : 'lob_backhand';
      }
      return Math.random() < shotPreference.forehandProbability
        ? 'passing_shot_forehand'
        : 'passing_shot_backhand';
    }

    // DEFENSIVE SITUATION: Must stay in point
    if (opportunity.defensiveRequired) {
      const defenseOptions: ShotType[] = [];

      // Always have defensive slice as option
      if (Math.random() < shotPreference.forehandProbability) {
        defenseOptions.push('defensive_slice_forehand');
      } else {
        defenseOptions.push('defensive_slice_backhand');
      }

      // Add lob for variety
      defenseOptions.push(
        Math.random() < shotPreference.forehandProbability ? 'lob_forehand' : 'lob_backhand'
      );

      // Patient players include a slice option more often (neutral 25%)
      if (Math.random() < 0.25 + (patience / 100) * 0.40) {
        defenseOptions.push(
          Math.random() < shotPreference.forehandProbability ? 'slice_forehand' : 'slice_backhand'
        );
      }

      return defenseOptions[Math.floor(Math.random() * defenseOptions.length)];
    }

    // DECISION TREE: Check for special shots first

    // 1. Net approach?
    if (this.shouldApproachNet(shooter, opportunity, rallyState, matchState.courtSurface, behaviorEffects)) {
      return Math.random() < shotPreference.forehandProbability
        ? 'forehand_approach'
        : 'backhand_approach';
    }

    // 2. Go for winner/power shot?
    if (this.shouldAttemptWinner(shooter, opportunity, rallyState, behaviorEffects)) {
      return Math.random() < shotPreference.forehandProbability
        ? 'forehand_power'
        : 'backhand_power';
    }

    // 3. Tactical shot?
    const tacticalDecision = this.shouldUseTacticalShot(shooter, rallyState, opportunity, behaviorEffects);
    if (tacticalDecision.use) {
      const isForehand = Math.random() < shotPreference.forehandProbability;

      switch (tacticalDecision.type) {
        case 'drop_shot':
          return isForehand ? 'drop_shot_forehand' : 'drop_shot_backhand';
        case 'lob':
          return isForehand ? 'lob_forehand' : 'lob_backhand';
        case 'angle_shot':
          return isForehand ? 'angle_shot_forehand' : 'angle_shot_backhand';
      }
    }

    // 4. Long rally defensive shift (11+ shots)
    if (rallyLength > 10 && Math.random() < 0.25 + (patience / 100) * 0.20) {
      return Math.random() < shotPreference.forehandProbability
        ? 'slice_forehand'
        : 'slice_backhand';
    }

    // 5. DEFAULT: Regular groundstroke using shot preference.
    // Per-wing slice preference lets archetypes express "topspin FH, slice BH".
    const isForehand = Math.random() < shotPreference.forehandProbability;
    if (this.shouldSliceGroundstroke(isForehand, behaviorEffects)) {
      return isForehand ? 'slice_forehand' : 'slice_backhand';
    }
    return isForehand ? 'forehand' : 'backhand';
  }

  /**
   * Decide whether a routine groundstroke is hit as a slice, driven by the
   * archetype's per-wing slice-preference behavior effect (e.g. a slice/defensive
   * backhand specialist knifes most backhands while still driving forehands).
   */
  private shouldSliceGroundstroke(isForehand: boolean, behaviorEffects: BehaviorEffects): boolean {
    const key = isForehand
      ? EffectKey.SLICE_PREFERENCE_FOREHAND
      : EffectKey.SLICE_PREFERENCE_BACKHAND;
    const pref = behaviorEffects[key] ?? 0;
    if (pref <= 0) return false;
    // ~0.25 at tier I (10), ~0.6 cap at tier III (24); never fully locks the wing.
    const probability = Math.min(0.85, (pref / 100) * 2.5);
    return Math.random() < probability;
  }

  /**
   * Calculate forehand/backhand preference based on stat differential
   *
   * Formula: 0.5 + (diff / 200), clamped to [0.3, 0.7]
   * - FH 85, BH 60 (diff +25) → 62.5% forehands
   * - FH 70, BH 70 (diff 0) → 50% forehands
   * - FH 60, BH 80 (diff -20) → 40% forehands
   */
  private calculateShotPreference(shooter: PlayerProfile): ShotPreference {
    const fh = shooter.stats.core.forehand;
    const bh = shooter.stats.core.backhand;
    const diff = fh - bh;

    // Linear interpolation: -50 diff = 30% FH, 0 diff = 50% FH, +50 diff = 70% FH
    const forehandProb = Math.max(0.3, Math.min(0.7, 0.5 + diff / 200));

    return {
      forehandProbability: forehandProb,
      preferredSide: diff > 15 ? 'forehand' : diff < -15 ? 'backhand' : 'balanced',
      runAroundBackhand: diff > 20, // 20+ point advantage
      strongShotStat: Math.max(fh, bh),
      weakShotStat: Math.min(fh, bh),
    };
  }


  /**
   * Select volley shot type when shooter is at the net
   *
   * At net, players hit volleys (forehand/backhand) or overheads.
   * Half-volleys are chosen when the incoming ball is low quality (dipping shots).
   */
  private selectVolley(
    shooter: PlayerProfile,
    shotPreference: ShotPreference,
    rallyState: RallyState,
    behaviorEffects: BehaviorEffects
  ): ShotType {
    const isForehand = Math.random() < shotPreference.forehandProbability;

    const thresholds = getQualityThresholds(rallyState.matchLevel);

    // Lob response — three tiers based on lob quality relative to match level
    if (rallyState.lastShotType.includes('lob')) {
      if (rallyState.ballQuality.baseQuality >= thresholds.exceptional) {
        // Exceptional lob — winner candidate, fall through to normal volley
        // (ShotCalculator will determine if it's a winner)
      } else if (rallyState.ballQuality.baseQuality >= thresholds.high) {
        return 'defensive_overhead'; // Good lob, hard to put away
      } else {
        return 'overhead'; // Weak lob, smash it
      }
    }

    // Put-away volley: when ball is attackable and player leans toward finishing at net
    const putawayBias = behaviorEffects[EffectKey.PUTAWAY_VOLLEY_BIAS] ?? 0;
    const ballIsAttackable = !rallyState.lastShotType.includes('lob')
      && rallyState.ballQuality.timeAvailable !== 'rushed';

    if (putawayBias > 0 && ballIsAttackable) {
      const putawayChance = Math.min(0.75, (putawayBias / 100) * 1.2);
      if (Math.random() < putawayChance) {
        return isForehand ? 'volley_forehand_power' : 'volley_backhand_power';
      }
    }

    // Half-volley on low, dipping balls (heavy topspin or high quality passing shots)
    const isLowBall =
      rallyState.ballQuality.spin === 'heavy_topspin' ||
      (rallyState.ballQuality.baseQuality >= thresholds.high && rallyState.ballQuality.timeAvailable === 'rushed');

    if (isLowBall && Math.random() < 0.6) {
      return isForehand ? 'half_volley_forehand' : 'half_volley_backhand';
    }

    return isForehand ? 'volley_forehand' : 'volley_backhand';
  }

  /**
   * Decide whether to approach net (hybrid stats + situation)
   *
   * All players can approach the net, but frequency and success depend on
   * net approach stat and offensive mentality. Low-rated players approach
   * less often and with less success, but aren't locked out entirely.
   */
  private shouldApproachNet(
    shooter: PlayerProfile,
    opportunity: TacticalOpportunity,
    rallyState: RallyState,
    courtSurface: CourtSurface,
    behaviorEffects: BehaviorEffects
  ): boolean {
    const netBias = behaviorEffects[EffectKey.NET_APPROACH_BIAS] ?? 0;
    const offensive = shooter.stats.mental.offensive;

    // Neutral ~12%; negative bias floors near 0
    let baseProbability = Math.max(0, 0.12 + (netBias / 100) * 0.50);
    baseProbability += (offensive / 100) * 0.08;
    baseProbability += SURFACE_EFFECTS[courtSurface].netApproachBonus;
    baseProbability = Math.max(0, baseProbability);

    if (!opportunity.netApproachSuitable) return false;

    let probability = baseProbability;

    if (opportunity.attackOpportunity === 'high') probability *= 2.5;
    else if (opportunity.attackOpportunity === 'medium') probability *= 1.8;
    else if (opportunity.attackOpportunity === 'low') probability *= 1.3;

    const approachThresholds = getQualityThresholds(rallyState.matchLevel);
    if (rallyState.lastShotQuality >= approachThresholds.high) probability *= 1.3;
    if (rallyState.opponentPosition === 'way_back_deep') probability *= 1.5;

    // Serve-and-volley: first ball after own serve
    if (rallyState.rallyLength === 2) {
      const svBias = behaviorEffects[EffectKey.SERVE_AND_VOLLEY_BIAS] ?? 0;
      if (svBias > 0) {
        probability = Math.min(0.90, probability + (svBias / 100) * 0.55);
      }
    }

    return Math.random() < Math.min(0.9, probability);
  }

  /**
   * Decide whether to go for a winner (hybrid stats + situation)
   *
   * Aggressive players attempt winners more often, but everyone goes for it
   * when they have a great opportunity
   */
  private shouldAttemptWinner(
    shooter: PlayerProfile,
    opportunity: TacticalOpportunity,
    rallyState: RallyState,
    behaviorEffects: BehaviorEffects
  ): boolean {
    const winnerBias = behaviorEffects[EffectKey.RALLY_WINNER_BIAS] ?? 0;
    const offensive = shooter.stats.mental.offensive;
    const defensive = shooter.stats.mental.defensive;

    // Neutral 15%; each bias point ≈ 1% swing. Floors at ~3%.
    let baseProbability = Math.max(0.03, 0.15 + winnerBias * 0.01);
    baseProbability += (offensive / 100) * 0.10;
    baseProbability -= (defensive / 100) * 0.08;
    baseProbability = Math.max(0, baseProbability);

    // Early-rally aggression boost (driven by offensive stat)
    if (Math.random() < offensive / 100 && rallyState.rallyLength >= 3 && rallyState.rallyLength <= 5) {
      baseProbability *= 1.5;
    }

    if (!opportunity.winnerAttemptSuitable) {
      if (Math.random() < (winnerBias / 100) * 0.30) {
        return true;
      }
      return false;
    }

    let probability = baseProbability;

    if (opportunity.attackOpportunity === 'high') probability *= 3.0;
    else if (opportunity.attackOpportunity === 'medium') probability *= 1.8;
    else if (opportunity.attackOpportunity === 'low') probability *= 1.2;

    const winnerThresholds = getQualityThresholds(rallyState.matchLevel);
    if (rallyState.lastShotQuality >= winnerThresholds.exceptional) probability *= 1.4;

    return Math.random() < Math.min(0.90, probability);
  }

  /**
   * Decide whether to use a tactical shot (drop, lob, angle)
   *
   * Drop shots are driven by the dropShot technical stat and favored by
   * defensive/counterpuncher play styles. Other tactical shots use shotVariety.
   */
  private shouldUseTacticalShot(
    shooter: PlayerProfile,
    rallyState: RallyState,
    opportunity: TacticalOpportunity,
    behaviorEffects: BehaviorEffects
  ): { use: boolean; type?: 'drop_shot' | 'lob' | 'angle_shot' } {
    if (!opportunity.tacticalShotSuitable) return { use: false };

    const { opponentPosition, ballQuality } = rallyState;

    // --- Drop shot evaluation (independent of shotVariety) ---
    const dropShotResult = this.evaluateDropShot(shooter, opponentPosition, ballQuality, behaviorEffects);
    if (dropShotResult.use) return dropShotResult;

    // --- Other tactical shots (lob, angle) still use shotVariety ---
    const shotVariety = shooter.stats.mental.shotVariety;
    const baseProbability = 0.01 + (shotVariety / 100) * 0.24;
    if (Math.random() > baseProbability) return { use: false };

    // Positive lob bias tilts toward lob; default prefers angle shot
    const lobBias = behaviorEffects[EffectKey.LOB_BIAS] ?? 0;
    const lobChance = Math.max(0, 0.15 + (lobBias / 100) * 0.50);
    if (Math.random() < lobChance) return { use: true, type: 'lob' };
    return { use: true, type: 'angle_shot' };
  }

  /**
   * Evaluate whether to attempt a drop shot based on dropShot skill,
   * play style, and opponent position.
   *
   * Selection probability scales with the dropShot stat (0-100).
   * Defensive and counterpuncher styles get a boost.
   * Opponent must be at least on the baseline (well_positioned) for a small
   * chance, with much higher probability when pushed back deep.
   */
  private evaluateDropShot(
    shooter: PlayerProfile,
    opponentPosition: CourtPosition,
    ballQuality: RallyState['ballQuality'],
    behaviorEffects: BehaviorEffects
  ): { use: boolean; type?: 'drop_shot' } {
    const dropShotStat = shooter.stats.technical.dropShot;

    // Can't drop shot a rushing ball
    if (ballQuality.timeAvailable === 'rushed') return { use: false };

    // Position multiplier — how good the drop shot opportunity is
    let positionMultiplier = 0;
    if (opponentPosition === 'way_back_deep') {
      positionMultiplier = 1.0;   // Ideal: opponent far behind baseline
    } else if (opponentPosition === 'way_out_wide') {
      positionMultiplier = 0.8;   // Great: opponent stretched wide
    } else if (opponentPosition === 'slightly_off') {
      positionMultiplier = 0.3;   // Opportunistic: catch them off guard
    } else if (opponentPosition === 'well_positioned') {
      positionMultiplier = 0.12;  // Cheeky: only high-skill players try this
    } else {
      return { use: false };      // Opponent at net or recovering toward net
    }

    // Base probability driven by dropShot skill: ~5% at 10, ~35% at 100
    let probability = (dropShotStat / 280) * positionMultiplier;

    // Relative skill boost: if dropShot is stronger than groundstrokes,
    // the player leans on it more as a weapon
    const avgGroundstroke = (shooter.stats.core.forehand + shooter.stats.core.backhand) / 2;
    const skillEdge = dropShotStat - avgGroundstroke;
    if (skillEdge > 0) {
      // Up to 1.6x boost when dropShot is 30+ points above groundstrokes
      probability *= 1 + Math.min(0.6, skillEdge / 50);
    }

    // Drop shot bias: positive = favors the drop shot, negative = never touches it
    const dropBias = behaviorEffects[EffectKey.DROP_SHOT_BIAS] ?? 0;
    if (dropBias > 0) {
      probability *= 1 + (dropBias / 50);
    }
    if (dropBias < 0) {
      probability *= Math.max(0, 1 + (dropBias / 30));
    }

    return Math.random() < probability
      ? { use: true, type: 'drop_shot' }
      : { use: false };
  }
}
