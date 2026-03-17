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
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { TacticalAnalyzer } from './TacticalAnalyzer.js';
import { getQualityThresholds } from '../utils/qualityThresholds.js';

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
    matchState: MatchState
  ): ShotType {
    const playStyle = shooter.playStyle;
    const { rallyLength, opponentPosition, shooterPosition } = rallyState;

    // Calculate preferences and opportunities using unified tactical analyzer
    const shotPreference = this.calculateShotPreference(shooter);
    const opportunity = this.tacticalAnalyzer.evaluateTacticalSituation(rallyState, shooterPosition);

    // SPECIAL CASE: Return of serve (rallyLength === 1)
    if (rallyLength === 1) {
      if (Math.random() < (playStyle.aggression / 100) * 0.35) {
        // Aggressive power return
        return Math.random() < shotPreference.forehandProbability
          ? 'return_forehand_power'
          : 'return_backhand_power';
      }
      // Use shot preference for regular returns
      return Math.random() < shotPreference.forehandProbability
        ? 'return_forehand'
        : 'return_backhand';
    }

    // SPECIAL CASE: Shooter at net - must volley
    if (shooterPosition === 'at_net') {
      return this.selectVolley(shooter, shotPreference, rallyState);
    }

    // SPECIAL CASE: Opponent at net - must pass or lob
    if (opponentPosition === 'at_net') {
      if (Math.random() < 0.3) {
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

      // Consistent players can also use regular slice (scales with consistency)
      if (Math.random() < playStyle.consistency / 100) {
        defenseOptions.push(
          Math.random() < shotPreference.forehandProbability ? 'slice_forehand' : 'slice_backhand'
        );
      }

      return defenseOptions[Math.floor(Math.random() * defenseOptions.length)];
    }

    // DECISION TREE: Check for special shots first

    // 1. Net approach?
    if (this.shouldApproachNet(shooter, opportunity, rallyState)) {
      return Math.random() < shotPreference.forehandProbability
        ? 'forehand_approach'
        : 'backhand_approach';
    }

    // 2. Go for winner/power shot?
    if (this.shouldAttemptWinner(shooter, opportunity, rallyState)) {
      return Math.random() < shotPreference.forehandProbability
        ? 'forehand_power'
        : 'backhand_power';
    }

    // 3. Tactical shot?
    const tacticalDecision = this.shouldUseTacticalShot(shooter, rallyState, opportunity);
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
    if (rallyLength > 10 && Math.random() < (playStyle.consistency / 100) * 0.5) {
      return Math.random() < shotPreference.forehandProbability
        ? 'slice_forehand'
        : 'slice_backhand';
    }

    // 5. DEFAULT: Regular groundstroke using shot preference
    return Math.random() < shotPreference.forehandProbability
      ? 'forehand'
      : 'backhand';
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
    const fh = shooter.stats.technical.forehand;
    const bh = shooter.stats.technical.backhand;
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
    rallyState: RallyState
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
    rallyState: RallyState
  ): boolean {
    const netApproachStat = shooter.playStyle.netApproach;
    const playStyleType = shooter.playStyle.type;
    const offensive = shooter.stats.mental.offensive;

    // Base probability scales smoothly with net approach stat
    // 5% at stat 0, ~12% at 20, ~22% at 50, ~40% at 100
    let baseProbability = 0;
    if (playStyleType === 'serve_volley') {
      baseProbability = 0.55; // 55% base for serve-volleyers
    } else {
      baseProbability = 0.05 + (netApproachStat / 100) * 0.35;
    }

    // Offensive mentality boost: aggressive players seek the net more
    // Scales 0-8% extra based on offensive stat
    baseProbability += (offensive / 100) * 0.08;

    // Situational modifiers
    if (!opportunity.netApproachSuitable) return false;

    let probability = baseProbability;

    if (opportunity.attackOpportunity === 'high') probability *= 2.5;
    else if (opportunity.attackOpportunity === 'medium') probability *= 1.8;
    else if (opportunity.attackOpportunity === 'low') probability *= 1.3;

    const approachThresholds = getQualityThresholds(rallyState.matchLevel);
    if (rallyState.lastShotQuality >= approachThresholds.high) probability *= 1.3;
    if (rallyState.opponentPosition === 'way_back_deep') probability *= 1.5;

    // Special case: serve-volleyers approach after serve
    if (playStyleType === 'serve_volley' && rallyState.rallyLength === 2) {
      probability = 0.7; // 70% chance on first shot after serve
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
    rallyState: RallyState
  ): boolean {
    const aggression = shooter.playStyle.aggression;
    const playStyleType = shooter.playStyle.type;
    const offensive = shooter.stats.mental.offensive;

    // Base probability by playstyle (increased for aggressive players)
    let baseProbability = 0;
    if (playStyleType === 'aggressive') {
      baseProbability = 0.35; // 35% for aggressive players (increased from 25%)
    } else if (playStyleType === 'all_court') {
      baseProbability = 0.20; // 20% for all-court (increased from 15%)
    } else if (playStyleType === 'serve_volley') {
      baseProbability = 0.12; // 12% for serve-volley (prefer net game)
    } else if (playStyleType === 'counterpuncher') {
      baseProbability = 0.08; // 8% for counterpunchers
    } else {
      // defensive
      baseProbability = 0.05; // 5% for defensive players
    }

    // Additional boost for high offensive stat (scales 0-10% extra)
    baseProbability += (offensive / 100) * 0.10;

    // Aggressive players attempt power shots early in rallies (3-5 shots)
    // Probability of getting boost scales with aggression
    if (Math.random() < aggression / 100 && rallyState.rallyLength >= 3 && rallyState.rallyLength <= 5) {
      baseProbability *= 1.5; // 50% boost to go for early winners
    }

    if (!opportunity.winnerAttemptSuitable) {
      // Aggressive players go for it anyway — scales with aggression
      if (Math.random() < (aggression / 100) * 0.30) {
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

    return Math.random() < Math.min(0.90, probability); // Increased cap from 0.85
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
    opportunity: TacticalOpportunity
  ): { use: boolean; type?: 'drop_shot' | 'lob' | 'angle_shot' } {
    if (!opportunity.tacticalShotSuitable) return { use: false };

    const { opponentPosition, ballQuality } = rallyState;

    // --- Drop shot evaluation (independent of shotVariety) ---
    const dropShotResult = this.evaluateDropShot(shooter, opponentPosition, ballQuality);
    if (dropShotResult.use) return dropShotResult;

    // --- Other tactical shots (lob, angle) still use shotVariety ---
    const shotVariety = shooter.stats.mental.shotVariety;
    if (shotVariety < 20) return { use: false };

    // 0% at 20, 25% at 100
    const baseProbability = (shotVariety - 20) / 320;
    if (Math.random() > baseProbability) return { use: false };

    if (opponentPosition === 'slightly_off' || opponentPosition === 'well_positioned') {
      return { use: true, type: 'angle_shot' };
    }

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
    ballQuality: RallyState['ballQuality']
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
    const avgGroundstroke = (shooter.stats.technical.forehand + shooter.stats.technical.backhand) / 2;
    const skillEdge = dropShotStat - avgGroundstroke;
    if (skillEdge > 0) {
      // Up to 1.6x boost when dropShot is 30+ points above groundstrokes
      probability *= 1 + Math.min(0.6, skillEdge / 50);
    }

    // Defensive and counterpuncher styles favor drop shots
    const playStyleType = shooter.playStyle.type;
    if (playStyleType === 'defensive' || playStyleType === 'counterpuncher') {
      probability *= 1.5;
    }

    return Math.random() < probability
      ? { use: true, type: 'drop_shot' }
      : { use: false };
  }
}
