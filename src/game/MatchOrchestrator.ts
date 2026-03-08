/**
 * Match Orchestrator
 * Coordinates match simulation with key moment system
 * Wraps the existing MatchSimulator to add interactive key moments
 */

import { MatchSimulator } from '../core/MatchSimulator';
import { ScoreTracker } from '../core/ScoreTracker';
import { PlayerProfile } from '../core/PlayerProfile';
import { MatchStatistics } from '../core/MatchStatistics';
import { PointSimulator } from '../core/PointSimulator';
import { KeyMomentResolver, KeyMomentResult } from './KeyMomentResolver';
import { getOptionsForSituation, KeyMomentType } from '../data/tacticalOptions';
import {
  KeyMoment,
  KeyMomentCallback,
  InteractiveMatchConfig,
  MatchScore,
  MatchState as KeyMomentMatchState,
} from '../types/keyMoments';
import { PlayerStats, Ability } from '../types/game';
import { MatchStatistics as IMatchStatistics, MatchState, PointResult, PointType } from '../types';
import { AbilitySystem } from './AbilitySystem';

export class MatchOrchestrator {
  private keyMomentsTriggered = 0;
  private pointsPlayed = 0;
  private momentum = 0;
  private pressure = 0;
  private matchStatistics: MatchStatistics | null = null;
  private pointSimulator: PointSimulator | null = null;
  private cancelled = false;

  /**
   * Apply ability stat boosts to player stats
   * Only applies during match - does not permanently modify player stats
   */
  private applyAbilityBoosts(baseStats: PlayerStats, abilities?: Ability[]): PlayerStats {
    if (!abilities || abilities.length === 0) {
      return baseStats;
    }

    // Calculate total boosts from all abilities
    const totalBoosts = AbilitySystem.calculateTotalBoosts(abilities);

    // Create a copy of stats with boosts applied
    const boostedStats: PlayerStats = {
      technical: { ...baseStats.technical },
      physical: { ...baseStats.physical },
      mental: { ...baseStats.mental },
    };

    // Apply boosts to each stat
    for (const [stat, boost] of Object.entries(totalBoosts)) {
      if (!boost) continue;

      // Map flat stat names to nested structure
      if (stat in boostedStats.technical) {
        const key = stat as keyof typeof boostedStats.technical;
        boostedStats.technical[key] = Math.min(100, boostedStats.technical[key] + boost);
      } else if (stat in boostedStats.physical) {
        const key = stat as keyof typeof boostedStats.physical;
        boostedStats.physical[key] = Math.min(100, boostedStats.physical[key] + boost);
      } else if (stat in boostedStats.mental) {
        const key = stat as keyof typeof boostedStats.mental;
        boostedStats.mental[key] = Math.min(100, boostedStats.mental[key] + boost);
      }
    }

    return boostedStats;
  }

