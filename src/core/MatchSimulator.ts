/**
 * MatchSimulator - Main orchestrator for complete tennis match simulation
 *
 * Brings together all components for a complete, transparent tennis match
 * simulation with direct stat-to-outcome correlation.
 */

import type {
  MatchResult,
  MatchState,
  MatchFormat,
  CourtSurface,
  ScoreSnapshot,
  MatchAnalysisData,
  PointAnalysisData,
  PointResult,
} from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
import { PointSimulator } from './PointSimulator.js';
import { ScoreTracker } from './ScoreTracker.js';
import { MatchStatistics } from './MatchStatistics.js';

export interface MatchConfig {
  player: PlayerProfile;
  opponent: PlayerProfile;
  courtSurface: CourtSurface;
  matchFormat?: MatchFormat;
  initialServer?: 'player' | 'opponent';
}

export class MatchSimulator {
  private pointSimulator: PointSimulator;
  private scoreTracker: ScoreTracker;
  private matchStatistics: MatchStatistics;
  private config: MatchConfig;

  // Match state
  private matchState: MatchState;
  private scoreProgression: ScoreSnapshot[] = [];
  private pointResults: PointResult[] = [];
  private startTime: number;

  constructor(config: MatchConfig) {
    this.config = config;
    this.pointSimulator = new PointSimulator();
    this.scoreTracker = new ScoreTracker(config.matchFormat);
    this.matchStatistics = new MatchStatistics(config.player, config.opponent);

    // Set initial server
    const initialServer = config.initialServer || this.determineInitialServer();
    this.scoreTracker.setInitialServer(initialServer);

    // Initialize match state
    this.matchState = this.createInitialMatchState();
    this.startTime = Date.now();
  }

  /**
   * Simulate a complete match
   */
  public simulateMatch(): MatchResult {
    console.log(`🎾 Starting match: ${this.config.player.name} vs ${this.config.opponent.name}`);
    console.log(`📊 Player stats: ${this.config.player.overallRating} vs ${this.config.opponent.overallRating}`);

    let pointCount = 0;
    const maxPoints = 200; // Safety limit to prevent infinite matches

    while (!this.scoreTracker.isComplete() && pointCount < maxPoints) {
      // Simulate one point
      this.simulateNextPoint();
      pointCount++;

      // Update match state
      this.updateMatchState();

      // Record score progression
      this.recordScoreSnapshot();

      // Log current score after every point (always show player score first)
      const currentScore = this.scoreTracker.getScore();
      const setGames = this.scoreTracker.getCurrentSetGames();

      // Convert current game points from server/returner to player/opponent
      const playerIsServer = currentScore.currentServer === 'player';
      const playerPoints = playerIsServer ? currentScore.currentGame.server : currentScore.currentGame.returner;
      const opponentPoints = playerIsServer ? currentScore.currentGame.returner : currentScore.currentGame.server;

      // Count completed sets for each player
      const completedSets = currentScore.sets.filter(s => s.isComplete);
      const playerSets = completedSets.filter(set => set.winner === 'player').length;
      const opponentSets = completedSets.filter(set => set.winner === 'opponent').length;

      // Always display player score first
      console.log(`📊 Score - Sets: ${playerSets}-${opponentSets} | Games: ${setGames.player}-${setGames.opponent} | Points: ${playerPoints}-${opponentPoints}`);

      // Reduce player energy slightly (stamina effect)
      this.applyStaminaCost();

      // Log progress occasionally
      if (pointCount % 20 === 0) {
        console.log(`🎾 Point ${pointCount}: ${this.scoreTracker.getScoreString()}`);
      }
    }

    // Finalize statistics
    this.matchStatistics.finalizeStatistics();

    const matchResult = this.createMatchResult();
    console.log(`🏆 Match complete: ${matchResult.winner} wins ${matchResult.finalScore}`);
    console.log(`📈 Duration: ${matchResult.duration} minutes, ${pointCount} points played`);

    return matchResult;
  }

