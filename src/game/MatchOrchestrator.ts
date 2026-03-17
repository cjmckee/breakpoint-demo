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
import { KeyMomentResolver, KeyMomentResult, AppliedEffect } from './KeyMomentResolver';
import { getOptionsForSituation, KeyMomentType } from '../data/tacticalOptions';
import type { ArchetypeType } from '../data/archetypes';
import {
  KeyMoment,
  KeyMomentCallback,
  InteractiveMatchConfig,
  MatchScore,
  MatchState as KeyMomentMatchState,
} from '../types/keyMoments';
import { PlayerStats, Ability, StatBoosts } from '../types/game';
import { MatchStatistics as IMatchStatistics, MatchState, PointResult, PointType, PlayerMatchFatigue } from '../types';
import { AbilitySystem } from './AbilitySystem';
import { MATCH_FATIGUE, MOMENTUM_BANK, PRESSURE_BANK } from '../config/shotThresholds';
import { getMatchLevel, getQualityThresholds } from '../utils/qualityThresholds';
import { DEFAULT_KEY_MOMENTS_PER_MATCH } from '../config/matchRewards';

export interface AccumulatedMatchEffects {
  energyDelta: number;  // Net energy change from key moment choices
  moodDelta: number;    // Net mood change from key moment choices
}

export class MatchOrchestrator {
  private keyMomentsTriggered = 0;
  private pointsPlayed = 0;
  private recentPointWinners: Array<'player' | 'opponent'> = [];
  private momentum = 0;
  private momentumBank = 0; // Persistent momentum from events/shot quality (decays slowly)
  private pressure = 0;
  private pressureBank = 0; // Persistent pressure from key moment effects (decays slowly)
  private matchEnergy = 100; // Tracked mid-match, starts at config.energy
  private matchMood = 0; // Tracked mid-match, starts at config.mood
  private fatigue: PlayerMatchFatigue = { player: 0, opponent: 0 };
  private matchStatistics: MatchStatistics | null = null;
  private pointSimulator: PointSimulator | null = null;
  private cancelled = false;
  private playerStats: PlayerStats | null = null;
  private opponentStats: PlayerStats | null = null;
  private opponentArchetype: ArchetypeType = 'defensive';
  private accumulatedEffects: AccumulatedMatchEffects = { energyDelta: 0, moodDelta: 0 };

