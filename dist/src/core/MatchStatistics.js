export class MatchStatistics {
    statistics;
    pointResults = [];
    playerProfile;
    opponentProfile;
    breakPointOpportunities = { player: 0, opponent: 0 };
    firstServeAttempts = { player: 0, opponent: 0 };
    firstServesIn = { player: 0, opponent: 0 };
    secondServeAttempts = { player: 0, opponent: 0 };
    secondServesIn = { player: 0, opponent: 0 };
    constructor(playerProfile, opponentProfile) {
        this.playerProfile = playerProfile;
        this.opponentProfile = opponentProfile;
        this.statistics = this.createEmptyStatistics();
    }
    createEmptyStatistics() {
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
            shotTypeStats: {},
            statCorrelation: {},
        };
    }
    addPointResult(pointResult, currentServer, breakPointFor) {
        this.pointResults.push(pointResult);
        this.updateBasicStatistics(pointResult, currentServer);
        this.updateShotStatistics(pointResult.shots, pointResult.winner, currentServer);
        this.updateRallyStatistics(pointResult, currentServer);
        this.updateServiceStatistics(pointResult, currentServer);
        this.updateBreakPointStatistics(pointResult, currentServer, breakPointFor);
    }
    updateBasicStatistics(pointResult, currentServer) {
        const winner = this.convertPointWinnerToPlayer(pointResult.winner, currentServer);
        this.statistics.totalPoints[winner]++;
        if (pointResult.winner === 'server') {
            this.statistics.pointsWon[currentServer].serve++;
        }
        else {
            const returner = currentServer === 'player' ? 'opponent' : 'player';
            this.statistics.pointsWon[returner].return++;
        }
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
    updateShotStatistics(shots, pointWinner, currentServer) {
        let netApproachBy = undefined;
        shots.forEach(shot => {
            const player = shot.shooter === 'server' ? currentServer : (currentServer === 'player' ? 'opponent' : 'player');
            const shotType = shot.shotType;
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
            const stats = this.statistics.shotTypeStats[shotType];
            stats.attempts[player]++;
            if (shot.success) {
                stats.successful[player]++;
                if (shot.outcome === 'winner') {
                    stats.winners[player]++;
                }
            }
            else {
                stats.errors[player]++;
                if (shot.errorType === 'unforced') {
                    stats.unforcedErrors[player]++;
                }
                else if (shot.errorType === 'forced') {
                    stats.forcedErrors[player]++;
                }
            }
            if (this.isNetShot(shotType) && !netApproachBy) {
                netApproachBy = shot.shooter;
            }
        });
        if (netApproachBy && netApproachBy === pointWinner) {
            const player = netApproachBy === 'server' ? currentServer : (currentServer === 'player' ? 'opponent' : 'player');
            this.statistics.netPointsWon[player]++;
        }
    }
    updateRallyStatistics(pointResult, currentServer) {
        const rallyLength = pointResult.rallyLength;
        const totalPoints = this.pointResults.length;
        const currentAverage = this.statistics.averageRallyLength;
        this.statistics.averageRallyLength =
            (currentAverage * (totalPoints - 1) + rallyLength) / totalPoints;
        if (rallyLength > this.statistics.longestRally) {
            this.statistics.longestRally = rallyLength;
        }
        const winner = this.convertPointWinnerToPlayer(pointResult.winner, currentServer);
        const playerWonRallies = [];
        const opponentWonRallies = [];
        if (rallyLength > this.statistics.longestRallyWon[winner]) {
            this.statistics.longestRallyWon[winner] = rallyLength;
        }
        const wonCountPlayer = this.statistics.totalPoints.player;
        const wonCountOpponent = this.statistics.totalPoints.opponent;
        if (winner === 'player' && wonCountPlayer > 0) {
            const currentAvg = this.statistics.averageRallyLengthWon.player;
            this.statistics.averageRallyLengthWon.player =
                (currentAvg * (wonCountPlayer - 1) + rallyLength) / wonCountPlayer;
        }
        else if (winner === 'opponent' && wonCountOpponent > 0) {
            const currentAvg = this.statistics.averageRallyLengthWon.opponent;
            this.statistics.averageRallyLengthWon.opponent =
                (currentAvg * (wonCountOpponent - 1) + rallyLength) / wonCountOpponent;
        }
    }
    updateServiceStatistics(pointResult, currentServer) {
        const shots = pointResult.shots;
        if (shots.length === 0)
            return;
        this.firstServeAttempts[currentServer]++;
        const isFirstServeIn = pointResult.serveType === 'first';
        if (isFirstServeIn) {
            this.firstServesIn[currentServer]++;
        }
        if (pointResult.serveType === 'second') {
            const secondServeShot = shots.find(shot => shot.shotType === 'serve_second');
            const isSecondServeIn = secondServeShot.outcome !== 'error';
            this.secondServeAttempts[currentServer]++;
            if (isSecondServeIn) {
                this.secondServesIn[currentServer]++;
            }
            this.statistics.secondServePercentage[currentServer] =
                (this.secondServesIn[currentServer] / this.secondServeAttempts[currentServer]) * 100;
        }
        this.statistics.firstServePercentage[currentServer] =
            (this.firstServesIn[currentServer] / this.firstServeAttempts[currentServer]) * 100;
        if (pointResult.winner === 'server') {
            if (isFirstServeIn) {
                this.statistics.firstServePointsWon[currentServer]++;
            }
            else {
                this.statistics.secondServePointsWon[currentServer]++;
            }
        }
    }
    updateBreakPointStatistics(pointResult, currentServer, breakPointFor) {
        if (!breakPointFor)
            return;
        this.breakPointOpportunities[breakPointFor]++;
        this.statistics.breakPointOpportunities[breakPointFor]++;
        const pointWinner = this.convertPointWinnerToPlayer(pointResult.winner, currentServer);
        if (pointWinner === breakPointFor) {
            this.statistics.breakPointsConverted[breakPointFor]++;
        }
    }
    finalizeStatistics() {
        this.calculateStatCorrelation();
    }
    calculateStatCorrelation() {
        const playerStats = this.playerProfile.stats;
        const opponentStats = this.opponentProfile.stats;
        this.analyzeStatCorrelation('serve', playerStats.technical.serve, opponentStats.technical.serve);
        this.analyzeStatCorrelation('forehand', playerStats.technical.forehand, opponentStats.technical.forehand);
        this.analyzeStatCorrelation('backhand', playerStats.technical.backhand, opponentStats.technical.backhand);
        this.analyzeStatCorrelation('return', playerStats.technical.return, opponentStats.technical.return);
        this.analyzeStatCorrelation('focus', playerStats.mental.focus, opponentStats.mental.focus);
        this.analyzeStatCorrelation('stamina', playerStats.physical.stamina, opponentStats.physical.stamina);
    }
    analyzeStatCorrelation(statName, playerStatValue, opponentStatValue) {
        const statDifference = playerStatValue - opponentStatValue;
        const expectedAdvantage = statDifference / 100;
        let actualPerformance = 0;
        switch (statName) {
            case 'serve':
                actualPerformance = this.calculateServePerformance();
                break;
            case 'forehand':
                actualPerformance = this.calculateShotPerformance(['forehand', 'forehand_power', 'topspin_forehand']);
                break;
            case 'backhand':
                actualPerformance = this.calculateShotPerformance(['backhand', 'backhand_power', 'topspin_backhand']);
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
        const correlation = this.calculateCorrelation(expectedAdvantage, actualPerformance);
        this.statistics.statCorrelation[statName] = {
            expectedPerformance: expectedAdvantage,
            actualPerformance,
            correlation,
        };
    }
    calculateServePerformance() {
        const playerAces = this.statistics.aces.player;
        const opponentAces = this.statistics.aces.opponent;
        const playerDF = this.statistics.doubleFaults.player;
        const opponentDF = this.statistics.doubleFaults.opponent;
        const playerServePoints = this.statistics.pointsWon.player.serve;
        const opponentServePoints = this.statistics.pointsWon.opponent.serve;
        if (playerServePoints + opponentServePoints === 0)
            return 0;
        const playerServeSuccess = (playerAces - playerDF + playerServePoints) /
            Math.max(1, playerServePoints + opponentServePoints);
        return (playerServeSuccess - 0.5) * 2;
    }
    calculateShotPerformance(shotTypes) {
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
        if (totalAttempts === 0)
            return 0;
        const avgPlayerRate = playerSuccessRate / totalAttempts;
        const avgOpponentRate = opponentSuccessRate / totalAttempts;
        return (avgPlayerRate - avgOpponentRate);
    }
    calculateReturnPerformance() {
        const playerReturnPoints = this.statistics.pointsWon.player.return;
        const opponentReturnPoints = this.statistics.pointsWon.opponent.return;
        const totalReturnPoints = playerReturnPoints + opponentReturnPoints;
        if (totalReturnPoints === 0)
            return 0;
        return (playerReturnPoints / totalReturnPoints - 0.5) * 2;
    }
    calculatePressurePerformance() {
        const playerBreakPoints = this.statistics.breakPointsConverted.player;
        const opponentBreakPoints = this.statistics.breakPointsConverted.opponent;
        const totalBreakPoints = playerBreakPoints + opponentBreakPoints;
        if (totalBreakPoints === 0)
            return 0;
        return (playerBreakPoints / totalBreakPoints - 0.5) * 2;
    }
    calculateStaminaPerformance() {
        const longRallyPoints = this.pointResults.filter(point => point.rallyLength > 10);
        if (longRallyPoints.length === 0)
            return 0;
        const playerLongRallyWins = longRallyPoints.filter(point => this.convertPointWinnerToPlayer(point.winner, 'player') === 'player').length;
        return (playerLongRallyWins / longRallyPoints.length - 0.5) * 2;
    }
    calculateCorrelation(expected, actual) {
        const maxDifference = 2;
        const difference = Math.abs(expected - actual);
        return 1 - (difference / maxDifference);
    }
    getPlayerPerformance() {
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
    calculateCategoryPerformance(category) {
        const categoryStats = this.playerProfile.stats[category];
        const avgStat = Object.values(categoryStats).reduce((sum, val) => sum + val, 0) /
            Object.values(categoryStats).length;
        return avgStat;
    }
    calculateStatEffectiveness() {
        const stats = this.playerProfile.stats;
        const effectiveness = {};
        Object.keys(stats.technical).forEach(stat => {
            effectiveness[stat] = this.getStatEffectiveness(stat);
        });
        Object.keys(stats.physical).forEach(stat => {
            effectiveness[stat] = this.getStatEffectiveness(stat);
        });
        Object.keys(stats.mental).forEach(stat => {
            effectiveness[stat] = this.getStatEffectiveness(stat);
        });
        return effectiveness;
    }
    getStatEffectiveness(statName) {
        const correlation = this.statistics.statCorrelation[statName];
        if (!correlation)
            return 50;
        return Math.round(50 + (correlation.correlation * 50));
    }
    calculateNetPlaySuccess() {
        const playerNetPoints = this.statistics.netPointsWon.player;
        const opponentNetPoints = this.statistics.netPointsWon.opponent;
        const totalNetPoints = playerNetPoints + opponentNetPoints;
        if (totalNetPoints === 0)
            return 0;
        return (playerNetPoints / totalNetPoints) * 100;
    }
    generateMatchSummary(winner, finalScore) {
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
    calculateCompetitiveness() {
        const playerPoints = this.statistics.totalPoints.player;
        const opponentPoints = this.statistics.totalPoints.opponent;
        const totalPoints = playerPoints + opponentPoints;
        if (totalPoints === 0)
            return 'close';
        const pointDifference = Math.abs(playerPoints - opponentPoints) / totalPoints;
        if (pointDifference < 0.1)
            return 'very_close';
        if (pointDifference < 0.2)
            return 'close';
        if (pointDifference < 0.3)
            return 'comfortable';
        return 'dominant';
    }
    identifyKeyFactor() {
        if (this.statistics.aces.player > this.statistics.aces.opponent * 2)
            return 'serving';
        if (this.statistics.pointsWon.player.return > this.statistics.pointsWon.opponent.return * 1.5)
            return 'returning';
        if (this.statistics.errors.player < this.statistics.errors.opponent * 0.8)
            return 'consistency';
        if (this.statistics.winners.player > this.statistics.winners.opponent * 1.5)
            return 'power';
        if (this.statistics.breakPointsConverted.player > this.statistics.breakPointsConverted.opponent)
            return 'pressure';
        return 'fitness';
    }
    identifyBestStat() {
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
    identifyWorstStat() {
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
    generateRecommendations() {
        const recommendations = [];
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
    generateHighlights(finalScore) {
        const highlights = [];
        highlights.push(`Final Score: ${finalScore}`);
        if (this.statistics.aces.player > 5) {
            highlights.push(`${this.statistics.aces.player} aces served`);
        }
        if (this.statistics.longestRally > 15) {
            highlights.push(`Longest rally: ${this.statistics.longestRally} shots`);
        }
        return highlights;
    }
    convertPointWinnerToPlayer(pointWinner, currentServer) {
        if (pointWinner === 'server') {
            return currentServer;
        }
        return currentServer === 'player' ? 'opponent' : 'player';
    }
    isNetShot(shotType) {
        return shotType.includes('volley') || shotType.includes('half_volley');
    }
    getStatistics() {
        return { ...this.statistics };
    }
}
