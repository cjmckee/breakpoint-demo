/**
 * Season registry: each tier's fixed story beats, scheduled when the season
 * starts (SeasonManager). A tier with no entry has no authored season yet.
 */

import type { OpponentTier, SeasonSchedule } from '../../types/game';
import { CLUB_SEASON } from './club';

export const SEASON_SCHEDULES: Partial<Record<OpponentTier, SeasonSchedule>> = {
  1: CLUB_SEASON,
};
