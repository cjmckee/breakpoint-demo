/**
 * Quick empirical check: does MatchStatistics.pointsWon agree with direct
 * point tallies from the match loop? (Investigating a serve/return
 * attribution discrepancy noticed during character balance sims.)
 *
 * Run with: npm run build:node && node --experimental-specifier-resolution=node dist/src/test/analysis/statsCheck.js
 */

import type { MatchFormat, MatchState, PlayerStats } from '../../types/index.js';
import { PlayerProfile } from '../../core/PlayerProfile.js';
import { PointSimulator } from '../../core/PointSimulator.js';
import { ScoreTracker } from '../../core/ScoreTracker.js';
import { MatchStatistics } from '../../core/MatchStatistics.js';
import { OPPONENTS_BY_TIER, getOpponentArchetypeProfile } from '../../data/opponents.js';

const CHARACTER: PlayerStats = {
  core: { serve: 72, forehand: 56, backhand: 45, return: 52, slice: 44 },
  technical: { volley: 40, overhead: 42, dropShot: 30, spin: 49, placement: 52 },
  physical: { speed: 53, stamina: 66, strength: 47, agility: 44, recovery: 55 },
  mental: { focus: 57, anticipation: 42, shotVariety: 36, offensive: 51, defensive: 58 },
};

const BO1: MatchFormat = { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: true, tiebreakAt: 6 };

const _origLog = console.log;
console.log = () => {};

const yuki = OPPONENTS_BY_TIER[2][4];
const yukiProfile = getOpponentArchetypeProfile(yuki);

let directPlayerServeWon = 0, directPlayerServeTotal = 0;
let directOppServeWon = 0, directOppServeTotal = 0;
let directPlayerReturnWon = 0, directOppReturnWon = 0;
let dfByPlayer = 0, dfByOpp = 0;
let statsPlayerServe = 0, statsPlayerReturn = 0, statsOppServe = 0, statsOppReturn = 0;

const N = 100;
for (let i = 0; i < N; i++) {
  const player = new PlayerProfile('character', 'You', CHARACTER);
  const opponent = new PlayerProfile('yuki', yuki.name, yuki.stats, yukiProfile);
  const tracker = new ScoreTracker(BO1);
  tracker.setInitialServer(Math.random() < 0.5 ? 'player' : 'opponent');
  const pointSim = new PointSimulator();
  const stats = new MatchStatistics(player, opponent);

  const matchState: MatchState = {
    score: tracker.getScore(),
    currentServer: tracker.getCurrentServer(),
    courtSurface: 'hard',
    momentum: 0,
    pressure: 'low',
    matchLength: 0,
    pointsPlayed: 0,
    isKeyMoment: false,
    fatigue: { player: 0, opponent: 0 },
  };

  let points = 0;
  while (!tracker.isComplete() && points < 600) {
    const server = tracker.getCurrentServer();
    const serverProfile = server === 'player' ? player : opponent;
    const returnerProfile = server === 'player' ? opponent : player;
    const breakPointFor = tracker.getBreakPointFor();

    const pr = pointSim.simulatePoint(server, serverProfile, returnerProfile, matchState, {}, {});
    const pointWinner = pr.winner === 'server' ? server : (server === 'player' ? 'opponent' : 'player');
    tracker.addPoint(pointWinner);
    stats.addPointResult(pr, server, breakPointFor);

    if (server === 'player') {
      directPlayerServeTotal++;
      if (pointWinner === 'player') directPlayerServeWon++;
      else {
        directOppReturnWon++;
        if (pr.pointType === 'double_fault') dfByPlayer++;
      }
    } else {
      directOppServeTotal++;
      if (pointWinner === 'opponent') directOppServeWon++;
      else {
        directPlayerReturnWon++;
        if (pr.pointType === 'double_fault') dfByOpp++;
      }
    }

    points++;
    matchState.score = tracker.getScore();
    matchState.currentServer = tracker.getCurrentServer();
    matchState.pointsPlayed = points;
  }

  stats.finalizeStatistics();
  const s = stats.getStatistics();
  statsPlayerServe += s.pointsWon.player.serve;
  statsPlayerReturn += s.pointsWon.player.return;
  statsOppServe += s.pointsWon.opponent.serve;
  statsOppReturn += s.pointsWon.opponent.return;
}

console.log = _origLog;

console.log(`Across ${N} Bo1 matches vs ${yuki.name}:`);
console.log(`  DIRECT: player serve won ${directPlayerServeWon}/${directPlayerServeTotal}, player return won ${directPlayerReturnWon} (${dfByOpp} via opp DF)`);
console.log(`  DIRECT: opp serve won ${directOppServeWon}/${directOppServeTotal}, opp return won ${directOppReturnWon} (${dfByPlayer} via player DF)`);
console.log(`  STATS : pointsWon.player = serve ${statsPlayerServe}, return ${statsPlayerReturn}`);
console.log(`  STATS : pointsWon.opponent = serve ${statsOppServe}, return ${statsOppReturn}`);
console.log('');
console.log('  Expected match: stats.player.serve == direct player serve won, etc.');
console.log('  (stats excludes double-fault wins from .return by design — see updateBasicStatistics)');
