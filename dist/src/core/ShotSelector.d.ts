import type { ShotType, RallyState, MatchState } from '../types/index.js';
import { PlayerProfile } from './PlayerProfile.js';
export declare class ShotSelector {
    selectShot(shooter: PlayerProfile, opponent: PlayerProfile, rallyState: RallyState, matchState: MatchState): ShotType;
    private calculateShotPreference;
    private evaluateTacticalSituation;
    private shouldApproachNet;
    private shouldAttemptWinner;
    private shouldUseTacticalShot;
}
