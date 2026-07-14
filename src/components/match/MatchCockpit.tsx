/**
 * Match Cockpit
 * Tier-1 focus panel for the live match: hero scoreboard (big live point score, server
 * indicator, set pips, games), a center-out momentum tug-of-war bar, and the court
 * flanked by large stamina tanks.
 *
 * Court tokens are static for now — rally animation lands in a later stage.
 */

import React from 'react';
import type { CourtSurface } from '../../types';
import type { MatchScore } from '../../types/keyMoments';
import type { InteractiveMatchConfig } from '../../types/keyMoments';
import { MatchCourt } from './MatchCourt';

interface MatchCockpitProps {
  courtSurface: CourtSurface;
  score: MatchScore;
  playerName: string;
  opponentName: string;
  matchFormat?: InteractiveMatchConfig['matchFormat'];
  /** Optional overlay (e.g. toasts) rendered absolutely over the court region. */
  overlay?: React.ReactNode;
}

// Sets required to win the match, by format (drives the number of set pips)
const setsToWinFor = (format?: InteractiveMatchConfig['matchFormat']): number =>
  format === 'best-of-1' ? 1 : format === 'best-of-5' ? 3 : 2;

// Format a game-point total for display (0 / 15 / 30 / 40 / AD, or raw numbers in a tiebreak)
const formatGamePoints = (points: number, opponentPoints: number, isTiebreak: boolean): string => {
  if (isTiebreak) return String(points);
  const labels = ['0', '15', '30', '40'];
  if (points < 3 || opponentPoints < 3) return labels[Math.min(points, 3)] ?? '0';
  if (points === opponentPoints) return '40';
  if (points > opponentPoints) return 'AD';
  return '40';
};

const ServeDot: React.FC = () => (
  <span
    className="inline-block w-3 h-3 rounded-full bg-pixel-warning shrink-0"
    style={{ boxShadow: '0 0 0 3px rgba(243, 156, 18, 0.22)' }}
    title="Serving"
    aria-label="Serving"
  />
);

interface SetPipsProps {
  won: number;
  total: number;
  who: 'player' | 'opponent';
  alignEnd?: boolean;
}

const SetPips: React.FC<SetPipsProps> = ({ won, total, who, alignEnd }) => (
  <div className={`flex gap-1 ${alignEnd ? 'flex-row-reverse' : ''}`} aria-label={`${won} of ${total} sets won`}>
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`w-2.5 h-2.5 rounded-[2px] border-2 ${
          i < won
            ? who === 'player'
              ? 'bg-pixel-success border-pixel-success'
              : 'bg-pixel-error border-pixel-error'
            : 'border-pixel-border'
        }`}
      />
    ))}
  </div>
);

interface StaminaTankProps {
  value: number;
  label: string;
}

const StaminaTank: React.FC<StaminaTankProps> = ({ value, label }) => {
  const v = Math.max(0, Math.min(100, value));
  const fill = v > 60 ? 'bg-pixel-success' : v > 30 ? 'bg-pixel-warning' : 'bg-pixel-error';
  const text = v > 60 ? 'text-pixel-success' : v > 30 ? 'text-pixel-warning' : 'text-pixel-error';
  return (
    <div className="flex flex-col items-center gap-1.5 justify-end h-full">
      <div className="relative w-12 sm:w-14 flex-1 min-h-[150px] bg-pixel-secondary border-2 border-pixel-border rounded-md overflow-hidden flex items-end">
        <div className={`w-full transition-[height] duration-500 ease-out ${fill}`} style={{ height: `${v}%` }} />
      </div>
      <span className={`text-[10px] ${text}`}>{Math.round(v)}%</span>
      <span className="text-[8px] text-pixel-text-muted tracking-wide uppercase truncate max-w-[56px]">{label}</span>
    </div>
  );
};

