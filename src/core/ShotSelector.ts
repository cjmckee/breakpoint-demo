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
      if (playStyle.aggression > 80 && Math.random() < 0.3) {
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

      // Consistent players can also use regular slice
      if (playStyle.consistency > 60) {
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
    if (rallyLength > 10 && playStyle.consistency > 60 && Math.random() < 0.4) {
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
   * Decide whether to approach net (hybrid stats + situation)
   *
   * Net players look for opportunities more often, but everyone approaches
   * more when the situation is right
   */
  private shouldApproachNet(
    shooter: PlayerProfile,
    opportunity: TacticalOpportunity,
    rallyState: RallyState
  ): boolean {
    const netApproachStat = shooter.playStyle.netApproach;
    const playStyleType = shooter.playStyle.type;

    // Base probability based on player type
    let baseProbability = 0;
    if (playStyleType === 'serve_volley') {
      baseProbability = 0.5; // 50% base for serve-volleyers
    } else if (netApproachStat >= 70) {
      baseProbability = 0.3; // 30% for net players
    } else if (netApproachStat >= 50) {
      baseProbability = 0.15; // 15% for occasional net players
    } else {
      baseProbability = 0.08; // 8% for baseliners
    }

    // Situational modifiers
    if (!opportunity.netApproachSuitable) return false;

    let probability = baseProbability;

    if (opportunity.attackOpportunity === 'high') probability *= 2.5;
    else if (opportunity.attackOpportunity === 'medium') probability *= 1.5;
    else if (opportunity.attackOpportunity === 'low') probability *= 1.2;

    if (rallyState.lastShotQuality >= 80) probability *= 1.3;
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
    if (aggression >= 75 && rallyState.rallyLength >= 3 && rallyState.rallyLength <= 5) {
      baseProbability *= 1.5; // 50% boost to go for early winners
    }

    if (!opportunity.winnerAttemptSuitable) {
      // Aggressive players go for it anyway more often
      if (aggression >= 80 && Math.random() < 0.25) { // Increased from 0.15
        return true;
      }
      return false;
    }

    let probability = baseProbability;

    if (opportunity.attackOpportunity === 'high') probability *= 3.0;
    else if (opportunity.attackOpportunity === 'medium') probability *= 1.8;
    else if (opportunity.attackOpportunity === 'low') probability *= 1.2;

    if (rallyState.lastShotQuality >= 85) probability *= 1.4;

    return Math.random() < Math.min(0.90, probability); // Increased cap from 0.85
  }

  /**
   * Decide whether to use a tactical shot (drop, lob, angle)
   *
   * Only high-variety players use tactical shots frequently
   */
  private shouldUseTacticalShot(
    shooter: PlayerProfile,
    rallyState: RallyState,
    opportunity: TacticalOpportunity
  ): { use: boolean; type?: 'drop_shot' | 'lob' | 'angle_shot' } {
    const shotVariety = shooter.stats.mental.shotVariety;

    // Only high-variety players use tactical shots frequently
    if (shotVariety < 50) return { use: false };

    if (!opportunity.tacticalShotSuitable) return { use: false };

    // Base probability scales with shot variety stat
    const baseProbability = (shotVariety - 50) / 200; // 0% at 50, 25% at 100

    if (Math.random() > baseProbability) return { use: false };

    // Choose tactical shot type based on situation
    const { opponentPosition, ballQuality } = rallyState;

    // Drop shot: opponent back, we have time
    if (opponentPosition === 'way_back_deep' && ballQuality.baseQuality < 60) {
      return { use: true, type: 'drop_shot' };
    }

    // Angle shot: opponent slightly off, we can pull them wider
    if (opponentPosition === 'slightly_off' || opponentPosition === 'well_positioned') {
      return { use: true, type: 'angle_shot' };
    }

    // Default to angle shot
    return { use: true, type: 'angle_shot' };
  }
}
