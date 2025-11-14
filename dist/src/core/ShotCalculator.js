import { RELATIVE_QUALITY_REQUIREMENTS, MIN_QUALITY_FLOORS, MINIMUM_WINNER_THRESHOLDS, OUTCOME_MULTIPLIERS, SERVE_BASELINE, OPPONENT_STAT_ADJUSTMENTS, POSITION_ADJUSTMENTS, SERVE_VARIANCE, RETURN_VARIANCE, RALLY_SHOT_VARIANCE, SERVE_BONUSES, TOTAL_MODIFIER_CAPS, getShotCategory, } from '../config/shotThresholds.js';
const SHOT_RANGES = {
    pressureModifiers: {
        low: { min: 1.0, max: 1.05 },
        medium: { min: 0.75, max: 1.0 },
        high: { min: 0.4, max: 1.15 },
    },
    rallyLengthModifiers: {
        short: { min: 1.0, max: 1.0 },
        medium: { min: 0.90, max: 1.0 },
        long: { min: 0.80, max: 1.0 },
        extreme: { min: 0.75, max: 1.0 },
    },
};
const SHOT_CLASSIFICATIONS = {
    powerShots: ['serve_first', 'forehand_power', 'backhand_power', 'return_forehand_power', 'return_backhand_power', 'overhead', 'passing_shot_forehand', 'passing_shot_backhand'],
    spinShots: ['topspin_forehand', 'topspin_backhand', 'kick_serve', 'slice_forehand', 'slice_backhand'],
    placementShots: ['drop_shot_forehand', 'drop_shot_backhand', 'angle_shot_forehand', 'angle_shot_backhand', 'down_the_line_forehand', 'down_the_line_backhand', 'cross_court_forehand', 'cross_court_backhand', 'lob_forehand', 'lob_backhand', 'short_angle_forehand', 'short_angle_backhand'],
    netShots: ['volley_forehand', 'volley_backhand', 'half_volley_forehand', 'half_volley_backhand'],
    defensiveShots: ['defensive_slice_forehand', 'defensive_slice_backhand', 'defensive_overhead', 'return_forehand', 'return_backhand'],
};
export class ShotCalculator {
    calculateShotSuccess(shooterProfile, shotType, context, opponentProfile, opponentPosition, incomingShot, ballQuality, tacticalOpportunity) {
        console.log('Calculating shot success for', shotType);
        console.log('Incoming shot quality:', incomingShot?.quality);
        const primaryStat = shooterProfile.getStatForShot(shotType);
        const modifiers = this.calculateModifiers(shooterProfile, shotType, context, incomingShot, ballQuality, tacticalOpportunity, opponentPosition);
        const quality = this.applyModifiers(primaryStat, modifiers);
        let outcome;
        let thresholds;
        if (shotType.includes('serve')) {
            const serveOutcome = this.determineServeOutcome(quality, shotType, opponentProfile.stats.technical.return);
            outcome = serveOutcome.outcome;
            thresholds = serveOutcome.thresholds;
        }
        else {
            if (!incomingShot) {
                throw new Error('Incoming shot is required for non-serve shots to calculate quality thresholds.');
            }
            const incomingQuality = incomingShot.quality;
            thresholds = this.calculateQualityRequirements(incomingQuality, shotType, opponentProfile.stats, opponentPosition);
            outcome = this.determineOutcome(quality, thresholds);
        }
        console.log('Shot quality:', quality.toFixed(1), 'Outcome:', outcome);
        console.log('Quality thresholds:', thresholds);
        return {
            success: outcome === 'winner' || outcome === 'in_play',
            outcome,
            quality,
            shotType,
            statUsed: this.getPrimaryStatName(shotType),
            modifiers,
            thresholds,
        };
    }
    calculateQualityRequirements(incomingQuality, shotType, opponentStats, opponentPosition) {
        const baseMultiplier = RELATIVE_QUALITY_REQUIREMENTS[shotType];
        const baseRequirement = incomingQuality * baseMultiplier;
        const shotCategory = getShotCategory(shotType);
        const minFloor = MIN_QUALITY_FLOORS[shotCategory];
        let inPlayReq = Math.max(baseRequirement, minFloor);
        const defensiveAdj = (opponentStats.mental.defensive - 50) * OPPONENT_STAT_ADJUSTMENTS.defensive;
        inPlayReq += defensiveAdj;
        const speedAdj = (opponentStats.physical.speed - 50) * OPPONENT_STAT_ADJUSTMENTS.speed;
        inPlayReq += speedAdj;
        const positionAdj = POSITION_ADJUSTMENTS[opponentPosition];
        inPlayReq += positionAdj;
        const multipliers = OUTCOME_MULTIPLIERS[shotCategory];
        const calculatedWinner = inPlayReq * multipliers.winner;
        const winnerThreshold = Math.max(calculatedWinner, MINIMUM_WINNER_THRESHOLDS[shotCategory]);
        return {
            winner: winnerThreshold,
            inPlay: inPlayReq * multipliers.inPlay,
            forcedError: inPlayReq * multipliers.forcedError,
        };
    }
    determineOutcome(quality, thresholds) {
        if (quality >= thresholds.winner)
            return 'winner';
        if (quality >= thresholds.inPlay)
            return 'in_play';
        if (quality >= thresholds.forcedError)
            return 'forced_error';
        return 'unforced_error';
    }
    determineServeOutcome(serveQuality, serveType, opponentReturnStat) {
        const baseline = SERVE_BASELINE[serveType];
        const serveIn = serveQuality >= baseline.inPlayThreshold;
        if (!serveIn) {
            return {
                outcome: 'error',
                thresholds: {
                    winner: opponentReturnStat * baseline.aceMultiplier,
                    inPlay: baseline.inPlayThreshold,
                    forcedError: 0,
                },
            };
        }
        const aceThreshold = opponentReturnStat * baseline.aceMultiplier;
        const isAce = serveQuality >= aceThreshold;
        return {
            outcome: isAce ? 'winner' : 'in_play',
            thresholds: {
                winner: aceThreshold,
                inPlay: baseline.inPlayThreshold,
                forcedError: 0,
            },
        };
    }
    calculateModifiers(shooterProfile, shotType, context, incomingShot, ballQuality, tacticalOpportunity, opponentPosition) {
        const stats = shooterProfile.stats;
        const playStyle = shooterProfile.playStyle;
        let spinBonus = this.calculateSpinBonus(shotType, stats.technical.spin);
        const placementBonus = this.calculatePlacementBonus(shotType, stats.technical.placement);
        let physicalModifier = this.calculatePhysicalModifier(shotType, context, stats.physical, ballQuality);
        let mentalModifier = this.calculateMentalModifier(context, stats.mental, playStyle, opponentPosition);
        let serveVariance = 0;
        if (shotType === 'serve_first') {
            const offensiveBonus = Math.min((stats.mental.offensive / 100) * SERVE_BONUSES.first.offensive.multiplier, SERVE_BONUSES.first.offensive.maxBonus);
            const strengthBonus = Math.min((stats.physical.strength / 100) * SERVE_BONUSES.first.strength.multiplier, SERVE_BONUSES.first.strength.maxBonus);
            const spinBonusServe = Math.min((stats.technical.spin / 100) * SERVE_BONUSES.first.spin.multiplier, SERVE_BONUSES.first.spin.maxBonus);
            physicalModifier *= (1 + offensiveBonus + strengthBonus);
            spinBonus += spinBonusServe * 100;
            serveVariance = (Math.random() - 0.5) * 2 * SERVE_VARIANCE.first;
        }
        else if (shotType === 'serve_second' || shotType === 'kick_serve') {
            const consistencyBonus = Math.min((playStyle.consistency / 100) * SERVE_BONUSES.second.consistency.multiplier, SERVE_BONUSES.second.consistency.maxBonus);
            const spinBonusServe = Math.min((stats.technical.spin / 100) * SERVE_BONUSES.second.spin.multiplier, SERVE_BONUSES.second.spin.maxBonus);
            const defensiveBonus = Math.min((stats.mental.defensive / 100) * SERVE_BONUSES.second.defensive.multiplier, SERVE_BONUSES.second.defensive.maxBonus);
            mentalModifier *= (1 + consistencyBonus + defensiveBonus);
            spinBonus += spinBonusServe * 100;
            serveVariance = (Math.random() - 0.5) * 2 * SERVE_VARIANCE.second;
        }
        let returnVariance = 0;
        if (shotType.includes('return')) {
            returnVariance = (Math.random() - 0.5) * 2 * RETURN_VARIANCE;
        }
        let rallyVariance = 0;
        if (!shotType.includes('serve') && !shotType.includes('return') && incomingShot) {
            const incomingQuality = incomingShot.quality;
            const totalVariance = RALLY_SHOT_VARIANCE.base +
                (incomingQuality / 100) * RALLY_SHOT_VARIANCE.qualityMultiplier;
            rallyVariance = (Math.random() - 0.5) * 2 * totalVariance;
        }
        const difficultyModifier = this.getDifficultyModifier(context.difficulty);
        const pressureModifier = this.getPressureModifier(context.pressure, stats.mental.focus);
        const rallyLengthModifier = this.getRallyLengthModifier(context.rallyLength, stats.physical.stamina);
        const ballQualityModifier = this.getBallQualityModifier(ballQuality, stats.physical);
        const tacticalModifier = this.getTacticalModifier(shotType, tacticalOpportunity, opponentPosition);
        let finalAdjustment = (1 + spinBonus / 100) *
            (1 + placementBonus / 100) *
            physicalModifier *
            mentalModifier *
            difficultyModifier *
            pressureModifier *
            rallyLengthModifier *
            ballQualityModifier *
            tacticalModifier;
        if (shotType.includes('serve')) {
            finalAdjustment = Math.min(finalAdjustment, TOTAL_MODIFIER_CAPS.serve);
        }
        else if (shotType.includes('return')) {
            finalAdjustment = Math.min(finalAdjustment, TOTAL_MODIFIER_CAPS.return);
        }
        else {
            finalAdjustment = Math.min(finalAdjustment, TOTAL_MODIFIER_CAPS.rally);
        }
        return {
            spinBonus,
            placementBonus,
            physicalModifier,
            mentalModifier,
            difficultyModifier,
            pressureModifier,
            rallyLengthModifier,
            finalAdjustment,
            serveVariance,
            returnVariance,
            rallyVariance,
        };
    }
    calculateSpinBonus(shotType, spinStat) {
        if (!SHOT_CLASSIFICATIONS.spinShots.includes(shotType)) {
            return 0;
        }
        return (spinStat / 100) * 20;
    }
    calculatePlacementBonus(shotType, placementStat) {
        if (!SHOT_CLASSIFICATIONS.placementShots.includes(shotType)) {
            return 0;
        }
        return (placementStat / 100) * 15;
    }
    calculatePhysicalModifier(shotType, context, physical, ballQuality) {
        let modifier = 1.0;
        if (SHOT_CLASSIFICATIONS.defensiveShots.includes(shotType) ||
            context.courtPosition === 'defensive') {
            const speedModifier = 0.8 + (physical.speed / 100) * 0.2;
            modifier *= speedModifier;
        }
        if (SHOT_CLASSIFICATIONS.powerShots.includes(shotType)) {
            const strengthModifier = 0.9 + (physical.strength / 100) * 0.2;
            modifier *= strengthModifier;
        }
        const isRushed = ballQuality?.timeAvailable === 'rushed';
        if (SHOT_CLASSIFICATIONS.netShots.includes(shotType) || isRushed) {
            const agilityModifier = 0.85 + (physical.agility / 100) * 0.3;
            modifier *= agilityModifier;
        }
        return modifier;
    }
    calculateMentalModifier(context, mental, playStyle, opponentPosition) {
        let modifier = 1.0;
        if (opponentPosition === 'at_net' || opponentPosition === 'well_positioned') {
            const anticipationModifier = 0.8 + (mental.anticipation / 100) * 0.2;
            modifier *= anticipationModifier;
        }
        const varietyModifier = 0.9 + (mental.shot_variety / 100) * 0.2;
        modifier *= varietyModifier;
        if (playStyle.aggression > 70 && SHOT_CLASSIFICATIONS.powerShots.length > 0) {
            const offensiveModifier = 1.0 + (mental.offensive / 100) * 0.1;
            modifier *= offensiveModifier;
        }
        return modifier;
    }
    getDifficultyModifier(difficulty) {
        const modifiers = {
            easy: 1.1,
            normal: 1.0,
            hard: 0.8,
            extreme: 0.6,
        };
        return modifiers[difficulty];
    }
    getPressureModifier(pressure, focusStat) {
        const range = SHOT_RANGES.pressureModifiers[pressure];
        return range.min + (focusStat / 100) * (range.max - range.min);
    }
    getRallyLengthModifier(rallyLength, staminaStat) {
        let range;
        if (rallyLength <= 5) {
            range = SHOT_RANGES.rallyLengthModifiers.short;
        }
        else if (rallyLength <= 10) {
            range = SHOT_RANGES.rallyLengthModifiers.medium;
        }
        else if (rallyLength <= 15) {
            range = SHOT_RANGES.rallyLengthModifiers.long;
        }
        else {
            range = SHOT_RANGES.rallyLengthModifiers.extreme;
        }
        return range.min + (staminaStat / 100) * (range.max - range.min);
    }
    applyModifiers(baseStat, modifiers) {
        let quality = baseStat * modifiers.finalAdjustment;
        if (modifiers.serveVariance !== undefined) {
            quality += modifiers.serveVariance;
        }
        if (modifiers.returnVariance !== undefined) {
            quality += modifiers.returnVariance;
        }
        if (modifiers.rallyVariance !== undefined) {
            quality += modifiers.rallyVariance;
        }
        return Math.min(100, Math.max(0, quality));
    }
    getPrimaryStatName(shotType) {
        if (shotType.includes('serve'))
            return 'serve';
        if (shotType.includes('forehand'))
            return 'forehand';
        if (shotType.includes('backhand'))
            return 'backhand';
        if (shotType.includes('volley'))
            return 'volley';
        if (shotType.includes('overhead'))
            return 'overhead';
        if (shotType.includes('drop'))
            return 'drop_shot';
        if (shotType.includes('slice'))
            return 'slice';
        if (shotType.includes('return'))
            return 'return';
        if (shotType.includes('angle') || shotType.includes('lob'))
            return 'placement';
        return 'placement';
    }
    getBallQualityModifier(ballQuality, physical) {
        if (!ballQuality)
            return 1.0;
        let modifier = 1.0;
        if (ballQuality.timeAvailable === 'rushed') {
            const rushHandling = (physical.speed + physical.agility) / 2;
            modifier *= 0.6 + (rushHandling / 100) * 0.4;
        }
        else if (ballQuality.timeAvailable === 'plenty') {
            modifier *= 1.05;
        }
        if (ballQuality.baseQuality >= 80) {
            modifier *= 0.85;
        }
        else if (ballQuality.baseQuality >= 60) {
            modifier *= 0.95;
        }
        else if (ballQuality.baseQuality < 40) {
            modifier *= 1.1;
        }
        return modifier;
    }
    getTacticalModifier(shotType, tacticalOpportunity, opponentPosition) {
        if (!tacticalOpportunity || !opponentPosition)
            return 1.0;
        let modifier = 1.0;
        if (shotType.includes('passing_shot')) {
            if (opponentPosition === 'at_net') {
                modifier *= 0.8;
            }
        }
        if (shotType.includes('drop_shot')) {
            if (opponentPosition === 'way_back_deep') {
                modifier *= 1.2;
            }
            else if (opponentPosition === 'at_net') {
                modifier *= 0.7;
            }
        }
        if (SHOT_CLASSIFICATIONS.powerShots.includes(shotType)) {
            if (tacticalOpportunity.attackOpportunity === 'high') {
                modifier *= 1.15;
            }
            else if (tacticalOpportunity.attackOpportunity === 'low') {
                modifier *= 0.95;
            }
        }
        if (SHOT_CLASSIFICATIONS.defensiveShots.includes(shotType)) {
            if (tacticalOpportunity.defensiveRequired) {
                modifier *= 1.1;
            }
        }
        return modifier;
    }
    explainShotCalculation(shooterProfile, shotType, context) {
        const primaryStat = shooterProfile.getStatForShot(shotType);
        const modifiers = this.calculateModifiers(shooterProfile, shotType, context);
        const quality = this.applyModifiers(primaryStat, modifiers);
        let explanation = `Shot Calculation for ${shotType}:\n`;
        explanation += `Primary Stat (${this.getPrimaryStatName(shotType)}): ${primaryStat}\n`;
        explanation += `Difficulty: ${context.difficulty} (×${modifiers.difficultyModifier})\n`;
        explanation += `Pressure: ${context.pressure} (×${modifiers.pressureModifier.toFixed(3)})\n`;
        explanation += `Rally Length: ${context.rallyLength} shots (×${modifiers.rallyLengthModifier.toFixed(3)})\n`;
        if (modifiers.spinBonus > 0) {
            explanation += `Spin Bonus: +${modifiers.spinBonus.toFixed(1)}%\n`;
        }
        if (modifiers.placementBonus > 0) {
            explanation += `Placement Bonus: +${modifiers.placementBonus.toFixed(1)}%\n`;
        }
        if (modifiers.serveVariance) {
            explanation += `Serve Variance: ${modifiers.serveVariance > 0 ? '+' : ''}${modifiers.serveVariance.toFixed(1)}\n`;
        }
        explanation += `Physical Modifier: ×${modifiers.physicalModifier.toFixed(3)}\n`;
        explanation += `Mental Modifier: ×${modifiers.mentalModifier.toFixed(3)}\n`;
        explanation += `Final Adjustment: ×${modifiers.finalAdjustment.toFixed(3)}\n`;
        explanation += `Final Quality: ${quality.toFixed(1)}\n`;
        explanation += `\nNOTE: Outcome determined by quality vs thresholds (varies by opponent)\n`;
        return explanation;
    }
    calculateStatImpact(shooterProfile, shotType, context, statImprovement) {
        const beforeStat = shooterProfile.getStatForShot(shotType);
        const beforeModifiers = this.calculateModifiers(shooterProfile, shotType, context);
        const beforeQuality = this.applyModifiers(beforeStat, beforeModifiers);
        const afterStat = Math.min(100, beforeStat + statImprovement);
        const afterQuality = this.applyModifiers(afterStat, beforeModifiers);
        return {
            beforeRate: beforeQuality,
            afterRate: afterQuality,
            improvement: afterQuality - beforeQuality,
        };
    }
}
