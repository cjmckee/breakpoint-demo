import type { PlayerStats } from './types/index.js';
declare const ARCHETYPES: {
    beginner: {
        technical: {
            serve: number;
            forehand: number;
            backhand: number;
            volley: number;
            overhead: number;
            drop_shot: number;
            slice: number;
            return: number;
            spin: number;
            placement: number;
        };
        physical: {
            speed: number;
            stamina: number;
            strength: number;
            agility: number;
            recovery: number;
        };
        mental: {
            focus: number;
            anticipation: number;
            shot_variety: number;
            offensive: number;
            defensive: number;
        };
    };
    baseline: {
        technical: {
            serve: number;
            forehand: number;
            backhand: number;
            volley: number;
            overhead: number;
            drop_shot: number;
            slice: number;
            return: number;
            spin: number;
            placement: number;
        };
        physical: {
            speed: number;
            stamina: number;
            strength: number;
            agility: number;
            recovery: number;
        };
        mental: {
            focus: number;
            anticipation: number;
            shot_variety: number;
            offensive: number;
            defensive: number;
        };
    };
    aggressive: {
        technical: {
            serve: number;
            forehand: number;
            backhand: number;
            volley: number;
            overhead: number;
            drop_shot: number;
            slice: number;
            return: number;
            spin: number;
            placement: number;
        };
        physical: {
            speed: number;
            stamina: number;
            strength: number;
            agility: number;
            recovery: number;
        };
        mental: {
            focus: number;
            anticipation: number;
            shot_variety: number;
            offensive: number;
            defensive: number;
        };
    };
    serveVolley: {
        technical: {
            serve: number;
            forehand: number;
            backhand: number;
            volley: number;
            overhead: number;
            drop_shot: number;
            slice: number;
            return: number;
            spin: number;
            placement: number;
        };
        physical: {
            speed: number;
            stamina: number;
            strength: number;
            agility: number;
            recovery: number;
        };
        mental: {
            focus: number;
            anticipation: number;
            shot_variety: number;
            offensive: number;
            defensive: number;
        };
    };
    defensive: {
        technical: {
            serve: number;
            forehand: number;
            backhand: number;
            volley: number;
            overhead: number;
            drop_shot: number;
            slice: number;
            return: number;
            spin: number;
            placement: number;
        };
        physical: {
            speed: number;
            stamina: number;
            strength: number;
            agility: number;
            recovery: number;
        };
        mental: {
            focus: number;
            anticipation: number;
            shot_variety: number;
            offensive: number;
            defensive: number;
        };
    };
};
declare global {
    interface Window {
        applyArchetype: (player: string, archetype: keyof typeof ARCHETYPES) => void;
        updateDisplay: (player: string) => void;
        getPlayerStats: (player: string) => PlayerStats;
        simulateMatch: () => void;
        simulateMultiple: () => void;
        resetPlayers: () => void;
        log: (message: string, type?: string) => void;
    }
}
export {};
