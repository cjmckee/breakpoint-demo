/**
 * Player Stats Utilities
 * Shared functions for calculating and displaying player statistics
 */

import type { PlayerStats, PlayStyle, StatName, CourtSurface } from '../types';
import type { OpponentTier } from '../types/game';
import type { ArchetypeType } from '../data/archetypes';
import { getArchetypeLabel as getArchetypeLabelRaw, ARCHETYPE_DATA } from '../data/archetypes';

export function calculateOverallRating(stats: PlayerStats): number {
  const coreAvg = (stats.core.serve + stats.core.forehand + stats.core.backhand + stats.core.return + stats.core.slice) / 5;
  const technicalAvg = (stats.technical.volley + stats.technical.overhead + stats.technical.dropShot + stats.technical.spin + stats.technical.placement) / 5;
  const physicalAvg = (stats.physical.speed + stats.physical.stamina + stats.physical.strength + stats.physical.agility + stats.physical.recovery) / 5;
  const mentalAvg = (stats.mental.focus + stats.mental.anticipation + stats.mental.shotVariety + stats.mental.offensive + stats.mental.defensive) / 5;

  return Math.round(
    coreAvg * 0.45 +
    technicalAvg * 0.15 +
    physicalAvg * 0.25 +
    mentalAvg * 0.15
  );
}

export function getTierLabel(tier: OpponentTier | number): string {
  switch (tier) {
    case 1: return 'Club';
    case 2: return 'Regional';
    case 3: return 'Professional';
    case 4: return 'Elite';
    case 5: return 'Champion';
    default: return 'Unknown';
  }
}

export function getTierColor(tier: OpponentTier | number): string {
  switch (tier) {
    case 1: return 'border-green-500';
    case 2: return 'border-yellow-500';
    case 3: return 'border-orange-500';
    case 4: return 'border-red-500';
    default: return 'border-pixel-border';
  }
}

export function getSurfaceEmoji(surface: CourtSurface | string): string {
  switch (surface) {
    case 'hard': return '🏟️';
    case 'clay': return '🧱';
    case 'grass': return '🌱';
    case 'carpet': return '📋';
    default: return '🎾';
  }
}

export interface StatDisplay {
  name: StatName;
  value: number;
  label: string;
}

export const STAT_LABELS: Record<StatName, string> = {
  serve: 'Serve',
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  slice: 'Slice',
  volley: 'Volley',
  overhead: 'Overhead',
  dropShot: 'Drop Shot',
  spin: 'Spin',
  placement: 'Placement',
  speed: 'Speed',
  stamina: 'Stamina',
  strength: 'Strength',
  agility: 'Agility',
  recovery: 'Recovery',
  focus: 'Focus',
  anticipation: 'Anticipation',
  shotVariety: 'Shot Variety',
  offensive: 'Offensive',
  defensive: 'Defensive',
};

export function flattenStats(stats: PlayerStats): StatDisplay[] {
  const entries: StatDisplay[] = [];

  (Object.entries(stats.core) as [keyof typeof stats.core, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });
  (Object.entries(stats.technical) as [keyof typeof stats.technical, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });
  (Object.entries(stats.physical) as [keyof typeof stats.physical, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });
  (Object.entries(stats.mental) as [keyof typeof stats.mental, number][]).forEach(([key, value]) => {
    entries.push({ name: key, value, label: STAT_LABELS[key] });
  });

  return entries;
}

export function getTopNStats(stats: PlayerStats, n: number): StatDisplay[] {
  return flattenStats(stats)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function getBottomNStats(stats: PlayerStats, n: number): StatDisplay[] {
  return flattenStats(stats)
    .sort((a, b) => a.value - b.value)
    .slice(0, n);
}

export function getArchetypeLabel(playStyleType: string): string {
  if (playStyleType in ARCHETYPE_DATA) {
    return getArchetypeLabelRaw(playStyleType as ArchetypeType);
  }
  return 'Unknown';
}

export function getArchetypeData(playStyleType: string) {
  if (playStyleType in ARCHETYPE_DATA) {
    return ARCHETYPE_DATA[playStyleType as ArchetypeType];
  }
  return null;
}

export function validatePlayStyle(playStyle: PlayStyle): boolean {
  return (
    playStyle != null &&
    typeof playStyle.type === 'string' &&
    typeof playStyle.description === 'string'
  );
}

export interface LetterGrade {
  grade: string;
  color: string;
}

export function getLetterGrade(value: number): LetterGrade {
  if (value >= 95) return { grade: 'A+', color: '#FF6B35' };
  if (value >= 90) return { grade: 'A', color: '#FF8C42' };
  if (value >= 85) return { grade: 'A-', color: '#FFAF42' };
  if (value >= 80) return { grade: 'B+', color: '#FFD23F' };
  if (value >= 75) return { grade: 'B', color: '#BFFF3C' };
  if (value >= 70) return { grade: 'B-', color: '#8FFF8F' };
  if (value >= 65) return { grade: 'C+', color: '#4ECDC4' };
  if (value >= 60) return { grade: 'C', color: '#45B7D1' };
  if (value >= 55) return { grade: 'C-', color: '#6C7CE0' };
  if (value >= 50) return { grade: 'D+', color: '#A683E3' };
  if (value >= 45) return { grade: 'D', color: '#B19CD9' };
  if (value >= 40) return { grade: 'D-', color: '#C8C8C8' };
  return { grade: 'F', color: '#96A7B7' };
}