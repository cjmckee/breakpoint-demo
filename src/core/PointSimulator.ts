/**
 * PointSimulator - Point-by-point tennis simulation
 *
 * Orchestrates individual point simulation using the ShotCalculator
 * for transparent, stat-based tennis gameplay.
 */

import {
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
  PointType,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { ShotCalculator } from './ShotCalculator.js';
import { ShotSelector } from './ShotSelector.js';
import { TacticalAnalyzer } from './TacticalAnalyzer.js';
import { getQualityThresholds, getMatchLevel, RelativeThresholds } from '../utils/qualityThresholds.js';
import { RALLY_CONFIG, DIFFICULTY_SCORE_FACTORS, DIFFICULTY_THRESHOLDS } from '../config/shotThresholds.js';

export class PointSimulator {
  private shotCalculator: ShotCalculator;
  private shotSelector: ShotSelector;
  private tacticalAnalyzer: TacticalAnalyzer;

  constructor() {
    this.shotCalculator = new ShotCalculator();
    this.shotSelector = new ShotSelector();
    this.tacticalAnalyzer = new TacticalAnalyzer();
  }

  /**
   * Simulate a complete point between server and returner
   */
  public simulatePoint(
    currentServer: 'player' | 'opponent',
    server: PlayerProfile,
    returner: PlayerProfile,
    matchState: MatchState,
    activeEffects?: Record<string, number>
  ): PointResult {
    const shots: ShotDetail[] = [];
    const pointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let shotNumber = 1;

    // Step 1: Serve sequence
    const serveResult = this.simulateServe(server, returner, matchState, pointId, shotNumber, currentServer);
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
      serveResult.nextShooter!,
      currentServer,
      activeEffects
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
    shotNumber: number,
    currentServer: 'player' | 'opponent'
  ): {
    shots: ShotDetail[];
    pointEnded: boolean;
    winner?: 'server' | 'returner';
    pointType?: PointType.ACE | PointType.DOUBLE_FAULT;
    nextShooter?: 'server' | 'returner';
    serveType: 'first' | 'second';
    quality: number;
  } {
    const shots: ShotDetail[] = [];

    // First serve attempt
    // Server fatigue and momentum from server's perspective
    const serverFatigue = matchState.fatigue[currentServer];
    const serverMomentum = currentServer === 'player' ? matchState.momentum : -matchState.momentum;

    const firstServeContext = this.createServeContext(matchState, true);
    const firstServeResult = this.shotCalculator.calculateShotSuccess(
      server,
      'serve_first',
      firstServeContext,
      returner,
      'well_positioned',
      undefined,
      undefined,
      serverFatigue,
      serverMomentum
    );

    // Check first serve result
    if (firstServeResult.outcome === PointType.ACE) {
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
        pointType: PointType.ACE,
        serveType: 'first',
        quality: firstServeResult.quality,
      };
    }

    if (firstServeResult.outcome === PointType.IN_PLAY) {
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

    // First serve was a fault — record the failed attempt in the shots array
    const faultServeShot: ShotDetail = {
      shotType: 'serve_first',
      shooter: 'server',
      success: false,
      quality: firstServeResult.quality,
      outcome: firstServeResult.outcome,
      statUsed: firstServeResult.statUsed,
      modifiers: firstServeResult.modifiers,
      timestamp: Date.now(),
      shotNumber: 1,
      context: firstServeContext,
      thresholds: firstServeResult.thresholds,
    };
    shots.push(faultServeShot);

    // Try second serve
    const secondServeContext = this.createServeContext(matchState, false);
    const secondServeResult = this.shotCalculator.calculateShotSuccess(
      server,
      'serve_second',
      secondServeContext,
      returner,
      'well_positioned',
      undefined,
      undefined,
      serverFatigue,
      serverMomentum
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
    if (secondServeResult.outcome === PointType.ACE) {
      // Ace on second serve (rare but possible)
      return {
        shots,
        pointEnded: true,
        winner: 'server',
        pointType: PointType.ACE,
        serveType: 'second',
        quality: secondServeResult.quality,
      };
    }

    if (secondServeResult.outcome === PointType.FAULT) {
      // Double fault
      return {
        shots,
        pointEnded: true,
        winner: 'returner',
        pointType: PointType.DOUBLE_FAULT,
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
    firstShooter: 'server' | 'returner',
    currentServer: 'player' | 'opponent',
    activeEffects?: Record<string, number>
  ): {
    shots: ShotDetail[];
    winner: 'server' | 'returner';
    pointType: PointType.WINNER | PointType.FORCED_ERROR | PointType.UNFORCED_ERROR;
  } {
    const shots: ShotDetail[] = [];
    let currentShooter = firstShooter;
    let shotNumber = 1; // This is return of serve, serve is shot 0
    let previousShot: ShotDetail = serveShot; // all rallies will at least begin with a serve
    const maxRallyLength = RALLY_CONFIG.maxLength;
    const matchLevel = getMatchLevel(server.overallRating, returner.overallRating);
    const thresholds = getQualityThresholds(matchLevel);

    // NEW: Track court positions throughout rally
    let serverPosition: CourtPosition = 'well_positioned';
    let returnerPosition: CourtPosition = 'well_positioned';

    while (shotNumber < maxRallyLength) {
      const shooterProfile = currentShooter === 'server' ? server : returner;
      const opponentProfile = currentShooter === 'server' ? returner : server;
      const rallyLength = shotNumber;

      // Get current positions
      const shooterPosition = currentShooter === 'server' ? serverPosition : returnerPosition;
      const opponentPosition = currentShooter === 'server' ? returnerPosition : serverPosition;

      // Build rally state for shot selection (ballQuality needed for RallyState)
      const rallyState: RallyState = {
        rallyLength,
        lastShotQuality: previousShot.quality,
        lastShotType: previousShot.shotType,
        shooterPosition,
        opponentPosition,
        ballQuality: this.shotCalculator.calculateBallQuality(previousShot, matchLevel),
        matchLevel,
      };

      // NEW: Use ShotSelector instead of old selectShotType
      const shotType = this.shotSelector.selectShot(
        shooterProfile,
        opponentProfile,
        rallyState,
        matchState
      );

      // Resolve shooter identity for fatigue/momentum/ability lookup
      const shooterIdentity: 'player' | 'opponent' =
        (currentShooter === 'server') === (currentServer === 'player') ? 'player' : 'opponent';

      // Create context for this shot (using actual ball quality and opponent position)
      const shotContext = this.createRallyContext(
        rallyLength,
        matchState,
        shooterPosition,
        thresholds,
        rallyState.ballQuality,
        rallyState.opponentPosition,
        shooterIdentity === 'player' ? activeEffects : undefined
      );

      // Calculate tactical opportunity using unified analyzer
      const tacticalOpportunity = this.tacticalAnalyzer.evaluateTacticalSituation(
        rallyState,
        shooterPosition
      );
      const shooterFatigue = matchState.fatigue[shooterIdentity];
      const shooterMomentum = shooterIdentity === 'player' ? matchState.momentum : -matchState.momentum;

      // Calculate shot result with threshold system
      // Only apply ability effects when the shooter is the player
      const shooterEffects = shooterIdentity === 'player' ? activeEffects : undefined;
      const shotResult = this.shotCalculator.calculateShotSuccess(
        shooterProfile,
        shotType,
        shotContext,
        opponentProfile,
        opponentPosition,
        previousShot,
        tacticalOpportunity,
        shooterFatigue,
        shooterMomentum,
        shooterEffects
      );

      // Error classification now handled by threshold system
      let errorType: 'forced' | 'unforced' | undefined;
      if (shotResult.outcome === PointType.FORCED_ERROR) {
        errorType = 'forced';
      } else if (shotResult.outcome === PointType.UNFORCED_ERROR) {
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
      if (shotResult.outcome === PointType.WINNER) {
        return {
          shots,
          winner: currentShooter,
          pointType: PointType.WINNER,
        };
      }

      if (shotResult.outcome === PointType.FORCED_ERROR || shotResult.outcome === PointType.UNFORCED_ERROR || shotResult.outcome === PointType.FAULT) {
        const opponent = currentShooter === 'server' ? 'returner' : 'server';
        const pointType = errorType === 'forced' ? PointType.FORCED_ERROR : PointType.UNFORCED_ERROR;
        return {
          shots,
          winner: opponent,
          pointType,
        };
      }

      // Shot was successful and in play, continue rally
      previousShot = shotDetail;

      // Update both shooter and opponent positions based on this shot
      const newOpponentPosition = this.updateOpponentPosition(
        shotResult,
        shotType,
        opponentPosition,
        thresholds
      );

      const newShooterPosition = this.updateShooterPosition(
        shotResult,
        shotType,
        shooterPosition,
        rallyLength,
        previousShot.quality,
        thresholds,
        shooterIdentity === 'player' ? activeEffects : undefined
      );

      // Update positions for both players
      if (currentShooter === 'server') {
        serverPosition = newShooterPosition;
        returnerPosition = newOpponentPosition;
      } else {
        returnerPosition = newShooterPosition;
        serverPosition = newOpponentPosition;
      }

      console.log('Current shooter:', currentShooter);
      console.log('Current shot number:', shotNumber);
      console.log('Shooter position:', shooterPosition);
      console.log('Opponent position:', opponentPosition);

      currentShooter = currentShooter === 'server' ? 'returner' : 'server';
      shotNumber++;
    }

    // Rally went too long, award to player with better stamina
    const winner = server.stats.physical.stamina >= returner.stats.physical.stamina ? 'server' : 'returner';
    return {
      shots,
      winner,
      pointType: PointType.FORCED_ERROR,
    };
  }

  /**
   * Classify an error as forced or unforced based on the opponent's previous shot
   * Forced error: Opponent hit a great shot that made it very difficult
   * Unforced error: Player made a mistake on a routine shot
   */
  private classifyError(previousShot: ShotDetail | null, currentContext: ShotContext, thresholds: RelativeThresholds): 'forced' | 'unforced' {
    // No previous shot (e.g., return error) - likely unforced
    if (!previousShot) {
      return 'unforced';
    }

    // If opponent's previous shot was high quality or context is hard/extreme, it's forced
    if (previousShot.quality >= thresholds.high || currentContext.difficulty === 'hard' || currentContext.difficulty === 'extreme') {
      return 'forced';
    }

    // If context was easy/normal and opponent's shot quality was below good, it's unforced
    if ((currentContext.difficulty === 'easy' || currentContext.difficulty === 'normal') && previousShot.quality < thresholds.good) {
      return 'unforced';
    }

    // Middle ground - opponent hit a decent shot on normal difficulty
    return previousShot.quality >= thresholds.good ? 'forced' : 'unforced';
  }

  /**
   * Create context for serve shots
   */
  private createServeContext(matchState: MatchState, isFirstServe: boolean): ShotContext {
    // First serves are generally easier (more powerful), second serves harder (more cautious)
    const difficulty = isFirstServe ? 'normal' : 'hard';

    // Pressure based on match situation
    // Serves are less affected by pressure than rally shots (you control the serve)
    let pressure: ShotContext['pressure'] = 'low';
    if (matchState.isKeyMoment) {
      pressure = 'medium'; // Key moments: medium pressure (not high - serves are self-initiated)
    } else if (matchState.pressure === 'high') {
      pressure = 'low'; // High match pressure: only low serve pressure
    }
    // Otherwise: stay at low pressure (default)

    return {
      difficulty,
      pressure,
      courtPosition: 'baseline',
      rallyLength: 1,
    };
  }

  /**
   * Create context for rally shots
   * Uses actual situation to determine difficulty, not just rally length
   */
  private createRallyContext(
    rallyLength: number,
    matchState: MatchState,
    shooterPosition: CourtPosition,
    thresholds: RelativeThresholds,
    ballQuality?: BallQuality,
    opponentPosition?: CourtPosition,
    activeEffects?: Record<string, number>
  ): ShotContext {
    // Calculate difficulty based on actual situation
    const difficulty = this.calculateShotDifficulty(
      thresholds,
      shooterPosition,
      opponentPosition,
      ballQuality,
      rallyLength,
      activeEffects
    );

    // Pressure from match situation
    let pressure: ShotContext['pressure'] = 'low';
    if (matchState.isKeyMoment) {
      pressure = 'high';
    } else if (rallyLength > 10) {
      pressure = 'medium';
    }

    // Court position comes from actual position tracking
    let courtPosition: ShotContext['courtPosition'] = 'baseline';
    if (shooterPosition === 'at_net') {
      courtPosition = 'net';
    } else if (shooterPosition === 'way_back_deep' || rallyLength > 12) {
      courtPosition = 'defensive';
    }

    return {
      difficulty,
      pressure,
      courtPosition,
      rallyLength,
    };
  }

  /**
   * Calculate shot difficulty based on multiple factors
   *
   * Factors:
   * - Shooter position (out of position = harder)
   * - Incoming ball quality (high quality = harder)
   * - Time available (rushed = harder)
   * - Opponent position (at net = harder)
   * - Rally length (fatigue factor)
   */
  private calculateShotDifficulty(
    thresholds: RelativeThresholds,
    shooterPosition?: CourtPosition,
    opponentPosition?: CourtPosition,
    ballQuality?: BallQuality,
    rallyLength?: number,
    activeEffects?: Record<string, number>
  ): ShotContext['difficulty'] {
    let difficultyScore = 0;

    // Shooter position difficulty
    if (shooterPosition) {
      difficultyScore += DIFFICULTY_SCORE_FACTORS.shooterPosition[shooterPosition];
    }

    // Incoming ball quality difficulty (relative to match level)
    if (ballQuality) {
      if (ballQuality.baseQuality >= thresholds.exceptional) {
        difficultyScore += DIFFICULTY_SCORE_FACTORS.ballQuality.exceptional;
      } else if (ballQuality.baseQuality >= thresholds.high) {
        difficultyScore += DIFFICULTY_SCORE_FACTORS.ballQuality.high;
      }

      // Time pressure
      if (ballQuality.timeAvailable === 'rushed') {
        difficultyScore += DIFFICULTY_SCORE_FACTORS.timePressure.rushed;
      } else if (ballQuality.timeAvailable === 'plenty') {
        difficultyScore += DIFFICULTY_SCORE_FACTORS.timePressure.plenty;
      }

      // Heavy spin is harder to handle
      if (ballQuality.spin === 'heavy_topspin') {
        difficultyScore += DIFFICULTY_SCORE_FACTORS.spin.heavy_topspin;
      }
    }

    // Opponent position difficulty
    if (opponentPosition) {
      difficultyScore += DIFFICULTY_SCORE_FACTORS.opponentPosition[opponentPosition];
    }

    // Rally length fatigue (minor factor)
    if (rallyLength && rallyLength > DIFFICULTY_SCORE_FACTORS.rallyFatigue.threshold1) {
      difficultyScore += DIFFICULTY_SCORE_FACTORS.rallyFatigue.bonus1;
    } else if (rallyLength && rallyLength > DIFFICULTY_SCORE_FACTORS.rallyFatigue.threshold2) {
      difficultyScore += DIFFICULTY_SCORE_FACTORS.rallyFatigue.bonus2;
    }

    // reach: reduces difficulty when out of position
    const reach = activeEffects?.['reach'] ?? 0;
    if (reach > 0 && shooterPosition &&
      shooterPosition !== 'well_positioned' && shooterPosition !== 'at_net') {
      difficultyScore -= reach;
    }

    // Convert score to difficulty level
    if (difficultyScore < 0) {
      return 'easy';
    } else if (difficultyScore < DIFFICULTY_THRESHOLDS.normal) {
      return 'normal';
    } else if (difficultyScore < DIFFICULTY_THRESHOLDS.hard) {
      return 'hard';
    } else {
      return 'extreme';
    }
  }

  /**
   * Update shooter's court position based on the shot they just took
   * Tracks movement to net, defensive positioning, and recovery
   */
  private updateShooterPosition(
    shotResult: ShotResult,
    shotType: ShotType,
    currentPosition: CourtPosition,
    rallyLength: number,
    incomingQuality: number,
    thresholds: RelativeThresholds,
    activeEffects?: Record<string, number>
  ): CourtPosition {
    // If shot was an error, position doesn't matter (point is over)
    if (!shotResult.success) return currentPosition;

    // Approach shots and volleys move shooter to net
    if (shotType.includes('approach')) {
      return 'at_net';
    }

    // Volleys and net shots keep player at net
    if (shotType.includes('volley') || shotType.includes('overhead')) {
      return 'at_net';
    }

    // Drop shots often move player forward
    if (shotType.includes('drop_shot') && shotResult.quality >= thresholds.good) {
      return 'recovering'; // Moving toward net but not there yet
    }

    // Defensive shots push player back
    if (shotType.includes('defensive') || shotType.includes('lob')) {
      return 'way_back_deep';
    }

    // High quality incoming shots force defensive position
    if (incomingQuality >= thresholds.high) {
      return currentPosition === 'at_net' ? 'at_net' : 'slightly_off';
    }

    // Long rallies tend to push players back to baseline
    if (rallyLength > 12) {
      return currentPosition === 'at_net' ? 'at_net' : 'well_positioned';
    }

    // Good shot quality allows recovery to good position
    if (shotResult.quality >= thresholds.high) {
      return currentPosition === 'at_net' ? 'at_net' : 'well_positioned';
    }

    // Weak shots leave player vulnerable
    if (shotResult.quality < thresholds.average) {
      return currentPosition === 'at_net' ? 'at_net' : 'slightly_off';
    }

    // Default: maintain or recover toward good position
    // Apply ability effects for position recovery
    const courtCoverage = (activeEffects?.['court_coverage'] ?? 0) + (activeEffects?.['court_range'] ?? 0);
    const recoverySpeed = activeEffects?.['recovery_speed'] ?? 0;

    if (currentPosition === 'way_out_wide' || currentPosition === 'way_back_deep') {
      // recovery_speed: upgrade from way_out/deep to slightly_off instead of recovering
      return recoverySpeed > 0 ? 'slightly_off' : 'recovering';
    }
    if (currentPosition === 'recovering') {
      // court_coverage + court_range: upgrade recovering to well_positioned faster
      return 'well_positioned';
    }
    if (currentPosition === 'slightly_off' && courtCoverage >= 2) {
      // Strong court coverage: recover from slightly_off to well_positioned
      return 'well_positioned';
    }

    return currentPosition;
  }

  /**
   * Update opponent court position based on shot result
   * High quality shots push opponent out of position
   */
  private updateOpponentPosition(
    shotResult: ShotResult,
    shotType: ShotType,
    currentPosition: CourtPosition,
    thresholds: RelativeThresholds
  ): CourtPosition {
    // If shot was an error, opponent doesn't need to move (they won the point)
    if (!shotResult.success) return currentPosition;

    // Players at net STAY at net — they chose to be there and don't retreat
    // to baseline mid-point. Only a lob can push them back.
    if (currentPosition === 'at_net') {
      if (shotType.includes('lob') && shotResult.quality >= thresholds.high) {
        return 'way_back_deep'; // Good lob forces net player back
      }
      return 'at_net'; // Otherwise hold net position
    }

    const quality = shotResult.quality;

    // Approach shots and volleys put shooter at net
    if (shotType.includes('approach') || shotType.includes('volley')) {
      // This is updating opponent position - if shooter approaches, opponent faces net player
      return currentPosition; // Opponent stays where they are
    }

    // Exceptional quality shots push opponent out of position
    if (quality >= thresholds.exceptional) {
      if (shotType.includes('angle') || shotType.includes('passing')) {
        return 'way_out_wide';
      }
      if (shotType.includes('lob') || quality >= thresholds.exceptional + 5) {
        return 'way_back_deep';
      }
      return 'slightly_off';
    }

    // High quality shots create some advantage
    if (quality >= thresholds.high) {
      return 'slightly_off';
    }

    // Weak shots let opponent recover
    if (quality < thresholds.average) {
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
   * Create complete point result with statistics
   */
  private createPointResult(
    server: 'player' | 'opponent',
    winner: 'server' | 'returner',
    shots: ShotDetail[],
    pointType: PointType,
    matchState: MatchState,
    serveType: 'first' | 'second'
  ): PointResult {
    const rallyLength = shots.length;
    const keyShot = this.identifyKeyShot(shots);
    const statistics = this.calculatePointStatistics(shots);

    // Estimate point duration based on rally length
    const baseDuration = shots.length * RALLY_CONFIG.durationPerShot;
    const rallyCostMultiplier = rallyLength > RALLY_CONFIG.longRallyThreshold
      ? RALLY_CONFIG.longRallyCostMultiplier : 1.0;
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
    // Ace or winner shot is always key
    const winnerShot = shots.find(shot => shot.outcome === PointType.ACE || shot.outcome === PointType.WINNER);
    if (winnerShot) return winnerShot;

    // Error shot that ended the point (last shot if it's an error)
    const lastShot = shots[shots.length - 1];
    if (lastShot && lastShot.outcome === PointType.FAULT) {
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
    const winnerCount = shots.filter(shot => shot.outcome === PointType.ACE || shot.outcome === PointType.WINNER).length;
    const errorCount = shots.filter(shot => shot.outcome === PointType.FAULT).length;
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