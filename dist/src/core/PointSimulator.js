import { ShotCalculator } from './ShotCalculator.js';
export class PointSimulator {
    shotCalculator;
    constructor() {
        this.shotCalculator = new ShotCalculator();
    }
    simulatePoint(server, returner, matchState) {
        const shots = [];
        const pointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let shotNumber = 1;
        const serveResult = this.simulateServe(server, returner, matchState, pointId, shotNumber);
        shots.push(...serveResult.shots);
        shotNumber += serveResult.shots.length;
        if (serveResult.pointEnded) {
            return this.createPointResult(serveResult.winner, shots, serveResult.pointType, matchState, serveResult.serveType);
        }
        const rallyResult = this.simulateRally(server, returner, matchState, pointId, shotNumber, serveResult.nextShooter);
        shots.push(...rallyResult.shots);
        const winner = rallyResult.winner;
        const pointType = rallyResult.pointType;
        return this.createPointResult(winner, shots, pointType, matchState, serveResult.serveType);
    }
    simulateServe(server, returner, matchState, pointId, shotNumber) {
        const shots = [];
        const firstServeContext = this.createServeContext(matchState, true);
        const firstServeResult = this.shotCalculator.calculateShotSuccess(server, 'serve_first', firstServeContext);
        if (firstServeResult.outcome === 'winner') {
            const firstServeShot = {
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
            };
            shots.push(firstServeShot);
            return {
                shots,
                pointEnded: true,
                winner: 'server',
                pointType: 'ace',
                serveType: 'first',
            };
        }
        if (firstServeResult.outcome === 'in_play') {
            const firstServeShot = {
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
            };
            shots.push(firstServeShot);
            return {
                shots,
                pointEnded: false,
                nextShooter: 'returner',
                serveType: 'first',
            };
        }
        const secondServeContext = this.createServeContext(matchState, false);
        const secondServeResult = this.shotCalculator.calculateShotSuccess(server, 'serve_second', secondServeContext);
        const secondServeShot = {
            shotType: 'serve_second',
            shooter: 'server',
            success: secondServeResult.success,
            quality: secondServeResult.quality,
            outcome: secondServeResult.outcome,
            statUsed: secondServeResult.statUsed,
            modifiers: secondServeResult.modifiers,
            timestamp: Date.now(),
            shotNumber: 1,
            context: secondServeContext,
        };
        shots.push(secondServeShot);
        if (secondServeResult.outcome === 'winner') {
            return {
                shots,
                pointEnded: true,
                winner: 'server',
                pointType: 'ace',
                serveType: 'second',
            };
        }
        if (secondServeResult.outcome === 'error') {
            return {
                shots,
                pointEnded: true,
                winner: 'returner',
                pointType: 'double_fault',
                serveType: 'second',
            };
        }
        return {
            shots,
            pointEnded: false,
            nextShooter: 'returner',
            serveType: 'second',
        };
    }
    simulateRally(server, returner, matchState, pointId, startingShotNumber, firstShooter) {
        const shots = [];
        let currentShooter = firstShooter;
        let shotNumber = startingShotNumber;
        let previousShot = null;
        const maxRallyLength = 30;
        while (shotNumber - startingShotNumber < maxRallyLength) {
            const shooterProfile = currentShooter === 'server' ? server : returner;
            const rallyLength = shotNumber - startingShotNumber + 1;
            const shotType = this.selectShotType(shooterProfile, rallyLength, matchState);
            const shotContext = this.createRallyContext(rallyLength, matchState, shooterProfile);
            const shotResult = this.shotCalculator.calculateShotSuccess(shooterProfile, shotType, shotContext);
            let errorType;
            if (shotResult.outcome === 'error') {
                errorType = this.classifyError(previousShot, shotContext);
            }
            const shotDetail = {
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
            };
            shots.push(shotDetail);
            if (shotResult.outcome === 'winner') {
                return {
                    shots,
                    winner: currentShooter,
                    pointType: 'winner',
                };
            }
            if (shotResult.outcome === 'error') {
                const opponent = currentShooter === 'server' ? 'returner' : 'server';
                const pointType = errorType === 'forced' ? 'forced_error' : 'unforced_error';
                return {
                    shots,
                    winner: opponent,
                    pointType,
                };
            }
            previousShot = shotDetail;
            currentShooter = currentShooter === 'server' ? 'returner' : 'server';
            shotNumber++;
        }
        const winner = server.stats.physical.stamina >= returner.stats.physical.stamina ? 'server' : 'returner';
        return {
            shots,
            winner,
            pointType: 'forced_error',
        };
    }
    classifyError(previousShot, currentContext) {
        if (!previousShot) {
            return 'unforced';
        }
        if (previousShot.quality >= 70 || currentContext.difficulty === 'hard' || currentContext.difficulty === 'extreme') {
            return 'forced';
        }
        if ((currentContext.difficulty === 'easy' || currentContext.difficulty === 'normal') && previousShot.quality < 60) {
            return 'unforced';
        }
        return previousShot.quality >= 65 ? 'forced' : 'unforced';
    }
    createServeContext(matchState, isFirstServe) {
        const difficulty = isFirstServe ? 'normal' : 'hard';
        let pressure = 'low';
        if (matchState.isKeyMoment) {
            pressure = 'high';
        }
        else if (matchState.pressure === 'medium' || matchState.pressure === 'high') {
            pressure = 'medium';
        }
        return {
            difficulty,
            pressure,
            courtPosition: 'baseline',
            rallyLength: 1,
            opponentPosition: 'good',
            timeAvailable: 'plenty',
            ballHeight: 'medium',
            ballSpeed: 'medium',
        };
    }
    createRallyContext(rallyLength, matchState, shooterProfile) {
        let difficulty;
        if (rallyLength <= 3) {
            difficulty = 'easy';
        }
        else if (rallyLength <= 8) {
            difficulty = 'normal';
        }
        else if (rallyLength <= 15) {
            difficulty = 'hard';
        }
        else {
            difficulty = 'extreme';
        }
        let pressure = 'low';
        if (matchState.isKeyMoment) {
            pressure = 'high';
        }
        else if (rallyLength > 10) {
            pressure = 'medium';
        }
        let courtPosition = 'baseline';
        if (shooterProfile.playStyle.netApproach > 70 && rallyLength >= 3) {
            courtPosition = 'net';
        }
        else if (rallyLength > 12) {
            courtPosition = 'defensive';
        }
        let timeAvailable = 'normal';
        if (rallyLength > 15) {
            timeAvailable = 'rushed';
        }
        else if (rallyLength < 4) {
            timeAvailable = 'plenty';
        }
        return {
            difficulty,
            pressure,
            courtPosition,
            rallyLength,
            opponentPosition: 'good',
            timeAvailable,
            ballHeight: 'medium',
            ballSpeed: 'medium',
        };
    }
    selectShotType(shooterProfile, rallyLength, matchState) {
        const playStyle = shooterProfile.playStyle;
        if (rallyLength === 1) {
            if (playStyle.aggression > 70) {
                return Math.random() < 0.5 ? 'return_forehand_power' : 'return_backhand_power';
            }
            return Math.random() < 0.5 ? 'return_forehand' : 'return_backhand';
        }
        if (rallyLength <= 4) {
            if (playStyle.aggression > 80 && Math.random() < 0.3) {
                return Math.random() < 0.5 ? 'forehand_power' : 'backhand_power';
            }
            if (playStyle.netApproach > 70 && Math.random() < 0.4) {
                return Math.random() < 0.5 ? 'forehand_approach' : 'backhand_approach';
            }
            return Math.random() < 0.6 ? 'forehand' : 'backhand';
        }
        if (rallyLength <= 10) {
            if (playStyle.netApproach > 60 && Math.random() < 0.3) {
                return Math.random() < 0.5 ? 'volley_forehand' : 'volley_backhand';
            }
            if (shooterProfile.stats.mental.shot_variety > 70 && Math.random() < 0.2) {
                const isForehand = Math.random() < 0.5;
                const tacticalShots = isForehand
                    ? ['drop_shot_forehand', 'lob_forehand', 'angle_shot_forehand']
                    : ['drop_shot_backhand', 'lob_backhand', 'angle_shot_backhand'];
                return tacticalShots[Math.floor(Math.random() * tacticalShots.length)];
            }
            if (playStyle.aggression > 60 && Math.random() < 0.25) {
                return Math.random() < 0.5 ? 'forehand_power' : 'backhand_power';
            }
            return Math.random() < 0.5 ? 'forehand' : 'backhand';
        }
        if (rallyLength > 15 && Math.random() < 0.3) {
            const isForehand = Math.random() < 0.5;
            return Math.random() < 0.5
                ? (isForehand ? 'defensive_slice_forehand' : 'defensive_slice_backhand')
                : (isForehand ? 'lob_forehand' : 'lob_backhand');
        }
        if (playStyle.consistency > 60) {
            return Math.random() < 0.5 ? 'slice_forehand' : 'slice_backhand';
        }
        return Math.random() < 0.5 ? 'forehand' : 'backhand';
    }
    createPointResult(winner, shots, pointType, matchState, serveType) {
        const rallyLength = shots.length;
        const keyShot = this.identifyKeyShot(shots);
        const statistics = this.calculatePointStatistics(shots);
        const baseDuration = shots.length * 2.5;
        const rallyCostMultiplier = rallyLength > 10 ? 1.5 : 1.0;
        const duration = Math.round(baseDuration * rallyCostMultiplier);
        return {
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
    identifyKeyShot(shots) {
        const winnerShot = shots.find(shot => shot.outcome === 'winner');
        if (winnerShot)
            return winnerShot;
        const lastShot = shots[shots.length - 1];
        if (lastShot && lastShot.outcome === 'error') {
            return lastShot;
        }
        return shots.reduce((best, current) => current.quality > best.quality ? current : best);
    }
    calculatePointStatistics(shots) {
        const totalShots = shots.length;
        const winnerCount = shots.filter(shot => shot.outcome === 'winner').length;
        const errorCount = shots.filter(shot => shot.outcome === 'error').length;
        const netApproaches = shots.filter(shot => shot.shotType.includes('volley') ||
            shot.shotType.includes('approach')).length;
        const rallyExchanges = Math.max(0, totalShots - 2);
        const pressureMoments = shots.filter(shot => shot.context.pressure === 'high' || shot.context.rallyLength > 10).length;
        const shotCounts = shots.reduce((counts, shot) => {
            counts[shot.shotType] = (counts[shot.shotType] || 0) + 1;
            return counts;
        }, {});
        const dominantShotEntry = Object.entries(shotCounts).reduce((dominant, [shotType, count]) => count > dominant[1] ? [shotType, count] : dominant, ['', 0]);
        const dominantShot = dominantShotEntry[0];
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
