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
  MatchState,
  PointStatistics,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { ShotCalculator } from './ShotCalculator.js';

export class PointSimulator {
  private shotCalculator: ShotCalculator;

  constructor() {
    this.shotCalculator = new ShotCalculator();
  }

  /**
   * Simulate a complete point between server and returner
   */
  public simulatePoint(
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
        serveResult.winner!,
        shots,
        serveResult.pointType!,
        matchState,
        serveResult.serveType
      );
    }

    // Step 2: Rally sequence (if serve was successful)
    const rallyResult = this.simulateRally(
      server,
      returner,
      matchState,
      pointId,
      shotNumber,
      serveResult.nextShooter!
    );
    shots.push(...rallyResult.shots);

    // Combine results
    const winner = rallyResult.winner;
    const pointType = rallyResult.pointType;

    return this.createPointResult(winner, shots, pointType, matchState, serveResult.serveType);
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
  } {
    const shots: ShotDetail[] = [];

    // First serve attempt
    const firstServeContext = this.createServeContext(matchState, true);
    const firstServeResult = this.shotCalculator.calculateShotSuccess(
      server,
      'serve_first',
      firstServeContext
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
      };
      shots.push(firstServeShot);

      return {
        shots,
        pointEnded: true,
        winner: 'server',
        pointType: 'ace',
        serveType: 'first',
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
      };
      shots.push(firstServeShot);

      return {
        shots,
        pointEnded: false,
        nextShooter: 'returner',
        serveType: 'first',
      };
    }

    // First serve was a fault, try second serve
    const secondServeContext = this.createServeContext(matchState, false);
    const secondServeResult = this.shotCalculator.calculateShotSuccess(
      server,
      'serve_second',
      secondServeContext
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
      };
    }

    // Second serve in play, returner gets to return
    return {
      shots,
      pointEnded: false,
      nextShooter: 'returner',
      serveType: 'second',
    };
  }

  /**
   * Simulate the rally after a successful serve
   */
  private simulateRally(
    server: PlayerProfile,
    returner: PlayerProfile,
    matchState: MatchState,
    pointId: string,
    startingShotNumber: number,
    firstShooter: 'server' | 'returner'
  ): {
    shots: ShotDetail[];
    winner: 'server' | 'returner';
    pointType: 'winner' | 'forced_error' | 'unforced_error';
  } {
    const shots: ShotDetail[] = [];
    let currentShooter = firstShooter;
    let shotNumber = startingShotNumber;
    const maxRallyLength = 30; // Prevent infinite rallies

    while (shotNumber - startingShotNumber < maxRallyLength) {
      const shooterProfile = currentShooter === 'server' ? server : returner;
      const rallyLength = shotNumber - startingShotNumber + 1;

      // Select shot type based on situation and player style
      const shotType = this.selectShotType(shooterProfile, rallyLength, matchState);

      // Create context for this shot
      const shotContext = this.createRallyContext(rallyLength, matchState, shooterProfile);

      // Calculate shot result
      const shotResult = this.shotCalculator.calculateShotSuccess(
        shooterProfile,
        shotType,
        shotContext
      );

      // Create shot detail
      const shotDetail: ShotDetail = {
        shotType,
        shooter: currentShooter,
        success: shotResult.success,
        quality: shotResult.quality,
        outcome: shotResult.outcome,
        statUsed: shotResult.statUsed,
        modifiers: shotResult.modifiers,
        timestamp: Date.now(),
        shotNumber,
        context: shotContext,
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

      if (shotResult.outcome === 'error') {
        const opponent = currentShooter === 'server' ? 'returner' : 'server';
        const errorType = rallyLength <= 3 ? 'unforced_error' : 'forced_error';
        return {
          shots,
          winner: opponent,
          pointType: errorType,
        };
      }

      // Shot was successful and in play, continue rally
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
   * Select appropriate shot type based on situation and player style
   */
  private selectShotType(
    shooterProfile: PlayerProfile,
    rallyLength: number,
    matchState: MatchState
  ): ShotType {
    const playStyle = shooterProfile.playStyle;

    // Return shots (first shot after serve)
    if (rallyLength === 1) {
      if (playStyle.aggression > 70) {
        return 'return_winner'; // Aggressive return
      }
      return Math.random() < 0.5 ? 'return_forehand' : 'return_backhand';
    }

    // Early rally (shots 2-4)
    if (rallyLength <= 4) {
      if (playStyle.aggression > 80 && Math.random() < 0.3) {
        return Math.random() < 0.5 ? 'forehand_winner' : 'backhand_winner';
      }

      if (playStyle.netApproach > 70 && Math.random() < 0.4) {
        return Math.random() < 0.5 ? 'forehand_approach' : 'backhand_approach';
      }

      return Math.random() < 0.6 ? 'forehand' : 'backhand';
    }

    // Mid rally (shots 5-10)
    if (rallyLength <= 10) {
      // Net players try to get to net
      if (playStyle.netApproach > 60 && Math.random() < 0.3) {
        return Math.random() < 0.5 ? 'volley_forehand' : 'volley_backhand';
      }

      // Tactical shots for variety-focused players
      if (shooterProfile.stats.mental.shot_variety > 70 && Math.random() < 0.2) {
        const tacticalShots: ShotType[] = ['drop_shot', 'lob', 'angle_shot'];
        return tacticalShots[Math.floor(Math.random() * tacticalShots.length)];
      }

      // Regular groundstrokes with occasional winners
      if (playStyle.aggression > 60 && Math.random() < 0.25) {
        return Math.random() < 0.5 ? 'forehand_winner' : 'backhand_winner';
      }

      return Math.random() < 0.5 ? 'forehand' : 'backhand';
    }

    // Long rally (shots 11+) - more defensive, occasional desperation shots
    if (rallyLength > 15 && Math.random() < 0.3) {
      return Math.random() < 0.5 ? 'defensive_slice' : 'lob';
    }

    // Mostly defensive groundstrokes in long rallies
    if (playStyle.consistency > 60) {
      return Math.random() < 0.5 ? 'slice_forehand' : 'slice_backhand';
    }

    return Math.random() < 0.5 ? 'forehand' : 'backhand';
  }

  /**
   * Create complete point result with statistics
   */
  private createPointResult(
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

    const dominantShot = Object.entries(shotCounts).reduce((dominant, [shotType, count]) =>
      count > (shotCounts[dominant as ShotType] || 0) ? shotType as ShotType : dominant as ShotType
    );

    return {
      totalShots,
      winnerCount,
      errorCount,
      netApproaches,
      rallyExchanges,
      pressureMoments,
      dominantShot: shotCounts[dominantShot] > 1 ? dominantShot : undefined,
    };
  }
}