import { PlayerProfile } from './core/PlayerProfile.js';
import { MatchSimulator } from './core/MatchSimulator.js';
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
window.applyArchetype = (player, archetype) => {
    const stats = ARCHETYPES[archetype];
    Object.entries(stats.technical).forEach(([stat, value]) => {
        const input = document.getElementById(`${player}-${stat}`);
        if (input)
            input.value = value.toString();
    });
    Object.entries(stats.physical).forEach(([stat, value]) => {
        const input = document.getElementById(`${player}-${stat}`);
        if (input)
            input.value = value.toString();
    });
    Object.entries(stats.mental).forEach(([stat, value]) => {
        const input = document.getElementById(`${player}-${stat}`);
        if (input)
            input.value = value.toString();
    });
    window.updateDisplay(player);
};
window.updateDisplay = (player) => {
    const stats = [
        'serve', 'forehand', 'backhand', 'return', 'volley',
        'speed', 'stamina', 'strength',
        'focus', 'offensive', 'defensive'
    ];
    let totalRating = 0;
    let count = 0;
    stats.forEach(stat => {
        const input = document.getElementById(`${player}-${stat}`);
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
    const offensive = parseInt(document.getElementById(`${player}-offensive`)?.value) || 50;
    const defensive = parseInt(document.getElementById(`${player}-defensive`)?.value) || 50;
    const volley = parseInt(document.getElementById(`${player}-volley`)?.value) || 50;
    let style = 'Balanced';
    if (volley >= 70 && offensive >= 60)
        style = 'Serve & Volley';
    else if (defensive >= 70 && offensive <= 40)
        style = 'Counterpuncher';
    else if (offensive >= 70 && defensive <= 40)
        style = 'Aggressive';
    else if (defensive >= 60)
        style = 'Defensive';
    const styleDisplay = document.getElementById(`${player}-style`);
    if (styleDisplay) {
        styleDisplay.textContent = style;
    }
};
window.getPlayerStats = (player) => {
    const getValue = (stat) => parseInt(document.getElementById(`${player}-${stat}`)?.value) || 50;
    return {
        technical: {
            serve: getValue('serve'),
            forehand: getValue('forehand'),
            backhand: getValue('backhand'),
            volley: getValue('volley'),
            overhead: 50,
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
    const player1Name = document.getElementById('player1-name')?.value || 'Player 1';
    const player2Name = document.getElementById('player2-name')?.value || 'Player 2';
    const player1Stats = window.getPlayerStats('player1');
    const player2Stats = window.getPlayerStats('player2');
    window.log(`🎾 Starting match simulation...`, 'match');
    window.log(`${player1Name} vs ${player2Name}`, 'game');
    document.getElementById('match-display')?.classList.add('active');
    const player1 = new PlayerProfile('player1', player1Name, player1Stats);
    const player2 = new PlayerProfile('player2', player2Name, player2Stats);
    window.log(`Player ratings: ${player1.overallRating} vs ${player2.overallRating}`, 'point');
    const config = {
        player: player1,
        opponent: player2,
        courtSurface: 'hard',
        matchFormat: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 },
        initialServer: 'player'
    };
    setTimeout(() => {
        const simulator = new MatchSimulator(config);
        const result = simulator.simulateMatch();
        window.log(`\n🏆 Match Result: ${result.winner === 'player' ? player1Name : player2Name} wins ${result.finalScore}`, 'match');
        window.log(`Total duration: ${result.duration} minutes`, 'game');
        displayMatchResult(result, player1Name, player2Name);
    }, 100);
};
window.simulateMultiple = () => {
    const player1Name = document.getElementById('player1-name')?.value || 'Player 1';
    const player2Name = document.getElementById('player2-name')?.value || 'Player 2';
    const player1Stats = window.getPlayerStats('player1');
    const player2Stats = window.getPlayerStats('player2');
    window.log(`📊 Running 10 match simulation...`, 'match');
    document.getElementById('match-display')?.classList.add('active');
    const player1 = new PlayerProfile('player1', player1Name, player1Stats);
    const player2 = new PlayerProfile('player2', player2Name, player2Stats);
    const config = {
        player: player1,
        opponent: player2,
        courtSurface: 'hard',
        matchFormat: { bestOfSets: 1, gamesPerSet: 6, enableTiebreaks: false, tiebreakAt: 6 },
        initialServer: 'player'
    };
    setTimeout(() => {
        const results = MatchSimulator.simulateMultipleMatches(config, 10);
        const player1Wins = results.filter(r => r.winner === 'player').length;
        const winRate = (player1Wins / 10 * 100).toFixed(1);
        window.log(`\n📈 Series Results: ${player1Name} won ${player1Wins}/10 matches (${winRate}%)`, 'match');
        displayMatchResult(results[results.length - 1], player1Name, player2Name);
    }, 100);
};
window.log = (message, type = 'point') => {
    const logPanel = document.getElementById('log-panel');
    if (!logPanel)
        return;
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
            const input = document.getElementById(`${player}-${stat}`);
            if (input)
                input.value = '50';
        });
        window.updateDisplay(player);
    });
    document.getElementById('player1-name').value = 'Player 1';
    document.getElementById('player2-name').value = 'Player 2';
    const logPanel = document.getElementById('log-panel');
    if (logPanel) {
        logPanel.innerHTML = '<div class="log-entry">Players reset to default values.</div>';
    }
};
function displayMatchResult(result, player1Name, player2Name) {
    const winnerName = result.winner === 'player' ? player1Name : player2Name;
    const scoreDiv = document.getElementById('live-score');
    if (scoreDiv) {
        scoreDiv.innerHTML = `
      <div class="score-line">${winnerName} wins ${result.finalScore}</div>
      <div class="match-info">${result.duration} minutes</div>
    `;
    }
    const stats = result.statistics;
    const statsContent = document.getElementById('stats-content');
    if (statsContent && stats) {
        statsContent.innerHTML = `
      <div class="stat-line">
        <span>Total Points</span>
        <span class="player-stat">${stats.totalPoints?.player ?? -1}</span>
        <span class="opponent-stat">${stats.totalPoints?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Aces</span>
        <span class="player-stat">${stats.aces?.player ?? -1}</span>
        <span class="opponent-stat">${stats.aces?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Double Faults</span>
        <span class="player-stat">${stats.doubleFaults?.player ?? -1}</span>
        <span class="opponent-stat">${stats.doubleFaults?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Winners</span>
        <span class="player-stat">${stats.winners?.player ?? -1}</span>
        <span class="opponent-stat">${stats.winners?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Total Errors</span>
        <span class="player-stat">${stats.errors?.player ?? -1}</span>
        <span class="opponent-stat">${stats.errors?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Unforced Errors</span>
        <span class="player-stat">${stats.unforcedErrors?.player ?? -1}</span>
        <span class="opponent-stat">${stats.unforcedErrors?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Forced Errors</span>
        <span class="player-stat">${stats.forcedErrors?.player ?? -1}</span>
        <span class="opponent-stat">${stats.forcedErrors?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>First Serve %</span>
        <span class="player-stat">${stats.firstServePercentage?.player?.toFixed(1) ?? '-1.0'}%</span>
        <span class="opponent-stat">${stats.firstServePercentage?.opponent?.toFixed(1) ?? '-1.0'}%</span>
      </div>
      <div class="stat-line">
        <span>First Serve Points Won</span>
        <span class="player-stat">${stats.firstServePointsWon?.player ?? -1}</span>
        <span class="opponent-stat">${stats.firstServePointsWon?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Second Serve %</span>
        <span class="player-stat">${stats.secondServePercentage?.player?.toFixed(1) ?? '-1.0'}%</span>
        <span class="opponent-stat">${stats.secondServePercentage?.opponent?.toFixed(1) ?? '-1.0'}%</span>
      </div>
      <div class="stat-line">
        <span>Second Serve Points Won</span>
        <span class="player-stat">${stats.secondServePointsWon?.player ?? -1}</span>
        <span class="opponent-stat">${stats.secondServePointsWon?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Points Won on Serve</span>
        <span class="player-stat">${stats.pointsWon?.player?.serve ?? -1}</span>
        <span class="opponent-stat">${stats.pointsWon?.opponent?.serve ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Points Won on Return</span>
        <span class="player-stat">${stats.pointsWon?.player?.return ?? -1}</span>
        <span class="opponent-stat">${stats.pointsWon?.opponent?.return ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Break Points Converted</span>
        <span class="player-stat">${stats.breakPointsConverted?.player ?? -1}/${stats.breakPointOpportunities?.player ?? -1}</span>
        <span class="opponent-stat">${stats.breakPointsConverted?.opponent ?? -1}/${stats.breakPointOpportunities?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Net Points Won</span>
        <span class="player-stat">${stats.netPointsWon?.player ?? -1}</span>
        <span class="opponent-stat">${stats.netPointsWon?.opponent ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Avg Rally Length (Overall)</span>
        <span class="player-stat">${stats.averageRallyLength?.toFixed(1) ?? '-1.0'}</span>
        <span class="opponent-stat">${stats.averageRallyLength?.toFixed(1) ?? '-1.0'}</span>
      </div>
      <div class="stat-line">
        <span>Avg Rally Length Won</span>
        <span class="player-stat">${stats.averageRallyLengthWon?.player?.toFixed(1) ?? '-1.0'}</span>
        <span class="opponent-stat">${stats.averageRallyLengthWon?.opponent?.toFixed(1) ?? '-1.0'}</span>
      </div>
      <div class="stat-line">
        <span>Longest Rally (Overall)</span>
        <span class="player-stat">${stats.longestRally ?? -1}</span>
        <span class="opponent-stat">${stats.longestRally ?? -1}</span>
      </div>
      <div class="stat-line">
        <span>Longest Rally Won</span>
        <span class="player-stat">${stats.longestRallyWon?.player ?? -1}</span>
        <span class="opponent-stat">${stats.longestRallyWon?.opponent ?? -1}</span>
      </div>
    `;
    }
    displayShotTypeStats(stats, player1Name, player2Name);
}
function displayShotTypeStats(stats, player1Name, player2Name) {
    const shotStatsDiv = document.getElementById('shot-stats-content');
    if (!shotStatsDiv || !stats?.shotTypeStats)
        return;
    console.log('Shot Type Stats:', stats.shotTypeStats);
    const groundstrokes = ['forehand', 'backhand', 'topspin_forehand', 'topspin_backhand', 'slice_forehand', 'slice_backhand'];
    const serves = ['serve_first', 'serve_second', 'kick_serve'];
    const returns = ['return_forehand', 'return_backhand', 'return_forehand_power', 'return_backhand_power'];
    const netPlay = ['volley_forehand', 'volley_backhand', 'half_volley_forehand', 'half_volley_backhand', 'overhead'];
    const approaches = ['forehand_approach', 'backhand_approach'];
    const tactical = ['drop_shot_forehand', 'drop_shot_backhand', 'lob_forehand', 'lob_backhand', 'angle_shot_forehand', 'angle_shot_backhand', 'passing_shot_forehand', 'passing_shot_backhand', 'down_the_line_forehand', 'down_the_line_backhand', 'cross_court_forehand', 'cross_court_backhand', 'defensive_slice_forehand', 'defensive_slice_backhand', 'defensive_overhead', 'short_angle_forehand', 'short_angle_backhand'];
    const powerShots = ['forehand_power', 'backhand_power', 'return_forehand_power', 'return_backhand_power'];
    let html = '<div class="stat-line shot-detail header"><span>Shot Type</span><span>P1 Att</span><span>P2 Att</span><span>P1 Err</span><span>P2 Err</span><span>P1 Win</span><span>P2 Win</span></div>';
    const addShotCategory = (categoryName, shotTypes) => {
        const relevantShots = shotTypes.filter(type => stats.shotTypeStats[type]);
        if (relevantShots.length === 0)
            return;
        html += `<div class="stat-category">${categoryName}</div>`;
        relevantShots.forEach(shotType => {
            const shotStats = stats.shotTypeStats[shotType];
            const displayName = shotType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            html += `
        <div class="stat-line shot-detail">
          <span class="shot-name">${displayName}</span>
          <span class="player-stat">${shotStats.attempts?.player ?? -1}</span>
          <span class="opponent-stat">${shotStats.attempts?.opponent ?? -1}</span>
          <span class="player-stat">${shotStats.unforcedErrors?.player ?? -1}/${shotStats.errors?.player ?? -1}</span>
          <span class="opponent-stat">${shotStats.unforcedErrors?.opponent ?? -1}/${shotStats.errors?.opponent ?? -1}</span>
          <span class="player-stat">${shotStats.winners?.player ?? -1}</span>
          <span class="opponent-stat">${shotStats.winners?.opponent ?? -1}</span>
        </div>
      `;
        });
    };
    addShotCategory('GROUNDSTROKES', groundstrokes);
    addShotCategory('SERVES', serves);
    addShotCategory('RETURNS', returns);
    addShotCategory('APPROACH SHOTS', approaches);
    addShotCategory('NET PLAY', netPlay);
    addShotCategory('POWER SHOTS', powerShots);
    addShotCategory('TACTICAL SHOTS', tactical);
    shotStatsDiv.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', () => {
    window.updateDisplay('player1');
    window.updateDisplay('player2');
    console.log('🎾 Tennis Match Simulator initialized with real TypeScript engine');
});
