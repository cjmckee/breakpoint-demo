/**
 * Season registry: each tier's fixed story beats, scheduled when the season
 * starts (SeasonManager). A tier with no entry has no authored season yet.
 */

import type { OpponentTier, SeasonSchedule } from '../../types/game';
import { CLUB_SEASON } from './club';
import { REGIONAL_SEASON } from './regional';

/**
 * The last event written. Once it has played, a player whose season isn't in
 * SEASON_SCHEDULES has reached the end of the story, and the game says so
 * (SeasonManager.contentEnded) instead of opening the menu on an empty season.
 */
export const CONTENT_END_EVENT = 'thanks_for_playing';

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
