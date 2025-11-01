import type { ShotType, ShotContext, ShotResult } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export declare class ShotCalculator {
    calculateShotSuccess(shooterProfile: PlayerProfile, shotType: ShotType, context: ShotContext): ShotResult;
    private calculateBaseSuccessRate;
    private calculateModifiers;
    private calculateSpinBonus;
    private calculatePlacementBonus;
    private calculatePhysicalModifier;
    private calculateMentalModifier;
    private getDifficultyModifier;
    private getPressureModifier;
    private getRallyLengthModifier;
    private applyModifiers;
    private determineOutcome;
    private getPlayStyleCategory;
    private getPrimaryStatName;
    explainShotCalculation(shooterProfile: PlayerProfile, shotType: ShotType, context: ShotContext): string;
    calculateStatImpact(shooterProfile: PlayerProfile, shotType: ShotType, context: ShotContext, statImprovement: number): {
        beforeRate: number;
        afterRate: number;
        improvement: number;
    };
}
