/**
 * Promotion playoffs, by id. A tier-final names its playoff with `playoffId`;
 * losing the tier-final schedules the first attempt (PlayoffManager).
 */

import type { PlayoffConfig } from '../types/game';

export const PLAYOFFS: Record<string, PlayoffConfig> = {};

export function getPlayoff(id: string | undefined): PlayoffConfig | undefined {
  return id === undefined ? undefined : PLAYOFFS[id];
}
