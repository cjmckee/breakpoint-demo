/**
 * Match Orchestrator
 * Coordinates match simulation with key moment system
 * Wraps the existing MatchSimulator to add interactive key moments
 */

import { MatchSimulator } from '../core/MatchSimulator';
import { ScoreTracker } from '../core/ScoreTracker';
import { PlayerProfile } from '../core/PlayerProfile';
import { KeyMomentResolver } from './KeyMomentResolver';
import { getOptionsForSituation, KeyMomentType } from '../data/tacticalOptions';
import {
  KeyMoment,
  KeyMomentCallback,
  InteractiveMatchConfig,
  MatchScore,
  MatchState,
  PointResult,
} from '../types/keyMoments';
import { PlayerStats } from '../types/game';

export class MatchOrchestrator {
  private keyMomentsTriggered = 0;
  private pointsPlayed = 0;
  private momentum = 0;
  private pressure = 0;

  /**
   * Simulate an interactive match with key moments
   */
  async simulateInteractiveMatch(config: InteractiveMatchConfig): Promise<MatchScore> {
    // Initialize match simulator with PlayerProfile objects
    const player = new PlayerProfile('player', 'Player', config.playerStats);
    const opponent = new PlayerProfile('opponent', 'Opponent', config.opponentStats);

    const matchSim = new MatchSimulator({
      player,
      opponent,
      courtSurface: config.surface,
    });

    // Initialize score tracker
    const scoreTracker = new ScoreTracker();

    // Match state
    let isComplete = false;
    let currentScore: MatchScore = this.initializeScore();

    // Main match loop - simulate point by point
    while (!isComplete) {
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

        // Apply result to score
        const pointWinner = result.pointWinner;
        currentScore = this.updateScore(currentScore, pointWinner);

        // Update momentum based on outcome
        this.updateMomentum(pointWinner, result.outcome);

        this.keyMomentsTriggered++;
      } else {
        // NORMAL SIMULATION
        // Use existing match simulator to determine point
        const pointWinner = this.simulatePoint(matchSim, currentScore);
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

      // Check if match is complete
      isComplete = this.isMatchComplete(currentScore);
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
    const maxKeyMoments = config.keyMomentsPerMatch || 8;
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
      return server === 'player' ? 'match-point-player-serve' : 'match-point-opponent';
    }
    if (this.isMatchPoint(score, 'opponent')) {
      return server === 'player' ? 'match-point-opponent' : 'match-point-player-serve';
    }

    // Check for set point
    if (this.isSetPoint(score, 'player')) {
      return server === 'player' ? 'set-point-player-serve' : 'set-point-opponent';
    }
    if (this.isSetPoint(score, 'opponent')) {
      return server === 'player' ? 'set-point-opponent' : 'set-point-player-serve';
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
   * Simulate a normal point (without key moment)
   */
  private simulatePoint(
    matchSim: MatchSimulator,
    score: MatchScore
  ): 'player' | 'opponent' {
    // Simple simulation based on stats
    // In a full implementation, this would call the actual PointSimulator
    const random = Math.random();
    return random < 0.5 ? 'player' : 'opponent';
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

        // Check if match is won (best of 3 sets, need 2)
        const playerSets = newScore.sets.filter(s => s.player > s.opponent).length;
        const opponentSets = newScore.sets.filter(s => s.opponent > s.player).length;

        if (playerSets === 2) {
          newScore.isComplete = true;
          newScore.winner = 'player';
        } else if (opponentSets === 2) {
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

    // Need 1 set already won, and this is set point
    return playerSets === 1 && this.isSetPoint(score, player);
  }

  private canWinGame(game: { player: number; opponent: number }, player: 'player' | 'opponent'): boolean {
    const playerScore = game[player];
    const opponentScore = game[player === 'player' ? 'opponent' : 'player'];

    // Win at 4 points with 2-point lead, or at deuce with 1-point lead
    return playerScore >= 3 && playerScore >= opponentScore;
  }

  private isGameWon(game: { player: number; opponent: number }): boolean {
    return game.player >= 4 || game.opponent >= 4;
  }

  private getGameWinner(game: { player: number; opponent: number }): 'player' | 'opponent' {
    return game.player > game.opponent ? 'player' : 'opponent';
  }

  private isSetWon(set: { player: number; opponent: number }): boolean {
    const { player, opponent } = set;
    // Win at 6 games with 2-game lead, or 7-5, or tiebreak at 7-6
    return (player >= 6 && player - opponent >= 2) || (opponent >= 6 && opponent - player >= 2);
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
      'set-point-opponent': `Set Point Against - ${game}`,
      'match-point-player-serve': `MATCH POINT! - ${game}`,
      'match-point-opponent': `Match Point Against! - ${game}`,
    };
    return typeMap[type];
  }

  private getKeyMomentDescription(type: KeyMomentType): string {
    const descriptions: Record<KeyMomentType, string> = {
      'break-point-serve': 'A critical moment to hold your serve!',
      'break-point-return': 'Your chance to break serve and take control!',
      'set-point-player-serve': 'One point away from winning the set!',
      'set-point-opponent': 'Fight to stay in this set!',
      'match-point-player-serve': 'This is it! One point for victory!',
      'match-point-opponent': 'Everything on the line - save this match point!',
    };
    return descriptions[type];
  }
}
