import { ShotCalculator } from './ShotCalculator.js';
import { ShotSelector } from './ShotSelector.js';
export class PointSimulator {
    shotCalculator;
    shotSelector;
    constructor() {
        this.shotCalculator = new ShotCalculator();
        this.shotSelector = new ShotSelector();
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
        let serverPosition = 'well_positioned';
        let returnerPosition = 'well_positioned';
        while (shotNumber - startingShotNumber < maxRallyLength) {
            const shooterProfile = currentShooter === 'server' ? server : returner;
            const opponentProfile = currentShooter === 'server' ? returner : server;
            const rallyLength = shotNumber - startingShotNumber + 1;
            const shooterPosition = currentShooter === 'server' ? serverPosition : returnerPosition;
            const opponentPosition = currentShooter === 'server' ? returnerPosition : serverPosition;
            const ballQuality = this.calculateBallQuality(previousShot);
            const rallyState = {
                rallyLength,
                lastShotQuality: previousShot?.quality ?? 50,
                lastShotType: previousShot?.shotType ?? 'serve_first',
                shooterPosition,
                opponentPosition,
                ballQuality,
            };
            const shotType = this.shotSelector.selectShot(shooterProfile, opponentProfile, rallyState, matchState);
            const shotContext = this.createRallyContext(rallyLength, matchState, shooterProfile);
            const tacticalOpportunity = this.evaluateTacticalOpportunity(rallyState);
            const shotResult = this.shotCalculator.calculateShotSuccess(shooterProfile, shotType, shotContext, opponentProfile, opponentPosition, previousShot ?? undefined, ballQuality, tacticalOpportunity);
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
            const newOpponentPosition = this.updateCourtPosition(shotResult, shotType, opponentPosition);
            if (currentShooter === 'server') {
                returnerPosition = newOpponentPosition;
            }
            else {
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
        else if (shotType.includes('power')) {
            spin = 'flat';
        }
        else {
            spin = 'topspin';
        }
        let timeAvailable;
        if (quality >= 80 || shotType.includes('power')) {
            timeAvailable = 'rushed';
        }
        else if (quality < 50 || shotType.includes('slice') || shotType.includes('lob')) {
            timeAvailable = 'plenty';
        }
        else {
            timeAvailable = 'normal';
        }
        const randomVariance = (Math.random() - 0.5) * 10;
        const baseQuality = Math.max(0, Math.min(100, quality + randomVariance));
        return {
            spin,
            timeAvailable,
            baseQuality,
        };
    }
    updateCourtPosition(shotResult, shotType, currentPosition) {
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
    evaluateTacticalOpportunity(rallyState) {
        const { opponentPosition, lastShotQuality, ballQuality } = rallyState;
        let attackScore = 0;
        if (opponentPosition === 'way_out_wide')
            attackScore += 40;
        if (opponentPosition === 'way_back_deep')
            attackScore += 35;
        if (opponentPosition === 'recovering')
            attackScore += 30;
        if (lastShotQuality >= 70)
            attackScore += 20;
        if (ballQuality.baseQuality < 50)
            attackScore += 15;
        const defensiveRequired = ballQuality.timeAvailable === 'rushed' ||
            ballQuality.baseQuality >= 80 ||
            opponentPosition === 'at_net';
        return {
            attackOpportunity: attackScore >= 60 ? 'high' : attackScore >= 35 ? 'medium' : 'low',
            netApproachSuitable: attackScore >= 40 && !defensiveRequired,
            winnerAttemptSuitable: attackScore >= 30 && !defensiveRequired,
            defensiveRequired,
            tacticalShotSuitable: !defensiveRequired,
            recommendedAggression: Math.min(100, attackScore),
        };
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
