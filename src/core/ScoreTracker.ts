/**
 * ScoreTracker - Tennis scoring and match progression
 *
 * Handles all tennis scoring rules: points, games, sets, and matches.
 * Provides clear scoring state and progression tracking.
 */

import type {
  MatchScore,
  GameScore,
  SetScore,
  MatchFormat,
  ScoreSnapshot,
} from '../types/index.js';

export class ScoreTracker {
  private score: MatchScore;

  constructor(matchFormat: MatchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 }) {
    this.score = this.createInitialScore(matchFormat);
  }

  /**
   * Create initial match score
   */
  private createInitialScore(matchFormat: MatchFormat): MatchScore {
    return {
      sets: [{
        player: 0,
        opponent: 0,
        winner: undefined,
        isComplete: false,
      }],
      currentGame: {
        server: 0,
        returner: 0,
        advantage: undefined,
        isDeuce: false,
      },
      currentServer: 'player', // Will be set properly by match simulator
      isMatchComplete: false,
      winner: undefined,
      matchFormat,
    };
  }

  /**
   * Add a point to the current game
   */
  public addPoint(winner: 'player' | 'opponent'): void {
    const currentSet = this.getCurrentSet();

    // Convert winner to server/returner context
    const pointWinner = this.convertToServerReturner(winner);

    // Add point to current game
    this.addPointToGame(pointWinner);

    // Check if game is complete
    if (this.isGameComplete()) {
      const gameWinner = this.getGameWinner();

      // Convert game winner from server/returner to player/opponent
      const gameWinnerAsPlayer = this.convertFromServerReturner(gameWinner!);
      this.addGameToSet(gameWinnerAsPlayer);

      // Reset current game
      this.score.currentGame = {
        server: 0,
        returner: 0,
        advantage: undefined,
        isDeuce: false,
      };

      // Switch server for next game
      this.switchServer();

      // Check if set is complete
      if (this.isSetComplete()) {
        const setWinner = this.getSetWinner();
        currentSet.winner = setWinner;
        currentSet.isComplete = true;

        // Check if match is complete
        if (this.isMatchComplete()) {
          this.score.isMatchComplete = true;
          this.score.winner = this.getMatchWinner();
        } else {
          // Start new set
          this.score.sets.push({
            player: 0,
            opponent: 0,
            winner: undefined,
            isComplete: false,
          });
        }
      }
    }
  }

  /**
   * Add point to current game with tennis scoring rules
   */
  private addPointToGame(winner: 'server' | 'returner'): void {
    const game = this.score.currentGame;

    if (winner === 'server') {
      game.server++;
    } else {
      game.returner++;
    }

    // Handle deuce and advantage
    if (game.server >= 3 && game.returner >= 3) {
      if (game.server === game.returner) {
        // Deuce
        game.isDeuce = true;
        game.advantage = undefined;
      } else if (game.server === game.returner + 1) {
        // Server advantage
        game.isDeuce = false;
        game.advantage = 'server';
      } else if (game.returner === game.server + 1) {
        // Returner advantage
        game.isDeuce = false;
        game.advantage = 'returner';
      }
      // If difference is 2+ points, game is won (handled by isGameComplete)
    } else {
      // Normal scoring (0, 1, 2, 3+ points)
      game.isDeuce = false;
      game.advantage = undefined;
    }
  }

  /**
   * Check if current game is complete
   */
  private isGameComplete(): boolean {
    const game = this.score.currentGame;

    // Standard game win: 4+ points with 2+ point margin
    if ((game.server >= 4 && game.server - game.returner >= 2) ||
        (game.returner >= 4 && game.returner - game.server >= 2)) {
      return true;
    }

    return false;
  }

  /**
   * Get the winner of the current game
   */
  private getGameWinner(): 'server' | 'returner' | undefined {
    const game = this.score.currentGame;

    if (game.server >= 4 && game.server - game.returner >= 2) {
      return 'server';
    }
    if (game.returner >= 4 && game.returner - game.server >= 2) {
      return 'returner';
    }

    return undefined;
  }

  /**
   * Add game to current set
   */
  private addGameToSet(winner: 'player' | 'opponent'): void {
    const currentSet = this.getCurrentSet();

    if (winner === 'player') {
      currentSet.player++;
    } else {
      currentSet.opponent++;
    }
  }

  /**
   * Check if current set is complete
   */
  private isSetComplete(): boolean {
    const currentSet = this.getCurrentSet();
    const gamesPerSet = this.score.matchFormat.gamesPerSet;

    // Standard set win: 6+ games with 2+ game margin
    if ((currentSet.player >= gamesPerSet && currentSet.player - currentSet.opponent >= 2) ||
        (currentSet.opponent >= gamesPerSet && currentSet.opponent - currentSet.player >= 2)) {
      return true;
    }

    // Special case: 7-5 or 7-6 wins
    if ((currentSet.player === gamesPerSet + 1 && currentSet.opponent >= gamesPerSet - 1) ||
        (currentSet.opponent === gamesPerSet + 1 && currentSet.player >= gamesPerSet - 1)) {
      return true;
    }

    // If tiebreaks are enabled and we reach 6-6, next game winner takes set 7-6
    if (this.score.matchFormat.enableTiebreaks &&
        currentSet.player === this.score.matchFormat.tiebreakAt &&
        currentSet.opponent === this.score.matchFormat.tiebreakAt) {
      // Next game winner takes the set
      return (currentSet.player > this.score.matchFormat.tiebreakAt ||
              currentSet.opponent > this.score.matchFormat.tiebreakAt);
    }

    // Without tiebreaks, if we reach 6-6, next game winner takes set 7-6
    // (temporary until tiebreaker is implemented)
    if (!this.score.matchFormat.enableTiebreaks &&
        currentSet.player === gamesPerSet &&
        currentSet.opponent === gamesPerSet) {
      // If anyone has won a game past 6-6, they win the set
      return (currentSet.player >= gamesPerSet + 1 || currentSet.opponent >= gamesPerSet + 1);
    }

    return false;
  }

  /**
   * Get the winner of the current set
   */
  private getSetWinner(): 'player' | 'opponent' | undefined {
    const currentSet = this.getCurrentSet();
    const gamesPerSet = this.score.matchFormat.gamesPerSet;

    // Player wins with 2+ game margin or 7-5/7-6
    if ((currentSet.player >= gamesPerSet && currentSet.player - currentSet.opponent >= 2) ||
        (currentSet.player === gamesPerSet + 1 && currentSet.opponent >= gamesPerSet - 1)) {
      return 'player';
    }

    // Opponent wins with 2+ game margin or 7-5/7-6
    if ((currentSet.opponent >= gamesPerSet && currentSet.opponent - currentSet.player >= 2) ||
        (currentSet.opponent === gamesPerSet + 1 && currentSet.player >= gamesPerSet - 1)) {
      return 'opponent';
    }

    return undefined;
  }

  /**
   * Check if match is complete
   */
  private isMatchComplete(): boolean {
    const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
    const completedSets = this.score.sets.filter(set => set.isComplete);

    const playerSetsWon = completedSets.filter(set => set.winner === 'player').length;
    const opponentSetsWon = completedSets.filter(set => set.winner === 'opponent').length;

    return playerSetsWon >= setsToWin || opponentSetsWon >= setsToWin;
  }

  /**
   * Get the winner of the match
   */
  private getMatchWinner(): 'player' | 'opponent' | undefined {
    const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
    const completedSets = this.score.sets.filter(set => set.isComplete);

    const playerSetsWon = completedSets.filter(set => set.winner === 'player').length;
    const opponentSetsWon = completedSets.filter(set => set.winner === 'opponent').length;

    if (playerSetsWon >= setsToWin) {
      return 'player';
    }
    if (opponentSetsWon >= setsToWin) {
      return 'opponent';
    }

    return undefined;
  }

  /**
   * Switch server for next game
   */
  private switchServer(): void {
    this.score.currentServer = this.score.currentServer === 'player' ? 'opponent' : 'player';
  }

  /**
   * Convert player/opponent to server/returner based on current server
   */
  private convertToServerReturner(winner: 'player' | 'opponent'): 'server' | 'returner' {
    if (this.score.currentServer === winner) {
      return 'server';
    }
    return 'returner';
  }

  /**
   * Convert server/returner to player/opponent based on current server
   */
  private convertFromServerReturner(winner: 'server' | 'returner'): 'player' | 'opponent' {
    if (winner === 'server') {
      return this.score.currentServer;
    }
    return this.score.currentServer === 'player' ? 'opponent' : 'player';
  }

  /**
   * Get current set
   */
  private getCurrentSet(): SetScore {
    return this.score.sets[this.score.sets.length - 1];
  }

  // =======================
  // PUBLIC INTERFACE
  // =======================

  /**
   * Get current match score
   */
  public getScore(): MatchScore {
    return { ...this.score }; // Return copy to prevent mutations
  }

  /**
   * Get current set games in player/opponent format
   */
  public getCurrentSetGames(): { player: number; opponent: number } {
    const currentSet = this.getCurrentSet();
    return {
      player: currentSet.player,
      opponent: currentSet.opponent,
    };
  }

  /**
   * Get human-readable score string
   */
  public getScoreString(): string {
    const currentSet = this.getCurrentSet();
    const game = this.score.currentGame;

    // Convert points to tennis scoring
    const pointsToTennis = (points: number, advantage?: string, isDeuce?: boolean) => {
      if (isDeuce) return 'Deuce';
      if (advantage === 'server') return 'Ad';
      if (advantage === 'returner') return 'Ad';

      switch (points) {
        case 0: return '0';
        case 1: return '15';
        case 2: return '30';
        case 3: return '40';
        default: return '40';
      }
    };

    const playerGames = currentSet.player;
    const opponentGames = currentSet.opponent;

    // Determine if player is currently serving
    const playerIsServer = this.score.currentServer === 'player';

    let playerPoints, opponentPoints;

    if (game.isDeuce) {
      playerPoints = opponentPoints = 'Deuce';
    } else if (game.advantage) {
      if ((game.advantage === 'server' && playerIsServer) ||
          (game.advantage === 'returner' && !playerIsServer)) {
        playerPoints = 'Ad';
        opponentPoints = '';
      } else {
        playerPoints = '';
        opponentPoints = 'Ad';
      }
    } else {
      const playerGamePoints = playerIsServer ? game.server : game.returner;
      const opponentGamePoints = playerIsServer ? game.returner : game.server;
      playerPoints = pointsToTennis(playerGamePoints);
      opponentPoints = pointsToTennis(opponentGamePoints);
    }

    // Format: "Player 6-4, 30-15" or "Player 2-1, Deuce"
    let scoreString = `${playerGames}-${opponentGames}`;

    if (!this.score.isMatchComplete) {
      if (playerPoints === 'Deuce' || opponentPoints === 'Deuce') {
        scoreString += ', Deuce';
      } else {
        scoreString += `, ${playerPoints}-${opponentPoints}`;
      }
    }

    return scoreString;
  }

  /**
   * Get score snapshot for tracking progression
   */
  public getScoreSnapshot(): ScoreSnapshot {
    return {
      timestamp: Date.now(),
      gameScore: { ...this.score.currentGame },
      setScore: { ...this.getCurrentSet() },
      currentServer: this.score.currentServer,
      momentum: 0, // Will be calculated by match simulator
    };
  }

  /**
   * Check if match is complete
   */
  public isComplete(): boolean {
    return this.score.isMatchComplete;
  }

  /**
   * Get match winner
   */
  public getWinner(): 'player' | 'opponent' | undefined {
    return this.score.winner;
  }

  /**
   * Set initial server
   */
  public setInitialServer(server: 'player' | 'opponent'): void {
    this.score.currentServer = server;
  }

  /**
   * Get current server
   */
  public getCurrentServer(): 'player' | 'opponent' {
    return this.score.currentServer;
  }

  /**
   * Check if current point is a key moment (break point, set point, etc.)
   */
  public isKeyMoment(): boolean {
    const game = this.score.currentGame;
    const currentSet = this.getCurrentSet();

    // Break point: returner can win the game
    if (this.score.currentServer === 'player') {
      // Opponent serving, player can break
      if ((game.returner >= 3 && game.server <= 3) ||
          (game.advantage === 'returner')) {
        return true;
      }
    } else {
      // Player serving, opponent can break
      if ((game.server >= 3 && game.returner <= 3) ||
          (game.advantage === 'server')) {
        return true;
      }
    }

    // Set point: either player can win the set with this game
    const gamesPerSet = this.score.matchFormat.gamesPerSet;
    if ((currentSet.player >= gamesPerSet - 1 && currentSet.opponent <= gamesPerSet - 2) ||
        (currentSet.opponent >= gamesPerSet - 1 && currentSet.player <= gamesPerSet - 2)) {
      return true;
    }

    // Match point: either player can win the match with this set
    if (this.isSetComplete()) {
      const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
      const completedSets = this.score.sets.filter(set => set.isComplete);
      const playerSetsWon = completedSets.filter(set => set.winner === 'player').length;
      const opponentSetsWon = completedSets.filter(set => set.winner === 'opponent').length;

      if (playerSetsWon === setsToWin - 1 || opponentSetsWon === setsToWin - 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if current point is a break point and for which player
   * Returns 'player' if player has break point, 'opponent' if opponent has break point, undefined otherwise
   */
  public getBreakPointFor(): 'player' | 'opponent' | undefined {
    const game = this.score.currentGame;

    // A break point is when the returner can win the game
    // The returner needs 1 point to win the game while the server is serving

    if (this.score.currentServer === 'player') {
      // Player is serving, opponent can break
      // Opponent needs to be one point away from winning (returner needs 4 points with 2+ point margin)
      if ((game.returner === 3 && game.server < 3) || // 0-40, 15-40, 30-40
          (game.advantage === 'returner')) { // Advantage returner
        return 'opponent';
      }
    } else {
      // Opponent is serving, player can break
      // Player needs to be one point away from winning (returner needs 4 points with 2+ point margin)
      if ((game.returner === 3 && game.server < 3) || // 0-40, 15-40, 30-40
          (game.advantage === 'returner')) { // Advantage returner
        return 'player';
      }
    }

    return undefined;
  }

  /**
   * Reset for new match
   */
  public reset(matchFormat?: MatchFormat): void {
    const format = matchFormat || this.score.matchFormat;
    this.score = this.createInitialScore(format);
  }
}