export const MatchCockpit: React.FC<MatchCockpitProps> = ({
  courtSurface,
  score,
  playerName,
  opponentName,
  matchFormat,
  overlay,
}) => {
  const server = score.server;
  const momentum = score.momentum ?? 0;
  const isTiebreak = score.isTiebreak ?? false;

  const playerStamina = score.playerStamina ?? score.energy ?? 100;
  const opponentStamina = score.opponentStamina ?? 100;

  const currentSet = score.currentSet ?? { player: 0, opponent: 0 };
  const currentGame = score.currentGame ?? { player: 0, opponent: 0 };
  const setsWon = {
    player: score.sets.filter((s) => s.player > s.opponent).length,
    opponent: score.sets.filter((s) => s.opponent > s.player).length,
  };
  const setsToWin = setsToWinFor(matchFormat);

  const playerPoints = formatGamePoints(currentGame.player, currentGame.opponent, isTiebreak);
  const opponentPoints = formatGamePoints(currentGame.opponent, currentGame.player, isTiebreak);

  // Momentum tug-of-war geometry: bar grows from the center toward whoever leads.
  const mag = Math.min(50, Math.abs(momentum) / 2);
  const momentumStyle: React.CSSProperties =
    momentum >= 0 ? { left: '50%', width: `${mag}%` } : { width: `${mag}%`, left: `${50 - mag}%` };

  return (
    <div className="bg-pixel-primary rounded-lg p-4 shadow-lg border-2 border-pixel-border">
      {/* Scoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
        {/* Player */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {server === 'player' && <ServeDot />}
            <span className="text-sm sm:text-base font-bold text-pixel-success truncate">{playerName}</span>
          </div>
          <SetPips won={setsWon.player} total={setsToWin} who="player" />
          <span className="text-[10px] text-pixel-text-muted">Games {currentSet.player}</span>
        </div>

        {/* Big point score */}
        <div className="flex items-center gap-3 sm:gap-5 px-1">
          <div className="flex flex-col items-center min-w-[54px]">
            <span className="text-[8px] text-pixel-text-muted mb-1.5 uppercase truncate max-w-[72px]">You</span>
            <span className="text-3xl sm:text-5xl text-pixel-success leading-none">{playerPoints}</span>
          </div>
          <span className="text-xl sm:text-2xl text-pixel-text-muted self-center mt-3">–</span>
          <div className="flex flex-col items-center min-w-[54px]">
            <span className="text-[8px] text-pixel-text-muted mb-1.5 uppercase truncate max-w-[72px]">{opponentName}</span>
            <span className="text-3xl sm:text-5xl text-pixel-error leading-none">{opponentPoints}</span>
          </div>
        </div>

        {/* Opponent */}
        <div className="flex flex-col gap-1.5 items-end text-right min-w-0">
          <div className="flex items-center gap-2 flex-row-reverse min-w-0">
            {server === 'opponent' && <ServeDot />}
            <span className="text-sm sm:text-base font-bold text-pixel-error truncate">{opponentName}</span>
          </div>
          <SetPips won={setsWon.opponent} total={setsToWin} who="opponent" alignEnd />
          <span className="text-[10px] text-pixel-text-muted">Games {currentSet.opponent}</span>
        </div>
      </div>

      {/* Momentum tug-of-war */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] uppercase tracking-wide text-pixel-text-muted">Momentum</span>
          <span className="text-[9px] uppercase tracking-wide text-pixel-text-muted">
            {momentum >= 0 ? playerName : opponentName} +{Math.round(Math.abs(momentum))}
          </span>
        </div>
        <div className="relative h-[18px] bg-pixel-secondary border-2 border-pixel-border rounded-full overflow-hidden">
          <div
            className={`absolute top-0 bottom-0 transition-all duration-300 ${momentum >= 0 ? 'bg-pixel-success' : 'bg-pixel-error'}`}
            style={momentumStyle}
          />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-pixel-text opacity-60 -translate-x-1/2" />
        </div>
      </div>

      {/* Court flanked by stamina tanks */}
      <div className="mt-4 grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-stretch">
        <StaminaTank value={playerStamina} label="You" />

        <MatchCourt courtSurface={courtSurface} overlay={overlay} />

        <StaminaTank value={opponentStamina} label={opponentName} />
      </div>
    </div>
  );
};
