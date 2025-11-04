import type { PointResult, MatchState } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export declare class PointSimulator {
    private shotCalculator;
    private shotSelector;
    constructor();
    simulatePoint(server: PlayerProfile, returner: PlayerProfile, matchState: MatchState): PointResult;
    private simulateServe;
    private simulateRally;
    private classifyError;
    private createServeContext;
    private createRallyContext;
    private calculateBallQuality;
    private updateCourtPosition;
    private evaluateTacticalOpportunity;
    private createPointResult;
    private identifyKeyShot;
    private calculatePointStatistics;
}
