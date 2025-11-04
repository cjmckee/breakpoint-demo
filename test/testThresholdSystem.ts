/**
 * Quick test of the new threshold-based system
 * Tests return winners and serve aces with Andy vs Dan
 */

import { PlayerProfile } from '../src/core/PlayerProfile.js';
import { MatchSimulator } from '../src/core/MatchSimulator.js';
import type { PlayerStats } from '../src/types/index.js';

// Aggressive Andy stats (same as before)
const andyStats: PlayerStats = {
  technical: {
    serve: 80,
    forehand: 85,
    backhand: 60,
    volley: 75,
    overhead: 75,
    drop_shot: 50,
    slice: 55,
    return: 65,
    spin: 70,
    placement: 70,
  },
  physical: {
    speed: 60,
    stamina: 70,
    strength: 85,
    agility: 65,
    recovery: 70,
  },
  mental: {
    focus: 70,
    anticipation: 65,
    shot_variety: 65,
    offensive: 80,
    defensive: 40,
  },
};

// Defensive Dan stats (same as before)
const danStats: PlayerStats = {
  technical: {
    serve: 70,
    forehand: 70,
    backhand: 75,
    volley: 60,
    overhead: 65,
    drop_shot: 60,
    slice: 80,
    return: 85,
    spin: 75,
    placement: 75,
  },
  physical: {
    speed: 85,
    stamina: 90,
    strength: 60,
    agility: 80,
    recovery: 85,
  },
  mental: {
    focus: 85,
    anticipation: 90,
    shot_variety: 70,
    offensive: 40,
    defensive: 95,
  },
};

// Create players (playStyle is auto-calculated from stats)
const andy = new PlayerProfile('andy', 'Aggressive Andy', andyStats);
const dan = new PlayerProfile('dan', 'Defensive Dan', danStats);

console.log('Testing new threshold-based system...\n');
console.log('=== Player Stats ===');
console.log(`Andy: Serve ${andy.stats.technical.serve}, Offensive ${andy.stats.mental.offensive}, Strength ${andy.stats.physical.strength}`);
console.log(`Dan: Return ${dan.stats.technical.return}, Defensive ${dan.stats.mental.defensive}, Speed ${dan.stats.physical.speed}\n`);

// Run a single game to analyze
const matchConfig = {
  player: andy,
  opponent: dan,
  courtSurface: 'hard' as const,
  matchFormat: {
    bestOfSets: 1,
    gamesPerSet: 6,
    enableTiebreaks: true,
    tiebreakAt: 6,
  },
};

const simulator = new MatchSimulator(matchConfig);
const match = simulator.simulateMatch();

// Analyze match
console.log('=== Match Result ===');
console.log(`Winner: ${match.winner === 'player' ? 'Andy' : 'Dan'}`);
console.log(`Final Score: ${match.finalScore}`);
console.log(`Total Points: ${match.pointResults.length}\n`);

// Count return winners
const returnWinners = match.pointResults.filter(point => {
  const returnShot = point.shots.find(s => s.shotType.includes('return'));
  return returnShot && returnShot.outcome === 'winner';
}).length;

console.log(`=== Return Winners ===`);
console.log(`Total return winners: ${returnWinners}`);
console.log(`Return winner rate: ${(returnWinners / match.pointResults.length * 100).toFixed(1)}%`);
console.log(`Expected: ~2-5% (should be much lower than before)\n`);

// Count aces
const aces = match.pointResults.filter(point => point.pointType === 'ace').length;
const firstServeAces = match.pointResults.filter(point => {
  return point.pointType === 'ace' && point.serveType === 'first';
}).length;
const secondServeAces = match.pointResults.filter(point => {
  return point.pointType === 'ace' && point.serveType === 'second';
}).length;

console.log(`=== Aces ===`);
console.log(`Total aces: ${aces}`);
console.log(`First serve aces: ${firstServeAces}`);
console.log(`Second serve aces: ${secondServeAces}`);
console.log(`Expected: Few second serve aces against Dan (return: 85)\n`);

// Analyze first 10 points in detail
console.log('=== First 10 Points Detail ===');
match.pointResults.slice(0, 10).forEach((point, i) => {
  console.log(`\nPoint ${i + 1}:`);
  point.shots.forEach(shot => {
    const outcome = shot.outcome;
    const quality = shot.quality.toFixed(1);
    const thresholds = shot.thresholds;
    let thresholdStr = '';
    if (thresholds) {
      thresholdStr = ` (win: ${thresholds.winner.toFixed(1)}, inPlay: ${thresholds.inPlay.toFixed(1)})`;
    }
    console.log(`  ${shot.shooter}: ${shot.shotType} q=${quality}${thresholdStr} → ${outcome}`);
  });
  console.log(`  Result: ${point.winner} wins (${point.pointType})`);
});

console.log('\n=== System Check ===');
if (returnWinners / match.pointResults.length < 0.10) {
  console.log('✓ Return winners significantly reduced (< 10%)');
} else {
  console.log('✗ Return winners still too high');
}

if (secondServeAces < 3) {
  console.log('✓ Second serve aces are rare');
} else {
  console.log('✗ Too many second serve aces');
}
