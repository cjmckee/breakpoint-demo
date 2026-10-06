/**
 * Quick empirical check: does MatchStatistics.pointsWon agree with direct
 * point tallies from the match's own points? (Investigating a serve/return
 * attribution discrepancy noticed during character balance sims.)
 *
 * Run with: npm run build:node && node --experimental-specifier-resolution=node dist/src/test/analysis/statsCheck.js
 */

import type { PlayerStats } from '../../types';
import { PlayerProfile } from '../../core/PlayerProfile';
import { OPPONENTS_BY_TIER, getOpponentArchetypeProfile } from '../../data/opponents';
import { BO1, playMatch } from './simMatch';

const CHARACTER: PlayerStats = {
  core: { serve: 72, forehand: 56, backhand: 45, return: 52, net: 41 },
  technical: { slice: 44, spin: 49, placement: 52 },
  physical: { speed: 53, stamina: 66, strength: 47 },
  mental: { focus: 57, anticipation: 42, tactics: 55 },
};

const yuki = OPPONENTS_BY_TIER[2][4];
const yukiProfile = getOpponentArchetypeProfile(yuki);

let directPlayerServeWon = 0,
  directPlayerServeTotal = 0;
let directOppServeWon = 0,
  directOppServeTotal = 0;
let directPlayerReturnWon = 0,
  directOppReturnWon = 0;
let dfByPlayer = 0,
  dfByOpp = 0;
let statsPlayerServe = 0,
  statsPlayerReturn = 0,
  statsOppServe = 0,
  statsOppReturn = 0;

const N = 100;
for (let i = 0; i < N; i++) {
  const player = new PlayerProfile('character', 'You', CHARACTER);
  const opponent = new PlayerProfile('yuki', yuki.name, yuki.stats, yukiProfile);
  const match = playMatch(player, opponent, { format: BO1 });

  for (const pt of match.points) {
    if (pt.server === 'player') {
      directPlayerServeTotal++;
      if (pt.winner === 'player') directPlayerServeWon++;
      else {
        directOppReturnWon++;
        if (pt.pointType === 'double_fault') dfByPlayer++;
      }
    } else {
      directOppServeTotal++;
      if (pt.winner === 'opponent') directOppServeWon++;
      else {
        directPlayerReturnWon++;
        if (pt.pointType === 'double_fault') dfByOpp++;
      }
    }
  }

  const s = match.statistics;
  statsPlayerServe += s.pointsWon.player.serve;
  statsPlayerReturn += s.pointsWon.player.return;
  statsOppServe += s.pointsWon.opponent.serve;
  statsOppReturn += s.pointsWon.opponent.return;
}

console.log(`Across ${N} Bo1 matches vs ${yuki.name}:`);
console.log(
  `  DIRECT: player serve won ${directPlayerServeWon}/${directPlayerServeTotal}, player return won ${directPlayerReturnWon} (${dfByOpp} via opp DF)`,
);
console.log(
  `  DIRECT: opp serve won ${directOppServeWon}/${directOppServeTotal}, opp return won ${directOppReturnWon} (${dfByPlayer} via player DF)`,
);
console.log(`  STATS : pointsWon.player = serve ${statsPlayerServe}, return ${statsPlayerReturn}`);
console.log(`  STATS : pointsWon.opponent = serve ${statsOppServe}, return ${statsOppReturn}`);
console.log('');
console.log('  Expected match: stats.player.serve == direct player serve won, etc.');
console.log(
  '  (stats excludes double-fault wins from .return by design — see updateBasicStatistics)',
);
