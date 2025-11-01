import type { PointResult, MatchState } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export declare class PointSimulator {
    private shotCalculator;
    constructor();
    simulatePoint(server: PlayerProfile, returner: PlayerProfile, matchState: MatchState): PointResult;
    private simulateServe;
    private simulateRally;
    private classifyError;
    private createServeContext;
    private createRallyContext;
    private selectShotType;
    private createPointResult;
    private identifyKeyShot;
    private calculatePointStatistics;
}