  /**
   * Simulate an interactive match with key moments
   */
  async simulateInteractiveMatch(config: InteractiveMatchConfig): Promise<MatchScore> {
    // Store match format
    (this as any).matchFormat = config.matchFormat || 'best-of-3';

    // Apply ability boosts to player stats (only for the duration of the match)
    const playerStatsWithAbilities = this.applyAbilityBoosts(
      config.playerStats,
      config.playerAbilities
    );

    // Initialize match simulator with PlayerProfile objects
    const player = new PlayerProfile('player', 'Player', playerStatsWithAbilities);
    const opponent = new PlayerProfile('opponent', 'Opponent', config.opponentStats);

    const matchSim = new MatchSimulator({
      player,
      opponent,
      courtSurface: config.surface,
    });

    // Initialize statistics tracker
    this.matchStatistics = new MatchStatistics(player, opponent);
    this.pointSimulator = new PointSimulator();

    // Initialize score tracker
    const scoreTracker = new ScoreTracker();

    // Match state
    let isComplete = false;
    let currentScore: MatchScore = this.initializeScore();

    // Main match loop - simulate point by point
    while (!isComplete && !this.cancelled) {
      // Check if this should be a key moment
      const shouldTriggerKeyMoment =
        config.enableKeyMoments &&
        this.shouldTriggerKeyMoment(currentScore, config);

      if (shouldTriggerKeyMoment && config.onKeyMoment) {
        // PAUSE FOR KEY MOMENT
        const keyMoment = this.createKeyMoment(currentScore, config);

        // Wait for user choice
        const selectedOption = await config.onKeyMoment(keyMoment);

        // Resolve key moment
        const result = KeyMomentResolver.resolveKeyMoment(
          config.playerStats as PlayerStats,
          config.opponentStats as PlayerStats,
          selectedOption,
          {
            mood: config.mood,
            energy: config.energy,
            momentum: this.momentum,
            pressure: this.pressure,
          }
        );

        // Notify UI of key moment result
        if (config.onKeyMomentResult) {
          config.onKeyMomentResult(result);
        }

        // Track statistics for key moment (create synthetic PointResult)
        if (this.matchStatistics) {
          const pointResult = this.createPointResultFromKeyMoment(result, currentScore.server);
          const breakPointFor = this.isBreakPoint(currentScore)
            ? (currentScore.server === 'player' ? 'opponent' : 'player')
            : undefined;
          this.matchStatistics.addPointResult(pointResult, currentScore.server, breakPointFor);
          this.matchStatistics.addKeyMomentResult(result.pointWinner);
        }

        // Apply result to score
        // Update score after recording match statistics in case the update changes game / server
        currentScore = this.updateScore(currentScore, result.pointWinner);

        // Update momentum based on outcome
        this.updateMomentum(result.pointWinner, result.outcome);

        this.keyMomentsTriggered++;
      } else {
        // NORMAL SIMULATION
        // Use point simulator to determine point with full statistics
        const pointResult = this.simulatePointWithStats(matchSim, currentScore);
        const pointWinner = pointResult.winner === 'server'
          ? currentScore.server
          : (currentScore.server === 'player' ? 'opponent' : 'player');

        currentScore = this.updateScore(currentScore, pointWinner);

        // Update momentum
        this.updateMomentum(pointWinner, 'success');
      }

      this.pointsPlayed++;

      // Update pressure based on situation
      this.updatePressure(currentScore);

      // Callback for score update
      if (config.onScoreUpdate) {
        config.onScoreUpdate(currentScore);
      }

      // Callback for stats update - provide current statistics
      if (config.onStatsUpdate && this.matchStatistics) {
        const currentStats = this.matchStatistics.getStatistics();
        config.onStatsUpdate(currentStats);
      }

      // Check if match is complete
      isComplete = this.isMatchComplete(currentScore);

      // Add delay between points for visual updates (500ms)
      // Skip delay if match is complete to show final score immediately
      if (!isComplete) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Match complete callback
    if (config.onMatchComplete) {
      config.onMatchComplete(currentScore);
    }

    return currentScore;
  }

  /**
   * Determine if a key moment should trigger
   */
  private shouldTriggerKeyMoment(
    score: MatchScore,
    config: InteractiveMatchConfig
  ): boolean {
    // Don't exceed max key moments per match
    const maxKeyMoments = config.keyMomentsPerMatch || 30;
    if (this.keyMomentsTriggered >= maxKeyMoments) {
      return false;
    }

    // Check for break points, set points, match points
    const momentType = this.detectKeyMomentType(score);
    return momentType !== null;
  }

  /**
   * Detect what type of key moment this is
   */
  private detectKeyMomentType(score: MatchScore): KeyMomentType | null {
    const { currentGame, currentSet, server } = score;

    // Check for match point
    if (this.isMatchPoint(score, 'player')) {
      return server === 'player' ? 'match-point-player-serve' : 'match-point-player-return';
    }
    if (this.isMatchPoint(score, 'opponent')) {
      return server === 'player' ? 'match-point-opponent-serve' : 'match-point-opponent-return';
    }

    // Check for set point
    if (this.isSetPoint(score, 'player')) {
      return server === 'player' ? 'set-point-player-serve' : 'set-point-player-return';
    }
    if (this.isSetPoint(score, 'opponent')) {
      return server === 'player' ? 'set-point-opponent-serve' : 'set-point-opponent-return';
    }

    // Check for break point
    if (this.isBreakPoint(score)) {
      return server === 'player' ? 'break-point-serve' : 'break-point-return';
    }

    return null;
  }

  /**
   * Create a key moment object
   */
  private createKeyMoment(
    score: MatchScore,
    config: InteractiveMatchConfig
  ): KeyMoment {
    const momentType = this.detectKeyMomentType(score)!;
    const options = getOptionsForSituation(momentType);

    // Calculate success probabilities for each option
    const optionsWithProb = options.map(option => ({
      ...option,
      successProbability: KeyMomentResolver.calculateSuccessProbability(
        config.playerStats as PlayerStats,
        config.opponentStats as PlayerStats,
        option,
        {
          mood: config.mood,
          energy: config.energy,
          momentum: this.momentum,
          pressure: this.pressure,
        }
      ),
    }));

    return {
      id: `km-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: momentType,
      situation: this.getSituationDescription(momentType, score),
      description: this.getKeyMomentDescription(momentType),
      options: optionsWithProb,
      timestamp: Date.now(),
      matchContext: {
        score: this.formatScore(score),
        server: score.server,
        momentum: this.momentum,
        pressure: this.pressure,
        energy: config.energy,
        mood: config.mood,
      },
    };
  }

  /**
   * Synthesize realistic shot sequence for a key moment point
   * This ensures statistics match what a real simulated point would produce
   */
  private synthesizeRallyShots(
    shotOutcome: { outcome: PointType; shotType: string; shooter: 'player' | 'opponent' },
    pointWinner: 'player' | 'opponent',
    currentServer: 'player' | 'opponent'
  ): { shots: any[]; serveType: 'first' | 'second' } {
    const shots: any[] = [];
    const timestamp = Date.now();
    let shotNumber = 1;
    let serveType: 'first' | 'second' = 'first';

    // Helper to create a shot detail
    const createShot = (
      shotType: string,
      shooter: 'server' | 'returner',
      success: boolean,
      outcome: string,
      quality: number = 70
    ) => ({
      shotType,
      shooter,
      success,
      quality,
      outcome,
      statUsed: shotType.includes('serve') ? 'serve' :
                shotType.includes('forehand') ? 'forehand' :
                shotType.includes('backhand') ? 'backhand' : 'forehand',
      modifiers: {
        spinBonus: 0,
        placementBonus: 0,
        physicalModifier: 0,
        mentalModifier: 0,
        difficultyModifier: 0,
        pressureModifier: 0,
        rallyLengthModifier: 0,
        finalAdjustment: 0,
      },
      timestamp: timestamp + shotNumber * 100,
      shotNumber: shotNumber++,
      context: {
        difficulty: 'normal' as const,
        pressure: 'high' as const,
        courtPosition: 'baseline' as const,
        rallyLength: shotNumber - 1,
      },
    });

    // Determine winner in server/returner terms
    const winnerRole = pointWinner === currentServer ? 'server' as const : 'returner' as const;

    // Generate shots based on outcome type
    switch (shotOutcome.outcome) {
      case PointType.ACE:
        // ACE: Just the serve
        shots.push(createShot('serve_first', 'server', true, 'winner', 85));
        serveType = 'first';
        break;

      case PointType.DOUBLE_FAULT:
        // DOUBLE_FAULT: First serve fault, then second serve fault
        shots.push(createShot('serve_first', 'server', false, 'error', 30));
        shots.push(createShot('serve_second', 'server', false, 'error', 35));
        serveType = 'second';
        break;

      case PointType.WINNER:
        // WINNER: Serve + return + winner shot (3-5 shots)
        // Serve (successful first serve)
        shots.push(createShot('serve_first', 'server', true, 'in_play', 75));
        serveType = 'first';

        // Return
        shots.push(createShot('return_forehand', 'returner', true, 'in_play', 65));

        // 1-3 rally shots before winner
        const rallyShots = 1 + Math.floor(Math.random() * 3); // 1-3 rally shots
        for (let i = 0; i < rallyShots - 1; i++) {
          const isServerShot = i % 2 === 0;
          shots.push(createShot(
            isServerShot ? 'forehand' : 'backhand',
            isServerShot ? 'server' : 'returner',
            true,
            'in_play',
            70
          ));
        }

        // Final winner shot
        shots.push(createShot(
          shotOutcome.shotType,
          winnerRole,
          true,
          'winner',
          90
        ));
        break;

      case PointType.FORCED_ERROR:
      case PointType.UNFORCED_ERROR:
        // ERROR: Serve + return + rally ending in error
        // Serve (successful first serve)
        shots.push(createShot('serve_first', 'server', true, 'in_play', 75));
        serveType = 'first';

        // Return
        shots.push(createShot('return_forehand', 'returner', true, 'in_play', 65));

        // 1-3 rally shots before error
        const rallyErrorShots = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rallyErrorShots - 1; i++) {
          const isServerShot = i % 2 === 0;
          shots.push(createShot(
            isServerShot ? 'forehand' : 'backhand',
            isServerShot ? 'server' : 'returner',
            true,
            'in_play',
            70
          ));
        }

        // Final error shot (loser makes the error)
        const loserRole = pointWinner === currentServer ? 'returner' as const : 'server' as const;
        shots.push(createShot(
          shotOutcome.shotType,
          loserRole,
          false,
          shotOutcome.outcome === PointType.FORCED_ERROR ? 'forced_error' : 'unforced_error',
          40
        ));
        break;

      default:
        // Fallback: simple serve + rally
        shots.push(createShot('serve_first', 'server', true, 'in_play', 75));
        shots.push(createShot('forehand', winnerRole, true, 'winner', 80));
        serveType = 'first';
    }

    return { shots, serveType };
  }

  /**
   * Create a PointResult from a key moment resolution
   */
  private createPointResultFromKeyMoment(
    keyMomentResult: KeyMomentResult,
    currentServer: 'player' | 'opponent'
  ): PointResult {
    const winner = keyMomentResult.pointWinner === currentServer ? 'server' as const : 'returner' as const;
    const pointType = keyMomentResult.shotOutcome.outcome;

    // Synthesize realistic shot sequence
    const { shots, serveType } = this.synthesizeRallyShots(
      keyMomentResult.shotOutcome,
      keyMomentResult.pointWinner,
      currentServer
    );

    // Calculate statistics from actual shots
    const rallyLength = shots.length;
    const winnerCount = shots.filter(s => s.outcome === PointType.ACE || s.outcome === PointType.WINNER).length;
    const errorCount = shots.filter(s =>
      s.outcome === PointType.FAULT ||
      s.outcome === PointType.FORCED_ERROR ||
      s.outcome === PointType.UNFORCED_ERROR
    ).length;
    const netApproaches = shots.filter(s => s.shotType.includes('volley')).length;
    const rallyExchanges = Math.floor(rallyLength / 2);

    // Estimate duration: 2-3 seconds per shot
    const duration = Math.round(rallyLength * 2.5);

    return {
      server: currentServer,
      winner,
      pointType,
      shots,
      rallyLength,
      serveType,
      duration,
      statistics: {
        totalShots: rallyLength,
        winnerCount,
        errorCount,
        netApproaches,
        rallyExchanges,
        pressureMoments: 1, // Key moments are pressure situations
      },
    };
  }

  /**
   * Simulate a normal point using the full PointSimulator
   * This ensures realistic shot-by-shot simulation and accurate statistics
   */
  private simulatePointWithStats(
    matchSim: MatchSimulator,
    score: MatchScore
  ): PointResult {
    if (!this.pointSimulator) {
      throw new Error('PointSimulator not initialized');
    }

    const playerProfile = (matchSim as any).config.player;
    const opponentProfile = (matchSim as any).config.opponent;
    const currentServer = score.server;

    // Determine server and returner profiles
    const serverProfile = currentServer === 'player' ? playerProfile : opponentProfile;
    const returnerProfile = currentServer === 'player' ? opponentProfile : playerProfile;

    // Convert MatchScore to MatchState format expected by PointSimulator
    const matchState: MatchState = {
      score: {
        sets: score.sets.map(s => ({
          player: s.player,
          opponent: s.opponent,
          tiebreak: undefined,
          winner: undefined,
          isComplete: false,
        })),
        currentGame: {
          server: score.currentGame[currentServer],
          returner: score.currentGame[currentServer === 'player' ? 'opponent' : 'player'],
          advantage: null,
          isDeuce: false,
        },
        currentServer: currentServer,
        isMatchComplete: score.isComplete,
        winner: score.winner,
        matchFormat: {
          bestOfSets: (this as any).matchFormat === 'best-of-1' ? 1 : (this as any).matchFormat === 'best-of-3' ? 3 : 5,
          gamesPerSet: 6,
          enableTiebreaks: true,
          tiebreakAt: 6,
        },
      },
      currentServer: currentServer,
      courtSurface: (matchSim as any).config.courtSurface,
      momentum: this.momentum,
      pressure: this.pressure > 60 ? 'high' as const : this.pressure > 30 ? 'medium' as const : 'low' as const,
      matchLength: this.pointsPlayed * 0.5, // Rough estimate: 30 seconds per point
      pointsPlayed: this.pointsPlayed,
      isKeyMoment: false,
    };

    // Use PointSimulator to simulate the point
    const pointResult = this.pointSimulator.simulatePoint(
      currentServer,
      serverProfile,
      returnerProfile,
      matchState
    );

    // Track statistics
    if (this.matchStatistics) {
      const breakPointFor = this.isBreakPoint(score)
        ? (score.server === 'player' ? 'opponent' : 'player')
        : undefined;
      this.matchStatistics.addPointResult(pointResult, currentServer, breakPointFor);
    }

    return pointResult;
  }

  /**
   * Get match statistics (call after match is complete)
   */
  public getMatchStatistics(): IMatchStatistics | null {
    if (this.matchStatistics) {
      this.matchStatistics.finalizeStatistics();
      return this.matchStatistics.getStatistics();
    }
    return null;
  }

  /**
   * Cancel the ongoing match simulation
   */
  public cancelMatch(): void {
    this.cancelled = true;
  }

  /**
   * Update score after a point
   */
  private updateScore(score: MatchScore, winner: 'player' | 'opponent'): MatchScore {
    const newScore = { ...score };

    // Update current game
    if (winner === 'player') {
      newScore.currentGame.player++;
    } else {
      newScore.currentGame.opponent++;
    }

    // Check if game is won
    if (this.isGameWon(newScore.currentGame)) {
      const gameWinner = this.getGameWinner(newScore.currentGame);

      // Update current set
      if (gameWinner === 'player') {
        newScore.currentSet.player++;
      } else {
        newScore.currentSet.opponent++;
      }

      // Reset game score
      newScore.currentGame = { player: 0, opponent: 0 };

      // Check if set is won
      if (this.isSetWon(newScore.currentSet)) {
        const setWinner = this.getSetWinner(newScore.currentSet);

        // Add to sets array
        newScore.sets.push({ ...newScore.currentSet });

        // Reset set score
        newScore.currentSet = { player: 0, opponent: 0 };

        // Check if match is won based on format
        const playerSets = newScore.sets.filter(s => s.player > s.opponent).length;
        const opponentSets = newScore.sets.filter(s => s.opponent > s.player).length;

        // Store matchFormat in instance variable during startMatch
        const format = (this as any).matchFormat || 'best-of-3';
        const setsToWin = format === 'best-of-1' ? 1 : format === 'best-of-3' ? 2 : 3;

        if (playerSets === setsToWin) {
          newScore.isComplete = true;
          newScore.winner = 'player';
        } else if (opponentSets === setsToWin) {
          newScore.isComplete = true;
          newScore.winner = 'opponent';
        }
      }

      // Switch server after game
      newScore.server = newScore.server === 'player' ? 'opponent' : 'player';
    }

    return newScore;
  }

  /**
   * Update momentum based on point result
   */
  private updateMomentum(winner: 'player' | 'opponent', outcome: string): void {
    let change = winner === 'player' ? 5 : -5;

    // Critical moments have bigger momentum swings
    if (outcome === 'critical-success' || outcome === 'critical-failure') {
      change *= 2;
    }

    this.momentum = Math.max(-100, Math.min(100, this.momentum + change));
  }

  /**
   * Update pressure based on match situation
   */
  private updatePressure(score: MatchScore): void {
    // Pressure increases as games get closer and in late sets
    const gameScore = score.currentGame;
    const setScore = score.currentSet;

    let pressureLevel = 30; // Base pressure

    // Close game scores increase pressure
    const gameDiff = Math.abs(gameScore.player - gameScore.opponent);
    if (gameDiff <= 1 && (gameScore.player >= 3 || gameScore.opponent >= 3)) {
      pressureLevel += 20;
    }

    // Close set scores increase pressure
    const setDiff = Math.abs(setScore.player - setScore.opponent);
    if (setDiff <= 1 && (setScore.player >= 4 || setScore.opponent >= 4)) {
      pressureLevel += 30;
    }

    // Late in match
    if (score.sets.length >= 1) {
      pressureLevel += 20;
    }

    this.pressure = Math.min(100, pressureLevel);
  }

  // Helper methods for score checking

  private isBreakPoint(score: MatchScore): boolean {
    const { currentGame, server } = score;
    const servingPlayer = server;
    const returningPlayer = server === 'player' ? 'opponent' : 'player';

    // Break point: returner can win the game
    return this.canWinGame(currentGame, returningPlayer);
  }

  private isSetPoint(score: MatchScore, player: 'player' | 'opponent'): boolean {
    const { currentSet, currentGame } = score;

    // Player can win set if they win this game
    const gamesNeeded = 6;
    const currentGames = currentSet[player];
    const opponentGames = currentSet[player === 'player' ? 'opponent' : 'player'];

    // Need at least 6 games and 2-game lead (or 7-5, 7-6)
    if (currentGames >= gamesNeeded - 1 && currentGames > opponentGames) {
      return this.canWinGame(currentGame, player);
    }

    return false;
  }

  private isMatchPoint(score: MatchScore, player: 'player' | 'opponent'): boolean {
    const playerSets = score.sets.filter(s =>
      player === 'player' ? s.player > s.opponent : s.opponent > s.player
    ).length;

    // Determine sets needed to win based on match format
    const format = (this as any).matchFormat || 'best-of-3';
    const setsToWin = format === 'best-of-1' ? 1 : format === 'best-of-3' ? 2 : 3;

    // Match point if: winning this set would win the match
    // That means: player has (setsToWin - 1) sets already, and this is set point
    return playerSets === (setsToWin - 1) && this.isSetPoint(score, player);
  }

  private canWinGame(game: { player: number; opponent: number }, player: 'player' | 'opponent'): boolean {
    const playerScore = game[player];
    const opponentScore = game[player === 'player' ? 'opponent' : 'player'];

    // Can win game if:
    // - At 40-30 or better (player has 3+, opponent has <= 2)
    // - OR at advantage (both have 3+, player is ahead by 1)
    if (playerScore >= 3 && opponentScore <= 2) {
      return true; // 40-0, 40-15, 40-30
    }

    if (playerScore >= 4 && opponentScore >= 3 && playerScore > opponentScore) {
      return true; // Advantage after deuce
    }

    return false;
  }

  private isGameWon(game: { player: number; opponent: number }): boolean {
    return game.player >= 4 || game.opponent >= 4;
  }

  private getGameWinner(game: { player: number; opponent: number }): 'player' | 'opponent' {
    return game.player > game.opponent ? 'player' : 'opponent';
  }

  private isSetWon(set: { player: number; opponent: number }): boolean {
    const { player, opponent } = set;

    // Win at 6 games with 2-game lead (e.g., 6-4, 6-3, 6-2, 6-1, 6-0)
    if (player >= 6 && player - opponent >= 2) return true;
    if (opponent >= 6 && opponent - player >= 2) return true;

    // Win at 7-6 (after tiebreak at 6-6)
    // Once either player reaches 7, the set is over
    if (player === 7 || opponent === 7) return true;

    return false;
  }

  private getSetWinner(set: { player: number; opponent: number }): 'player' | 'opponent' {
    return set.player > set.opponent ? 'player' : 'opponent';
  }

  private isMatchComplete(score: MatchScore): boolean {
    return score.isComplete;
  }

  private initializeScore(): MatchScore {
    return {
      sets: [],
      currentSet: { player: 0, opponent: 0 },
      currentGame: { player: 0, opponent: 0 },
      server: Math.random() < 0.5 ? 'player' : 'opponent',
      isComplete: false,
    };
  }

  private formatScore(score: MatchScore): string {
    const sets = score.sets.map(s => `${s.player}-${s.opponent}`).join(', ');
    const current = `${score.currentSet.player}-${score.currentSet.opponent}`;
    const game = this.formatGameScore(score.currentGame);
    return `Sets: ${sets || 'none'} | Current: ${current} (${game})`;
  }

  private formatGameScore(game: { player: number; opponent: number }): string {
    const points = ['0', '15', '30', '40'];
    if (game.player < 4 && game.opponent < 4) {
      return `${points[game.player]}-${points[game.opponent]}`;
    }
    if (game.player === game.opponent) return 'Deuce';
    return game.player > game.opponent ? 'Ad-In' : 'Ad-Out';
  }

  private getSituationDescription(type: KeyMomentType, score: MatchScore): string {
    const game = this.formatGameScore(score.currentGame);
    const typeMap: Record<KeyMomentType, string> = {
      'break-point-serve': `Break Point Against - ${game}`,
      'break-point-return': `Break Point For You - ${game}`,
      'set-point-player-serve': `Set Point On Your Serve - ${game}`,
      'set-point-player-return': `Set Point On Your Return - ${game}`,
      'set-point-opponent-serve': `Set Point Against - ${game}`,
      'set-point-opponent-return': `Set Point Against - ${game}`,
      'match-point-player-serve': `MATCH POINT! - ${game}`,
      'match-point-player-return': `MATCH POINT! - ${game}`,
      'match-point-opponent-serve': `Match Point Against! - ${game}`,
      'match-point-opponent-return': `Match Point Against! - ${game}`,
    };
    return typeMap[type];
  }

  private getKeyMomentDescription(type: KeyMomentType): string {
    const descriptions: Record<KeyMomentType, string> = {
      'break-point-serve': 'A critical moment to hold your serve!',
      'break-point-return': 'Your chance to break serve and take control!',
      'set-point-player-serve': 'One serve away from winning the set! Stay focused!',
      'set-point-player-return': 'A chance here to break for the set! Find your rhythm!',
      'set-point-opponent-serve': 'Fight to stay in this set! A great serve can pull you back in it!',
      'set-point-opponent-return': 'Fight to stay in this set! You need to get this ball back!',
      'match-point-player-serve': 'This is it! One point for victory! One last push!',
      'match-point-player-return': 'Deep breath. Focus on the return. One more time!',
      'match-point-opponent-serve': 'Everything on the line - this serve is crucial!',
      'match-point-opponent-return': 'This is match point! Anything to get it back over!',
    };
    return descriptions[type];
  }
}
