/**
 * Quick debugging test
 */

import { PlayerProfile } from '../src/core/PlayerProfile.js';
import { PointSimulator } from '../src/core/PointSimulator.js';
import type { PlayerStats } from '../src/types/index.js';

const andyStats: PlayerStats = {
  technical: { serve: 80, forehand: 85, backhand: 60, volley: 75, overhead: 75, drop_shot: 50, slice: 55, return: 65, spin: 70, placement: 70 },
  physical: { speed: 60, stamina: 70, strength: 85, agility: 65, recovery: 70 },
  mental: { focus: 70, anticipation: 65, shot_variety: 65, offensive: 80, defensive: 40 },
};

const danStats: PlayerStats = {
  technical: { serve: 70, forehand: 70, backhand: 75, volley: 60, overhead: 65, drop_shot: 60, slice: 80, return: 85, spin: 75, placement: 75 },
  physical: { speed: 85, stamina: 90, strength: 60, agility: 80, recovery: 85 },
  mental: { focus: 85, anticipation: 90, shot_variety: 70, offensive: 40, defensive: 95 },
};

const andy = new PlayerProfile('andy', 'Andy', andyStats);
const dan = new PlayerProfile('dan', 'Dan', danStats);

const simulator = new PointSimulator();
const matchState = {
  score: {} as any,
  currentServer: 'player' as const,
  courtSurface: 'hard' as const,
  momentum: 0,
  pressure: 'low' as const,
  matchLength: 0,
  pointsPlayed: 0,
  isKeyMoment: false,
};

console.log('Simulating 10 points...\n');

for (let i = 0; i < 10; i++) {
  const point = simulator.simulatePoint(andy, dan, matchState);
  console.log(`Point ${i + 1}: ${point.winner} wins - ${point.pointType} (${point.rallyLength} shots)`);

  point.shots.forEach((shot, j) => {
    const thresholdInfo = shot.thresholds
      ? `[win:${shot.thresholds.winner.toFixed(1)} in:${shot.thresholds.inPlay.toFixed(1)}]`
      : '';
    console.log(`  ${j + 1}. ${shot.shooter} ${shot.shotType} q=${shot.quality.toFixed(1)} ${thresholdInfo} → ${shot.outcome}`);
  });
  console.log('');
}
