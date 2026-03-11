/**
 * TacticalAnalyzer - Unified tactical situation evaluation
 *
 * Analyzes rally state to determine attack opportunities, defensive requirements,
 * and tactical shot suitability. Used by both PointSimulator and ShotSelector
 * to ensure consistent tactical assessment throughout the simulation.
 */

import type {
  RallyState,
  TacticalOpportunity,
  CourtPosition,
  BallQuality,
} from '../types/index.js';

export class TacticalAnalyzer {
  /**
   * Evaluate the complete tactical situation from rally state
   *
   * Considers:
   * - Opponent position (out wide, back deep, at net, etc.)
   * - Last shot quality (did we hit a good shot?)
   * - Incoming ball quality (weak shot to attack, or defensive situation?)
   * - Rally length (is this getting long?)
   * - Shooter position (are we at net already?)
   *
   * Returns comprehensive tactical evaluation for shot selection and quality calculations
   */
  public evaluateTacticalSituation(
    rallyState: RallyState,
    shooterPosition?: CourtPosition
  ): TacticalOpportunity {
    const { opponentPosition, lastShotQuality, ballQuality, rallyLength } = rallyState;

    // Attack opportunity scoring
    let attackScore = 0;

    // Opponent position contributes to attack score
    attackScore += this.getPositionAttackScore(opponentPosition);

    // Our previous shot quality matters
    if (lastShotQuality >= 80) attackScore += 30; // We hit a great shot
    else if (lastShotQuality >= 60) attackScore += 15; // We hit a good shot

    // Incoming ball quality
    attackScore += this.getBallQualityAttackScore(ballQuality);

    // Shooter at net increases attack opportunity
    if (shooterPosition === 'at_net') {
      attackScore += 25; // Already at net = offensive position
    }

    // Defensive requirement evaluation
    const defensiveRequired = this.isDefensiveRequired(
      ballQuality,
      opponentPosition,
      lastShotQuality,
      shooterPosition
    );

    // Classify attack opportunity level
    const attackLevel = this.classifyAttackLevel(attackScore);

    // Net approach suitability
    const netApproachSuitable =
      attackScore >= 25 &&
      rallyLength >= 2 &&
      !defensiveRequired &&
      shooterPosition !== 'at_net'; // Don't approach if already at net

    // Winner attempt suitability
    const winnerAttemptSuitable = attackScore >= 30 && !defensiveRequired;

    // Tactical shot suitability (drop shots, angles, lobs)
    const tacticalShotSuitable =
      rallyLength >= 5 &&
      ballQuality.timeAvailable !== 'rushed' &&
      !defensiveRequired;

    return {
      attackOpportunity: attackLevel,
      netApproachSuitable,
      winnerAttemptSuitable,
      defensiveRequired,
      tacticalShotSuitable,
      recommendedAggression: Math.min(100, attackScore),
    };
  }

  /**
   * Calculate attack score contribution from opponent position
   */
  private getPositionAttackScore(opponentPosition: CourtPosition): number {
    switch (opponentPosition) {
      case 'way_out_wide':
        return 40; // Opponent pushed wide = great attack opportunity
      case 'way_back_deep':
        return 35; // Opponent pushed back = good attack opportunity
      case 'recovering':
        return 30; // Opponent in transition = attack window
      case 'slightly_off':
        return 15; // Opponent slightly off = moderate opportunity
      case 'at_net':
        return -10; // Opponent at net = harder to attack
      case 'well_positioned':
        return 0; // Neutral situation
      default:
        return 0;
    }
  }

  /**
   * Calculate attack score contribution from incoming ball quality
   */
  private getBallQualityAttackScore(ballQuality: BallQuality): number {
    let score = 0;

    // Weak incoming shots = attack opportunity
    if (ballQuality.baseQuality < 40) score += 20;
    else if (ballQuality.baseQuality < 60) score += 10;

    // High quality incoming shots = defensive situation (negative score)
    if (ballQuality.baseQuality >= 80) score -= 15;

    // Time pressure affects attack opportunity
    if (ballQuality.timeAvailable === 'plenty') score += 15;
    else if (ballQuality.timeAvailable === 'rushed') score -= 10;

    return score;
  }

  /**
   * Determine if defensive shot is required
   */
  private isDefensiveRequired(
    ballQuality: BallQuality,
    opponentPosition: CourtPosition,
    lastShotQuality: number,
    shooterPosition?: CourtPosition
  ): boolean {
    // Rushed time = must defend
    if (ballQuality.timeAvailable === 'rushed') return true;

    // High quality shot against us = must defend
    if (ballQuality.baseQuality >= 80) return true;

    // Opponent at net and we're not = must defend
    if (opponentPosition === 'at_net' && shooterPosition !== 'at_net') return true;

    // We hit a very weak shot last time = likely in trouble
    if (lastShotQuality < 30) return true;

    return false;
  }

  /**
   * Classify attack opportunity level from score
   */
  private classifyAttackLevel(attackScore: number): 'none' | 'low' | 'medium' | 'high' {
    if (attackScore >= 70) return 'high';
    if (attackScore >= 40) return 'medium';
    if (attackScore >= 20) return 'low';
    return 'none';
  }

  /**
   * Helper method for external classes to quickly check if situation is defensive
   * (without needing full tactical opportunity evaluation)
   */
  public isDefensiveSituation(rallyState: RallyState, shooterPosition?: CourtPosition): boolean {
    return this.isDefensiveRequired(
      rallyState.ballQuality,
      rallyState.opponentPosition,
      rallyState.lastShotQuality,
      shooterPosition
    );
  }

  /**
   * Helper method to get recommended aggression level (0-100)
   */
  public getRecommendedAggression(rallyState: RallyState, shooterPosition?: CourtPosition): number {
    const tactical = this.evaluateTacticalSituation(rallyState, shooterPosition);
    return tactical.recommendedAggression;
  }
}
