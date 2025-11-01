import type { MatchScore, MatchFormat, ScoreSnapshot } from '../types/index.js';
export declare class ScoreTracker {
    private score;
    constructor(matchFormat?: MatchFormat);
    private createInitialScore;
    addPoint(winner: 'player' | 'opponent'): void;
    private addPointToGame;
    private isGameComplete;
    private getGameWinner;
    private addGameToSet;
    private isSetComplete;
    private getSetWinner;
    private isMatchComplete;
    private getMatchWinner;
    private switchServer;
    private convertToServerReturner;
    private convertFromServerReturner;
    private getCurrentSet;
    getScore(): MatchScore;
    getCurrentSetGames(): {
        player: number;
        opponent: number;
    };
    getScoreString(): string;
    getScoreSnapshot(): ScoreSnapshot;
    isComplete(): boolean;
    getWinner(): 'player' | 'opponent' | undefined;
    setInitialServer(server: 'player' | 'opponent'): void;
    getCurrentServer(): 'player' | 'opponent';
    isKeyMoment(): boolean;
    getBreakPointFor(): 'player' | 'opponent' | undefined;
    reset(matchFormat?: MatchFormat): void;
}
