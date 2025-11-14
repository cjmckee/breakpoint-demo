import { ShotCalculator } from './ShotCalculator.js';
import { ShotSelector } from './ShotSelector.js';
import { TacticalAnalyzer } from './TacticalAnalyzer.js';
export class PointSimulator {
    shotCalculator;
    shotSelector;
    tacticalAnalyzer;
    constructor() {
        this.shotCalculator = new ShotCalculator();
        this.shotSelector = new ShotSelector();
        this.tacticalAnalyzer = new TacticalAnalyzer();
    }
    simulatePoint(currentServer, server, returner, matchState) {
        const shots = [];
        const pointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let shotNumber = 1;
        const serveResult = this.simulateServe(server, returner, matchState, pointId, shotNumber);
        shots.push(...serveResult.shots);
        shotNumber += serveResult.shots.length;
        if (serveResult.pointEnded) {
            return this.createPointResult(currentServer, serveResult.winner, shots, serveResult.pointType, matchState, serveResult.serveType);
        }
        const rallyResult = this.simulateRally(shots[0], server, returner, matchState, pointId, serveResult.nextShooter);
        shots.push(...rallyResult.shots);
        const winner = rallyResult.winner;
        const pointType = rallyResult.pointType;
        return this.createPointResult(currentServer, winner, shots, pointType, matchState, serveResult.serveType);
    }
    simulateServe(server, returner, matchState, pointId, shotNumber) {
        const shots = [];
        const firstServeContext = this.createServeContext(matchState, true);
        const firstServeResult = this.shotCalculator.calculateShotSuccess(server, 'serve_first', firstServeContext, returner, 'well_positioned', undefined);
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
                thresholds: firstServeResult.thresholds,
            };
            shots.push(firstServeShot);
            return {
                shots,
                pointEnded: true,
                winner: 'server',
                pointType: 'ace',
                serveType: 'first',
                quality: firstServeResult.quality,
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
                thresholds: firstServeResult.thresholds,
            };
            shots.push(firstServeShot);
            return {
                shots,
                pointEnded: false,
                nextShooter: 'returner',
                serveType: 'first',
                quality: firstServeResult.quality,
            };
        }
        const secondServeContext = this.createServeContext(matchState, false);
        const secondServeResult = this.shotCalculator.calculateShotSuccess(server, 'serve_second', secondServeContext, returner, 'well_positioned', undefined);
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
            thresholds: secondServeResult.thresholds,
        };
        shots.push(secondServeShot);
        if (secondServeResult.outcome === 'winner') {
            return {
                shots,
                pointEnded: true,
                winner: 'server',
                pointType: 'ace',
                serveType: 'second',
                quality: secondServeResult.quality,
            };
        }
        if (secondServeResult.outcome === 'error') {
            return {
                shots,
                pointEnded: true,
                winner: 'returner',
                pointType: 'double_fault',
                serveType: 'second',
                quality: secondServeResult.quality,
            };
        }
        return {
            shots,
            pointEnded: false,
            nextShooter: 'returner',
            serveType: 'second',
            quality: secondServeResult.quality,
        };
    }
    simulateRally(serveShot, server, returner, matchState, pointId, firstShooter) {
        const shots = [];
        let currentShooter = firstShooter;
        let shotNumber = 1;
        let previousShot = serveShot;
        const maxRallyLength = 30;
        let serverPosition = 'well_positioned';
        let returnerPosition = 'well_positioned';
        while (shotNumber < maxRallyLength) {
            const shooterProfile = currentShooter === 'server' ? server : returner;
            const opponentProfile = currentShooter === 'server' ? returner : server;
            const rallyLength = shotNumber;
            const shooterPosition = currentShooter === 'server' ? serverPosition : returnerPosition;
            const opponentPosition = currentShooter === 'server' ? returnerPosition : serverPosition;
            const ballQuality = this.calculateBallQuality(previousShot);
            const rallyState = {
                rallyLength,
                lastShotQuality: previousShot.quality,
                lastShotType: previousShot.shotType,
                shooterPosition,
                opponentPosition,
                ballQuality,
            };
            const shotType = this.shotSelector.selectShot(shooterProfile, opponentProfile, rallyState, matchState);
            const shotContext = this.createRallyContext(rallyLength, matchState, shooterPosition, rallyState.ballQuality, rallyState.opponentPosition);
            const tacticalOpportunity = this.tacticalAnalyzer.evaluateTacticalSituation(rallyState, shooterPosition);
            const shotResult = this.shotCalculator.calculateShotSuccess(shooterProfile, shotType, shotContext, opponentProfile, opponentPosition, previousShot, ballQuality, tacticalOpportunity);
            let errorType;
            if (shotResult.outcome === 'forced_error') {
                errorType = 'forced';
            }
            else if (shotResult.outcome === 'unforced_error') {
                errorType = 'unforced';
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
                thresholds: shotResult.thresholds,
            };
            shots.push(shotDetail);
            if (shotResult.outcome === 'winner') {
                return {
                    shots,
                    winner: currentShooter,
                    pointType: 'winner',
                };
            }
            if (shotResult.outcome === 'forced_error' || shotResult.outcome === 'unforced_error' || shotResult.outcome === 'error') {
                const opponent = currentShooter === 'server' ? 'returner' : 'server';
                const pointType = errorType === 'forced' ? 'forced_error' : 'unforced_error';
                return {
                    shots,
                    winner: opponent,
                    pointType,
                };
            }
            previousShot = shotDetail;
            const newOpponentPosition = this.updateOpponentPosition(shotResult, shotType, opponentPosition);
            const newShooterPosition = this.updateShooterPosition(shotResult, shotType, shooterPosition, rallyLength, previousShot.quality);
            if (currentShooter === 'server') {
                serverPosition = newShooterPosition;
                returnerPosition = newOpponentPosition;
            }
            else {
                returnerPosition = newShooterPosition;
                serverPosition = newOpponentPosition;
            }
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
        };
    }
    createRallyContext(rallyLength, matchState, shooterPosition, ballQuality, opponentPosition) {
        const difficulty = this.calculateShotDifficulty(shooterPosition, opponentPosition, ballQuality, rallyLength);
        let pressure = 'low';
        if (matchState.isKeyMoment) {
            pressure = 'high';
        }
        else if (rallyLength > 10) {
            pressure = 'medium';
        }
        let courtPosition = 'baseline';
        if (shooterPosition === 'at_net') {
            courtPosition = 'net';
        }
        else if (shooterPosition === 'way_back_deep' || rallyLength > 12) {
            courtPosition = 'defensive';
        }
        return {
            difficulty,
            pressure,
            courtPosition,
            rallyLength,
        };
    }
    calculateShotDifficulty(shooterPosition, opponentPosition, ballQuality, rallyLength) {
        let difficultyScore = 0;
        if (shooterPosition === 'way_out_wide' || shooterPosition === 'way_back_deep') {
            difficultyScore += 30;
        }
        else if (shooterPosition === 'recovering') {
            difficultyScore += 20;
        }
        else if (shooterPosition === 'slightly_off') {
            difficultyScore += 10;
        }
        if (ballQuality) {
            if (ballQuality.baseQuality >= 85) {
                difficultyScore += 25;
            }
            else if (ballQuality.baseQuality >= 70) {
                difficultyScore += 15;
            }
            if (ballQuality.timeAvailable === 'rushed') {
                difficultyScore += 20;
            }
            else if (ballQuality.timeAvailable === 'plenty') {
                difficultyScore -= 10;
            }
            if (ballQuality.spin === 'heavy_topspin') {
                difficultyScore += 10;
            }
        }
        if (opponentPosition === 'at_net') {
            difficultyScore += 25;
        }
        else if (opponentPosition === 'well_positioned') {
            difficultyScore += 5;
        }
        if (opponentPosition === 'way_out_wide' || opponentPosition === 'way_back_deep') {
            difficultyScore -= 15;
        }
        if (rallyLength && rallyLength > 15) {
            difficultyScore += 10;
        }
        else if (rallyLength && rallyLength > 10) {
            difficultyScore += 5;
        }
        if (difficultyScore < 0) {
            return 'easy';
        }
        else if (difficultyScore < 30) {
            return 'normal';
        }
        else if (difficultyScore < 60) {
            return 'hard';
        }
        else {
            return 'extreme';
        }
    }
    calculateBallQuality(previousShot) {
        if (!previousShot) {
            return {
                spin: 'flat',
                timeAvailable: 'normal',
                baseQuality: 50,
            };
        }
        const { shotType, quality, success } = previousShot;
        let spin;
        if (shotType.includes('slice') || shotType.includes('defensive_slice')) {
            spin = 'slice';
        }
        else if (shotType.includes('topspin') || shotType.includes('kick')) {
            spin = quality >= 70 ? 'heavy_topspin' : 'topspin';
        }
        else if (shotType.includes('power') || shotType.includes('serve_first')) {
            spin = 'flat';
        }
        else {
            spin = 'topspin';
        }
        let timeAvailable;
        if (shotType.includes('power') || shotType.includes('passing_shot')) {
            timeAvailable = quality >= 70 ? 'rushed' : 'normal';
        }
        else if (shotType.includes('lob')) {
            timeAvailable = 'plenty';
        }
        else if (shotType.includes('drop_shot')) {
            timeAvailable = 'plenty';
        }
        else if (shotType.includes('slice') || shotType.includes('defensive')) {
            timeAvailable = 'plenty';
        }
        else if (shotType.includes('approach') || shotType.includes('volley')) {
            timeAvailable = quality >= 70 ? 'rushed' : 'normal';
        }
        else if (quality >= 80) {
            timeAvailable = 'rushed';
        }
        else if (quality < 50) {
            timeAvailable = 'plenty';
        }
        else {
            timeAvailable = 'normal';
        }
        let qualityModifier = 0;
        if (shotType.includes('lob') && quality < 70)
            qualityModifier -= 5;
        if (shotType.includes('drop_shot') && quality < 60)
            qualityModifier -= 5;
        if (shotType.includes('angle') || shotType.includes('passing'))
            qualityModifier += 5;
        const randomVariance = (Math.random() - 0.5) * 10;
        const baseQuality = Math.max(0, Math.min(100, quality + randomVariance + qualityModifier));
        return {
            spin,
            timeAvailable,
            baseQuality,
        };
    }
    updateShooterPosition(shotResult, shotType, currentPosition, rallyLength, incomingQuality) {
        if (!shotResult.success)
            return currentPosition;
        if (shotType.includes('approach')) {
            return 'at_net';
        }
        if (shotType.includes('volley') || shotType.includes('overhead')) {
            return 'at_net';
        }
        if (shotType.includes('drop_shot') && shotResult.quality >= 60) {
            return 'recovering';
        }
        if (shotType.includes('defensive') || shotType.includes('lob')) {
            return 'way_back_deep';
        }
        if (incomingQuality >= 80) {
            return currentPosition === 'at_net' ? 'at_net' : 'slightly_off';
        }
        if (rallyLength > 12) {
            return currentPosition === 'at_net' ? 'at_net' : 'well_positioned';
        }
        if (shotResult.quality >= 70) {
            return currentPosition === 'at_net' ? 'at_net' : 'well_positioned';
        }
        if (shotResult.quality < 50) {
            return currentPosition === 'at_net' ? 'at_net' : 'slightly_off';
        }
        if (currentPosition === 'way_out_wide' || currentPosition === 'way_back_deep') {
            return 'recovering';
        }
        if (currentPosition === 'recovering') {
            return 'well_positioned';
        }
        return currentPosition;
    }
    updateOpponentPosition(shotResult, shotType, currentPosition) {
        if (!shotResult.success)
            return currentPosition;
        const quality = shotResult.quality;
        if (shotType.includes('approach') || shotType.includes('volley')) {
            return currentPosition;
        }
        if (quality >= 85) {
            if (shotType.includes('angle') || shotType.includes('passing')) {
                return 'way_out_wide';
            }
            if (shotType.includes('lob') || quality >= 90) {
                return 'way_back_deep';
            }
            return 'slightly_off';
        }
        if (quality >= 70) {
            return 'slightly_off';
        }
        if (quality < 50) {
            return 'well_positioned';
        }
        if (currentPosition === 'way_out_wide' || currentPosition === 'way_back_deep') {
            return 'recovering';
        }
        if (currentPosition === 'recovering') {
            return 'slightly_off';
        }
        return 'well_positioned';
    }
    createPointResult(server, winner, shots, pointType, matchState, serveType) {
        const rallyLength = shots.length;
        const keyShot = this.identifyKeyShot(shots);
        const statistics = this.calculatePointStatistics(shots);
        const baseDuration = shots.length * 2.5;
        const rallyCostMultiplier = rallyLength > 10 ? 1.5 : 1.0;
        const duration = Math.round(baseDuration * rallyCostMultiplier);
        return {
            server,
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