  /**
   * Simulate a single point
   */
  private simulateNextPoint(): void {
    // Determine server and returner for this point
    const currentServer = this.scoreTracker.getCurrentServer();
    const serverProfile = currentServer === 'player' ? this.config.player : this.config.opponent;
    const returnerProfile = currentServer === 'player' ? this.config.opponent : this.config.player;

    // Check if this is a break point opportunity
    const breakPointFor = this.scoreTracker.getBreakPointFor();

    // Simulate the point
    const pointResult = this.pointSimulator.simulatePoint(
      serverProfile,
      returnerProfile,
      this.matchState
    );

    // Store point result for later analysis
    this.pointResults.push(pointResult);

    // Add point to score tracker
    const pointWinner = this.convertPointWinner(pointResult.winner, currentServer);
    this.scoreTracker.addPoint(pointWinner);

    // Update statistics with break point information
    this.matchStatistics.addPointResult(pointResult, currentServer, breakPointFor);

    // Log detailed point result
    this.logPointResult(pointResult, currentServer, pointWinner);
  }

  /**
   * Convert point winner from server/returner to player/opponent
   */
  private convertPointWinner(
    pointWinner: 'server' | 'returner',
    currentServer: 'player' | 'opponent'
  ): 'player' | 'opponent' {
    if (pointWinner === 'server') {
      return currentServer;
    }
    return currentServer === 'player' ? 'opponent' : 'player';
  }

  /**
   * Update match state after each point
   */
  private updateMatchState(): void {
    this.matchState.score = this.scoreTracker.getScore();
    this.matchState.currentServer = this.scoreTracker.getCurrentServer();
    this.matchState.isKeyMoment = this.scoreTracker.isKeyMoment();
    this.matchState.pointsPlayed++;

    // Update momentum based on recent point outcomes
    this.updateMomentum();

    // Update pressure based on score situation
    this.updatePressure();

    // Update match length
    const elapsed = (Date.now() - this.startTime) / (1000 * 60); // Convert to minutes
    this.matchState.matchLength = elapsed;
  }

  /**
   * Update momentum based on recent results
   */
  private updateMomentum(): void {
    // Simplified momentum calculation
    // Positive momentum favors player, negative favors opponent
    const recentPoints = this.scoreProgression.slice(-5); // Last 5 points

    if (recentPoints.length === 0) {
      this.matchState.momentum = 0;
      return;
    }

    let playerPoints = 0;
    let opponentPoints = 0;

    // Count recent point winners (simplified)
    recentPoints.forEach(snapshot => {
      // This is a simplified calculation - in reality we'd track actual point winners
      if (Math.random() > 0.5) playerPoints++;
      else opponentPoints++;
    });

    // Convert to -100 to +100 scale
    const totalPoints = playerPoints + opponentPoints;
    this.matchState.momentum = totalPoints > 0 ?
      ((playerPoints - opponentPoints) / totalPoints) * 100 : 0;
  }

  /**
   * Update pressure level based on match situation
   */
  private updatePressure(): void {
    if (this.matchState.isKeyMoment) {
      this.matchState.pressure = 'high';
    } else if (this.matchState.pointsPlayed > 30) {
      this.matchState.pressure = 'medium';
    } else {
      this.matchState.pressure = 'low';
    }
  }

  /**
   * Apply stamina cost to players during long matches
   */
  private applyStaminaCost(): void {
    const matchLength = this.matchState.matchLength;

    // Reduce energy based on match length and player stamina
    if (matchLength > 30) { // After 30 minutes
      const staminaCost = Math.max(0, (matchLength - 30) / 10); // 1 energy per 10 minutes

      const playerStaminaFactor = this.config.player.stats.physical.stamina / 100;
      const opponentStaminaFactor = this.config.opponent.stats.physical.stamina / 100;

      this.config.player.reduceEnergy(staminaCost * (1 - playerStaminaFactor));
      this.config.opponent.reduceEnergy(staminaCost * (1 - opponentStaminaFactor));
    }
  }

