/**
 * Analyze shot distribution from match data
 */

import fs from 'fs';
import type { MatchAnalysisData } from '../src/types/index.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: tsx test/analyzeShotDistribution.ts <path-to-match-json>');
  process.exit(1);
}

const filePath = args[0];
const data: MatchAnalysisData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Count shot types
const shotStats: Record<string, number> = {};
const playerShotStats: Record<string, { forehand: number; backhand: number }> = {
  player: { forehand: 0, backhand: 0 },
  opponent: { forehand: 0, backhand: 0 }
};

let totalShots = 0;

data.points.forEach(point => {
  point.shots.forEach(shot => {
    totalShots++;
    shotStats[shot.shotType] = (shotStats[shot.shotType] || 0) + 1;

    // Track forehand/backhand for each player
    const shooter = shot.shooter === 'server' ?
      (point.server === 'player' ? 'player' : 'opponent') :
      (point.server === 'player' ? 'opponent' : 'player');

    if (shot.shotType.includes('forehand')) {
      playerShotStats[shooter].forehand++;
    } else if (shot.shotType.includes('backhand')) {
      playerShotStats[shooter].backhand++;
    }
  });
});

// Sort by count
const sorted = Object.entries(shotStats).sort((a, b) => b[1] - a[1]);

console.log('================================================================================');
console.log('SHOT DISTRIBUTION ANALYSIS');
console.log('================================================================================\n');

console.log('Shot Type Distribution:\n');
sorted.forEach(([shot, count]) => {
  const percentage = ((count / totalShots) * 100).toFixed(1);
  console.log(`  ${shot.padEnd(30)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%)`);
});

console.log(`\nTotal shots: ${totalShots}\n`);

console.log('================================================================================');
console.log('FOREHAND/BACKHAND ANALYSIS');
console.log('================================================================================\n');

console.log(`${data.player.name} (FH: ${data.player.stats.technical.forehand}, BH: ${data.player.stats.technical.backhand}):`);
const playerTotal = playerShotStats.player.forehand + playerShotStats.player.backhand;
const playerFhPct = (playerShotStats.player.forehand / playerTotal * 100).toFixed(1);
const playerBhPct = (playerShotStats.player.backhand / playerTotal * 100).toFixed(1);
console.log(`  Forehand: ${playerShotStats.player.forehand} (${playerFhPct}%)`);
console.log(`  Backhand: ${playerShotStats.player.backhand} (${playerBhPct}%)`);

// Expected based on stats
const playerStatDiff = data.player.stats.technical.forehand - data.player.stats.technical.backhand;
const playerExpectedFh = (0.5 + playerStatDiff / 200) * 100;
console.log(`  Expected FH%: ${playerExpectedFh.toFixed(1)}% (based on stat differential of ${playerStatDiff > 0 ? '+' : ''}${playerStatDiff})`);
console.log(`  Difference: ${(parseFloat(playerFhPct) - playerExpectedFh).toFixed(1)}%\n`);

console.log(`${data.opponent.name} (FH: ${data.opponent.stats.technical.forehand}, BH: ${data.opponent.stats.technical.backhand}):`);
const oppTotal = playerShotStats.opponent.forehand + playerShotStats.opponent.backhand;
const oppFhPct = (playerShotStats.opponent.forehand / oppTotal * 100).toFixed(1);
const oppBhPct = (playerShotStats.opponent.backhand / oppTotal * 100).toFixed(1);
console.log(`  Forehand: ${playerShotStats.opponent.forehand} (${oppFhPct}%)`);
console.log(`  Backhand: ${playerShotStats.opponent.backhand} (${oppBhPct}%)`);

const oppStatDiff = data.opponent.stats.technical.forehand - data.opponent.stats.technical.backhand;
const oppExpectedFh = (0.5 + oppStatDiff / 200) * 100;
console.log(`  Expected FH%: ${oppExpectedFh.toFixed(1)}% (based on stat differential of ${oppStatDiff > 0 ? '+' : ''}${oppStatDiff})`);
console.log(`  Difference: ${(parseFloat(oppFhPct) - oppExpectedFh).toFixed(1)}%\n`);

console.log('================================================================================');
console.log('PLAYSTYLE VALIDATION');
console.log('================================================================================\n');

// Count aggressive vs defensive shots
const aggressiveShots = ['forehand_power', 'backhand_power', 'return_forehand_power', 'return_backhand_power'];
const defensiveShots = ['defensive_slice_forehand', 'defensive_slice_backhand', 'slice_forehand', 'slice_backhand', 'lob_forehand', 'lob_backhand'];

const playerAggressive = sorted.filter(([shot]) => aggressiveShots.includes(shot)).reduce((sum, [_, count]) => sum + count, 0);
const playerDefensive = sorted.filter(([shot]) => defensiveShots.includes(shot)).reduce((sum, [_, count]) => sum + count, 0);

console.log(`Aggressive shots: ${playerAggressive} (${(playerAggressive / totalShots * 100).toFixed(1)}%)`);
console.log(`Defensive shots: ${playerDefensive} (${(playerDefensive / totalShots * 100).toFixed(1)}%)`);
console.log();
