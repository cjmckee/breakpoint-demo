/**
 * Main entry point for browser-based match simulator
 * Connects the HTML UI to the TypeScript match engine
 */

import { PlayerProfile } from './core/PlayerProfile.js';
import { MatchSimulator, type MatchConfig } from './core/MatchSimulator.js';
import type { CourtSurface, PlayerStats } from './types/index.js';

// Player archetypes for quick setup
const ARCHETYPES = {
  beginner: {
    technical: {
      serve: 25, forehand: 30, backhand: 25, volley: 20, overhead: 20,
      drop_shot: 15, slice: 20, return: 30, spin: 20, placement: 20
    },
    physical: {
      speed: 35, stamina: 40, strength: 30, agility: 30, recovery: 35
    },
    mental: {
      focus: 25, anticipation: 25, shot_variety: 20, offensive: 30, defensive: 40
    }
  },
  baseline: {
    technical: {
      serve: 50, forehand: 70, backhand: 70, volley: 35, overhead: 40,
      drop_shot: 45, slice: 60, return: 65, spin: 65, placement: 60
    },
    physical: {
      speed: 60, stamina: 70, strength: 55, agility: 55, recovery: 65
    },
    mental: {
      focus: 60, anticipation: 60, shot_variety: 55, offensive: 45, defensive: 75
    }
  },
  aggressive: {
    technical: {
      serve: 75, forehand: 80, backhand: 65, volley: 70, overhead: 75,
      drop_shot: 50, slice: 55, return: 55, spin: 60, placement: 65
    },
    physical: {
      speed: 65, stamina: 55, strength: 80, agility: 65, recovery: 60
    },
    mental: {
      focus: 65, anticipation: 60, shot_variety: 65, offensive: 85, defensive: 35
    }
  },
  serveVolley: {
    technical: {
      serve: 85, forehand: 60, backhand: 55, volley: 85, overhead: 80,
      drop_shot: 55, slice: 65, return: 50, spin: 50, placement: 70
    },
    physical: {
      speed: 70, stamina: 60, strength: 70, agility: 75, recovery: 65
    },
    mental: {
      focus: 70, anticipation: 70, shot_variety: 70, offensive: 75, defensive: 50
    }
  },
  defensive: {
    technical: {
      serve: 45, forehand: 65, backhand: 75, volley: 40, overhead: 45,
      drop_shot: 50, slice: 75, return: 80, spin: 70, placement: 65
    },
    physical: {
      speed: 80, stamina: 85, strength: 45, agility: 80, recovery: 85
    },
    mental: {
      focus: 80, anticipation: 80, shot_variety: 65, offensive: 25, defensive: 90
    }
  }
};

// Make functions available globally for HTML onclick handlers
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

window.applyArchetype = (player: string, archetype: keyof typeof ARCHETYPES) => {
  const stats = ARCHETYPES[archetype];

  Object.entries(stats.technical).forEach(([stat, value]) => {
    const input = document.getElementById(`${player}-${stat}`) as HTMLInputElement;
    if (input) input.value = value.toString();
  });

  Object.entries(stats.physical).forEach(([stat, value]) => {
    const input = document.getElementById(`${player}-${stat}`) as HTMLInputElement;
    if (input) input.value = value.toString();
  });

  Object.entries(stats.mental).forEach(([stat, value]) => {
    const input = document.getElementById(`${player}-${stat}`) as HTMLInputElement;
    if (input) input.value = value.toString();
  });

  window.updateDisplay(player);
};

window.updateDisplay = (player: string) => {
  const stats = [
    'serve', 'forehand', 'backhand', 'return', 'volley',
    'speed', 'stamina', 'strength',
    'focus', 'offensive', 'defensive'
  ];

  let totalRating = 0;
  let count = 0;

  stats.forEach(stat => {
    const input = document.getElementById(`${player}-${stat}`) as HTMLInputElement;
    const display = document.getElementById(`${player}-${stat}-display`);
    if (input && display) {
      const value = parseInt(input.value) || 0;
      display.textContent = value.toString();
      totalRating += value;
      count++;
    }
  });

  const rating = Math.round(totalRating / count);
  const ratingDisplay = document.getElementById(`${player}-rating`);
  if (ratingDisplay) {
    ratingDisplay.textContent = rating.toString();
  }

  // Update style
  const offensive = parseInt((document.getElementById(`${player}-offensive`) as HTMLInputElement)?.value) || 50;
  const defensive = parseInt((document.getElementById(`${player}-defensive`) as HTMLInputElement)?.value) || 50;
  const volley = parseInt((document.getElementById(`${player}-volley`) as HTMLInputElement)?.value) || 50;

  let style = 'Balanced';
  if (volley >= 70 && offensive >= 60) style = 'Serve & Volley';
  else if (defensive >= 70 && offensive <= 40) style = 'Counterpuncher';
  else if (offensive >= 70 && defensive <= 40) style = 'Aggressive';
  else if (defensive >= 60) style = 'Defensive';

  const styleDisplay = document.getElementById(`${player}-style`);
  if (styleDisplay) {
    styleDisplay.textContent = style;
  }
};