  /**
   * Record score progression for analysis
   */
  private recordScoreSnapshot(): void {
    const snapshot = this.scoreTracker.getScoreSnapshot();
    snapshot.momentum = this.matchState.momentum;
    this.scoreProgression.push(snapshot);
  }

  /**
   * Create initial match state
   */
  private createInitialMatchState(): MatchState {
    return {
      score: this.scoreTracker.getScore(),
      currentServer: this.scoreTracker.getCurrentServer(),
      courtSurface: this.config.courtSurface,
      momentum: 0,
      pressure: 'low',
      matchLength: 0,
      pointsPlayed: 0,
      isKeyMoment: false,
    };
  }

  /**
   * Determine initial server (random if not specified)
   */
  private determineInitialServer(): 'player' | 'opponent' {
    return Math.random() < 0.5 ? 'player' : 'opponent';
  }

  /**
   * Create complete match result
   */
  private createMatchResult(): MatchResult {
    const winner = this.scoreTracker.getWinner()!;
    const finalScore = this.scoreTracker.getScoreString();
    const duration = Math.round(this.matchState.matchLength);

    const statistics = this.matchStatistics.getStatistics();
    const playerPerformance = this.matchStatistics.getPlayerPerformance();

    // Create opponent performance (simplified)
    const opponentPerformance = {
      ...playerPerformance,
      overallRating: this.config.opponent.overallRating,
    };

    const summary = this.matchStatistics.generateMatchSummary(winner, finalScore);

    return {
      matchId: `match_${Date.now()}`,
      winner,
      finalScore,
      duration,
      courtSurface: this.config.courtSurface,
      pointResults: [], // Would be populated in full implementation
      scoreProgression: this.scoreProgression,
      statistics,
      playerPerformance,
      opponentPerformance,
      summary,
    };
  }

  /**
   * Log detailed point result for debugging
   */
  private logPointResult(
    pointResult: any,
    currentServer: 'player' | 'opponent',
    pointWinner: 'player' | 'opponent'
  ): void {
    const serverName = currentServer === 'player' ? this.config.player.name : this.config.opponent.name;
    const winnerName = pointWinner === 'player' ? this.config.player.name : this.config.opponent.name;
    const loserName = pointWinner === 'player' ? this.config.opponent.name : this.config.player.name;

    // Format point result message based on point type
    let resultMessage = '';
    if (pointResult.pointType === 'ace') {
      resultMessage = `${winnerName} serves an ace`;
    } else if (pointResult.pointType === 'double_fault') {
      resultMessage = `${loserName} double faults`;
    } else if (pointResult.pointType === 'winner') {
      resultMessage = `${winnerName} hits a winner`;
    } else if (pointResult.pointType === 'unforced_error') {
      resultMessage = `${loserName} makes an unforced error`;
    } else if (pointResult.pointType === 'forced_error') {
      resultMessage = `${loserName} makes a forced error`;
    }

    // Add serve type indicator
    const serveIndicator = pointResult.serveType === 'second' ? ' [2nd serve]' : '';

    console.log(
      `🎾 Point: ${serverName} serving${serveIndicator} → ${resultMessage} (${pointResult.rallyLength} shots) - ${winnerName} wins`
    );

    // Log key shot with shooter information
    if (pointResult.keyShot) {
      const keyShooter = pointResult.keyShot.shooter === 'server' ? serverName :
                         (currentServer === 'player' ? this.config.opponent.name : this.config.player.name);
      console.log(
        `🔥 Key shot by ${keyShooter}: ${pointResult.keyShot.shotType} (${pointResult.keyShot.quality.toFixed(1)} quality, ${pointResult.keyShot.statUsed})`
      );
    }
  }

  // =======================
  // PUBLIC INTERFACE
  // =======================

  /**
   * Get current match state
   */
  public getMatchState(): MatchState {
    return { ...this.matchState };
  }

  /**
   * Get current score
   */
  public getCurrentScore(): string {
    return this.scoreTracker.getScoreString();
  }

