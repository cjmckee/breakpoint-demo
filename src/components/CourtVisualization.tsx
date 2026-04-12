/**
 * Court Visualization Component
 * Displays an animated tennis court with player positions, scores, and match status
 */

import React from 'react';
import type { CourtSurface, CourtPosition } from '../types';
import type { MatchScore } from '../types/keyMoments';

interface CourtVisualizationProps {
  courtSurface: CourtSurface;
  score: MatchScore;
  server: 'player' | 'opponent';
  playerPosition?: CourtPosition;
  opponentPosition?: CourtPosition;
  momentum?: number; // -100 to 100 (positive = player favor)
  stamina?: number; // 0-100
  maxStamina?: number;
  playerName?: string;
  opponentName?: string;
  className?: string;
}

// Court surface color mappings
const getCourtColors = (surface: CourtSurface) => {
  switch (surface) {
    case 'hard':
      return { court: '#4A90E2', lines: '#FFFFFF' };
    case 'clay':
      return { court: '#CD853F', lines: '#FFFFFF' };
    case 'grass':
      return { court: '#228B22', lines: '#FFFFFF' };
    case 'carpet':
      return { court: '#6B46C1', lines: '#FFFFFF' };
    default:
      return { court: '#4A90E2', lines: '#FFFFFF' };
  }
};

// Convert court position enum to SVG coordinates
const getPositionCoordinates = (position: CourtPosition | undefined, isPlayer: boolean): { x: number; y: number } => {
  const baseX = isPlayer ? 40 : 260; // Left side for player, right for opponent
  const baseY = 75; // Center vertically

  if (!position) {
    return { x: baseX, y: baseY };
  }

  switch (position) {
    case 'well_positioned':
      return { x: baseX, y: baseY };
    case 'slightly_off':
      return { x: baseX + (isPlayer ? 15 : -15), y: baseY + 10 };
    case 'way_out_wide':
      return { x: baseX + (isPlayer ? 30 : -30), y: baseY + 20 };
    case 'way_back_deep':
      return { x: baseX, y: baseY + 25 };
    case 'at_net':
      return { x: baseX + (isPlayer ? 80 : -80), y: baseY };
    case 'recovering':
      return { x: baseX + (isPlayer ? 20 : -20), y: baseY + 15 };
    default:
      return { x: baseX, y: baseY };
  }
};