window.getPlayerStats = (player: string): PlayerStats => {
  const getValue = (stat: string) => parseInt((document.getElementById(`${player}-${stat}`) as HTMLInputElement)?.value) || 50;

  return {
    technical: {
      serve: getValue('serve'),
      forehand: getValue('forehand'),
      backhand: getValue('backhand'),
      volley: getValue('volley'),
      overhead: 50, // Not in UI, use default
      drop_shot: 50,
      slice: 50,
      return: getValue('return'),
      spin: 50,
      placement: 50,
    },
    physical: {
      speed: getValue('speed'),
      stamina: getValue('stamina'),
      strength: getValue('strength'),
      agility: 50,
      recovery: 50,
    },
    mental: {
      focus: getValue('focus'),
      anticipation: 50,
      shot_variety: 50,
      offensive: getValue('offensive'),
      defensive: getValue('defensive'),
    },
  };
};

window.simulateMatch = () => {
  const player1Name = (document.getElementById('player1-name') as HTMLInputElement)?.value || 'Player 1';
  const player2Name = (document.getElementById('player2-name') as HTMLInputElement)?.value || 'Player 2';
  const player1Stats = window.getPlayerStats('player1');
  const player2Stats = window.getPlayerStats('player2');

  window.log(`🎾 Starting match simulation...`, 'match');
  window.log(`${player1Name} vs ${player2Name}`, 'game');

  // Show match display
  document.getElementById('match-display')?.classList.add('active');

  // Create player profiles
  const player1 = new PlayerProfile('player1', player1Name, player1Stats);
  const player2 = new PlayerProfile('player2', player2Name, player2Stats);

  window.log(`Player ratings: ${player1.overallRating} vs ${player2.overallRating}`, 'point');

  // Create match configuration
  const config: MatchConfig = {
    player: player1,
    opponent: player2,
    courtSurface: 'hard' as CourtSurface,
    matchFormat: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 },
    initialServer: 'player'
  };

  // Run simulation
  setTimeout(() => {
    const simulator = new MatchSimulator(config);
    const result = simulator.simulateMatch();

    window.log(`\n🏆 Match Result: ${result.winner === 'player' ? player1Name : player2Name} wins ${result.finalScore}`, 'match');
    window.log(`Total duration: ${result.duration} minutes`, 'game');

    // Display results
    displayMatchResult(result, player1Name, player2Name);
  }, 100);
};

window.simulateMultiple = () => {
  const player1Name = (document.getElementById('player1-name') as HTMLInputElement)?.value || 'Player 1';
  const player2Name = (document.getElementById('player2-name') as HTMLInputElement)?.value || 'Player 2';
  const player1Stats = window.getPlayerStats('player1');
  const player2Stats = window.getPlayerStats('player2');

  window.log(`📊 Running 10 match simulation...`, 'match');
  document.getElementById('match-display')?.classList.add('active');

  const player1 = new PlayerProfile('player1', player1Name, player1Stats);
  const player2 = new PlayerProfile('player2', player2Name, player2Stats);

  const config: MatchConfig = {
    player: player1,
    opponent: player2,
    courtSurface: 'hard' as CourtSurface,
    matchFormat: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 },
    initialServer: 'player'
  };

  setTimeout(() => {
    const results = MatchSimulator.simulateMultipleMatches(config, 10);
    const player1Wins = results.filter(r => r.winner === 'player').length;
    const winRate = (player1Wins / 10 * 100).toFixed(1);

    window.log(`\n📈 Series Results: ${player1Name} won ${player1Wins}/10 matches (${winRate}%)`, 'match');

    // Display last match
    displayMatchResult(results[results.length - 1], player1Name, player2Name);
  }, 100);
};

window.log = (message: string, type: string = 'point') => {
  const logPanel = document.getElementById('log-panel');
  if (!logPanel) return;

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logPanel.appendChild(entry);
  logPanel.scrollTop = logPanel.scrollHeight;
};

