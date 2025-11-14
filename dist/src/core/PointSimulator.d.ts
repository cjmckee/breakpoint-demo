import type { PointResult, MatchState } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export declare class PointSimulator {
    private shotCalculator;
    private shotSelector;
    private tacticalAnalyzer;
    constructor();
    simulatePoint(currentServer: 'player' | 'opponent', server: PlayerProfile, returner: PlayerProfile, matchState: MatchState): PointResult;
    private simulateServe;
    private simulateRally;
    private classifyError;
    private createServeContext;
    private createRallyContext;
    private calculateShotDifficulty;
    private calculateBallQuality;
    private updateShooterPosition;
    private updateOpponentPosition;
    private createPointResult;
    private identifyKeyShot;
    private calculatePointStatistics;
}
