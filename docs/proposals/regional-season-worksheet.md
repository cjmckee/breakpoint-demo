# Regional season worksheet

Everything the Regional season (tier 2) needs written, with the ids, days and wiring already
decided. The engine work is done: seasons, venues, silver training, specialty tier II, the
practice roster and the promotion playoff. What's left is content. Design and pacing are in
[`mid-late-progression.md`](./mid-late-progression.md).

The season is drafted in `src/data/seasons/regional.ts` and listed in `DRAFT_SEASONS`, so nothing
is scheduled yet. A player promoted today gets an empty season rather than a half-written one.
`npx tsx src/test/seasonCheck.ts` prints which beats are still to write. When they all exist,
move `REGIONAL_SEASON` into `SEASON_SCHEDULES` (`src/data/seasons/index.ts`).

## The calendar

Days are season days: day 1 is the morning after the promotion. The layout matches the Club
season, so the team matches fall on the same days.

| day   | beat (listed in `regional.ts`)       | what it opens                                           |
| ----- | ------------------------------------ | ------------------------------------------------------- |
| 1     | `regional_season_opener`             | the promotion aftermath, who moved up with you          |
| 2     | `regional_silver_training_intro`     | the training focus (it shows from tier 2 on its own)    |
| 4     | `regional_specialty_tier_intro`      | specialty tier II (unlocks with the tier on its own)    |
| 6     | `regional_whats_new`                 | anything else new: venues with conditions, the shop     |
| 9     | `regional_team_intro`                | the new team or division                                |
| 11    | `regional_team_first_practice`       | first practice, the season's rival team                 |
| 13-29 | `regional_tm1_scheduled` … `tm5`     | one announcement every 4 days; each schedules its match |
| 33    | `regional_final_prep`                | leads into the tier-final; its ceremony opens on day 36 |
| 36-39 | (tournament rounds)                  | four rounds                                             |
| ~45   | (playoff, only if the final is lost) | the same match until it's won                           |

Free days between beats are the usual loop: training, practice, random events, hangouts. Storyline
beats (coach, rival, family, romance) can go anywhere in 13-31. Give each a
`prerequisites.tier: { min: 2, max: 2 }` so it can't fire in another season.

Everything written before Regional is the Club season's and stops at promotion, random flavour
events and hangouts included. So Regional's free days are empty until it has its own: write a few
random events and hangouts for it, or tag a Club event `tier: { max: 2 }` in its own file to bring
it along. Keith and Jen come up with you, for the story only: they appear in Regional's events and
hangouts, not as match teammates or training partners. Put Regional's events in their own file and
list it in `src/data/storyEvents/index.ts` outside the Club files, so it isn't gated to Club.

## Events by chain

Ids follow the Club season's pattern. Anything marked _wired_ is fired by the engine from a
config; you write the event and the config names it.

### Season opener and system intros (days 1-11)

Six beats, one event each, listed above. Each is a plain story event fired by id from the season
file. None needs prerequisites beyond the tier gate.

### Team matches (days 15, 19, 23, 27, 31)

For each match N from 1 to 5:

| event                    | fired by                         | must do                                                                                                        |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `regional_tmN_scheduled` | the season file, day 13 + 4(N−1) | `scheduledEvents`: a `story_match` 2 days on, afternoon, with `buildStoryMatchMetadata(REGIONAL_TEAM_MATCH_N)` |
| `regional_tmN_prematch`  | _wired_, `prematchEventId`       | flavour before the match                                                                                       |
| `regional_tmN_win`       | _wired_, `winEventId`            | rewards (`effects.currency`, `contentCurrency`)                                                                |
| `regional_tmN_loss`      | _wired_, `lossEventId`           | consolation                                                                                                    |

Plus a `TeamMatchConfig` per match (`REGIONAL_TEAM_MATCH_N`, next to the Club ones in
`src/data/teamMatches.ts`) with:

- **an opponent** with `tier: 2`, a `characterId` registered in `CHARACTERS` with an `appearance`
  and `plays: 'opponent'` (`spriteCheck` fails otherwise), an archetype, and abilities;
- **a venue** from `src/data/venues.ts` (add new ones there) and `home` if it has a crowd;
- `matchFormat: 'best-of-3'`.