window.resetPlayers = () => {
  ['player1', 'player2'].forEach(player => {
    [
      'serve', 'forehand', 'backhand', 'return', 'volley',
      'speed', 'stamina', 'strength',
      'focus', 'offensive', 'defensive'
    ].forEach(stat => {
      const input = document.getElementById(`${player}-${stat}`) as HTMLInputElement;
      if (input) input.value = '50';
    });
    window.updateDisplay(player);
  });

  (document.getElementById('player1-name') as HTMLInputElement).value = 'Player 1';
  (document.getElementById('player2-name') as HTMLInputElement).value = 'Player 2';

  const logPanel = document.getElementById('log-panel');
  if (logPanel) {
    logPanel.innerHTML = '<div class="log-entry">Players reset to default values.</div>';
  }
};

function displayMatchResult(result: any, player1Name: string, player2Name: string) {
  const winnerName = result.winner === 'player' ? player1Name : player2Name;

  // Update score display
  const scoreDiv = document.getElementById('live-score');
  if (scoreDiv) {
    scoreDiv.innerHTML = `
      <div class="score-line">${winnerName} wins ${result.finalScore}</div>
      <div class="match-info">${result.duration} minutes</div>
    `;
  }

  // Update statistics
  const stats = result.statistics;
  const statsContent = document.getElementById('stats-content');
  if (statsContent && stats) {
    statsContent.innerHTML = `
      <div class="stat-line">
        <span>Total Points</span>
        <span>${stats.totalPoints?.player ?? -1}</span>
        <span>${stats.totalPoints?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Aces</span>
        <span>${stats.aces?.player ?? -1}</span>
        <span>${stats.aces?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Double Faults</span>
        <span>${stats.doubleFaults?.player ?? -1}</span>
        <span>${stats.doubleFaults?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Winners</span>
        <span>${stats.winners?.player ?? -1}</span>
        <span>${stats.winners?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Errors</span>
        <span>${stats.errors?.player ?? -1}</span>
        <span>${stats.errors?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>First Serve %</span>
        <span>${stats.firstServePercentage?.player?.toFixed(1) ?? '-1.0'}%</span>
        <span>${stats.firstServePercentage?.opponent?.toFixed(1) ?? '-1.0'}%</span>
      </div>
      <div class="stat-line">
        <span>First Serve Points Won</span>
        <span>${stats.firstServePointsWon?.player ?? -1}</span>
        <span>${stats.firstServePointsWon?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Second Serve %</span>
        <span>${stats.secondServePercentage?.player?.toFixed(1) ?? '-1.0'}%</span>
        <span>${stats.secondServePercentage?.opponent?.toFixed(1) ?? '-1.0'}%</span>
      </div>
      <div class="stat-line">
        <span>Second Serve Points Won</span>
        <span>${stats.secondServePointsWon?.player ?? -1}</span>
        <span>${stats.secondServePointsWon?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Points Won on Serve</span>
        <span>${stats.pointsWon?.player?.serve ?? -1}</span>
        <span>${stats.pointsWon?.opponent?.serve ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Points Won on Return</span>
        <span>${stats.pointsWon?.player?.return ?? -1}</span>
        <span>${stats.pointsWon?.opponent?.return ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Break Points Converted</span>
        <span>${stats.breakPointsConverted?.player ?? -1}/${stats.breakPointOpportunities?.player ?? -1}</span>
        <span>${stats.breakPointsConverted?.opponent ?? -1}/${stats.breakPointOpportunities?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Net Points Won</span>
        <span>${stats.netPointsWon?.player ?? -1}</span>
        <span>${stats.netPointsWon?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Avg Rally Length (Overall)</span>
        <span>${stats.averageRallyLength?.toFixed(1) ?? '-1.0'}</span>
        <span>${stats.averageRallyLength?.toFixed(1) ?? '-1.0'}</span>
      </div>
      <div class="stat-line">
        <span>Avg Rally Length Won</span>
        <span>${stats.averageRallyLengthWon?.player?.toFixed(1) ?? '-1.0'}</span>
        <span>${stats.averageRallyLengthWon?.opponent?.toFixed(1) ?? '-1.0'}</span>
      </div>
      <div class="stat-line">
        <span>Longest Rally (Overall)</span>
        <span>${stats.longestRally ?? -1}</span>
        <span>${stats.longestRally ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Longest Rally Won</span>
        <span>${stats.longestRallyWon?.player ?? -1}</span>
        <span>${stats.longestRallyWon?.opponent ?? -1}</span>
      </div>
    `;
  }
}

// Initialize displays on page load
document.addEventListener('DOMContentLoaded', () => {
  window.updateDisplay('player1');
  window.updateDisplay('player2');
  console.log('🎾 Tennis Match Simulator initialized with real TypeScript engine');
});
