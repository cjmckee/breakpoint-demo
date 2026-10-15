/**
 * The opponent slots of a career, and the OVR each one is built to.
 *
 * One row per place an opponent appears: practice, the five team matches, the
 * tier-final rounds and the promotion playoff, on their season days. Targets are
 * the bands in docs/proposals/mid-late-progression.md §2.2: the expected player
 * OVR on that day plus the bronze-calibrated margin, measured against the
 * team-match stat shapes (careerSim PAR=1). Club rows are the bronze opponents
 * the bands were calibrated on.
 *
 * Seasons start at career days 0, 41, 81 and 121 (§2.1), so a season day maps to
 * a career day by adding the offset.
 */

import type { PlayerStats } from '../../types';
import type { ArchetypeProfile } from '../../types/archetype';
import type { OpponentTier } from '../../types/game';

export interface BandSlot {
  /** Stable id an author names in bandCheck: `regional-tm3`, `tour-final-r2`. */
  id: string;
  tier: OpponentTier;
  seasonDay: number;
  /** The reference OVR this slot's opponent should play like. */
  target: number;
}

export const SEASON_NAMES: Record<OpponentTier, string> = {
  1: 'club',
  2: 'regional',
  3: 'tour',
  4: 'world',
};

/** The career day each season starts from: season day d is career day offset + d. */
export const SEASON_OFFSET: Record<OpponentTier, number> = { 1: 0, 2: 41, 3: 81, 4: 121 };

export const careerDay = (slot: Pick<BandSlot, 'tier' | 'seasonDay'>): number =>
  SEASON_OFFSET[slot.tier] + slot.seasonDay;

const TEAM_DAYS = [15, 19, 23, 27, 31];
const FINAL_DAYS = [36, 37, 38, 39, 40];
const PLAYOFF_DAY = 45;

interface SeasonBands {
  practice: number;
  team: number[];
  final: number[];
  playoff?: number;
}

/**
 * §2.2, by season. Practice is the roster's base on season day 1 (each practice
 * win then adds +2, to +20); its target is the middle of the band.
 */
const BANDS: Record<OpponentTier, SeasonBands> = {
  1: { practice: 28, team: [29, 34, 36, 38, 41], final: [36, 39, 44, 46] },
  2: { practice: 44, team: [48, 50, 52, 54, 56], final: [51, 54, 58, 60], playoff: 57 },
  3: { practice: 58, team: [60, 62, 64, 66, 67], final: [61, 64, 68, 70], playoff: 67 },
  4: { practice: 68, team: [70, 72, 74, 76, 77], final: [72, 75, 77, 79, 81], playoff: 81 },
};

export const BAND_SLOTS: BandSlot[] = ([1, 2, 3, 4] as OpponentTier[]).flatMap((tier) => {
  const season = SEASON_NAMES[tier];
  const b = BANDS[tier];
  return [
    { id: `${season}-practice`, tier, seasonDay: 1, target: b.practice },
    ...b.team.map((target, i) => ({
      id: `${season}-tm${i + 1}`,
      tier,
      seasonDay: TEAM_DAYS[i],
      target,
    })),
    ...b.final.map((target, i) => ({
      id: `${season}-final-r${i + 1}`,
      tier,
      seasonDay: FINAL_DAYS[i],
      target,
    })),
    ...(b.playoff === undefined
      ? []
      : [{ id: `${season}-playoff`, tier, seasonDay: PLAYOFF_DAY, target: b.playoff }]),
  ];
});

/** Every career day a slot falls on, for careerSim to snapshot. */
export const BAND_DAYS: number[] = [...new Set(BAND_SLOTS.map(careerDay))].sort((a, b) => a - b);

export function getBandSlot(id: string): BandSlot | undefined {
  return BAND_SLOTS.find((s) => s.id === id);
}

/**
 * Mean career builds by identity and career day, as `careerSim BUILDS=<path>`
 * writes them (careerBuilds.json).
 */
export interface CareerBuilds {
  /** The command and settings that produced the file. */
  generated: string;
  identities: Record<
    string,
    {
      /** The identity's specialties, all at tier I; bandCheck raises them to the season's cap. */
      profile: ArchetypeProfile;
      /** No specialties before this day (the coach event). */
      archetypeDay: number;
      days: Record<
        string,
        {
          stats: PlayerStats;
          /** One ability effect set per career, so abilities stay a spread, not a mean. */
          effects: Array<Record<string, number>>;
        }
      >;
    }
  >;
}
