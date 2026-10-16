/**
 * The Club season (tier 1): the tutorial week, the Academy team's five matches
 * and the Riverside Open.
 *
 * Each team match announcement schedules its own match two days later, and the
 * Riverside Open prep leads into the tournament, so only the first event of
 * each chain is listed here.
 */

import type { SeasonSchedule } from '../../types/game';
import { TimeSlot } from '../../types/game';

export const CLUB_SEASON: SeasonSchedule = {
  tier: 1,
  beats: [
    // Tutorial events, spaced out so the player has time to explore between them
    { day: 2, slot: TimeSlot.MORNING, storyEventId: 'making_connections' },
    { day: 3, slot: TimeSlot.MORNING, storyEventId: 'food_hall_gossip' },
    { day: 4, slot: TimeSlot.MORNING, storyEventId: 'player_tier_intro' },
    { day: 5, slot: TimeSlot.MORNING, storyEventId: 'match_play_basics' },
    { day: 5, slot: TimeSlot.EVENING, storyEventId: 'training_session_intro' },
    { day: 6, slot: TimeSlot.MORNING, storyEventId: 'relationship_basics' },
    { day: 7, slot: TimeSlot.MORNING, storyEventId: 'shop_basics' },
    // Storylines open
    { day: 8, slot: TimeSlot.AFTERNOON, storyEventId: 'rival_first_encounter' },
    { day: 9, slot: TimeSlot.MORNING, storyEventId: 'club_team_intro' },
    { day: 10, slot: TimeSlot.MORNING, storyEventId: 'coach_first_meeting' },
    { day: 11, slot: TimeSlot.MORNING, storyEventId: 'coach_archetype_selection' },
    { day: 11, slot: TimeSlot.AFTERNOON, storyEventId: 'club_team_first_practice' },
    { day: 12, slot: TimeSlot.MORNING, storyEventId: 'coach_training_focus' },
    // Team matches play on days 15, 19, 23, 27 and 31
    { day: 13, slot: TimeSlot.MORNING, storyEventId: 'first_team_match_scheduled' },
    { day: 16, slot: TimeSlot.MORNING, storyEventId: 'coach_balanced_development' },
    { day: 17, slot: TimeSlot.MORNING, storyEventId: 'second_team_match_scheduled' },
    { day: 21, slot: TimeSlot.MORNING, storyEventId: 'third_team_match_scheduled' },
    { day: 25, slot: TimeSlot.MORNING, storyEventId: 'fourth_team_match_scheduled' },
    { day: 29, slot: TimeSlot.MORNING, storyEventId: 'fifth_team_match_scheduled' },
    // The tier-final: prep on day 33, the opening ceremony on day 36
    { day: 33, slot: TimeSlot.MORNING, storyEventId: 'riverside_open_prep' },
  ],
};
