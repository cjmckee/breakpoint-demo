const SHOT_RANGES = {
    baseSuccessRates: {
        easy: { min: 45, max: 95 },
        normal: { min: 30, max: 90 },
        hard: { min: 15, max: 85 },
        extreme: { min: 5, max: 60 },
    },
    winnerRates: {
        aggressive: { min: 3, max: 45 },
        balanced: { min: 2, max: 35 },
        defensive: { min: 1, max: 25 },
    },
    pressureModifiers: {
        low: { min: 1.0, max: 1.05 },
        medium: { min: 0.75, max: 1.0 },
        high: { min: 0.4, max: 1.15 },
    },
    rallyLengthModifiers: {
        short: { min: 1.0, max: 1.0 },
        medium: { min: 0.85, max: 1.0 },
        long: { min: 0.70, max: 1.0 },
        extreme: { min: 0.50, max: 1.0 },
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
    calculateShotSuccess(shooterProfile, shotType, context) {
        const primaryStat = shooterProfile.getStatForShot(shotType);
        const modifiers = this.calculateModifiers(shooterProfile, shotType, context);
        const adjustedStat = this.applyModifiers(primaryStat, modifiers);
        const baseSuccessRate = this.calculateBaseSuccessRate(adjustedStat, context.difficulty);
        const finalSuccessRate = Math.min(98, Math.max(2, baseSuccessRate));
        const outcome = this.determineOutcome(finalSuccessRate, adjustedStat, shooterProfile.playStyle, shotType);
        return {
            success: outcome.outcome !== 'error',
            outcome: outcome.outcome,
            quality: adjustedStat,
            shotType,
            statUsed: this.getPrimaryStatName(shotType),
            modifiers,
        };
    }
    calculateBaseSuccessRate(statValue, difficulty) {
        const range = SHOT_RANGES.baseSuccessRates[difficulty];
        const successRate = range.min + (statValue / 100) * (range.max - range.min);
        return successRate;
    }
    calculateModifiers(shooterProfile, shotType, context) {
        const stats = shooterProfile.stats;
        const playStyle = shooterProfile.playStyle;
        const spinBonus = this.calculateSpinBonus(shotType, stats.technical.spin);
        const placementBonus = this.calculatePlacementBonus(shotType, stats.technical.placement);
        const physicalModifier = this.calculatePhysicalModifier(shotType, context, stats.physical);
        const mentalModifier = this.calculateMentalModifier(context, stats.mental, playStyle);
        const difficultyModifier = this.getDifficultyModifier(context.difficulty);
        const pressureModifier = this.getPressureModifier(context.pressure, stats.mental.focus);
        const rallyLengthModifier = this.getRallyLengthModifier(context.rallyLength, stats.physical.stamina);
        const finalAdjustment = (1 + spinBonus / 100) *
            (1 + placementBonus / 100) *
            physicalModifier *
            mentalModifier *
            difficultyModifier *
            pressureModifier *
            rallyLengthModifier;
        return {
            spinBonus,
            placementBonus,
            physicalModifier,
            mentalModifier,
            difficultyModifier,
            pressureModifier,
            rallyLengthModifier,
            finalAdjustment,
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
    calculatePhysicalModifier(shotType, context, physical) {
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
        if (SHOT_CLASSIFICATIONS.netShots.includes(shotType) ||
            context.timeAvailable === 'rushed') {
            const agilityModifier = 0.85 + (physical.agility / 100) * 0.3;
            modifier *= agilityModifier;
        }
        return modifier;
    }
    calculateMentalModifier(context, mental, playStyle) {
        let modifier = 1.0;
        if (context.opponentPosition === 'excellent') {
            const anticipationModifier = 0.8 + (mental.anticipation / 100) * 0.2;
            modifier *= anticipationModifier;
        }
        const tacticalShots = [...SHOT_CLASSIFICATIONS.placementShots, 'drop_shot', 'lob'];
        if (tacticalShots.some(shot => context.toString().includes(shot))) {
            const varietyModifier = 0.9 + (mental.shot_variety / 100) * 0.2;
            modifier *= varietyModifier;
        }
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
        else if (rallyLength <= 20) {
            range = SHOT_RANGES.rallyLengthModifiers.long;
        }
        else {
            range = SHOT_RANGES.rallyLengthModifiers.extreme;
        }
        return range.min + (staminaStat / 100) * (range.max - range.min);
    }
    applyModifiers(baseStat, modifiers) {
        return Math.min(100, Math.max(0, baseStat * modifiers.finalAdjustment));
    }
    determineOutcome(successRate, adjustedStat, playStyle, shotType) {
        const roll = Math.random() * 100;
        if (roll > successRate) {
            return { outcome: 'error' };
        }
        const playStyleCategory = this.getPlayStyleCategory(playStyle);
        const winnerRange = SHOT_RANGES.winnerRates[playStyleCategory];
        const baseWinnerProbability = winnerRange.min + (adjustedStat / 100) * (winnerRange.max - winnerRange.min);
        const shotTypeBonus = SHOT_CLASSIFICATIONS.powerShots.includes(shotType) ? 1.3 : 1.0;
        const finalWinnerProbability = baseWinnerProbability * shotTypeBonus;
        if (roll < finalWinnerProbability) {
            return { outcome: 'winner' };
        }
        return { outcome: 'in_play' };
    }
    getPlayStyleCategory(playStyle) {
        if (playStyle.aggression >= 70)
            return 'aggressive';
        if (playStyle.aggression <= 40)
            return 'defensive';
        return 'balanced';
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
    explainShotCalculation(shooterProfile, shotType, context) {
        const primaryStat = shooterProfile.getStatForShot(shotType);
        const modifiers = this.calculateModifiers(shooterProfile, shotType, context);
        const adjustedStat = this.applyModifiers(primaryStat, modifiers);
        const baseSuccessRate = this.calculateBaseSuccessRate(adjustedStat, context.difficulty);
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
        explanation += `Physical Modifier: ×${modifiers.physicalModifier.toFixed(3)}\n`;
        explanation += `Mental Modifier: ×${modifiers.mentalModifier.toFixed(3)}\n`;
        explanation += `Final Adjustment: ×${modifiers.finalAdjustment.toFixed(3)}\n`;
        explanation += `Adjusted Stat: ${adjustedStat.toFixed(1)}\n`;
        explanation += `Success Rate: ${baseSuccessRate.toFixed(1)}%\n`;
        return explanation;
    }
    calculateStatImpact(shooterProfile, shotType, context, statImprovement) {
        const beforeStat = shooterProfile.getStatForShot(shotType);
        const beforeModifiers = this.calculateModifiers(shooterProfile, shotType, context);
        const beforeAdjusted = this.applyModifiers(beforeStat, beforeModifiers);
        const beforeRate = this.calculateBaseSuccessRate(beforeAdjusted, context.difficulty);
        const afterStat = Math.min(100, beforeStat + statImprovement);
        const afterAdjusted = this.applyModifiers(afterStat, beforeModifiers);
        const afterRate = this.calculateBaseSuccessRate(afterAdjusted, context.difficulty);
        return {
            beforeRate,
            afterRate,
            improvement: afterRate - beforeRate,
        };
    }
}
