/**
 * Match Narrator
 * Generates human-readable narration for match events.
 * Pure utility — no React or store dependencies.
 */

import { PointType } from '../types';
import type { KeyMomentResult } from '../game/KeyMomentResolver';

/** Simple point data for narration (matches keyMoments.ts PointResult) */
interface NarrationPoint {
  winner: 'player' | 'opponent';
  outcome: string;       // PointType value
  shotType?: string;      // ShotType value of the decisive shot
  rallyLength?: number;
  server?: 'player' | 'opponent';
}

// Rotation index to cycle through template variations
let templateIndex = 0;
function nextTemplate<T>(templates: T[]): T {
  const t = templates[templateIndex % templates.length];
  templateIndex++;
  return t;
}

/**
 * Format a ShotType string into readable text.
 * e.g. 'forehand_power' → 'power forehand', 'drop_shot_backhand' → 'backhand drop shot'
 */
function formatShotType(shotType: string): string {
  // Special cases
  if (shotType === 'serve_first') return 'first serve';
  if (shotType === 'serve_second') return 'second serve';
  if (shotType === 'overhead') return 'overhead smash';
  if (shotType === 'defensive_overhead') return 'defensive overhead';

  // Pattern: prefix_suffix → "suffix prefix" (e.g. forehand_power → power forehand)
  const parts = shotType.split('_');

  // Handle "X_forehand" / "X_backhand" patterns (volley_forehand, drop_shot_forehand, etc.)
  const lastPart = parts[parts.length - 1];
  if (lastPart === 'forehand' || lastPart === 'backhand') {
    const prefix = parts.slice(0, -1).join(' ');
    return `${lastPart} ${prefix}`;
  }

  // Handle "forehand_X" / "backhand_X" patterns (forehand_power, backhand_approach)
  if (parts[0] === 'forehand' || parts[0] === 'backhand') {
    const suffix = parts.slice(1).join(' ');
    return `${suffix} ${parts[0]}`;
  }

  // Fallback: just join with spaces
  return parts.join(' ');
}

/**
 * Generate narration for a completed point.
 */
export function narratePoint(
  point: NarrationPoint,
  playerName: string,
  opponentName: string
): string {
  const winnerName = point.winner === 'player' ? playerName : opponentName;
  const loserName = point.winner === 'player' ? opponentName : playerName;
  const serverName = point.server === 'player' ? playerName : opponentName;
  const shotDesc = point.shotType ? formatShotType(point.shotType) : 'shot';
  const rallyPrefix = (point.rallyLength && point.rallyLength >= 8)
    ? `After a ${point.rallyLength}-shot rally, `
    : '';

  switch (point.outcome) {
    case PointType.ACE: {
      const templates = [
        `${serverName} serves an ace!`,
        `Ace from ${serverName}!`,
        `${serverName} fires an untouchable serve!`,
      ];
      return nextTemplate(templates);
    }

    case PointType.DOUBLE_FAULT: {
      const templates = [
        `${serverName} double faults.`,
        `Double fault from ${serverName}.`,
        `${serverName} can't find the service box — double fault.`,
      ];
      return nextTemplate(templates);
    }

    case PointType.WINNER: {
      const templates = [
        `${rallyPrefix}${winnerName} hits a ${shotDesc} winner!`,
        `${rallyPrefix}${winnerName} finishes the point with a ${shotDesc}!`,
        `${rallyPrefix}Clean ${shotDesc} winner from ${winnerName}!`,
        `${rallyPrefix}${winnerName} puts away the ${shotDesc}!`,
      ];
      return nextTemplate(templates);
    }

    case PointType.FORCED_ERROR: {
      const templates = [
        `${rallyPrefix}${winnerName} forces an error with a ${shotDesc}.`,
        `${rallyPrefix}${loserName} pushed into an error by ${winnerName}'s ${shotDesc}.`,
        `${rallyPrefix}Great pressure from ${winnerName} — forced error.`,
      ];
      return nextTemplate(templates);
    }

    case PointType.UNFORCED_ERROR: {
      const templates = [
        `${rallyPrefix}${loserName} makes an unforced error on the ${shotDesc}.`,
        `${rallyPrefix}Unforced error from ${loserName}.`,
        `${rallyPrefix}${loserName} puts the ${shotDesc} wide.`,
        `${rallyPrefix}Mistake from ${loserName} on the ${shotDesc}.`,
      ];
      return nextTemplate(templates);
    }

    default:
      return `${winnerName} wins the point.`;
  }
}

/**
 * Generate narration for a key moment result.
 */
export function narrateKeyMoment(
  result: KeyMomentResult,
  playerName: string
): string {
  const outcomeText = result.outcome === 'critical-success'
    ? 'INCREDIBLE! '
    : result.outcome === 'critical-failure'
    ? 'DISASTER! '
    : '';

  const won = result.pointWinner === 'player';
  const shotDesc = formatShotType(result.shotOutcome.shotType);

  if (won) {
    return `${outcomeText}${playerName} wins the key moment with a ${shotDesc}!`;
  } else {
    return `${outcomeText}${playerName} loses the key moment — ${shotDesc}.`;
  }
}
