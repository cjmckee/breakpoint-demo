import type { ShotType, ShotContext, ShotResult, BallQuality, TacticalOpportunity, CourtPosition, ShotDetail } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export declare class ShotCalculator {
    calculateShotSuccess(shooterProfile: PlayerProfile, shotType: ShotType, context: ShotContext, opponentProfile: PlayerProfile, opponentPosition: CourtPosition, incomingShot?: ShotDetail, ballQuality?: BallQuality, tacticalOpportunity?: TacticalOpportunity): ShotResult;
    private calculateQualityRequirements;
    private determineOutcome;
    private determineServeOutcome;
    private calculateModifiers;
    private calculateSpinBonus;
    private calculatePlacementBonus;
    private calculatePhysicalModifier;
    private calculateMentalModifier;
    private getDifficultyModifier;
    private getPressureModifier;
    private getRallyLengthModifier;
    private applyModifiers;
    private getPrimaryStatName;
    private getBallQualityModifier;
    private getTacticalModifier;
    explainShotCalculation(shooterProfile: PlayerProfile, shotType: ShotType, context: ShotContext): string;
    calculateStatImpact(shooterProfile: PlayerProfile, shotType: ShotType, context: ShotContext, statImprovement: number): {
        beforeRate: number;
        afterRate: number;
        improvement: number;
    };
}
