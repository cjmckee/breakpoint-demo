/**
 * ScoreTracker - Tennis scoring and match progression
 *
 * Implements the official ITF Rules of Tennis for all scoring:
 *
 * REGULAR GAME SCORING (ITF Rule 26 - "How Games Are Scored"):
 * - Points progress: Love (0), 15, 30, 40, Game
 * - Tracked internally as raw counts: 0, 1, 2, 3+
 * - Deuce: when both players reach 40 (3 points each)
 * - Advantage: one player ahead by 1 after deuce
 * - Game won: first to 4 points with at least a 2-point margin
 * - At Deuce (40-40), it is NOT yet a break point — advantage must be won first
 *
 * SET SCORING (ITF Rule 27 - "How Sets Are Scored"):
 * - First player to win 6 games wins the set, provided they lead by at least 2 games
 * - Covers: 6-0, 6-1, 6-2, 6-3, 6-4 (all win by 2+ from 6 games)
 * - If the score reaches 5-5: play continues, winner is first to reach 7 games at 7-5
 * - If score reaches 6-6 AND tiebreaks are enabled: a tiebreak game is played
 * - Without tiebreaks (advantage sets): play continues until one player leads by 2 games
 *
 * TIEBREAK GAME SCORING (ITF Rule 27 Appendix - "The Tiebreak Game"):
 * - Triggered when set score reaches 6-6 (the configured tiebreakAt value)
 * - Points are counted NUMERICALLY: 1, 2, 3... (NOT Love-15-30-40)
 * - First player to reach 7 points wins, WITH a minimum 2-point lead
 * - If tied at 6-6 in the tiebreak, play continues until one player leads by 2
 * - Server rotation (ITF Rule 27 Appendix):
 *   • The player whose turn it is to serve starts the tiebreak (1 point)
 *   • Service then alternates every 2 points for the remainder of the tiebreak
 *   • Pattern: A serves point 1 → B serves points 2-3 → A serves points 4-5 → B serves 6-7 → ...
 * - Side changes: ends are changed after every 6 points in the tiebreak
 *   (not tracked here since this is a simulation, but noted for completeness)
 * - After the tiebreak: the player who served the FIRST tiebreak point will
 *   RECEIVE serve at the start of the next set (ITF Rule 27 Appendix)
 * - The set score is recorded as 7-6 for the tiebreak winner
 *
 * MATCH FORMAT:
 * - Best of 1, 3, or 5 sets
 * - Player who wins the majority of sets wins the match
 *
 * Sources: ITF Rules of Tennis 2026
 * https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf
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

  // Tiebreak tracking (implementation details, not exposed in score object)
  private tiebreakFirstServer: 'player' | 'opponent' | null = null;
  private tiebreakPointsPlayed: number = 0;

  constructor(matchFormat: MatchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 }) {
    this.score = this.createInitialScore(matchFormat);
  }

  // =======================
  // INITIALIZATION
  // =======================

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
      currentServer: 'player',
      isMatchComplete: false,
      winner: undefined,
      matchFormat,
      isTiebreak: false,
      currentTiebreak: undefined,
    };
  }

  // =======================
  // PUBLIC POINT ENTRY
  // =======================

  /**
   * Record a point won by the given player.
   * Routes to tiebreak or standard game handling based on current state.
   */
  public addPoint(winner: 'player' | 'opponent'): void {
    if (this.score.isTiebreak) {
      this.addPointToTiebreak(winner);
    } else {
      this.addPointToNormalGame(winner);
    }
  }

  // =======================
  // STANDARD GAME SCORING
  // =======================

  /**
   * Handle a point scored in a standard game (Love/15/30/40/Deuce/Advantage).
   */
  private addPointToNormalGame(winner: 'player' | 'opponent'): void {
    const pointWinner = this.convertToServerReturner(winner);
    this.updateGameScore(pointWinner);

    if (this.isNormalGameComplete()) {
      const gameWinner = this.getNormalGameWinner()!;
      const gameWinnerAsPlayer = this.convertFromServerReturner(gameWinner);

      this.addGameToCurrentSet(gameWinnerAsPlayer);

      // Reset game score for next game
      this.score.currentGame = {
        server: 0,
        returner: 0,
        advantage: undefined,
        isDeuce: false,
      };

      // ITF Rule 27: Server changes after each game (except at end of set/tiebreak)
      this.switchServer();

      // After server switch, check for tiebreak trigger before checking set win
      if (this.shouldStartTiebreak()) {
        this.initializeTiebreak();
      } else if (this.isNormalSetComplete()) {
        this.completeCurrentSet();
      }
    }
  }

  /**
   * Update the current game score with deuce/advantage tracking.
   *
   * ITF Rule 26:
   * - Love = 0, 15 = 1, 30 = 2, 40 = 3 points
   * - At 40-40 (Deuce): advantage awarded to next point winner
   * - Advantage: if that player wins next point → Game; if not → back to Deuce
   * - Game is won by reaching 4 points with a 2-point margin
   */
  private updateGameScore(winner: 'server' | 'returner'): void {
    const game = this.score.currentGame;

    if (winner === 'server') {
      game.server++;
    } else {
      game.returner++;
    }

    // Track deuce/advantage once both players have reached 40 (3 points)
    if (game.server >= 3 && game.returner >= 3) {
      if (game.server === game.returner) {
        // Tied after deuce: back to Deuce (40-40)
        game.isDeuce = true;
        game.advantage = undefined;
      } else if (game.server === game.returner + 1) {
        // Server leads by exactly 1: Advantage Server
        game.isDeuce = false;
        game.advantage = 'server';
      } else if (game.returner === game.server + 1) {
        // Returner leads by exactly 1: Advantage Returner
        game.isDeuce = false;
        game.advantage = 'returner';
      }
      // A margin of 2+ means the game is won — checked by isNormalGameComplete()
    } else {
      // Pre-deuce scoring: no advantage state
      game.isDeuce = false;
      game.advantage = undefined;
    }
  }

  /**
   * Check if the current standard game has been won.
   * ITF Rule 26: Win by reaching 4+ points with at least a 2-point margin.
   */
  private isNormalGameComplete(): boolean {
    const game = this.score.currentGame;
    return (game.server >= 4 && game.server - game.returner >= 2) ||
           (game.returner >= 4 && game.returner - game.server >= 2);
  }

  /**
   * Return the winner of the current standard game (server or returner).
   */
  private getNormalGameWinner(): 'server' | 'returner' | undefined {
    const game = this.score.currentGame;
    if (game.server >= 4 && game.server - game.returner >= 2) return 'server';
    if (game.returner >= 4 && game.returner - game.server >= 2) return 'returner';
    return undefined;
  }

  /**
   * Increment the game count in the current set for the given player.
   */
  private addGameToCurrentSet(winner: 'player' | 'opponent'): void {
    const currentSet = this.getCurrentSet();
    if (winner === 'player') {
      currentSet.player++;
    } else {
      currentSet.opponent++;
    }
  }

  /**
   * Check if the current set has been won through standard play (no tiebreak).
   *
   * ITF Rule 27: A set is won by reaching 6 games with a 2-game lead, OR by
   * winning a 7th game at 6-5 (making it 7-5). Without tiebreaks, sets
   * continue past 6-6 until one player leads by 2 games (advantage set format).
   *
   * The single condition (gamesPerSet + at least 2-game lead) covers all cases:
   * 6-0, 6-1, 6-2, 6-3, 6-4, 7-5, 8-6, 9-7, etc.
   */
  private isNormalSetComplete(): boolean {
    const currentSet = this.getCurrentSet();
    const gamesPerSet = this.score.matchFormat.gamesPerSet;
    return (currentSet.player >= gamesPerSet && currentSet.player - currentSet.opponent >= 2) ||
           (currentSet.opponent >= gamesPerSet && currentSet.opponent - currentSet.player >= 2);
  }

  /**
   * Return the winner of the current set under standard completion conditions.
   */
  private getNormalSetWinner(): 'player' | 'opponent' | undefined {
    const currentSet = this.getCurrentSet();
    const gamesPerSet = this.score.matchFormat.gamesPerSet;
    if (currentSet.player >= gamesPerSet && currentSet.player - currentSet.opponent >= 2) return 'player';
    if (currentSet.opponent >= gamesPerSet && currentSet.opponent - currentSet.player >= 2) return 'opponent';
    return undefined;
  }

  /**
   * Mark the current set as complete and either end the match or start a new set.
   * Accepts an optional override winner (used when completing via tiebreak).
   */
  private completeCurrentSet(overrideWinner?: 'player' | 'opponent'): void {
    const currentSet = this.getCurrentSet();
    const setWinner = overrideWinner ?? this.getNormalSetWinner();

    if (!setWinner) return;

    currentSet.winner = setWinner;
    currentSet.isComplete = true;

    if (this.isMatchNowComplete()) {
      this.score.isMatchComplete = true;
      this.score.winner = this.getMatchWinner();
    } else {
      // Start a fresh set
      this.score.sets.push({
        player: 0,
        opponent: 0,
        winner: undefined,
        isComplete: false,
      });
    }
  }

  // =======================
  // TIEBREAK SCORING
  // =======================

  /**
   * Determine whether a tiebreak should be started.
   *
   * ITF Rule 27 Appendix: A tiebreak game is played when both players have won
   * the same number of games equal to the configured tiebreakAt value (usually 6).
   */
  private shouldStartTiebreak(): boolean {
    if (!this.score.matchFormat.enableTiebreaks) return false;
    const currentSet = this.getCurrentSet();
    return currentSet.player === this.score.matchFormat.tiebreakAt &&
           currentSet.opponent === this.score.matchFormat.tiebreakAt;
  }

  /**
   * Begin a tiebreak game.
   *
   * ITF Rule 27 Appendix: "The player whose turn it is to serve shall be the
   * first server in the tiebreak game." The current server (already switched
   * after the last regular game) is the correct tiebreak first server.
   */
  private initializeTiebreak(): void {
    this.tiebreakFirstServer = this.score.currentServer;
    this.tiebreakPointsPlayed = 0;
    this.score.isTiebreak = true;
    this.score.currentTiebreak = { player: 0, opponent: 0 };
  }

  /**
   * Record a point in a tiebreak game (numeric scoring: 1, 2, 3...).
   *
   * ITF Rule 27 Appendix:
   * - Points are counted numerically, not with Love/15/30/40
   * - First to 7 points with a 2-point minimum lead wins the tiebreak
   * - If tied at 6-6, play continues until one player leads by 2
   */
  private addPointToTiebreak(winner: 'player' | 'opponent'): void {
    const tb = this.score.currentTiebreak!;

    if (winner === 'player') {
      tb.player++;
    } else {
      tb.opponent++;
    }

    this.tiebreakPointsPlayed++;

    // Update server for next point per tiebreak rotation (may be overwritten by completeTiebreak)
    this.updateTiebreakServer();

    // Check for tiebreak completion
    if (this.isTiebreakComplete()) {
      this.completeTiebreak();
    }
  }

  /**
   * Update the server for the next tiebreak point per the ITF rotation rules.
   *
   * ITF Rule 27 Appendix - Service order in tiebreak:
   * The first server serves 1 point. Thereafter, each player serves 2 consecutive
   * points, alternating throughout the tiebreak.
   *
   * Pattern (1-indexed points): A(1), B(2-3), A(4-5), B(6-7), A(8-9), ...
   *
   * After n points have been played, the next server is:
   *   n=0  → first server (tiebreak hasn't started; guarded by caller)
   *   n=1  → second server (block 0: points 2-3)
   *   n=2  → second server (still in block 0)
   *   n=3  → first server  (block 1: points 4-5)
   *   n=4  → first server  (still in block 1)
   *   n=5  → second server (block 2: points 6-7)
   *   ... and so on, alternating every 2 points after the first.
   */
  private updateTiebreakServer(): void {
    const firstServer = this.tiebreakFirstServer!;
    const secondServer: 'player' | 'opponent' = firstServer === 'player' ? 'opponent' : 'player';
    const played = this.tiebreakPointsPlayed;

    if (played === 0) {
      this.score.currentServer = firstServer;
    } else {
      // After the first point, alternate every 2 points.
      // block 0 (played 1-2): second server
      // block 1 (played 3-4): first server
      // block 2 (played 5-6): second server
      // ...
      const block = Math.floor((played - 1) / 2);
      this.score.currentServer = block % 2 === 0 ? secondServer : firstServer;
    }
  }

  /**
   * Check if the tiebreak has been decided.
   * ITF Rule 27 Appendix: First to 7 points, must lead by at least 2.
   */
  private isTiebreakComplete(): boolean {
    const tb = this.score.currentTiebreak!;
    return (tb.player >= 7 && tb.player - tb.opponent >= 2) ||
           (tb.opponent >= 7 && tb.opponent - tb.player >= 2);
  }

  /**
   * Return the tiebreak winner once the tiebreak is complete.
   */
  private getTiebreakWinner(): 'player' | 'opponent' | undefined {
    const tb = this.score.currentTiebreak!;
    if (tb.player >= 7 && tb.player - tb.opponent >= 2) return 'player';
    if (tb.opponent >= 7 && tb.opponent - tb.player >= 2) return 'opponent';
    return undefined;
  }

  /**
   * Finalize a completed tiebreak and wrap up the set.
   *
   * ITF Rule 27 Appendix:
   * - The set score is recorded as 7-6 for the tiebreak winner
   * - The tiebreak score is saved on the set for display (e.g., "7-6(4)")
   * - "The player who served the first point of the tiebreak game shall
   *    receive service in the first game of the following set." This means
   *    the player who did NOT serve first in the tiebreak serves next.
   */
  private completeTiebreak(): void {
    const winner = this.getTiebreakWinner()!;
    const tb = this.score.currentTiebreak!;
    const currentSet = this.getCurrentSet();
    const tiebreakAt = this.score.matchFormat.tiebreakAt;

    // Save the tiebreak score on the set for display purposes
    currentSet.tiebreak = {
      player: tb.player,
      opponent: tb.opponent,
      winner,
    };

    // Set final game count: 7-6 for winner
    currentSet.player = winner === 'player' ? tiebreakAt + 1 : tiebreakAt;
    currentSet.opponent = winner === 'opponent' ? tiebreakAt + 1 : tiebreakAt;

    // Reset tiebreak state
    this.score.isTiebreak = false;
    this.score.currentTiebreak = undefined;
    this.score.currentGame = {
      server: 0,
      returner: 0,
      advantage: undefined,
      isDeuce: false,
    };

    // ITF Rule 27 Appendix: the first tiebreak server RECEIVES in the next set
    this.score.currentServer = this.tiebreakFirstServer === 'player' ? 'opponent' : 'player';

    // Clear tiebreak tracking state
    this.tiebreakFirstServer = null;
    this.tiebreakPointsPlayed = 0;

    // Complete the set (with explicit winner since set scores were set directly above)
    this.completeCurrentSet(winner);
  }

  // =======================
  // MATCH COMPLETION
  // =======================

  /**
   * Check if the required number of sets to win the match have been won.
   */
  private isMatchNowComplete(): boolean {
    const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
    const completedSets = this.score.sets.filter(s => s.isComplete);
    const playerSets = completedSets.filter(s => s.winner === 'player').length;
    const opponentSets = completedSets.filter(s => s.winner === 'opponent').length;
    return playerSets >= setsToWin || opponentSets >= setsToWin;
  }

  /**
   * Return the match winner if one has been determined.
   */
  private getMatchWinner(): 'player' | 'opponent' | undefined {
    const setsToWin = Math.ceil(this.score.matchFormat.bestOfSets / 2);
    const completedSets = this.score.sets.filter(s => s.isComplete);
    const playerSets = completedSets.filter(s => s.winner === 'player').length;
    const opponentSets = completedSets.filter(s => s.winner === 'opponent').length;
    if (playerSets >= setsToWin) return 'player';
    if (opponentSets >= setsToWin) return 'opponent';
    return undefined;
  }

  // =======================
  // SERVER MANAGEMENT
  // =======================

  /** Switch server after a standard game. */
  private switchServer(): void {
    this.score.currentServer = this.score.currentServer === 'player' ? 'opponent' : 'player';
  }

  /**
   * Convert player/opponent to server/returner based on who is currently serving.
   */
  private convertToServerReturner(winner: 'player' | 'opponent'): 'server' | 'returner' {
    return this.score.currentServer === winner ? 'server' : 'returner';
  }

  /**
   * Convert server/returner back to player/opponent based on who is currently serving.
   */
  private convertFromServerReturner(winner: 'server' | 'returner'): 'player' | 'opponent' {
    if (winner === 'server') return this.score.currentServer;
    return this.score.currentServer === 'player' ? 'opponent' : 'player';
  }

  /** Return a reference to the active set. */
  private getCurrentSet(): SetScore {
    return this.score.sets[this.score.sets.length - 1];
  }

  // =======================
  // PUBLIC INTERFACE
  // =======================

  /** Return a shallow copy of the current match score. */
  public getScore(): MatchScore {
    return { ...this.score };
  }

  /** Return the game count for the current set. */
  public getCurrentSetGames(): { player: number; opponent: number } {
    const currentSet = this.getCurrentSet();
    return { player: currentSet.player, opponent: currentSet.opponent };
  }

  /**
   * Return a human-readable score string.
   * During tiebreaks, shows numeric tiebreak score instead of 15-30-40.
   * Examples: "6-4, 30-15" | "6-6, Tiebreak 5-3" | "Match complete"
   */
  public getScoreString(): string {
    if (this.score.isMatchComplete) {
      return 'Match complete';
    }

    const currentSet = this.getCurrentSet();
    const playerGames = currentSet.player;
    const opponentGames = currentSet.opponent;

    let gameDisplay: string;

    if (this.score.isTiebreak && this.score.currentTiebreak) {
      // Tiebreak in progress: show numeric scores (ITF: points are "1, 2, 3...")
      const tb = this.score.currentTiebreak;
      gameDisplay = `Tiebreak ${tb.player}-${tb.opponent}`;
    } else {
      // Standard game: convert raw point counts to tennis notation
      const game = this.score.currentGame;
      const playerIsServer = this.score.currentServer === 'player';
      const playerPts = playerIsServer ? game.server : game.returner;
      const opponentPts = playerIsServer ? game.returner : game.server;

      if (game.isDeuce) {
        gameDisplay = 'Deuce';
      } else if (game.advantage) {
        // Show whose advantage it is from the player's perspective
        const advHolder = game.advantage === 'server'
          ? this.score.currentServer
          : (this.score.currentServer === 'player' ? 'opponent' : 'player');
        gameDisplay = advHolder === 'player' ? 'Ad-In' : 'Ad-Out';
      } else {
        const pts = ['0', '15', '30', '40'];
        gameDisplay = `${pts[Math.min(playerPts, 3)]}-${pts[Math.min(opponentPts, 3)]}`;
      }
    }

    return `${playerGames}-${opponentGames}, ${gameDisplay}`;
  }

  /** Return a score snapshot for progression tracking. */
  public getScoreSnapshot(): ScoreSnapshot {
    return {
      timestamp: Date.now(),
      gameScore: { ...this.score.currentGame },
      setScore: { ...this.getCurrentSet() },
      currentServer: this.score.currentServer,
      momentum: 0, // Filled in by MatchSimulator
    };
  }

  /** True once the match has been decided. */
  public isComplete(): boolean {
    return this.score.isMatchComplete;
  }

  /** Return the match winner, or undefined if not yet decided. */
  public getWinner(): 'player' | 'opponent' | undefined {
    return this.score.winner;
  }

  /** Set the initial server before the match begins. */
  public setInitialServer(server: 'player' | 'opponent'): void {
    this.score.currentServer = server;
  }

  /** Return who is currently serving. */
  public getCurrentServer(): 'player' | 'opponent' {
    return this.score.currentServer;
  }

  /** True when a tiebreak game is currently in progress. */
  public isInTiebreak(): boolean {
    return this.score.isTiebreak;
  }

  /**
   * Determine whether the current point is a key moment.
   *
   * Key moments include:
   * - Break point (returner one point from winning the game)
   * - Set point (winning this game would win the set)
   * - Tiebreak set point (winning this tiebreak point would win the set)
   *
   * Note: Deuce (40-40) is NOT a break point — advantage must be established first.
   */
  public isKeyMoment(): boolean {
    if (this.score.isTiebreak) {
      return this.isTiebreakKeyMoment();
    }

    const game = this.score.currentGame;
    const currentSet = this.getCurrentSet();
    const gamesPerSet = this.score.matchFormat.gamesPerSet;

    // Break point: returner is one point from winning the game.
    // Conditions: returner at 40 (3 pts) with server below 40, OR returner has advantage.
    // At Deuce (3-3), it is NOT yet a break point.
    if ((game.returner === 3 && game.server < 3) || game.advantage === 'returner') {
      return true;
    }

    // Set point: winning this game would win the current set for either player.
    // player_games + 1 >= gamesPerSet AND lead by 2 simplifies to:
    // player_games >= gamesPerSet - 1 AND player_games > opponent_games
    const playerSetPoint = currentSet.player >= gamesPerSet - 1 && currentSet.player > currentSet.opponent;
    const opponentSetPoint = currentSet.opponent >= gamesPerSet - 1 && currentSet.opponent > currentSet.player;
    if (playerSetPoint || opponentSetPoint) {
      return true;
    }

    return false;
  }

  /**
   * Check if the current tiebreak point is a key moment (set point in the tiebreak).
   *
   * A tiebreak set point exists when winning the next point would win the tiebreak:
   *   (player_pts + 1 >= 7) AND (player_pts + 1 - opponent_pts >= 2)
   *   Simplifies to: player_pts >= 6 AND player_pts > opponent_pts
   *
   * Examples: 6-4 → set point (next: 7-4, win by 3); 6-5 → set point (next: 7-5, win by 2)
   *           6-6 → NO set point yet (next: 7-6, margin only 1); 7-6 → set point (next: 8-6)
   */
  private isTiebreakKeyMoment(): boolean {
    const tb = this.score.currentTiebreak!;
    const playerSetPoint = tb.player >= 6 && tb.player > tb.opponent;
    const opponentSetPoint = tb.opponent >= 6 && tb.opponent > tb.player;
    return playerSetPoint || opponentSetPoint;
  }

  /**
   * Return which player currently has a break point opportunity, or undefined.
   *
   * A break point exists when the returner can win the current game with the next point:
   * - Returner at 40 (3 pts) with server at 30 or below (0-40, 15-40, 30-40)
   * - Returner has advantage after deuce
   *
   * Returns undefined during tiebreaks — there are no "break points" in tiebreaks
   * because both players alternate serving throughout.
   */
  public getBreakPointFor(): 'player' | 'opponent' | undefined {
    // No break points during tiebreaks (serving alternates every 1-2 points)
    if (this.score.isTiebreak) return undefined;

    const game = this.score.currentGame;

    if (this.score.currentServer === 'player') {
      // Player is serving; opponent (returner) breaks if they win game
      if ((game.returner === 3 && game.server < 3) || game.advantage === 'returner') {
        return 'opponent';
      }
    } else {
      // Opponent is serving; player (returner) breaks if they win game
      if ((game.returner === 3 && game.server < 3) || game.advantage === 'returner') {
        return 'player';
      }
    }

    return undefined;
  }

  /**
   * Reset the tracker for a new match (or re-use with a different format).
   */
  public reset(matchFormat?: MatchFormat): void {
    const format = matchFormat ?? this.score.matchFormat;
    this.score = this.createInitialScore(format);
    this.tiebreakFirstServer = null;
    this.tiebreakPointsPlayed = 0;
  }
}
