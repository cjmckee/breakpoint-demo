export class ShotSelector {
    selectShot(shooter, opponent, rallyState, matchState) {
        const playStyle = shooter.playStyle;
        const { rallyLength, opponentPosition } = rallyState;
        const shotPreference = this.calculateShotPreference(shooter);
        const opportunity = this.evaluateTacticalSituation(rallyState);
        if (rallyLength === 1) {
            if (playStyle.aggression > 80 && Math.random() < 0.3) {
                return Math.random() < shotPreference.forehandProbability
                    ? 'return_forehand_power'
                    : 'return_backhand_power';
            }
            return Math.random() < shotPreference.forehandProbability
                ? 'return_forehand'
                : 'return_backhand';
        }
        if (opponentPosition === 'at_net') {
            if (Math.random() < 0.3) {
                return Math.random() < shotPreference.forehandProbability
                    ? 'lob_forehand'
                    : 'lob_backhand';
            }
            return Math.random() < shotPreference.forehandProbability
                ? 'passing_shot_forehand'
                : 'passing_shot_backhand';
        }
        if (opportunity.defensiveRequired) {
            const defenseOptions = [];
            if (Math.random() < shotPreference.forehandProbability) {
                defenseOptions.push('defensive_slice_forehand');
            }
            else {
                defenseOptions.push('defensive_slice_backhand');
            }
            defenseOptions.push(Math.random() < shotPreference.forehandProbability ? 'lob_forehand' : 'lob_backhand');
            if (playStyle.consistency > 60) {
                defenseOptions.push(Math.random() < shotPreference.forehandProbability ? 'slice_forehand' : 'slice_backhand');
            }
            return defenseOptions[Math.floor(Math.random() * defenseOptions.length)];
        }
        if (this.shouldApproachNet(shooter, opportunity, rallyState)) {
            return Math.random() < shotPreference.forehandProbability
                ? 'forehand_approach'
                : 'backhand_approach';
        }
        if (this.shouldAttemptWinner(shooter, opportunity, rallyState)) {
            return Math.random() < shotPreference.forehandProbability
                ? 'forehand_power'
                : 'backhand_power';
        }
        const tacticalDecision = this.shouldUseTacticalShot(shooter, rallyState, opportunity);
        if (tacticalDecision.use) {
            const isForehand = Math.random() < shotPreference.forehandProbability;
            switch (tacticalDecision.type) {
                case 'drop_shot':
                    return isForehand ? 'drop_shot_forehand' : 'drop_shot_backhand';
                case 'lob':
                    return isForehand ? 'lob_forehand' : 'lob_backhand';
                case 'angle_shot':
                    return isForehand ? 'angle_shot_forehand' : 'angle_shot_backhand';
            }
        }
        if (rallyLength > 10 && playStyle.consistency > 60 && Math.random() < 0.4) {
            return Math.random() < shotPreference.forehandProbability
                ? 'slice_forehand'
                : 'slice_backhand';
        }
        return Math.random() < shotPreference.forehandProbability
            ? 'forehand'
            : 'backhand';
    }
    calculateShotPreference(shooter) {
        const fh = shooter.stats.technical.forehand;
        const bh = shooter.stats.technical.backhand;
        const diff = fh - bh;
        const forehandProb = Math.max(0.3, Math.min(0.7, 0.5 + diff / 200));
        return {
            forehandProbability: forehandProb,
            preferredSide: diff > 15 ? 'forehand' : diff < -15 ? 'backhand' : 'balanced',
            runAroundBackhand: diff > 20,
            strongShotStat: Math.max(fh, bh),
            weakShotStat: Math.min(fh, bh),
        };
    }
    evaluateTacticalSituation(rallyState) {
        const { opponentPosition, lastShotQuality, ballQuality, rallyLength } = rallyState;
        let attackScore = 0;
        if (opponentPosition === 'way_out_wide')
            attackScore += 40;
        if (opponentPosition === 'way_back_deep')
            attackScore += 35;
        if (opponentPosition === 'recovering')
            attackScore += 30;
        if (opponentPosition === 'slightly_off')
            attackScore += 15;
        if (lastShotQuality >= 80)
            attackScore += 30;
        if (lastShotQuality >= 60)
            attackScore += 15;
        if (ballQuality.baseQuality < 40)
            attackScore += 20;
        if (ballQuality.baseQuality < 60)
            attackScore += 10;
        if (ballQuality.timeAvailable === 'plenty')
            attackScore += 15;
        const defensiveRequired = ballQuality.timeAvailable === 'rushed' ||
            ballQuality.baseQuality >= 80 ||
            opponentPosition === 'at_net' ||
            lastShotQuality < 30;
        let attackLevel;
        if (attackScore >= 70)
            attackLevel = 'high';
        else if (attackScore >= 40)
            attackLevel = 'medium';
        else if (attackScore >= 20)
            attackLevel = 'low';
        else
            attackLevel = 'none';
        return {
            attackOpportunity: attackLevel,
            netApproachSuitable: attackScore >= 40 &&
                rallyLength >= 3 &&
                !defensiveRequired,
            winnerAttemptSuitable: attackScore >= 30 && !defensiveRequired,
            defensiveRequired,
            tacticalShotSuitable: rallyLength >= 5 &&
                ballQuality.timeAvailable !== 'rushed',
            recommendedAggression: Math.min(100, attackScore),
        };
    }
    shouldApproachNet(shooter, opportunity, rallyState) {
        const netApproachStat = shooter.playStyle.netApproach;
        const playStyleType = shooter.playStyle.type;
        let baseProbability = 0;
        if (playStyleType === 'serve_volley') {
            baseProbability = 0.5;
        }
        else if (netApproachStat >= 70) {
            baseProbability = 0.3;
        }
        else if (netApproachStat >= 50) {
            baseProbability = 0.15;
        }
        else {
            baseProbability = 0.05;
        }
        if (!opportunity.netApproachSuitable)
            return false;
        let probability = baseProbability;
        if (opportunity.attackOpportunity === 'high')
            probability *= 2.5;
        else if (opportunity.attackOpportunity === 'medium')
            probability *= 1.5;
        if (rallyState.lastShotQuality >= 80)
            probability *= 1.3;
        if (rallyState.opponentPosition === 'way_back_deep')
            probability *= 1.5;
        if (playStyleType === 'serve_volley' && rallyState.rallyLength === 2) {
            probability = 0.7;
        }
        return Math.random() < Math.min(0.9, probability);
    }
    shouldAttemptWinner(shooter, opportunity, rallyState) {
        const aggression = shooter.playStyle.aggression;
        const playStyleType = shooter.playStyle.type;
        let baseProbability = 0;
        if (playStyleType === 'aggressive') {
            baseProbability = 0.25;
        }
        else if (playStyleType === 'all_court') {
            baseProbability = 0.15;
        }
        else if (playStyleType === 'serve_volley') {
            baseProbability = 0.12;
        }
        else if (playStyleType === 'counterpuncher') {
            baseProbability = 0.08;
        }
        else {
            baseProbability = 0.05;
        }
        if (!opportunity.winnerAttemptSuitable) {
            if (aggression >= 80 && Math.random() < 0.15) {
                return true;
            }
            return false;
        }
        let probability = baseProbability;
        if (opportunity.attackOpportunity === 'high')
            probability *= 3.0;
        else if (opportunity.attackOpportunity === 'medium')
            probability *= 1.8;
        else if (opportunity.attackOpportunity === 'low')
            probability *= 1.2;
        if (rallyState.lastShotQuality >= 85)
            probability *= 1.4;
        return Math.random() < Math.min(0.85, probability);
    }
    shouldUseTacticalShot(shooter, rallyState, opportunity) {
        const shotVariety = shooter.stats.mental.shot_variety;
        if (shotVariety < 50)
            return { use: false };
        if (!opportunity.tacticalShotSuitable)
            return { use: false };
        const baseProbability = (shotVariety - 50) / 200;
        if (Math.random() > baseProbability)
            return { use: false };
        const { opponentPosition, ballQuality } = rallyState;
        if (opponentPosition === 'way_back_deep' && ballQuality.baseQuality < 60) {
            return { use: true, type: 'drop_shot' };
        }
        if (opponentPosition === 'slightly_off' || opponentPosition === 'well_positioned') {
            return { use: true, type: 'angle_shot' };
        }
        return { use: true, type: 'angle_shot' };
    }
}
