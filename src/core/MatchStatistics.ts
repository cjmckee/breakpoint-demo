/**
 * MatchStatistics - Comprehensive match statistics collection and analysis
 *
 * Tracks all relevant match statistics and provides correlation analysis
 * to prove that player stats directly influence match outcomes.
 */

import {
  type MatchStatistics as IMatchStatistics,
  type PlayerPerformance,
  type MatchSummary,
  type PointResult,
  type ShotDetail,
  type ShotType,
  type StatName,
  type PlayerStats,
  PointType,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';

export class MatchStatistics {
  private statistics: IMatchStatistics;
  private pointResults: PointResult[] = [];
  private playerProfile: PlayerProfile;
  private opponentProfile: PlayerProfile;

  // Track break point opportunities
  private breakPointOpportunities: { player: number; opponent: number } = { player: 0, opponent: 0 };

  // Track serve attempts for accurate percentage calculations
  private firstServeAttempts: { player: number; opponent: number } = { player: 0, opponent: 0 };
  private firstServesIn: { player: number; opponent: number } = { player: 0, opponent: 0 };
  private secondServeAttempts: { player: number; opponent: number } = { player: 0, opponent: 0 };
  private secondServesIn: { player: number; opponent: number } = { player: 0, opponent: 0 };

  // Track largest deficit for comeback highlights
  private worstDeficitSeverity = 0;

  // Track rally point count for accurate average (only points with rallyLength > 2)
  private rallyPointCount = 0;
  private rallyPointCountWon: { player: number; opponent: number } = { player: 0, opponent: 0 };

  constructor(playerProfile: PlayerProfile, opponentProfile: PlayerProfile) {
    this.playerProfile = playerProfile;
    this.opponentProfile = opponentProfile;
    this.statistics = this.createEmptyStatistics();
  }

  /**
   * Create empty statistics structure
   */
  private createEmptyStatistics(): IMatchStatistics {
    return {
      totalPoints: { player: 0, opponent: 0 },
      pointsWon: {
        player: { serve: 0, return: 0 },
        opponent: { serve: 0, return: 0 },
      },
      winners: { player: 0, opponent: 0 },
      errors: { player: 0, opponent: 0 },
      unforcedErrors: { player: 0, opponent: 0 },
      forcedErrors: { player: 0, opponent: 0 },
      aces: { player: 0, opponent: 0 },
      doubleFaults: { player: 0, opponent: 0 },
      firstServePercentage: { player: 0, opponent: 0 },
      secondServePercentage: { player: 0, opponent: 0 },
      firstServePointsWon: { player: 0, opponent: 0 },
      secondServePointsWon: { player: 0, opponent: 0 },
      breakPointOpportunities: { player: 0, opponent: 0 },
      breakPointsConverted: { player: 0, opponent: 0 },
      averageRallyLength: 0,
      longestRally: 0,
      averageRallyLengthWon: { player: 0, opponent: 0 },
      longestRallyWon: { player: 0, opponent: 0 },
      netPointsWon: { player: 0, opponent: 0 },
      rallyPointsPlayed: { player: 0, opponent: 0 },
      rallyPointsWon: { player: 0, opponent: 0 },
      shotTypeStats: {},
      statCorrelation: {},
      keyMomentsWon: { player: 0, opponent: 0 },
    };
  }

  /**
   * Add a point result to statistics
   */
  public addPointResult(
    pointResult: PointResult,
    currentServer: 'player' | 'opponent',
    breakPointFor?: 'player' | 'opponent'
  ): void {
    this.pointResults.push(pointResult);

    // Update basic totals
    this.updateBasicStatistics(pointResult, currentServer);

    // Update shot-specific statistics (need point winner for net point tracking)
    this.updateShotStatistics(pointResult.shots, pointResult.winner, currentServer);

    // Update rally statistics
    this.updateRallyStatistics(pointResult, currentServer);

    // Update service statistics
    this.updateServiceStatistics(pointResult, currentServer);

    // Update break point statistics
    this.updateBreakPointStatistics(pointResult, currentServer, breakPointFor);
  }

  /**
   * Record a key moment result
   */
  public addKeyMomentResult(winner: 'player' | 'opponent'): void {
    this.statistics.keyMomentsWon[winner]++;
  }

  /**
   * Track the current score state to detect the player's largest deficit.
   * Called after each point to capture when the player is down a break (2+ games behind).
   * Among equal game deficits, prefers the state with the worst game score.
   */
  public updateScoreState(
    setScore: { player: number; opponent: number },
    gameScore: { player: number; opponent: number }
  ): void {
    const gameDeficit = setScore.opponent - setScore.player;
    if (gameDeficit < 2) return;

    // Severity: primary = game deficit, secondary = how close opponent is to winning current game
    const severity = gameDeficit * 1000 + Math.max(0, gameScore.opponent - gameScore.player) * 10 + gameScore.opponent;

    if (severity > this.worstDeficitSeverity) {
      this.worstDeficitSeverity = severity;

      // Convert raw point counts to tennis display format
      const pointToTennis = (p: number): string => {
        switch (p) {
          case 0: return '0';
          case 1: return '15';
          case 2: return '30';
          default: return '40';
        }
      };

      // Include game score if opponent has game point (3+ points and ahead)
      const opponentHasGamePoint = gameScore.opponent >= 3 && gameScore.opponent > gameScore.player;
      const gameScoreStr = opponentHasGamePoint
        ? `${pointToTennis(gameScore.player)}-${pointToTennis(gameScore.opponent)}`
        : undefined;

      this.statistics.largestDeficit = {
        games: `${setScore.player}-${setScore.opponent}`,
        gameScore: gameScoreStr,
        deficitSize: gameDeficit,
      };
    }
  }

  /**
   * Update basic point totals
   */
  private updateBasicStatistics(pointResult: PointResult, currentServer: 'player' | 'opponent'): void {
    const winner = this.convertPointWinnerToPlayer(pointResult.winner, currentServer);

    // Total points
    this.statistics.totalPoints[winner]++;

    // Points won by serve/return
    if (pointResult.winner === 'server') {
      this.statistics.pointsWon[currentServer].serve++;
    } else if (pointResult.pointType !== 'double_fault') {
      // Only count as return point won if it wasn't a double fault
      const returner = currentServer === 'player' ? 'opponent' : 'player';
      this.statistics.pointsWon[returner].return++;
    }

    // Point type statistics
    switch (pointResult.pointType) {
      case 'ace':
        this.statistics.aces[currentServer]++;
        break;
      case 'double_fault':
        const opponent = currentServer === 'player' ? 'opponent' : 'player';
        this.statistics.doubleFaults[currentServer]++;
        break;
      case 'winner':
        this.statistics.winners[winner]++;
        break;
      case 'forced_error':
        const loserForced = winner === 'player' ? 'opponent' : 'player';
        this.statistics.errors[loserForced]++;
        this.statistics.forcedErrors[loserForced]++;
        break;
      case 'unforced_error':
        const loserUnforced = winner === 'player' ? 'opponent' : 'player';
        this.statistics.errors[loserUnforced]++;
        this.statistics.unforcedErrors[loserUnforced]++;
        break;
    }
  }

  /**
   * Update shot-specific statistics
   */
  private updateShotStatistics(shots: ShotDetail[], pointWinner: 'server' | 'returner', currentServer: 'player' | 'opponent'): void {
    // Track which players were at net when the point ended
    // A player is "at net" once they hit an approach, volley, or overhead,
    // and stays at net for the rest of the point (matching PointSimulator behavior)
    const atNet: { server: boolean; returner: boolean } = { server: false, returner: false };

    shots.forEach(shot => {
      // Correctly map shooter to player/opponent based on who was serving
      const player = shot.shooter === 'server' ? currentServer : (currentServer === 'player' ? 'opponent' : 'player');
      const shotType = shot.shotType;

      // Initialize shot type stats if not exists
      if (!this.statistics.shotTypeStats[shotType]) {
        this.statistics.shotTypeStats[shotType] = {
          attempts: { player: 0, opponent: 0 },
          successful: { player: 0, opponent: 0 },
          winners: { player: 0, opponent: 0 },
          errors: { player: 0, opponent: 0 },
          unforcedErrors: { player: 0, opponent: 0 },
          forcedErrors: { player: 0, opponent: 0 },
        };
      }

      const stats = this.statistics.shotTypeStats[shotType]!;

      // Count attempt
      stats.attempts[player]++;

      // Count outcome
      if (shot.success) {
        stats.successful[player]++;
        if (shot.outcome === PointType.WINNER) {
          stats.winners[player]++;
        }
      } else {
        stats.errors[player]++;
        // Track forced vs unforced errors
        if (shot.errorType === 'unforced') {
          stats.unforcedErrors[player]++;
        } else if (shot.errorType === 'forced') {
          stats.forcedErrors[player]++;
        }
      }

      // Track net position: approach/volley/overhead moves player to net
      if (this.isNetShot(shotType)) {
        atNet[shot.shooter] = true;
      }
    });

    // A "net point won" = the point ended while that player was at the net and they won
    // This includes winners, forcing errors from net position, or opponent errors while you're at net
    if (atNet.server || atNet.returner) {
      const winnerIdentity = pointWinner === 'server' ? currentServer : (currentServer === 'player' ? 'opponent' : 'player');
      if (atNet[pointWinner]) {
        this.statistics.netPointsWon[winnerIdentity]++;
      }
    }
  }

  /**
   * Update rally-related statistics
   * rallyLength counts only in-play shots (faults excluded), so:
   *   - Ace = 1, Double fault = 0, Serve + return winner = 2
   *   - A "rally" is any point where rallyLength > 2 (at least one exchange after the return)
   */
  private updateRallyStatistics(pointResult: PointResult, currentServer: 'player' | 'opponent'): void {
    const rallyLength = pointResult.rallyLength;
    const winner = this.convertPointWinnerToPlayer(pointResult.winner, currentServer);
    const isRally = rallyLength > 2;

    // Track points where a real rally occurred (past serve + return)
    if (isRally) {
      this.statistics.rallyPointsPlayed.player++;
      this.statistics.rallyPointsPlayed.opponent++;
      this.statistics.rallyPointsWon[winner]++;
    }

    // Average rally length only counts actual rallies
    if (isRally) {
      this.rallyPointCount++;
      const currentAverage = this.statistics.averageRallyLength;
      this.statistics.averageRallyLength =
        (currentAverage * (this.rallyPointCount - 1) + rallyLength) / this.rallyPointCount;
    }

    // Longest rally (only meaningful for rallies)
    if (isRally && rallyLength > this.statistics.longestRally) {
      this.statistics.longestRally = rallyLength;
    }

    // Per-player longest rally won
    if (isRally && rallyLength > this.statistics.longestRallyWon[winner]) {
      this.statistics.longestRallyWon[winner] = rallyLength;
    }

    // Per-player average rally length won (only for rallies)
    if (isRally) {
      this.rallyPointCountWon[winner]++;
      const count = this.rallyPointCountWon[winner];
      const currentAvg = this.statistics.averageRallyLengthWon[winner];
      this.statistics.averageRallyLengthWon[winner] =
        (currentAvg * (count - 1) + rallyLength) / count;
    }
  }

  /**
   * Update service-related statistics
   */
  private updateServiceStatistics(pointResult: PointResult, currentServer: 'player' | 'opponent'): void {
    const shots = pointResult.shots;
    if (shots.length === 0) return;

    // Every service point counts as a first serve attempt
    this.firstServeAttempts[currentServer]++;

    // Derive first serve status from shot data: if a second serve was attempted,
    // the first serve must have been a fault. This keeps serve percentage in sync
    // with shot breakdown stats regardless of how the point was generated (simulation or key moment).
    const hasSecondServe = shots.some(shot => shot.shotType === 'serve_second');
    const isFirstServeIn = !hasSecondServe;

    if (isFirstServeIn) {
      this.firstServesIn[currentServer]++;
    }

    // Track second serve attempt (only when first serve was a fault)
    if (hasSecondServe) {
      const secondServeShot = shots.find(shot => shot.shotType === 'serve_second')!;
      // Second serve is "in" if it's not an error (can be 'in_play' or 'ace')
      const isSecondServeIn = secondServeShot.outcome === PointType.IN_PLAY || secondServeShot.outcome === PointType.ACE;

      this.secondServeAttempts[currentServer]++;

      if (isSecondServeIn) {
        this.secondServesIn[currentServer]++;
      }

      // Calculate second serve percentage
      this.statistics.secondServePercentage[currentServer] =
        (this.secondServesIn[currentServer] / this.secondServeAttempts[currentServer]) * 100;
    }

    // Calculate first serve percentage: first serves in / total service points
    this.statistics.firstServePercentage[currentServer] =
      (this.firstServesIn[currentServer] / this.firstServeAttempts[currentServer]) * 100;

    // Service points won
    if (pointResult.winner === 'server') {
      if (isFirstServeIn) {
        this.statistics.firstServePointsWon[currentServer]++;
      } else if (hasSecondServe && pointResult.pointType !== 'double_fault') {
        // Only count second serve points won if it wasn't a double fault
        this.statistics.secondServePointsWon[currentServer]++;
      }
    }
  }

  /**
   * Update break point statistics
   */
  private updateBreakPointStatistics(
    pointResult: PointResult,
    currentServer: 'player' | 'opponent',
    breakPointFor?: 'player' | 'opponent'
  ): void {
    if (!breakPointFor) return;

    // Track break point opportunity in both places
    this.breakPointOpportunities[breakPointFor]++;
    this.statistics.breakPointOpportunities[breakPointFor]++;

    // Check if break point was converted (returner wins the point and it was a break point)
    const pointWinner = this.convertPointWinnerToPlayer(pointResult.winner, currentServer);

    // Break point is converted if the player with the break point opportunity wins the point
    if (pointWinner === breakPointFor) {
      this.statistics.breakPointsConverted[breakPointFor]++;
    }
  }

  /**
   * Calculate final statistics and performance analysis
   */
  public finalizeStatistics(): void {
    this.calculateStatCorrelation();
  }

  /**
   * Calculate correlation between player stats and actual performance
   */
  private calculateStatCorrelation(): void {
    const playerStats = this.playerProfile.stats;
    const opponentStats = this.opponentProfile.stats;

    // Analyze key stats
    this.analyzeStatCorrelation('serve', playerStats.technical.serve, opponentStats.technical.serve);
    this.analyzeStatCorrelation('forehand', playerStats.technical.forehand, opponentStats.technical.forehand);
    this.analyzeStatCorrelation('backhand', playerStats.technical.backhand, opponentStats.technical.backhand);
    this.analyzeStatCorrelation('return', playerStats.technical.return, opponentStats.technical.return);
    this.analyzeStatCorrelation('focus', playerStats.mental.focus, opponentStats.mental.focus);
    this.analyzeStatCorrelation('stamina', playerStats.physical.stamina, opponentStats.physical.stamina);
  }

  /**
   * Analyze correlation for a specific stat
   */
  private analyzeStatCorrelation(
    statName: string,
    playerStatValue: number,
    opponentStatValue: number
  ): void {
    // Calculate expected performance based on stat difference
    const statDifference = playerStatValue - opponentStatValue;
    const expectedAdvantage = statDifference / 100; // -1 to +1 range

    // Calculate actual performance for this stat
    let actualPerformance = 0;

    switch (statName) {
      case 'serve':
        actualPerformance = this.calculateServePerformance();
        break;
      case 'forehand':
        actualPerformance = this.calculateShotPerformance(['forehand', 'forehand_power']);
        break;
      case 'backhand':
        actualPerformance = this.calculateShotPerformance(['backhand', 'backhand_power']);
        break;
      case 'return':
        actualPerformance = this.calculateReturnPerformance();
        break;
      case 'focus':
        actualPerformance = this.calculatePressurePerformance();
        break;
      case 'stamina':
        actualPerformance = this.calculateStaminaPerformance();
        break;
    }

    // Calculate correlation coefficient
    const correlation = this.calculateCorrelation(expectedAdvantage, actualPerformance);

    this.statistics.statCorrelation[statName] = {
      expectedPerformance: expectedAdvantage,
      actualPerformance,
      correlation,
    };
  }

  /**
   * Calculate serve performance metric
   */
  private calculateServePerformance(): number {
    const playerAces = this.statistics.aces.player;
    const opponentAces = this.statistics.aces.opponent;
    const playerDF = this.statistics.doubleFaults.player;
    const opponentDF = this.statistics.doubleFaults.opponent;

    const playerServePoints = this.statistics.pointsWon.player.serve;
    const opponentServePoints = this.statistics.pointsWon.opponent.serve;

    if (playerServePoints + opponentServePoints === 0) return 0;

    const playerServeSuccess = (playerAces - playerDF + playerServePoints) /
                               Math.max(1, playerServePoints + opponentServePoints);

    return (playerServeSuccess - 0.5) * 2; // Convert to -1 to +1 range
  }

  /**
   * Calculate shot type performance
   */
  private calculateShotPerformance(shotTypes: ShotType[]): number {
    let playerSuccessRate = 0;
    let opponentSuccessRate = 0;
    let totalAttempts = 0;

    shotTypes.forEach(shotType => {
      const stats = this.statistics.shotTypeStats[shotType];
      if (stats) {
        const playerAttempts = stats.attempts.player;
        const opponentAttempts = stats.attempts.opponent;
        const playerSuccessful = stats.successful.player;
        const opponentSuccessful = stats.successful.opponent;

        if (playerAttempts > 0) {
          playerSuccessRate += (playerSuccessful / playerAttempts) * playerAttempts;
          totalAttempts += playerAttempts;
        }
        if (opponentAttempts > 0) {
          opponentSuccessRate += (opponentSuccessful / opponentAttempts) * opponentAttempts;
          totalAttempts += opponentAttempts;
        }
      }
    });

    if (totalAttempts === 0) return 0;

    const avgPlayerRate = playerSuccessRate / totalAttempts;
    const avgOpponentRate = opponentSuccessRate / totalAttempts;

    return (avgPlayerRate - avgOpponentRate); // Performance difference
  }

  /**
   * Calculate return performance
   */
  private calculateReturnPerformance(): number {
    const playerReturnPoints = this.statistics.pointsWon.player.return;
    const opponentReturnPoints = this.statistics.pointsWon.opponent.return;
    const totalReturnPoints = playerReturnPoints + opponentReturnPoints;

    if (totalReturnPoints === 0) return 0;

    return (playerReturnPoints / totalReturnPoints - 0.5) * 2;
  }

  /**
   * Calculate pressure point performance
   */
  private calculatePressurePerformance(): number {
    // Simplified: use break point conversion as proxy for pressure performance
    const playerBreakPoints = this.statistics.breakPointsConverted.player;
    const opponentBreakPoints = this.statistics.breakPointsConverted.opponent;
    const totalBreakPoints = playerBreakPoints + opponentBreakPoints;

    if (totalBreakPoints === 0) return 0;

    return (playerBreakPoints / totalBreakPoints - 0.5) * 2;
  }

  /**
   * Calculate stamina performance (performance in long rallies)
   */
  private calculateStaminaPerformance(): number {
    const longRallyPoints = this.pointResults.filter(point => point.rallyLength > 10);

    if (longRallyPoints.length === 0) return 0;

    const playerLongRallyWins = longRallyPoints.filter(point =>
      this.convertPointWinnerToPlayer(point.winner, 'player') === 'player'
    ).length;

    return (playerLongRallyWins / longRallyPoints.length - 0.5) * 2;
  }

  /**
   * Calculate simple correlation coefficient
   */
  private calculateCorrelation(expected: number, actual: number): number {
    // Simplified correlation: how well actual matches expected
    const maxDifference = 2; // Max possible difference
    const difference = Math.abs(expected - actual);
    return 1 - (difference / maxDifference);
  }

  /**
   * Generate player performance analysis
   */
  public getPlayerPerformance(): PlayerPerformance {
    const stats = this.playerProfile.stats;

    return {
      overallRating: this.playerProfile.overallRating,
      technicalPerformance: this.calculateCategoryPerformance('technical'),
      physicalPerformance: this.calculateCategoryPerformance('physical'),
      mentalPerformance: this.calculateCategoryPerformance('mental'),
      statEffectiveness: this.calculateStatEffectiveness(),
      pressurePointsWon: this.statistics.breakPointsConverted.player,
      longRallySuccess: this.calculateStaminaPerformance(),
      netPlaySuccess: this.calculateNetPlaySuccess(),
      bigPointsConverted: this.statistics.breakPointsConverted.player,
      clutchPerformance: this.calculatePressurePerformance(),
    };
  }

  /**
   * Calculate performance for a stat category
   */
  private calculateCategoryPerformance(category: 'technical' | 'physical' | 'mental'): number {
    const categoryStats = this.playerProfile.stats[category];
    const avgStat = Object.values(categoryStats).reduce((sum, val) => sum + val, 0) /
                    Object.values(categoryStats).length;

    // Convert stat value to performance rating (0-100)
    return avgStat;
  }

  /**
   * Calculate stat effectiveness for all stats
   */
  private calculateStatEffectiveness(): PlayerPerformance['statEffectiveness'] {
    const stats = this.playerProfile.stats;
    const effectiveness: any = {};

    // Technical stats
    Object.keys(stats.technical).forEach(stat => {
      effectiveness[stat] = this.getStatEffectiveness(stat as StatName);
    });

    // Physical stats
    Object.keys(stats.physical).forEach(stat => {
      effectiveness[stat] = this.getStatEffectiveness(stat as StatName);
    });

    // Mental stats
    Object.keys(stats.mental).forEach(stat => {
      effectiveness[stat] = this.getStatEffectiveness(stat as StatName);
    });

    return effectiveness;
  }

  /**
   * Get effectiveness rating for a specific stat
   */
  private getStatEffectiveness(statName: StatName): number {
    const correlation = this.statistics.statCorrelation[statName];
    if (!correlation) return 50; // Default neutral rating

    // Convert correlation to 0-100 effectiveness rating
    return Math.round(50 + (correlation.correlation * 50));
  }

  /**
   * Calculate net play success rate
   */
  private calculateNetPlaySuccess(): number {
    const playerNetPoints = this.statistics.netPointsWon.player;
    const opponentNetPoints = this.statistics.netPointsWon.opponent;
    const totalNetPoints = playerNetPoints + opponentNetPoints;

    if (totalNetPoints === 0) return 0;

    return (playerNetPoints / totalNetPoints) * 100;
  }

  /**
   * Generate match summary
   */
  public generateMatchSummary(winner: 'player' | 'opponent', finalScore: string): MatchSummary {
    const playerWon = winner === 'player';
    const competitiveness = this.calculateCompetitiveness();
    const keyFactor = this.identifyKeyFactor();
    const bestStat = this.identifyBestStat();
    const worstStat = this.identifyWorstStat();

    return {
      outcome: playerWon ? 'win' : 'loss',
      competitiveness,
      keyFactor,
      bestStat,
      worstStat,
      recommendations: this.generateRecommendations(),
      highlights: this.generateHighlights(finalScore),
    };
  }

  /**
   * Helper methods for match summary
   */
  private calculateCompetitiveness(): 'dominant' | 'comfortable' | 'close' | 'very_close' {
    const playerPoints = this.statistics.totalPoints.player;
    const opponentPoints = this.statistics.totalPoints.opponent;
    const totalPoints = playerPoints + opponentPoints;

    if (totalPoints === 0) return 'close';

    const pointDifference = Math.abs(playerPoints - opponentPoints) / totalPoints;

    if (pointDifference < 0.1) return 'very_close';
    if (pointDifference < 0.2) return 'close';
    if (pointDifference < 0.3) return 'comfortable';
    return 'dominant';
  }

  private identifyKeyFactor(): 'serving' | 'returning' | 'consistency' | 'power' | 'pressure' | 'fitness' {
    // Simplified logic - could be enhanced with more sophisticated analysis
    if (this.statistics.aces.player > this.statistics.aces.opponent * 2) return 'serving';
    if (this.statistics.pointsWon.player.return > this.statistics.pointsWon.opponent.return * 1.5) return 'returning';
    if (this.statistics.errors.player < this.statistics.errors.opponent * 0.8) return 'consistency';
    if (this.statistics.winners.player > this.statistics.winners.opponent * 1.5) return 'power';
    if (this.statistics.breakPointsConverted.player > this.statistics.breakPointsConverted.opponent) return 'pressure';
    return 'fitness';
  }

  private identifyBestStat(): string {
    const correlations = this.statistics.statCorrelation;
    let bestStat = 'serve';
    let bestCorrelation = 0;

    Object.entries(correlations).forEach(([stat, data]) => {
      if (data.actualPerformance > bestCorrelation) {
        bestCorrelation = data.actualPerformance;
        bestStat = stat;
      }
    });

    return bestStat;
  }

  private identifyWorstStat(): string {
    const correlations = this.statistics.statCorrelation;
    let worstStat = 'serve';
    let worstCorrelation = 1;

    Object.entries(correlations).forEach(([stat, data]) => {
      if (data.actualPerformance < worstCorrelation) {
        worstCorrelation = data.actualPerformance;
        worstStat = stat;
      }
    });

    return worstStat;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const worstStat = this.identifyWorstStat();

    recommendations.push(`Focus training on ${worstStat} to improve match performance`);

    if (this.statistics.errors.player > this.statistics.winners.player) {
      recommendations.push('Work on consistency - reduce unforced errors');
    }

    if (this.statistics.firstServePercentage.player < 60) {
      recommendations.push('Improve first serve percentage');
    }

    return recommendations;
  }

  private generateHighlights(finalScore: string): string[] {
    const highlights: string[] = [];

    highlights.push(`Final Score: ${finalScore}`);

    if (this.statistics.aces.player > 5) {
      highlights.push(`${this.statistics.aces.player} aces served`);
    }

    if (this.statistics.longestRally > 15) {
      highlights.push(`Longest rally: ${this.statistics.longestRally} shots`);
    }

    return highlights;
  }

  // =======================
  // UTILITY METHODS
  // =======================

  private convertPointWinnerToPlayer(
    pointWinner: 'server' | 'returner',
    currentServer: 'player' | 'opponent'
  ): 'player' | 'opponent' {
    if (pointWinner === 'server') {
      return currentServer;
    }
    return currentServer === 'player' ? 'opponent' : 'player';
  }

  private isNetShot(shotType: ShotType): boolean {
    return shotType.includes('volley') || shotType.includes('half_volley') || shotType.includes('approach') || shotType.includes('overhead');
  }

  public getStatistics(): IMatchStatistics {
    return { ...this.statistics };
  }
}