// Format points for tennis scoring (0, 15, 30, 40, AD)
export const CourtVisualization: React.FC<CourtVisualizationProps> = ({
  courtSurface,
  score,
  server,
  playerPosition,
  opponentPosition,
  momentum = 0,
  stamina = 100,
  maxStamina = 100,
  playerName = 'You',
  opponentName = 'Opponent',
  className = '',
}) => {
  const courtColors = getCourtColors(courtSurface);
  const playerCoords = getPositionCoordinates(playerPosition, true);
  const opponentCoords = getPositionCoordinates(opponentPosition, false);

  const staminaPercent = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));

  // Calculate current set score (from keyMoments MatchScore type)
  const currentSet = score.currentSet || { player: 0, opponent: 0 };

  // Calculate total sets won
  const setsWon = {
    player: score.sets.filter(s => s.player > s.opponent).length,
    opponent: score.sets.filter(s => s.opponent > s.player).length,
  };

  const isTiebreak = score.isTiebreak ?? false;

  const formatGamePoints = (points: number, opponentPoints: number): string => {
    // Tiebreak: numeric scoring (0, 1, 2, 3, ...)
    if (isTiebreak) return String(points);

    const labels = ['0', '15', '30', '40'];
    if (points < 3 || opponentPoints < 3) return labels[Math.min(points, 3)] ?? '0';
    // Both at 40+: deuce / advantage
    if (points === opponentPoints) return '40';
    if (points > opponentPoints) return 'AD';
    return '40';
  };

  return (
    <div className={`bg-pixel-primary rounded-lg p-4 shadow-lg border-2 border-pixel-border ${className}`}>
      {/* Score Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-pixel-text-muted">{playerName}</h3>
            {server === 'player' && (
              <span className="text-xs bg-pixel-success text-pixel-bg px-2 py-1 rounded-full font-bold">
                Serving
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-pixel-text">{currentSet.player}</div>
          <div className="text-sm text-pixel-text-muted">
            {formatGamePoints(score.currentGame?.player ?? 0, score.currentGame?.opponent ?? 0)}
          </div>
          <div className="text-xs text-pixel-text-muted mt-1">Sets: {setsWon.player}</div>
        </div>

        <div className="text-center px-4">
          <div className="text-xs text-pixel-text-muted mb-1">
            {courtSurface.charAt(0).toUpperCase() + courtSurface.slice(1)} Court
          </div>
          {isTiebreak ? (
            <div className="text-lg font-semibold text-pixel-warning">Tiebreak</div>
          ) : (
            <div className="text-lg font-semibold text-pixel-text">Set Score</div>
          )}
        </div>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-pixel-text-muted">{opponentName}</h3>
            {server === 'opponent' && (
              <span className="text-xs bg-pixel-error text-pixel-text px-2 py-1 rounded-full font-bold">
                Serving
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-pixel-text">{currentSet.opponent}</div>
          <div className="text-sm text-pixel-text-muted">
            {formatGamePoints(score.currentGame?.opponent ?? 0, score.currentGame?.player ?? 0)}
          </div>
          <div className="text-xs text-pixel-text-muted mt-1">Sets: {setsWon.opponent}</div>
        </div>
      </div>

      {/* Tennis Court SVG */}
      <div className="relative mx-auto mb-4" style={{ maxWidth: '500px' }}>
        <svg
          viewBox="0 0 300 150"
          className="w-full h-auto"
          style={{ aspectRatio: '2/1' }}
        >
          {/* Court Background */}
          <rect
            x="10"
            y="10"
            width="280"
            height="130"
            fill={courtColors.court}
            stroke={courtColors.lines}
            strokeWidth="2"
            rx="4"
          />

          {/* Center Line */}
          <line
            x1="150"
            y1="10"
            x2="150"
            y2="140"
            stroke={courtColors.lines}
            strokeWidth="1"
          />

          {/* Service Lines */}
          <line
            x1="70"
            y1="10"
            x2="70"
            y2="140"
            stroke={courtColors.lines}
            strokeWidth="1"
          />
          <line
            x1="230"
            y1="10"
            x2="230"
            y2="140"
            stroke={courtColors.lines}
            strokeWidth="1"
          />

          {/* Service Boxes (horizontal center line) */}
          <line
            x1="70"
            y1="75"
            x2="230"
            y2="75"
            stroke={courtColors.lines}
            strokeWidth="1"
          />

          {/* Player Icon (left side) - animated position */}
          <circle
            cx={playerCoords.x}
            cy={playerCoords.y}
            r="12"
            fill="#10B981"
            stroke="#FFFFFF"
            strokeWidth="2"
            className="transition-all duration-500 ease-in-out"
          />
          <text
            x={playerCoords.x}
            y={playerCoords.y + 5}
            textAnchor="middle"
            className="text-sm font-bold fill-white pointer-events-none"
          >
            P
          </text>

          {/* Opponent Icon (right side) - animated position */}
          <circle
            cx={opponentCoords.x}
            cy={opponentCoords.y}
            r="12"
            fill="#EF4444"
            stroke="#FFFFFF"
            strokeWidth="2"
            className="transition-all duration-500 ease-in-out"
          />
          <text
            x={opponentCoords.x}
            y={opponentCoords.y + 5}
            textAnchor="middle"
            className="text-sm font-bold fill-white pointer-events-none"
          >
            O
          </text>
        </svg>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stamina Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-pixel-text-muted">Stamina</span>
            <span className="text-xs text-pixel-text-muted">{Math.round(staminaPercent)}%</span>
          </div>
          <div className="w-full bg-pixel-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                staminaPercent > 60
                  ? 'bg-green-500'
                  : staminaPercent > 30
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
        </div>

        {/* Momentum Indicator */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-pixel-text-muted">Momentum</span>
            <span className="text-xs text-pixel-text-muted">
              {momentum > 0 ? '+' : ''}{momentum}
            </span>
          </div>
          <div className="w-full bg-pixel-secondary rounded-full h-2 relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-gray-400 transform -translate-x-0.5" />

            {/* Momentum bar */}
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                momentum > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                width: `${Math.abs(momentum) / 2}%`,
                marginLeft: momentum > 0 ? '50%' : `${50 - Math.abs(momentum) / 2}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Court Surface Badge */}
      <div className="mt-3 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pixel-secondary text-pixel-text border border-pixel-border">
          <div
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: courtColors.court }}
          />
          {courtSurface.charAt(0).toUpperCase() + courtSurface.slice(1)} Court
        </span>
      </div>
    </div>
  );
};