  /**
   * Check if match is complete
   */
  public isMatchComplete(): boolean {
    return this.scoreTracker.isComplete();
  }

  /**
   * Get match statistics
   */
  public getStatistics() {
    return this.matchStatistics.getStatistics();
  }

  /**
   * Export comprehensive match data for analysis by sub-agent
   * Includes all shots, contexts, player stats, and outcomes
   */
  public exportMatchData(): MatchAnalysisData {
    const winner = this.scoreTracker.getWinner()!;
    const finalScore = this.scoreTracker.getScoreString();

    // Convert point results to analysis format
    const points: PointAnalysisData[] = this.pointResults.map((pointResult, index) => {
      // Determine the server for this point
      // This is a simplification - in reality we'd need to track this during simulation
      const server: 'player' | 'opponent' = index % 2 === 0 ? 'player' : 'opponent';

      // Convert winner from server/returner to player/opponent
      const pointWinner = pointResult.winner === 'server' ? server :
                          (server === 'player' ? 'opponent' : 'player');

      // Get the score snapshot for this point (if available)
      const scoreSnapshot = this.scoreProgression[index];

      return {
        pointNumber: index + 1,
        server,
        winner: pointWinner,
        pointType: pointResult.pointType,
        serveType: pointResult.serveType,
        rallyLength: pointResult.rallyLength,
        duration: pointResult.duration,
        shots: pointResult.shots,
        keyShot: pointResult.keyShot,
        matchState: scoreSnapshot ? {
          pressure: this.matchState.pressure,
          momentum: scoreSnapshot.momentum,
          isKeyMoment: this.matchState.isKeyMoment,
          gameScore: scoreSnapshot.gameScore,
          setScore: scoreSnapshot.setScore,
        } : {
          pressure: 'low',
          momentum: 0,
          isKeyMoment: false,
          gameScore: { server: 0, returner: 0, isDeuce: false },
          setScore: { player: 0, opponent: 0, isComplete: false },
        },
      };
    });

    return {
      matchId: `match_${Date.now()}`,
      timestamp: Date.now(),
      courtSurface: this.config.courtSurface,
      matchFormat: this.scoreTracker.getScore().matchFormat,

      player: {
        name: this.config.player.name,
        stats: this.config.player.stats,
        playStyle: this.config.player.playStyle,
        overallRating: this.config.player.overallRating,
      },

      opponent: {
        name: this.config.opponent.name,
        stats: this.config.opponent.stats,
        playStyle: this.config.opponent.playStyle,
        overallRating: this.config.opponent.overallRating,
      },

      winner,
      finalScore,
      duration: Math.round(this.matchState.matchLength),

      points,
      statistics: this.matchStatistics.getStatistics(),
      scoreProgression: this.scoreProgression,
    };
  }

  /**
   * Simulate multiple matches for testing
   */
  public static simulateMultipleMatches(
    config: MatchConfig,
    numberOfMatches: number
  ): MatchResult[] {
    const results: MatchResult[] = [];

    console.log(`🎾 Simulating ${numberOfMatches} matches...`);

    for (let i = 0; i < numberOfMatches; i++) {
      // Create fresh player profiles for each match
      const playerCopy = config.player.clone();
      const opponentCopy = config.opponent.clone();

      const matchConfig = {
        ...config,
        player: playerCopy,
        opponent: opponentCopy,
      };

      const simulator = new MatchSimulator(matchConfig);
      const result = simulator.simulateMatch();
      results.push(result);

      if (i % 10 === 0) {
        console.log(`📊 Completed ${i + 1}/${numberOfMatches} matches`);
      }
    }

    // Summary statistics
    const playerWins = results.filter(result => result.winner === 'player').length;
    const winPercentage = (playerWins / numberOfMatches) * 100;

    console.log(`🏆 Results: ${playerWins}/${numberOfMatches} wins (${winPercentage.toFixed(1)}%)`);

    return results;
  }
}