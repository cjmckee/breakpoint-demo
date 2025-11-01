import type { MatchResult, MatchState, MatchFormat, CourtSurface, MatchAnalysisData } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export interface MatchConfig {
    player: PlayerProfile;
    opponent: PlayerProfile;
    courtSurface: CourtSurface;
    matchFormat?: MatchFormat;
    initialServer?: 'player' | 'opponent';
}
export declare class MatchSimulator {
    private pointSimulator;
    private scoreTracker;
    private matchStatistics;
    private config;
    private matchState;
    private scoreProgression;
    private pointResults;
    private startTime;
    constructor(config: MatchConfig);
    simulateMatch(): MatchResult;
    private simulateNextPoint;
    private convertPointWinner;
    private updateMatchState;
    private updateMomentum;
    private updatePressure;
    private applyStaminaCost;
    private recordScoreSnapshot;
    private createInitialMatchState;
    private determineInitialServer;
    private createMatchResult;
    private logPointResult;
    getMatchState(): MatchState;
    getCurrentScore(): string;
    isMatchComplete(): boolean;
    getStatistics(): import("../types/index.js").MatchStatistics;
    exportMatchData(): MatchAnalysisData;
    static simulateMultipleMatches(config: MatchConfig, numberOfMatches: number): MatchResult[];
}
