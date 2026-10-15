/**
 * Season registry: each tier's fixed story beats, scheduled when the season
 * starts (SeasonManager). A tier with no entry has no authored season yet.
 */

import type { OpponentTier, SeasonSchedule } from '../../types/game';
import { CLUB_SEASON } from './club';
import { REGIONAL_SEASON } from './regional';

export const SEASON_SCHEDULES: Partial<Record<OpponentTier, SeasonSchedule>> = {
  1: CLUB_SEASON,
};

/**
 * Seasons laid out but not yet written. They are never scheduled; seasonCheck
 * lists the events each one still needs. Move one into SEASON_SCHEDULES when
 * its events exist.
 */
export const DRAFT_SEASONS: Partial<Record<OpponentTier, SeasonSchedule>> = {
  2: REGIONAL_SEASON,
};
