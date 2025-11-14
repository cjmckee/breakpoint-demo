import { PointSimulator } from './PointSimulator.js';
import { ScoreTracker } from './ScoreTracker.js';
import { MatchStatistics } from './MatchStatistics.js';
export class MatchSimulator {
    pointSimulator;
    scoreTracker;
    matchStatistics;
    config;
    matchState;
    scoreProgression = [];
    pointResults = [];
    pointKeyMoments = [];
    startTime;
    constructor(config) {
        this.config = config;
        this.pointSimulator = new PointSimulator();
        this.scoreTracker = new ScoreTracker(config.matchFormat);
        this.matchStatistics = new MatchStatistics(config.player, config.opponent);
        const initialServer = config.initialServer || this.determineInitialServer();
        this.scoreTracker.setInitialServer(initialServer);
        this.matchState = this.createInitialMatchState();
        this.startTime = Date.now();
    }
    simulateMatch() {
        console.log(`🎾 Starting match: ${this.config.player.name} vs ${this.config.opponent.name}`);
        console.log(`📊 Player stats: ${this.config.player.overallRating} vs ${this.config.opponent.overallRating}`);
        let pointCount = 0;
        const maxPoints = 200;
        while (!this.scoreTracker.isComplete() && pointCount < maxPoints) {
            this.simulateNextPoint();
            pointCount++;
            this.updateMatchState();
            this.recordScoreSnapshot();
            const currentScore = this.scoreTracker.getScore();
            const setGames = this.scoreTracker.getCurrentSetGames();
            const playerIsServer = currentScore.currentServer === 'player';
            const playerPoints = playerIsServer ? currentScore.currentGame.server : currentScore.currentGame.returner;
            const opponentPoints = playerIsServer ? currentScore.currentGame.returner : currentScore.currentGame.server;
            const completedSets = currentScore.sets.filter(s => s.isComplete);
            const playerSets = completedSets.filter(set => set.winner === 'player').length;
            const opponentSets = completedSets.filter(set => set.winner === 'opponent').length;
            console.log(`📊 Score - Sets: ${playerSets}-${opponentSets} | Games: ${setGames.player}-${setGames.opponent} | Points: ${playerPoints}-${opponentPoints}`);
            this.applyStaminaCost();
            if (pointCount % 20 === 0) {
                console.log(`🎾 Point ${pointCount}: ${this.scoreTracker.getScoreString()}`);
            }
        }
        this.matchStatistics.finalizeStatistics();
        const matchResult = this.createMatchResult();
        console.log(`🏆 Match complete: ${matchResult.winner} wins ${matchResult.finalScore}`);
        console.log(`📈 Duration: ${matchResult.duration} minutes, ${pointCount} points played`);
        return matchResult;
    }
    simulateNextPoint() {
        const currentServer = this.scoreTracker.getCurrentServer();
        const serverProfile = currentServer === 'player' ? this.config.player : this.config.opponent;
        const returnerProfile = currentServer === 'player' ? this.config.opponent : this.config.player;
        const isKeyMomentBeforePoint = this.scoreTracker.isKeyMoment();
        const breakPointFor = this.scoreTracker.getBreakPointFor();
        this.matchState.isKeyMoment = isKeyMomentBeforePoint;
        const pointResult = this.pointSimulator.simulatePoint(currentServer, serverProfile, returnerProfile, this.matchState);
        this.pointResults.push(pointResult);
        this.pointKeyMoments.push(isKeyMomentBeforePoint);
        const pointWinner = this.convertPointWinner(pointResult.winner, currentServer);
        this.scoreTracker.addPoint(pointWinner);
        this.matchStatistics.addPointResult(pointResult, currentServer, breakPointFor);
        this.logPointResult(pointResult, currentServer, pointWinner);
    }
    convertPointWinner(pointWinner, currentServer) {
        if (pointWinner === 'server') {
            return currentServer;
        }
        return currentServer === 'player' ? 'opponent' : 'player';
    }
    updateMatchState() {
        this.matchState.score = this.scoreTracker.getScore();
        this.matchState.currentServer = this.scoreTracker.getCurrentServer();
        this.matchState.isKeyMoment = this.scoreTracker.isKeyMoment();
        this.matchState.pointsPlayed++;
        this.updateMomentum();
        this.updatePressure();
        const elapsed = (Date.now() - this.startTime) / (1000 * 60);
        this.matchState.matchLength = elapsed;
    }
    updateMomentum() {
        const recentPoints = this.pointResults.slice(-5);
        if (recentPoints.length === 0) {
            this.matchState.momentum = 0;
            return;
        }
        let playerPoints = 0;
        let opponentPoints = 0;
        recentPoints.forEach(pointResult => {
            const pointWinner = this.convertPointWinner(pointResult.winner, pointResult.server);
            if (pointWinner === 'player') {
                playerPoints++;
            }
            else {
                opponentPoints++;
            }
        });
        const totalPoints = playerPoints + opponentPoints;
        this.matchState.momentum = totalPoints > 0 ?
            ((playerPoints - opponentPoints) / totalPoints) * 100 : 0;
    }
    updatePressure() {
        if (this.matchState.isKeyMoment) {
            this.matchState.pressure = 'high';
        }
        else if (this.matchState.pointsPlayed > 30) {
            this.matchState.pressure = 'medium';
        }
        else {
            this.matchState.pressure = 'low';
        }
    }
    applyStaminaCost() {
        const matchLength = this.matchState.matchLength;
        if (matchLength > 30) {
            const staminaCost = Math.max(0, (matchLength - 30) / 10);
            const playerStaminaFactor = this.config.player.stats.physical.stamina / 100;
            const opponentStaminaFactor = this.config.opponent.stats.physical.stamina / 100;
            this.config.player.reduceEnergy(staminaCost * (1 - playerStaminaFactor));
            this.config.opponent.reduceEnergy(staminaCost * (1 - opponentStaminaFactor));
        }
    }
    recordScoreSnapshot() {
        const snapshot = this.scoreTracker.getScoreSnapshot();
        snapshot.momentum = this.matchState.momentum;
        this.scoreProgression.push(snapshot);
    }
    createInitialMatchState() {
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
    determineInitialServer() {
        return Math.random() < 0.5 ? 'player' : 'opponent';
    }
    createMatchResult() {
        const winner = this.scoreTracker.getWinner();
        const finalScore = this.scoreTracker.getScoreString();
        const duration = Math.round(this.matchState.matchLength);
        const statistics = this.matchStatistics.getStatistics();
        const playerPerformance = this.matchStatistics.getPlayerPerformance();
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
            pointResults: [],
            scoreProgression: this.scoreProgression,
            statistics,
            playerPerformance,
            opponentPerformance,
            summary,
        };
    }
    logPointResult(pointResult, currentServer, pointWinner) {
        const serverName = currentServer === 'player' ? this.config.player.name : this.config.opponent.name;
        const winnerName = pointWinner === 'player' ? this.config.player.name : this.config.opponent.name;
        const loserName = pointWinner === 'player' ? this.config.opponent.name : this.config.player.name;
        let resultMessage = '';
        if (pointResult.pointType === 'ace') {
            resultMessage = `${winnerName} serves an ace`;
        }
        else if (pointResult.pointType === 'double_fault') {
            resultMessage = `${loserName} double faults`;
        }
        else if (pointResult.pointType === 'winner') {
            resultMessage = `${winnerName} hits a winner`;
        }
        else if (pointResult.pointType === 'unforced_error') {
            resultMessage = `${loserName} makes an unforced error`;
        }
        else if (pointResult.pointType === 'forced_error') {
            resultMessage = `${loserName} makes a forced error`;
        }
        const serveIndicator = pointResult.serveType === 'second' ? ' [2nd serve]' : '';
        console.log(`🎾 Point: ${serverName} serving${serveIndicator} → ${resultMessage} (${pointResult.rallyLength} shots) - ${winnerName} wins`);
        if (pointResult.keyShot) {
            const keyShooter = pointResult.keyShot.shooter === 'server' ? serverName :
                (currentServer === 'player' ? this.config.opponent.name : this.config.player.name);
            console.log(`🔥 Key shot by ${keyShooter}: ${pointResult.keyShot.shotType} (${pointResult.keyShot.quality.toFixed(1)} quality, ${pointResult.keyShot.statUsed})`);
        }
    }
    getMatchState() {
        return { ...this.matchState };
    }
    getCurrentScore() {
        return this.scoreTracker.getScoreString();
    }
    isMatchComplete() {
        return this.scoreTracker.isComplete();
    }
    getStatistics() {
        return this.matchStatistics.getStatistics();
    }
    exportMatchData() {
        const winner = this.scoreTracker.getWinner();
        const finalScore = this.scoreTracker.getScoreString();
        const points = this.pointResults.map((pointResult, index) => {
            const { server, winner } = pointResult;
            const pointWinner = winner === 'server' ? server :
                (server === 'player' ? 'opponent' : 'player');
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
                statistics: pointResult.statistics,
                matchState: scoreSnapshot ? {
                    pressure: this.matchState.pressure,
                    momentum: scoreSnapshot.momentum,
                    isKeyMoment: this.pointKeyMoments[index] || false,
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
    static simulateMultipleMatches(config, numberOfMatches) {
        const results = [];
        console.log(`🎾 Simulating ${numberOfMatches} matches...`);
        for (let i = 0; i < numberOfMatches; i++) {
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
        const playerWins = results.filter(result => result.winner === 'player').length;
        const winPercentage = (playerWins / numberOfMatches) * 100;
        console.log(`🏆 Results: ${playerWins}/${numberOfMatches} wins (${winPercentage.toFixed(1)}%)`);
        return results;
    }
}