  /**
   * Apply flat stat boosts to player stats (clamped to 100).
   * Used for both ability and item boosts during match setup.
   */
  private applyStatBoosts(baseStats: PlayerStats, boosts: StatBoosts): PlayerStats {
    if (!boosts || Object.keys(boosts).length === 0) {
      return baseStats;
    }

    const boostedStats: PlayerStats = {
      technical: { ...baseStats.technical },
      physical: { ...baseStats.physical },
      mental: { ...baseStats.mental },
    };

    for (const [stat, boost] of Object.entries(boosts)) {
      if (!boost) continue;

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
   * Apply ability stat boosts to player stats.
   * Only applies during match - does not permanently modify player stats.
   */
  private applyAbilityBoosts(baseStats: PlayerStats, abilities?: Ability[]): PlayerStats {
    if (!abilities || abilities.length === 0) {
      return baseStats;
    }
    const totalBoosts = AbilitySystem.calculateTotalBoosts(abilities);
    return this.applyStatBoosts(baseStats, totalBoosts);
  }

  /**
   * Simulate an interactive match with key moments
   */
  async simulateInteractiveMatch(config: InteractiveMatchConfig): Promise<MatchScore> {
    // Store match format
    (this as any).matchFormat = config.matchFormat || 'best-of-3';

    // Apply ability and item boosts to player stats (only for the duration of the match)
    const playerStatsWithAbilities = this.applyAbilityBoosts(
      config.playerStats,
      config.playerAbilities
    );
    const playerStatsWithBoosts = config.itemBoosts
      ? this.applyStatBoosts(playerStatsWithAbilities, config.itemBoosts)
      : playerStatsWithAbilities;

    // Initialize match simulator with PlayerProfile objects
    const player = new PlayerProfile('player', 'Player', playerStatsWithBoosts);
    const opponent = new PlayerProfile('opponent', 'Opponent', config.opponentStats);

    // Compute opponent archetype from their stats
    this.opponentArchetype = opponent.playStyle.type;

    const matchLevel = getMatchLevel(player.overallRating, opponent.overallRating);
    const thresholds = getQualityThresholds(matchLevel);
    console.log(`🎾 Starting match: ${player.name} vs ${opponent.name}`);
    console.log(`📊 Player ratings: ${player.overallRating} vs ${opponent.overallRating} → matchLevel: ${matchLevel}`);
    console.log(`📏 Quality thresholds: exceptional=${thresholds.exceptional.toFixed(1)}, high=${thresholds.high.toFixed(1)}, good=${thresholds.good.toFixed(1)}, average=${thresholds.average.toFixed(1)}, weak=${thresholds.weak.toFixed(1)}`);

    const matchSim = new MatchSimulator({
      player,
      opponent,
      courtSurface: config.surface,
    });

    // Initialize statistics tracker
    this.matchStatistics = new MatchStatistics(player, opponent);
    this.pointSimulator = new PointSimulator();

    // Store stats for fatigue calculations
    this.playerStats = playerStatsWithBoosts;
    this.opponentStats = config.opponentStats;

    // Initialize fatigue from pre-match energy
    this.fatigue = {
      player: Math.max(0, (100 - (config.energy ?? 100)) * MATCH_FATIGUE.energyToFatigueFactor),
      opponent: 0,
    };

    // Initialize live energy/mood tracking
    this.matchEnergy = config.energy ?? 100;
    this.matchMood = config.mood ?? 0;
    this.accumulatedEffects = { energyDelta: 0, moodDelta: 0 };
    this.momentumBank = 0;
    this.pressureBank = 0;

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

        // Resolve key moment (use live energy/mood, not static config)
        const result = KeyMomentResolver.resolveKeyMoment(
          config.playerStats as PlayerStats,
          config.opponentStats as PlayerStats,
          selectedOption,
          this.opponentArchetype,
          {
            mood: this.matchMood,
            energy: this.matchEnergy,
            momentum: this.momentum,
            pressure: this.pressure,
          }
        );

        // Apply secondary effects to match state
        this.applySecondaryEffects(result.appliedEffects);

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

        // Update momentum based on outcome (use shot outcome point type)
        this.updateMomentum(result.pointWinner, result.shotOutcome.outcome);

        // Update fatigue (key moment rallies are ~3-5 shots)
        const kmPointResult = this.createPointResultFromKeyMoment(result, currentScore.server);
        this.updateMatchFatigue(kmPointResult.rallyLength);

        this.keyMomentsTriggered++;
      } else {
        // NORMAL SIMULATION
        // Use point simulator to determine point with full statistics
        const pointResult = this.simulatePointWithStats(matchSim, currentScore);
        const pointWinner = pointResult.winner === 'server'
          ? currentScore.server
          : (currentScore.server === 'player' ? 'opponent' : 'player');

        currentScore = this.updateScore(currentScore, pointWinner);

        // Update momentum and fatigue (pass actual point type for momentum events)
        this.updateMomentum(pointWinner, pointResult.pointType);
        this.updateMatchFatigue(pointResult.rallyLength);
      }

      this.pointsPlayed++;

      // Track deficit for comeback highlights
      if (this.matchStatistics) {
        this.matchStatistics.updateScoreState(currentScore.currentSet, currentScore.currentGame);
      }

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
    const maxKeyMoments = config.keyMomentsPerMatch ?? DEFAULT_KEY_MOMENTS_PER_MATCH;
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

    return {
      id: `km-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: momentType,
      situation: this.getSituationDescription(momentType, score),
      description: this.getKeyMomentDescription(momentType),
      options,
      timestamp: Date.now(),
      opponentArchetype: this.opponentArchetype,
      matchContext: {
        score: this.formatScore(score),
        server: score.server,
        momentum: this.momentum,
        pressure: this.pressure,
        energy: this.matchEnergy,
        mood: this.matchMood,
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
        physicalModifier: 1,
        mentalModifier: 1,
        difficultyModifier: 1,
        pressureModifier: 1,
        rallyLengthModifier: 1,
        finalAdjustment: 1,
        fatigueModifier: 1,
        momentumModifier: 1,
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
      fatigue: { ...this.fatigue },
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
   * Get accumulated energy/mood effects from key moment choices.
   * Used post-match to apply consequences to the game store.
   */
  public getAccumulatedEffects(): AccumulatedMatchEffects {
    return { ...this.accumulatedEffects };
  }

  /**
   * Cancel the ongoing match simulation
   */
  public cancelMatch(): void {
    this.cancelled = true;
  }

  /**
   * Apply secondary effects from a key moment to match state.
   * All 4 effect types now have real impact.
   */
  private applySecondaryEffects(effects: AppliedEffect[]): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'momentum':
          this.momentumBank = Math.max(-MOMENTUM_BANK.clamp, Math.min(MOMENTUM_BANK.clamp, this.momentumBank + effect.value));
          break;
        case 'pressure':
          this.pressureBank = Math.max(0, Math.min(PRESSURE_BANK.clamp, this.pressureBank + effect.value));
          break;
        case 'energy':
          this.matchEnergy = Math.max(0, Math.min(100, this.matchEnergy + effect.value));
          this.accumulatedEffects.energyDelta += effect.value;
          break;
        case 'mood':
          this.matchMood = Math.max(-100, Math.min(100, this.matchMood + effect.value));
          this.accumulatedEffects.moodDelta += effect.value;
          break;
      }
    }
  }

  /**
   * Update score after a point
   */
  private updateScore(score: MatchScore, winner: 'player' | 'opponent'): MatchScore {
    const newScore = { ...score, momentum: this.momentum, energy: this.matchEnergy };

    // Update current game
    if (winner === 'player') {
      newScore.currentGame.player++;
    } else {
      newScore.currentGame.opponent++;
    }

    // Normalize deuce: if both players had advantage-level scores and are now tied,
    // reset back to 3-3 (Deuce) so the scoreboard always shows 40-40 / Ad-In / Ad-Out
    const { player: gp, opponent: go } = newScore.currentGame;
    if (gp >= 3 && go >= 3 && gp === go) {
      newScore.currentGame = { player: 3, opponent: 3 };
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
   * Update momentum based on:
   * 1. Recent form (sliding window of last 5 points) — base component
   * 2. Shot quality events (aces, winners, UEs, DFs) — bump the momentum bank
   * 3. Persistent momentum bank from key moment secondary effects — decays slowly
   *
   * Final momentum = recentForm * 0.6 + momentumBank * 0.4
   */
  private updateMomentum(winner: 'player' | 'opponent', pointType: PointType | string): void {
    this.recentPointWinners.push(winner);
    if (this.recentPointWinners.length > 5) {
      this.recentPointWinners.shift();
    }

    // Component 1: Recent form (-100 to +100)
    const playerWins = this.recentPointWinners.filter(w => w === 'player').length;
    const opponentWins = this.recentPointWinners.filter(w => w === 'opponent').length;
    const total = this.recentPointWinners.length;
    const recentForm = total > 0 ? ((playerWins - opponentWins) / total) * 100 : 0;

    // Component 2: Shot quality events bump the momentum bank
    const isPlayerPoint = winner === 'player';
    const bump = MOMENTUM_BANK.bump;
    switch (pointType) {
      case PointType.ACE:
        this.momentumBank += isPlayerPoint ? bump.ace : -bump.ace;
        break;
      case PointType.WINNER:
        this.momentumBank += isPlayerPoint ? bump.winner : -bump.winner;
        break;
      case PointType.DOUBLE_FAULT:
        this.momentumBank += isPlayerPoint ? bump.doubleFault : -bump.doubleFault;
        break;
      case PointType.UNFORCED_ERROR:
        this.momentumBank += isPlayerPoint ? bump.unforcedError : -bump.unforcedError;
        break;
      case PointType.FORCED_ERROR:
        this.momentumBank += isPlayerPoint ? bump.forcedError : -bump.forcedError;
        break;
    }

    // Clamp momentum bank
    this.momentumBank = Math.max(-MOMENTUM_BANK.clamp, Math.min(MOMENTUM_BANK.clamp, this.momentumBank));

    // Decay momentum bank toward 0
    this.momentumBank *= MOMENTUM_BANK.decay;

    // Blend: recent form + persistent bank
    this.momentum = Math.max(-100, Math.min(100,
      recentForm * MOMENTUM_BANK.blendRecent + this.momentumBank * MOMENTUM_BANK.blendBank
    ));
  }

  /**
   * Update fatigue for both players after a point
   */
  private updateMatchFatigue(rallyLength: number): void {
    if (!this.playerStats || !this.opponentStats) return;

    this.fatigue.player = this.calculateNewFatigue(
      this.fatigue.player,
      rallyLength,
      this.playerStats.physical.stamina,
      this.playerStats.physical.recovery
    );

    this.fatigue.opponent = this.calculateNewFatigue(
      this.fatigue.opponent,
      rallyLength,
      this.opponentStats.physical.stamina,
      this.opponentStats.physical.recovery
    );
  }

  /**
   * Calculate new fatigue value after a point
   */
  private calculateNewFatigue(
    currentFatigue: number,
    rallyLength: number,
    staminaStat: number,
    recoveryStat: number
  ): number {
    const staminaFactor = MATCH_FATIGUE.minFatigueRate +
      (1 - MATCH_FATIGUE.minFatigueRate) * (1 - staminaStat / 100);

    let fatigueGain = rallyLength * MATCH_FATIGUE.basePerShot * staminaFactor;

    if (rallyLength > MATCH_FATIGUE.longRallyThreshold) {
      fatigueGain += (rallyLength - MATCH_FATIGUE.longRallyThreshold) *
        MATCH_FATIGUE.longRallyExtra * staminaFactor;
    }

    const recovery = MATCH_FATIGUE.baseRecoveryPerPoint +
      (recoveryStat / 100) * (MATCH_FATIGUE.maxRecoveryPerPoint - MATCH_FATIGUE.baseRecoveryPerPoint);

    return Math.max(0, Math.min(100, currentFatigue + fatigueGain - recovery));
  }

  /**
   * Update pressure based on match situation + persistent pressure bank.
   * Score-based pressure is the base; pressure bank from key moment effects layers on top.
   */
  private updatePressure(score: MatchScore): void {
    const gameScore = score.currentGame;
    const setScore = score.currentSet;

    let scorePressure = 30; // Base pressure

    // Close game scores increase pressure
    const gameDiff = Math.abs(gameScore.player - gameScore.opponent);
    if (gameDiff <= 1 && (gameScore.player >= 3 || gameScore.opponent >= 3)) {
      scorePressure += 20;
    }

    // Close set scores increase pressure
    const setDiff = Math.abs(setScore.player - setScore.opponent);
    if (setDiff <= 1 && (setScore.player >= 4 || setScore.opponent >= 4)) {
      scorePressure += 30;
    }

    // Late in match
    if (score.sets.length >= 1) {
      scorePressure += 20;
    }

    // Decay pressure bank slowly
    this.pressureBank *= PRESSURE_BANK.decay;

    // Final pressure = score-based + persistent bank from key moment effects
    this.pressure = Math.min(100, scorePressure + this.pressureBank);
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
    const { player, opponent } = game;
    // Standard game: first to 4, but must win by 2 after deuce (3-3+)
    if (player >= 4 && player - opponent >= 2) return true;
    if (opponent >= 4 && opponent - player >= 2) return true;
    return false;
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
      momentum: 0,
      energy: this.matchEnergy,
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
    if (game.player < 3 || game.opponent < 3) {
      return `${points[game.player]}-${points[game.opponent]}`;
    }
    // Both players have 3+ points (40-40 territory)
    if (game.player === game.opponent) return 'Deuce';
    if (game.player > game.opponent) return 'Ad-In';
    return 'Ad-Out';
  }

  private getSituationDescription(type: KeyMomentType, score: MatchScore): string {
    const game = this.formatGameScore(score.currentGame);
    const typeMap: Record<KeyMomentType, string> = {
      'break-point-serve': `Break Point Against - ${game}`,
      'break-point-return': `Break Point For You - ${game}`,
      'set-point-player-serve': `Set Point - Your Serve - ${game}`,
      'set-point-player-return': `Set Point - Your Return - ${game}`,
      'set-point-opponent-serve': `Set Point Against - Your Serve - ${game}`,
      'set-point-opponent-return': `Set Point Against - Your Return - ${game}`,
      'match-point-player-serve': `MATCH POINT - Your Serve! - ${game}`,
      'match-point-player-return': `MATCH POINT - Your Return! - ${game}`,
      'match-point-opponent-serve': `Match Point Against - Your Serve! - ${game}`,
      'match-point-opponent-return': `Match Point Against - Your Return! - ${game}`,
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