### The tier-final (days 33-39)

A `TournamentConfig` in `src/data/tournaments/` with `minPlayerTier: 2`,
`requiredEvents: ['regional_final_prep']`, a venue, and `playoffId: 'regional_playoff'`. It has no
consolation event, because the playoff replaces it.

| event                                          | fired by                          | must do                                 |
| ---------------------------------------------- | --------------------------------- | --------------------------------------- |
| `regional_final_prep`                          | the season file, day 33           | leads in, as `riverside_open_prep` does |
| `regional_final_opening_ceremony`              | _wired_, `openingCeremonyEventId` |                                         |
| `regional_final_rR_prematch_winner` / `_loser` | _wired_, per round R = 1-4        | `tournament_match` tag                  |
| `regional_final_rR_win` / `_loss`              | _wired_, per round                |                                         |
| `regional_final_victory`                       | _wired_, `victoryEventId`         | `tierChange` to 3 (the Tour)            |
| `regional_final_elimination`                   | _wired_, `eliminationEventId`     | the engine then schedules the playoff   |

The name is yours: `regional_final` is a placeholder id for whatever the tournament is called.

### The promotion playoff (from ~day 45, only after losing the final)

A `PlayoffConfig` named `regional_playoff` in `src/data/playoffs.ts`: a team match (opponent,
venue, prematch and win events) plus `lossEventIds` and `retryDays: 6`. The engine schedules
every attempt against the same opponent at the same strength.

| event                         | runs                 | must do                      |
| ----------------------------- | -------------------- | ---------------------------- |
| `regional_playoff_prematch`   | before every attempt | `repeatable: true`           |
| `regional_playoff_win`        | once                 | `tierChange` to 3            |
| `regional_playoff_loss_1`     | first loss           | "lost the final, then this"  |
| `regional_playoff_loss_2`     | second loss          | "lost to the same guy twice" |
| `regional_playoff_loss_again` | every loss after     | `repeatable: true`           |

`seasonCheck` fails if the playoff's events are missing or don't repeat where they must.

## Opponent stats

Every opponent has a slot, and every slot has a target. Don't tune stats by hand. Write the
opponent's identity (archetype, abilities, a rough shape), list it in `AUTHORED` in
`src/test/analysis/bandCheck.ts` with its slot, and let `FIT=1` move the block onto the band:

```
ONLY="new name" FIT=1 npx tsx src/test/analysis/bandCheck.ts
SLOT=regional-tm3 ONLY="marcus cole" FIT=1 npx tsx src/test/analysis/bandCheck.ts   # start from a roster shape
```

| slot                | season day | target |
| ------------------- | ---------- | ------ |
| `regional-practice` | 1          | 44     |
| `regional-tm1`      | 15         | 48     |
| `regional-tm2`      | 19         | 50     |
| `regional-tm3`      | 23         | 52     |
| `regional-tm4`      | 27         | 54     |
| `regional-tm5`      | 31         | 56     |
| `regional-final-r1` | 36         | 51     |
| `regional-final-r2` | 37         | 54     |
| `regional-final-r3` | 38         | 58     |
| `regional-final-r4` | 39         | 60     |
| `regional-playoff`  | 45         | 57     |

Targets are effective OVR, not written OVR. A flat all-courter is written about 4 above its
target, and a serve-volleyer 2-3 below. The win % per identity in the output shows who an
opponent is hard for. By mid-Regional the spread is already wide: a TM3-strength aggressive
opponent is 93% for the net rusher and 25% for the baseliner (§2.3). Pick archetypes across the
season so no single identity meets five walls in a row.

## Before registering the season

1. `npx tsx src/test/seasonCheck.ts`: no beats left to write, and the playoff passes.
2. `npx tsx src/test/analysis/bandCheck.ts ONLY=regional`: every opponent on band.
3. `npx tsx src/test/spriteCheck.ts`: every new character has a look and `plays`.
4. Tag the Club's random events that shouldn't follow you up with `tier: { max: 1 }`
   (`mid-late-progression.md` §7).
5. Move `REGIONAL_SEASON` into `SEASON_SCHEDULES`, then play it: an end-of-Club save, promoted,
   through a team match, the final and a lost playoff.
