import { MatchSimulator } from '../src/core/MatchSimulator.js';
import { PlayerProfile } from '../src/core/PlayerProfile.js';
import { saveMatchData } from '../src/utils/matchAnalysis.js';
console.log('='.repeat(80));
console.log('TENNIS RALLY ANALYSIS TEST');
console.log('='.repeat(80));
console.log('\n📊 Creating test players...\n');
const aggressive = new PlayerProfile('player_aggressive', 'Aggressive Andy', {
    technical: {
        serve: 80,
        forehand: 85,
        backhand: 60,
        volley: 70,
        overhead: 75,
        drop_shot: 50,
        slice: 45,
        return: 65,
        spin: 70,
        placement: 75,
    },
    physical: {
        speed: 70,
        stamina: 65,
        strength: 85,
        agility: 70,
        recovery: 60,
    },
    mental: {
        focus: 65,
        anticipation: 60,
        shot_variety: 55,
        offensive: 90,
        defensive: 40,
    },
});
aggressive.energy = 100;
aggressive.form = 80;
aggressive.confidence = 75;
const defensive = new PlayerProfile('player_defensive', 'Defensive Dan', {
    technical: {
        serve: 65,
        forehand: 70,
        backhand: 75,
        volley: 50,
        overhead: 55,
        drop_shot: 60,
        slice: 80,
        return: 85,
        spin: 65,
        placement: 80,
    },
    physical: {
        speed: 85,
        stamina: 90,
        strength: 60,
        agility: 85,
        recovery: 90,
    },
    mental: {
        focus: 80,
        anticipation: 85,
        shot_variety: 70,
        offensive: 40,
        defensive: 95,
    },
});
defensive.energy = 100;
defensive.form = 80;
defensive.confidence = 75;
console.log(`Player 1: ${aggressive.name}`);
console.log(`  - Overall Rating: ${aggressive.overallRating}`);
console.log(`  - Play Style: ${aggressive.playStyle.type} (aggression: ${aggressive.playStyle.aggression})`);
console.log(`  - Key Stats: FH ${aggressive.stats.technical.forehand}, BH ${aggressive.stats.technical.backhand}, Offensive ${aggressive.stats.mental.offensive}`);
console.log(`\nPlayer 2: ${defensive.name}`);
console.log(`  - Overall Rating: ${defensive.overallRating}`);
console.log(`  - Play Style: ${defensive.playStyle.type} (consistency: ${defensive.playStyle.consistency})`);
console.log(`  - Key Stats: FH ${defensive.stats.technical.forehand}, BH ${defensive.stats.technical.backhand}, Defensive ${defensive.stats.mental.defensive}`);
const config = {
    player: aggressive,
    opponent: defensive,
    courtSurface: 'hard',
    matchFormat: {
        bestOfSets: 3,
        gamesPerSet: 6,
        enableTiebreaks: true,
        tiebreakAt: 6,
    },
};
console.log('\n' + '='.repeat(80));
console.log('SIMULATING MATCH');
console.log('='.repeat(80));
console.log();
const simulator = new MatchSimulator(config);
const result = simulator.simulateMatch();
console.log('\n' + '='.repeat(80));
console.log('MATCH COMPLETE');
console.log('='.repeat(80));
console.log(`\n🏆 Winner: ${result.winner === 'player' ? aggressive.name : defensive.name}`);
console.log(`📊 Final Score: ${result.finalScore}`);
console.log(`⏱️  Duration: ${result.duration} minutes`);
console.log(`🎾 Points Played: ${result.statistics.totalPoints.player + result.statistics.totalPoints.opponent}`);
console.log('\n' + '='.repeat(80));
console.log('EXPORTING MATCH DATA');
console.log('='.repeat(80));
console.log();
const matchData = simulator.exportMatchData();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const filename = `aggressive-vs-defensive-${timestamp}.json`;
const filePath = saveMatchData(matchData, `./analysis/${filename}`);
console.log(`✅ Match data exported successfully`);
console.log(`📁 File: ${filePath}`);
console.log(`📦 Size: ${Math.round(JSON.stringify(matchData).length / 1024)} KB`);
console.log(`🎯 Points captured: ${matchData.points.length}`);
console.log(`🏸 Total shots: ${matchData.points.reduce((sum, p) => sum + p.shots.length, 0)}`);
console.log('\n' + '─'.repeat(80));
console.log('\n✅ Test complete!');
console.log('\n📖 For more information, see: docs/rally-analysis-subagent.md');
console.log();
