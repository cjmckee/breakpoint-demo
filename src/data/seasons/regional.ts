/**
 * The Regional season (tier 2), drafted: the beats and their event ids, laid out
 * like the Club season, with none of the events written yet. It is listed in
 * DRAFT_SEASONS, not SEASON_SCHEDULES, so a player promoted today gets nothing
 * half-written; move it across once its events exist. `seasonCheck` lists the
 * events still to write.
 *
 * The full list of events per chain (prematch, win, loss, the tier-final rounds,
 * the playoff) is in docs/proposals/regional-season-worksheet.md.
 */

import type { SeasonSchedule } from '../../types/game';
import { TimeSlot } from '../../types/game';

export const REGIONAL_SEASON: SeasonSchedule = {
  tier: 2,
  beats: [
    // The promotion aftermath, then one event per new system
    { day: 1, slot: TimeSlot.MORNING, storyEventId: 'regional_season_opener' },
    { day: 2, slot: TimeSlot.MORNING, storyEventId: 'regional_silver_training_intro' },
    { day: 4, slot: TimeSlot.MORNING, storyEventId: 'regional_specialty_tier_intro' },
    { day: 6, slot: TimeSlot.MORNING, storyEventId: 'regional_whats_new' },
    // The new team
    { day: 9, slot: TimeSlot.MORNING, storyEventId: 'regional_team_intro' },
    { day: 11, slot: TimeSlot.AFTERNOON, storyEventId: 'regional_team_first_practice' },
    // Team matches play on days 15, 19, 23, 27 and 31; each announcement schedules its match
    { day: 13, slot: TimeSlot.MORNING, storyEventId: 'regional_tm1_scheduled' },
    { day: 17, slot: TimeSlot.MORNING, storyEventId: 'regional_tm2_scheduled' },
    { day: 21, slot: TimeSlot.MORNING, storyEventId: 'regional_tm3_scheduled' },
    { day: 25, slot: TimeSlot.MORNING, storyEventId: 'regional_tm4_scheduled' },
    { day: 29, slot: TimeSlot.MORNING, storyEventId: 'regional_tm5_scheduled' },
    // The tier-final: prep on day 33, the opening ceremony on day 36
    { day: 33, slot: TimeSlot.MORNING, storyEventId: 'regional_final_prep' },
  ],
};
