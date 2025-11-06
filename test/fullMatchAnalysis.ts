/**
 * Full Match Analysis - Using actual MatchSimulator export data
 */

import { PlayerProfile } from '../src/core/PlayerProfile.js';
import { MatchSimulator } from '../src/core/MatchSimulator.js';
import type { PlayerStats } from '../src/types/index.js';
import * as fs from 'fs';

const ANDY_STATS: PlayerStats = {
  technical: { serve: 75, forehand: 80, backhand: 65, volley: 70, overhead: 75, drop_shot: 50, slice: 55, return: 55, spin: 60, placement: 65 },
  physical: { speed: 65, stamina: 55, strength: 80, agility: 65, recovery: 60 },
  mental: { focus: 65, anticipation: 60, shot_variety: 65, offensive: 85, defensive: 35 },
};

const DAN_STATS: PlayerStats = {
  technical: { serve: 45, forehand: 65, backhand: 75, volley: 40, overhead: 45, drop_shot: 50, slice: 75, return: 80, spin: 70, placement: 65 },
  physical: { speed: 80, stamina: 85, strength: 45, agility: 80, recovery: 85 },
  mental: { focus: 80, anticipation: 80, shot_variety: 65, offensive: 25, defensive: 90 },
};

function main() {
  console.log('\n🎾 FULL MATCH ANALYSIS\n');
  console.log('='.repeat(80));

  const andy = new PlayerProfile('player1', 'Andy (Aggressive)', ANDY_STATS);
  const dan = new PlayerProfile('player2', 'Dan (Defensive)', DAN_STATS);

  console.log(`Player Profiles:`);
  console.log(`  Andy (Aggressive): Rating ${andy.overallRating} - Serve 75, Forehand 80, Offensive 85`);
  console.log(`  Dan (Defensive): Rating ${dan.overallRating} - Return 80, Backhand 75, Defensive 90\n`);

  const config = {
    player: andy,
    opponent: dan,
    courtSurface: 'hard' as const,
    matchFormat: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 },
    initialServer: 'player' as const,
  };

  const simulator = new MatchSimulator(config);
  const matchResult = simulator.simulateMatch();
  const matchData = simulator.exportMatchData();

  // Save full match data
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `analysis/test-matches/full-match-${timestamp}.json`;
  fs.mkdirSync('analysis/test-matches', { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(matchData, null, 2));

  console.log('='.repeat(80));
  console.log('MATCH RESULT');
  console.log('='.repeat(80));
  console.log(`Winner: ${matchData.winner === 'player' ? 'Andy' : 'Dan'}`);
  console.log(`Score: ${matchData.finalScore}`);
  console.log(`Total Points: ${matchData.points.length}\n`);

  // Analyze all shots
  const allShots = matchData.points.flatMap(p => p.shots);
  const defensiveSliceShots = allShots.filter(s => s.shotType.includes('defensive_slice'));
  const defensiveSliceWinners = defensiveSliceShots.filter(s => s.outcome === 'winner');

  console.log('='.repeat(80));
  console.log('DEFENSIVE SLICE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Total defensive slices: ${defensiveSliceShots.length}`);
  console.log(`Defensive slice winners: ${defensiveSliceWinners.length}`);

  if (defensiveSliceWinners.length > 0) {
    console.log(`\n⚠️  DEFENSIVE SLICE WINNERS DETECTED:\n`);
    defensiveSliceWinners.forEach((shot, idx) => {
      const point = matchData.points.find(p => p.shots.includes(shot));
      console.log(`${idx + 1}. Point ${point?.pointNumber}: ${shot.shotType}`);
      console.log(`   Quality: ${shot.quality.toFixed(1)}`);
      if (shot.thresholds) {
        console.log(`   Winner Threshold: ${shot.thresholds.winner.toFixed(1)}`);
        console.log(`   In-Play Threshold: ${shot.thresholds.inPlay.toFixed(1)}`);
        console.log(`   Margin: +${(shot.quality - shot.thresholds.winner).toFixed(1)} above winner threshold`);
      }
      console.log(`   Shooter: ${shot.shooter}`);
      console.log('');
    });
  } else {
    console.log(`✅ No defensive slice winners - working as intended!\n`);
  }

  // Rally winners analysis
  console.log('='.repeat(80));
  console.log('WINNER ANALYSIS');
  console.log('='.repeat(80));

  const winnerShots = allShots.filter(s => s.outcome === 'winner' && !s.shotType.includes('serve'));
  const shotTypeWinners: Record<string, number> = {};

  winnerShots.forEach(shot => {
    shotTypeWinners[shot.shotType] = (shotTypeWinners[shot.shotType] || 0) + 1;
  });

  console.log(`\nWinner Shots by Type:`);
  Object.entries(shotTypeWinners)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  // Quality ranges
  console.log(`\n${'='.repeat(80)}`);
  console.log('QUALITY RANGES');
  console.log('='.repeat(80));

  const serves = allShots.filter(s => s.shotType.includes('serve'));
  const returns = allShots.filter(s => s.shotType.includes('return'));
  const groundstrokes = allShots.filter(s =>
    (s.shotType.includes('forehand') || s.shotType.includes('backhand')) &&
    !s.shotType.includes('return') && !s.shotType.includes('serve')
  );

  const avgQuality = (shots: typeof allShots) => {
    const sum = shots.reduce((acc, s) => acc + s.quality, 0);
    return shots.length > 0 ? sum / shots.length : 0;
  };

  const minMax = (shots: typeof allShots) => {
    if (shots.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...shots.map(s => s.quality)),
      max: Math.max(...shots.map(s => s.quality)),
    };
  };

  console.log(`\nServes (${serves.length} total):`);
  console.log(`  Average: ${avgQuality(serves).toFixed(1)}`);
  console.log(`  Range: ${minMax(serves).min.toFixed(1)} - ${minMax(serves).max.toFixed(1)}`);

  console.log(`\nReturns (${returns.length} total):`);
  console.log(`  Average: ${avgQuality(returns).toFixed(1)}`);
  console.log(`  Range: ${minMax(returns).min.toFixed(1)} - ${minMax(returns).max.toFixed(1)}`);

  console.log(`\nGroundstrokes (${groundstrokes.length} total):`);
  console.log(`  Average: ${avgQuality(groundstrokes).toFixed(1)}`);
  console.log(`  Range: ${minMax(groundstrokes).min.toFixed(1)} - ${minMax(groundstrokes).max.toFixed(1)}`);

  // Aces
  const aces = matchData.points.filter(p => p.pointType === 'ace');
  console.log(`\n${'='.repeat(80)}`);
  console.log('ACE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Total Aces: ${aces.length}`);
  console.log(`Ace Rate: ${(aces.length / matchData.points.length * 100).toFixed(1)}%`);

  if (aces.length > 0) {
    console.log(`\nAce Details:`);
    aces.forEach((point, idx) => {
      const serve = point.shots[0];
      console.log(`  ${idx + 1}. Point ${point.pointNumber}: Quality ${serve.quality.toFixed(1)}, Threshold ${serve.thresholds?.winner.toFixed(1)}`);
    });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Analysis complete. Data saved to: ${filename}`);
  console.log('='.repeat(80));
}

main();
