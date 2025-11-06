/**
 * PointSimulator - Point-by-point tennis simulation
 *
 * Orchestrates individual point simulation using the ShotCalculator
 * for transparent, stat-based tennis gameplay.
 */

import type {
  PointResult,
  ShotDetail,
  ShotContext,
  ShotType,
  ShotResult,
  MatchState,
  PointStatistics,
  RallyState,
  CourtPosition,
  BallQuality,
  TacticalOpportunity,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { ShotCalculator } from './ShotCalculator.js';
import { ShotSelector } from './ShotSelector.js';

export class PointSimulator {
  private shotCalculator: ShotCalculator;
  private shotSelector: ShotSelector;

  constructor() {
    this.shotCalculator = new ShotCalculator();
    this.shotSelector = new ShotSelector();
  }

  /**
   * Simulate a complete point between server and returner
   */
  public simulatePoint(
    currentServer: 'player' | 'opponent',
    server: PlayerProfile,
    returner: PlayerProfile,
    matchState: MatchState
  ): PointResult {
    const shots: ShotDetail[] = [];
    const pointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let shotNumber = 1;

    // Step 1: Serve sequence
    const serveResult = this.simulateServe(server, returner, matchState, pointId, shotNumber);
    shots.push(...serveResult.shots);
    shotNumber += serveResult.shots.length;

    // If serve sequence ended the point, return result
    if (serveResult.pointEnded) {
      return this.createPointResult(
        currentServer,
        serveResult.winner!,
        shots,
        serveResult.pointType!,
        matchState,
        serveResult.serveType
      );
    }

    // Step 2: Rally sequence (if serve was successful)
    // We need to pass the serve quality
    const rallyResult = this.simulateRally(
      shots[0],
      server,
      returner,
      matchState,
      pointId,
      serveResult.nextShooter!
    );
    shots.push(...rallyResult.shots);

    // Combine results
    const winner = rallyResult.winner;
    const pointType = rallyResult.pointType;

    return this.createPointResult(currentServer, winner, shots, pointType, matchState, serveResult.serveType);
  }

  /**
   * Simulate the serve sequence (first serve, possible second serve)
   */
  private simulateServe(
    server: PlayerProfile,
    returner: PlayerProfile,
    matchState: MatchState,
    pointId: string,
    shotNumber: number
  ): {
    shots: ShotDetail[];
    pointEnded: boolean;
    winner?: 'server' | 'returner';
    pointType?: 'ace' | 'double_fault';
    nextShooter?: 'server' | 'returner';
    serveType: 'first' | 'second';
    quality: number;
  } {
    const shots: ShotDetail[] = [];

    // First serve attempt
    const firstServeContext = this.createServeContext(matchState, true);
    const firstServeResult = this.shotCalculator.calculateShotSuccess(
      server,
      'serve_first',
      firstServeContext,
      returner,                    // NEW: opponent profile
      'well_positioned',           // NEW: returner position
      undefined                    // NEW: no incoming shot for serve
    );

    // Check first serve result
    if (firstServeResult.outcome === 'winner') {
      // Ace on first serve
      const firstServeShot: ShotDetail = {
        shotType: 'serve_first',
        shooter: 'server',
        success: firstServeResult.success,
        quality: firstServeResult.quality,
        outcome: firstServeResult.outcome,
        statUsed: firstServeResult.statUsed,
        modifiers: firstServeResult.modifiers,
        timestamp: Date.now(),
        shotNumber: 1,
        context: firstServeContext,
        thresholds: firstServeResult.thresholds,
      };
      shots.push(firstServeShot);

      return {
        shots,
        pointEnded: true,
        winner: 'server',
        pointType: 'ace',
        serveType: 'first',
        quality: firstServeResult.quality,
      };
    }

    if (firstServeResult.outcome === 'in_play') {
      // Good first serve, returner gets to return
      const firstServeShot: ShotDetail = {
        shotType: 'serve_first',
        shooter: 'server',
        success: firstServeResult.success,
        quality: firstServeResult.quality,
        outcome: firstServeResult.outcome,
        statUsed: firstServeResult.statUsed,
        modifiers: firstServeResult.modifiers,
        timestamp: Date.now(),
        shotNumber: 1,
        context: firstServeContext,
        thresholds: firstServeResult.thresholds,
      };
      shots.push(firstServeShot);

      return {
        shots,
        pointEnded: false,
        nextShooter: 'returner',
        serveType: 'first',
        quality: firstServeResult.quality,
      };
    }

    // First serve was a fault, try second serve
    const secondServeContext = this.createServeContext(matchState, false);
    const secondServeResult = this.shotCalculator.calculateShotSuccess(
      server,
      'serve_second',
      secondServeContext,
      returner,                    // NEW: opponent profile
      'well_positioned',           // NEW: returner position
      undefined                    // NEW: no incoming shot for serve
    );

    const secondServeShot: ShotDetail = {
      shotType: 'serve_second',
      shooter: 'server',
      success: secondServeResult.success,
      quality: secondServeResult.quality,
      outcome: secondServeResult.outcome,
      statUsed: secondServeResult.statUsed,
      modifiers: secondServeResult.modifiers,
      timestamp: Date.now(),
      shotNumber: 1, // Second serve is shot #1 when it starts the rally
      context: secondServeContext,
      thresholds: secondServeResult.thresholds,
    };

    shots.push(secondServeShot);

    // Check second serve result
    if (secondServeResult.outcome === 'winner') {
      // Ace on second serve (rare but possible)
      return {
        shots,
        pointEnded: true,
        winner: 'server',
        pointType: 'ace',
        serveType: 'second',
        quality: secondServeResult.quality,
      };
    }

    if (secondServeResult.outcome === 'error') {
      // Double fault
      return {
        shots,
        pointEnded: true,
        winner: 'returner',
        pointType: 'double_fault',
        serveType: 'second',
        quality: secondServeResult.quality,
      };
    }

    // Second serve in play, returner gets to return
    return {
      shots,
      pointEnded: false,
      nextShooter: 'returner',
      serveType: 'second',
      quality: secondServeResult.quality,
    };
  }

  /**
   * Simulate the rally after a successful serve
   */
  private simulateRally(
    serveShot: ShotDetail,
    server: PlayerProfile,
    returner: PlayerProfile,
    matchState: MatchState,
    pointId: string,
    firstShooter: 'server' | 'returner'
  ): {
    shots: ShotDetail[];
    winner: 'server' | 'returner';
    pointType: 'winner' | 'forced_error' | 'unforced_error';
  } {
    const shots: ShotDetail[] = [];
    let currentShooter = firstShooter;
    let shotNumber = 1; // This is return of serve, serve is shot 0
    let previousShot: ShotDetail = serveShot; // all rallies will at least begin with a serve
    const maxRallyLength = 30; // Prevent infinite rallies

    // NEW: Track court positions throughout rally
    let serverPosition: CourtPosition = 'well_positioned';
    let returnerPosition: CourtPosition = 'well_positioned';

    while (shotNumber < maxRallyLength) {
      const shooterProfile = currentShooter === 'server' ? server : returner;
      const opponentProfile = currentShooter === 'server' ? returner : server;
      const rallyLength = shotNumber;

      // NEW: Get current positions
      const shooterPosition = currentShooter === 'server' ? serverPosition : returnerPosition;
      const opponentPosition = currentShooter === 'server' ? returnerPosition : serverPosition;

      // NEW: Calculate ball quality from previous shot
      const ballQuality = this.calculateBallQuality(previousShot);

      // NEW: Build rally state for shot selection
      const rallyState: RallyState = {
        rallyLength,
        lastShotQuality: previousShot.quality,
        lastShotType: previousShot.shotType,
        shooterPosition,
        opponentPosition,
        ballQuality,
      };

      // NEW: Use ShotSelector instead of old selectShotType
      const shotType = this.shotSelector.selectShot(
        shooterProfile,
        opponentProfile,
        rallyState,
        matchState
      );

      // Create context for this shot
      const shotContext = this.createRallyContext(rallyLength, matchState, shooterProfile);

      // NEW: Calculate tactical opportunity for ShotCalculator
      const tacticalOpportunity = this.evaluateTacticalOpportunity(rallyState);

      // Calculate shot result with new threshold system
      const shotResult = this.shotCalculator.calculateShotSuccess(
        shooterProfile,
        shotType,
        shotContext,
        opponentProfile,                    // NEW: required opponent profile
        opponentPosition,                   // NEW: required opponent position
        previousShot,                       // NEW: previous shot for incoming quality
        ballQuality,                        // Legacy parameter (optional)
        tacticalOpportunity                 // Optional tactical context
      );

      // Error classification now handled by threshold system
      let errorType: 'forced' | 'unforced' | undefined;
      if (shotResult.outcome === 'forced_error') {
        errorType = 'forced';
      } else if (shotResult.outcome === 'unforced_error') {
        errorType = 'unforced';
      }

      // Create shot detail
      const shotDetail: ShotDetail = {
        shotType,
        shooter: currentShooter,
        success: shotResult.success,
        quality: shotResult.quality,
        outcome: shotResult.outcome,
        errorType,
        statUsed: shotResult.statUsed,
        modifiers: shotResult.modifiers,
        timestamp: Date.now(),
        shotNumber,
        context: shotContext,
        thresholds: shotResult.thresholds, // NEW: include thresholds for analysis
      };

      shots.push(shotDetail);

      // Check if point ended
      if (shotResult.outcome === 'winner') {
        return {
          shots,
          winner: currentShooter,
          pointType: 'winner',
        };
      }

      if (shotResult.outcome === 'forced_error' || shotResult.outcome === 'unforced_error' || shotResult.outcome === 'error') {
        const opponent = currentShooter === 'server' ? 'returner' : 'server';
        const pointType = errorType === 'forced' ? 'forced_error' : 'unforced_error';
        return {
          shots,
          winner: opponent,
          pointType,
        };
      }

      // Shot was successful and in play, continue rally
      previousShot = shotDetail;

      // NEW: Update opponent position based on this shot
      const newOpponentPosition = this.updateCourtPosition(
        shotResult,
        shotType,
        opponentPosition
      );

      if (currentShooter === 'server') {
        returnerPosition = newOpponentPosition;
      } else {
        serverPosition = newOpponentPosition;
      }

      currentShooter = currentShooter === 'server' ? 'returner' : 'server';
      shotNumber++;
    }

    // Rally went too long, award to player with better stamina
    const winner = server.stats.physical.stamina >= returner.stats.physical.stamina ? 'server' : 'returner';
    return {
      shots,
      winner,
      pointType: 'forced_error',
    };
  }

  /**
   * Classify an error as forced or unforced based on the opponent's previous shot
   * Forced error: Opponent hit a great shot that made it very difficult
   * Unforced error: Player made a mistake on a routine shot
   */
  private classifyError(previousShot: ShotDetail | null, currentContext: ShotContext): 'forced' | 'unforced' {
    // No previous shot (e.g., return error) - likely unforced
    if (!previousShot) {
      return 'unforced';
    }

    // If opponent's previous shot was high quality (>70) or context is hard/extreme, it's forced
    if (previousShot.quality >= 70 || currentContext.difficulty === 'hard' || currentContext.difficulty === 'extreme') {
      return 'forced';
    }

    // If context was easy/normal and opponent's shot quality was mediocre, it's unforced
    if ((currentContext.difficulty === 'easy' || currentContext.difficulty === 'normal') && previousShot.quality < 60) {
      return 'unforced';
    }

    // Middle ground - opponent hit a decent shot (60-70 quality) on normal difficulty
    // This is a judgment call - we'll consider it forced if quality >= 65
    return previousShot.quality >= 65 ? 'forced' : 'unforced';
  }

  /**
   * Create context for serve shots
   */
  private createServeContext(matchState: MatchState, isFirstServe: boolean): ShotContext {
    // First serves are generally easier (more powerful), second serves harder (more cautious)
    const difficulty = isFirstServe ? 'normal' : 'hard';

    // Pressure based on match situation
    let pressure: ShotContext['pressure'] = 'low';
    if (matchState.isKeyMoment) {
      pressure = 'high';
    } else if (matchState.pressure === 'medium' || matchState.pressure === 'high') {
      pressure = 'medium';
    }

    return {
      difficulty,
      pressure,
      courtPosition: 'baseline',
      rallyLength: 1,
      opponentPosition: 'good',
      timeAvailable: 'plenty',
      ballHeight: 'medium',
      ballSpeed: 'medium',
    };
  }

  /**
   * Create context for rally shots
   */
  private createRallyContext(
    rallyLength: number,
    matchState: MatchState,
    shooterProfile: PlayerProfile
  ): ShotContext {
    // Difficulty increases with rally length
    let difficulty: ShotContext['difficulty'];
    if (rallyLength <= 3) {
      difficulty = 'easy';
    } else if (rallyLength <= 8) {
      difficulty = 'normal';
    } else if (rallyLength <= 15) {
      difficulty = 'hard';
    } else {
      difficulty = 'extreme';
    }

    // Pressure from match situation
    let pressure: ShotContext['pressure'] = 'low';
    if (matchState.isKeyMoment) {
      pressure = 'high';
    } else if (rallyLength > 10) {
      pressure = 'medium';
    }

    // Court position based on play style
    let courtPosition: ShotContext['courtPosition'] = 'baseline';
    if (shooterProfile.playStyle.netApproach > 70 && rallyLength >= 3) {
      courtPosition = 'net';
    } else if (rallyLength > 12) {
      courtPosition = 'defensive';
    }

    // Time pressure increases with rally length
    let timeAvailable: ShotContext['timeAvailable'] = 'normal';
    if (rallyLength > 15) {
      timeAvailable = 'rushed';
    } else if (rallyLength < 4) {
      timeAvailable = 'plenty';
    }

    return {
      difficulty,
      pressure,
      courtPosition,
      rallyLength,
      opponentPosition: 'good',
      timeAvailable,
      ballHeight: 'medium',
      ballSpeed: 'medium',
    };
  }

  /**
   * Calculate ball quality from previous shot result and type
   * Derives spin, timeAvailable, and baseQuality from shot characteristics
   */
  private calculateBallQuality(previousShot: ShotDetail | null): BallQuality {
    if (!previousShot) {
      // No previous shot (e.g., first shot after serve) - neutral ball
      return {
        spin: 'flat',
        timeAvailable: 'normal',
        baseQuality: 50,
      };
    }

    const { shotType, quality, success } = previousShot;

    // Derive spin from shot type
    let spin: BallQuality['spin'];
    if (shotType.includes('slice') || shotType.includes('defensive_slice')) {
      spin = 'slice';
    } else if (shotType.includes('topspin') || shotType.includes('kick')) {
      spin = quality >= 70 ? 'heavy_topspin' : 'topspin';
    } else if (shotType.includes('power')) {
      spin = 'flat';
    } else {
      spin = 'topspin'; // Default for most groundstrokes
    }

    // Derive time available from shot quality and type
    let timeAvailable: BallQuality['timeAvailable'];
    if (quality >= 80 || shotType.includes('power')) {
      timeAvailable = 'rushed'; // Fast, powerful shots
    } else if (quality < 50 || shotType.includes('slice') || shotType.includes('lob')) {
      timeAvailable = 'plenty'; // Slow, loopy shots
    } else {
      timeAvailable = 'normal';
    }

    // Base quality is the shot quality with some randomness
    const randomVariance = (Math.random() - 0.5) * 10; // ±5 points
    const baseQuality = Math.max(0, Math.min(100, quality + randomVariance));

    return {
      spin,
      timeAvailable,
      baseQuality,
    };
  }

  /**
   * Update opponent court position based on shot result
   * High quality shots push opponent out of position
   */
  private updateCourtPosition(
    shotResult: ShotResult,
    shotType: ShotType,
    currentPosition: CourtPosition
  ): CourtPosition {
    // If shot was an error, opponent doesn't need to move (they won the point)
    if (!shotResult.success) return currentPosition;

    const quality = shotResult.quality;

    // Approach shots and volleys put shooter at net
    if (shotType.includes('approach') || shotType.includes('volley')) {
      // This is updating opponent position - if shooter approaches, opponent faces net player
      return currentPosition; // Opponent stays where they are
    }

    // High quality shots push opponent out of position
    if (quality >= 85) {
      if (shotType.includes('angle') || shotType.includes('passing')) {
        return 'way_out_wide';
      }
      if (shotType.includes('lob') || quality >= 90) {
        return 'way_back_deep';
      }
      return 'slightly_off';
    }

    // Good shots create some advantage
    if (quality >= 70) {
      return 'slightly_off';
    }

    // Weak shots let opponent recover
    if (quality < 50) {
      return 'well_positioned';
    }

    // Medium shots: opponent recovers slightly
    if (currentPosition === 'way_out_wide' || currentPosition === 'way_back_deep') {
      return 'recovering';
    }
    if (currentPosition === 'recovering') {
      return 'slightly_off';
    }

    return 'well_positioned';
  }

  /**
   * Evaluate tactical opportunity from rally state
   * (Simplified version - ShotSelector has the full implementation)
   */
  private evaluateTacticalOpportunity(rallyState: RallyState): TacticalOpportunity {
    const { opponentPosition, lastShotQuality, ballQuality } = rallyState;

    // Attack opportunity scoring (simplified)
    let attackScore = 0;

    if (opponentPosition === 'way_out_wide') attackScore += 40;
    if (opponentPosition === 'way_back_deep') attackScore += 35;
    if (opponentPosition === 'recovering') attackScore += 30;
    if (lastShotQuality >= 70) attackScore += 20;
    if (ballQuality.baseQuality < 50) attackScore += 15;

    const defensiveRequired =
      ballQuality.timeAvailable === 'rushed' ||
      ballQuality.baseQuality >= 80 ||
      opponentPosition === 'at_net';

    return {
      attackOpportunity: attackScore >= 60 ? 'high' : attackScore >= 35 ? 'medium' : 'low',
      netApproachSuitable: attackScore >= 40 && !defensiveRequired,
      winnerAttemptSuitable: attackScore >= 30 && !defensiveRequired,
      defensiveRequired,
      tacticalShotSuitable: !defensiveRequired,
      recommendedAggression: Math.min(100, attackScore),
    };
  }

  /**
   * Create complete point result with statistics
   */
  private createPointResult(
    server: 'player' | 'opponent',
    winner: 'server' | 'returner',
    shots: ShotDetail[],
    pointType: 'ace' | 'winner' | 'forced_error' | 'unforced_error' | 'double_fault',
    matchState: MatchState,
    serveType: 'first' | 'second'
  ): PointResult {
    const rallyLength = shots.length;
    const keyShot = this.identifyKeyShot(shots);
    const statistics = this.calculatePointStatistics(shots);

    // Estimate point duration (2-3 seconds per shot on average)
    const baseDuration = shots.length * 2.5;
    const rallyCostMultiplier = rallyLength > 10 ? 1.5 : 1.0;
    const duration = Math.round(baseDuration * rallyCostMultiplier);

    return {
      server,
      winner,
      shots,
      rallyLength,
      keyShot,
      pointType,
      duration,
      statistics,
      serveType,
    };
  }

  /**
   * Identify the most important shot in the point
   */
  private identifyKeyShot(shots: ShotDetail[]): ShotDetail | undefined {
    // Winner shot is always key
    const winnerShot = shots.find(shot => shot.outcome === 'winner');
    if (winnerShot) return winnerShot;

    // Error shot that ended the point (last shot if it's an error)
    const lastShot = shots[shots.length - 1];
    if (lastShot && lastShot.outcome === 'error') {
      return lastShot;
    }

    // Highest quality shot in the rally
    return shots.reduce((best, current) =>
      current.quality > best.quality ? current : best
    );
  }

  /**
   * Calculate statistics for this point
   */
  private calculatePointStatistics(shots: ShotDetail[]): PointStatistics {
    const totalShots = shots.length;
    const winnerCount = shots.filter(shot => shot.outcome === 'winner').length;
    const errorCount = shots.filter(shot => shot.outcome === 'error').length;
    const netApproaches = shots.filter(shot =>
      shot.shotType.includes('volley') ||
      shot.shotType.includes('approach')
    ).length;
    const rallyExchanges = Math.max(0, totalShots - 2); // Exclude serve and return
    const pressureMoments = shots.filter(shot =>
      shot.context.pressure === 'high' || shot.context.rallyLength > 10
    ).length;

    // Find most common shot type
    const shotCounts = shots.reduce((counts, shot) => {
      counts[shot.shotType] = (counts[shot.shotType] || 0) + 1;
      return counts;
    }, {} as Record<ShotType, number>);

    const dominantShotEntry = Object.entries(shotCounts).reduce((dominant, [shotType, count]) =>
      count > dominant[1] ? [shotType, count] as [string, number] : dominant,
      ['', 0] as [string, number]
    );

    const dominantShot = dominantShotEntry[0] as ShotType;

    return {
      totalShots,
      winnerCount,
      errorCount,
      netApproaches,
      rallyExchanges,
      pressureMoments,
      dominantShot: dominantShotEntry[1] > 1 ? dominantShot : undefined,
    };
  }
}