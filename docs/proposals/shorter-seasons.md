# Shorter seasons: three team matches, ~28 days, faster pay

**Status:** proposal, measured, not built. Waiting until silver (Regional) is further written, so
the calendar can be checked against real content before the economy moves.
**Builds on:** [`mid-late-progression.md`](./mid-late-progression.md) (the pacing contract, §2) and
[`regional-season-worksheet.md`](./regional-season-worksheet.md) (Regional's beats and slots).

## Decisions

| question                 | proposal                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Team matches per season  | **Three**, in every season, Club included. 12 team matches over the career instead of 20                                                                                                          |
| Season length            | **About 28 days** from Regional on. Club about 30, because its tutorial week (days 1-12) doesn't compress. The career is ~114 days instead of ~160                                                |
| Club's other two matches | **Move up to Regional.** Rich Soil (TM2) and Reginald Werther (TM4) become two of Regional's opponents, refitted to its bands. Their writing is checked for Club-only references, not thrown away |
| How the player keeps up  | **Training and matches pay more, from day 1, in whole units.** No tier multiplier: pay stays flat across tiers (§2.1 holds), the whole economy just runs faster                                   |
| The targets              | **Set by stage, not by day.** The player reaches the end of each season at the same OVR as today, so the bands in §2.2 stand. Only the days they fall on move                                     |
| Training buff            | **Open: A or B (§3).** Leaning B                                                                                                                                                                  |

## 1. Why

Each season is ~40 days with five team matches. That's a lot of content per tier (§6 of
`mid-late-progression.md`: ~60 events and ~10 named opponents a season), and a long stretch of
the same loop between beats. Three matches and ~28 days is a tighter season, and the content that
remains is mostly the tier-final, which is the part that carries the story.

## 2. The targets are stages, not days

The first pass at this kept Club's pay and calendar and asked how to accelerate the player from
Regional on. That made the shortfall look like a tier multiplier. It isn't: nothing ties a band to
a day. A band is "how strong the player is at this point in the story". If the whole economy runs
faster, the player reaches every point sooner, and the bands hold as they are.

Measured with `careerSim PAR=1`, everything the player earns ×1.35 from day 1 (training, matches
and story), Club ~30 days, then 28-day seasons (mean of the four identities, 8 careers each):

| stage           | today (160 days)       | compressed, ×1.35 everywhere |
| --------------- | ---------------------- | ---------------------------- |
| end of Club     | day 41: OVR 42, key 52 | day 30: 42.5, key 52         |
| end of Regional | day 81: 56, key 73     | day 58: 56, key 73           |
| end of Tour     | day 121: 66, key 89    | day 86: 67, key 88           |
| end of World    | day 160: 77, key 99    | day 114: 77, key 99          |

The old curve maps onto the short calendar almost exactly. Par (the opponent OVR a build beats
half the time) stays within a point of OVR at every stage. ×1.5 overshoots: key stats reach 100
partway through World.

For the record, the tier multiplier it replaces: Club unchanged and ×1.3 from Regional also lands
on 76/98 by day 125, and flat pay on the short calendar ends the career at OVR 68 (where today's
player starts World).

## 3. Faster pay in whole units

×1.35 is a measuring device, not something the game can pay: every amount is a whole unit. The
buff goes on training and matches, which are ~85% of income, and leaves authored story amounts as
they are. Both options below land within a point of every stage (8 careers per identity, ±1 OVR):

| stage (target)           | A: drills pay 3 + 1 a rep | B: a session pays mix × (reps + 2) |
| ------------------------ | ------------------------- | ---------------------------------- |
| end of Club, day 30 (42) | 42.0                      | 41.8                               |
| end of Regional, 58 (56) | 55.5                      | 55.8                               |
| end of Tour, 86 (66)     | 65.8                      | 65.5                               |
| end of World, 114 (77)   | 75.0, key 97.5            | 75.2, key 97.2                     |

Matches, in both: the performance pool 20 → **34**, and the base +1 in every currency (won
5/3/5/6, lost 4/2/4/5 as P/Q/T/M). A pool of 27 left both options 1-3 OVR short.

At the end of World the counter sits at 72-73 and the others at 75-77; that's the existing
identity gap, not this change. The last 2 points of World can come from World's own content once
it's written.

**The choice between A and B:**

|                            | today (2 + 1, reps + 1) | A: 3 + 1, reps + 1 | B: 2 + 1, reps + 2 |
| -------------------------- | ----------------------- | ------------------ | ------------------ |
| a whiff (0 clean reps)     | 2 + 1                   | 3 + 1              | 4 + 2              |
| a perfect session (3 reps) | 8 + 4                   | 12 + 4             | 10 + 5             |
| perfect ÷ whiff            | 4×                      | 4×                 | 2.5×               |
| secondary share            | a third                 | a quarter          | a third            |

- **A** keeps the minigame's skill reward where it is. It shrinks the secondary currency, which is
  the half of a drill silver's **focus** swaps, so focus is worth less.
- **B** keeps the 2:1 mix, so focus keeps its weight, and raises the floor. Skill counts for less
  (2.5× instead of 4×), which is the shape the training precedents favour: a guaranteed base and a
  capped skill bonus (`research/training-precedents.md`).

**Leaning B**, because focus is silver's new decision. Either is one change in
`src/config/economy.ts` (`TRAINING_MIXES` for A, a session base for `trainingPayout` for B) plus
`MATCH_PAYOUT`.

## 4. The calendar

### 4.1 Club (~30 days)

The faster pay means the player reaches a given OVR about 4 days sooner, so the three matches
Club keeps move to where their opponents still fit. Days are where the player's OVR (×1.35 curve)
sits at the bronze margin under each opponent.

| beat                           | opponent OVR | player then | season day      |
| ------------------------------ | ------------ | ----------- | --------------- |
| tutorial, intros               | —            | —           | 1-12, unchanged |
| TM1 Chet Vale                  | 29           | ~31         | 13-14           |
| TM2 Martia Estrella            | 36           | ~34         | ~17-18          |
| TM3 Olivia Gulp                | 41           | ~38         | ~22-23          |
| Riverside Open R1-R4           | 36-46        | ~41         | 26-29           |
| promotion (win or consolation) | —            | ~42         | 30              |

TM1 comes out about 2 points easier than today, because the tutorial week doesn't compress.
Probably right for a first match; check in a playtest.

### 4.2 Regional, Tour, World (28 days each)

| season day | beat                                                        |
| ---------- | ----------------------------------------------------------- |
| 1-3        | the opener, then the season's system intros                 |
| 5-6        | the team intro, the first practice                          |
| 8, 13, 18  | team match announcements; the matches play on 10, 15 and 20 |
| 22         | tier-final prep                                             |
| 24-27      | tier-final rounds (World: 24-28, five rounds, best of five) |
| 28         | promotion; the next season starts the following morning     |
| ~33        | the playoff, only if the final was lost (`retryDays` 6)     |

Matches are 5 days apart instead of 4, so storyline beats, hangouts and random events still have
room in days 7-21. With PR #156 the characters' hangouts and storylines carry over from Club, so
the free days aren't empty.

Season starts as career days: Club 1, Regional 31, Tour 59, World 87, the end ~114.

### 4.3 Bands

Each season covers the same OVR range as today in 70% of the time, so the targets barely move.
Three matches instead of five means each match steps up ~3 OVR instead of 2.

| tier     | player OVR in → out | TM1 | TM2 | TM3 | tier-final rounds        | playoff | practice base |
| -------- | ------------------- | --- | --- | --- | ------------------------ | ------- | ------------- |
| Club     | 20 → 42             | 29  | 36  | 41  | 36, 39, 44, 46           | none    | 26-29         |
| Regional | 42 → 56             | 48  | 52  | 55  | 51, 54, 59, 60           | ~58     | 42-45         |
| Tour     | 56 → 66             | 60  | 63  | 66  | 61, 64, 69, 70           | ~68     | 56-59         |
| World    | 66 → 77             | 70  | 73  | 76  | 71, 74, 77, 79, 81 (BO5) | 81      | 66-69         |

Club's are its existing opponents, unchanged. Regional's TM1 and TM2 are where Rich Soil and
Reginald Werther would land, refitted (`bandCheck FIT=1`) from 34 and 38.

## 5. Content per season

| slot            | today (5 matches) | proposed (3 matches) |
| --------------- | ----------------- | -------------------- |
| opener, intros  | 4-6               | 4-6                  |
| team intro      | 2                 | 2                    |
| team matches    | 20 (5 × 4)        | **12** (3 × 4)       |
| storyline beats | 8-10              | 5-6                  |
| tier-final      | 20                | 20                   |
| playoff         | 5                 | 5                    |
| **per season**  | **~60**           | **~45**              |
| named opponents | ~10               | **~8**               |

About 140 events and 24 named opponents for Regional, Tour and World, against 180 and 30. The
tier-final is now the biggest block. If that needs cutting, the loser-bracket prematch events (4
of its 20) can become one generic line per round.

## 6. What changes when it's built

1. **Economy** (`src/config/economy.ts`): A or B for training; `MATCH_PAYOUT` pool 34 and base +1.
   CLAUDE.md's "Training Currency" section names the mix (two main, one secondary): update it.
2. **Club** (`src/data/seasons/club.ts`, `src/data/teamMatches.ts`): three announcements on the
   new days, the Riverside Open prep moved up, and the end-of-Club events (`thanks_for_playing`,
   the consolation promotion) on the new days. Rich Soil and Reginald Werther move to Regional's
   configs: tier 2, a venue, refitted stats.
3. **Regional** (`src/data/seasons/regional.ts` and the worksheet): the §4.2 calendar, three
   matches, slots `regional-tm1`…`tm3`.
4. **Analysis** (`src/test/analysis/bandSlots.ts`): `SEASON_OFFSET` 0/30/58/86, `TEAM_DAYS`,
   `FINAL_DAYS`, `PLAYOFF_DAY` and the §4.3 bands; regenerate `careerBuilds.json`; re-run
   `bandCheck` over the practice rosters. careerSim's Club calendar (`TEAM_MATCHES`, `STORY_SLOTS`)
   follows the season file.
5. **Saves and specs**: re-record the season-start saves; the e2e specs that walk to a team match
   or the Riverside Open by day need their days.
6. **Docs**: `mid-late-progression.md` §1.1, §2.1 ("each season is ~40 days") and §2.2 take the
   new calendar.

## 7. Open questions

1. **A or B** (§3).
2. **TM1's day.** Day 13-14 makes Chet Vale ~2 OVR easier than today. Fine for a first match, or
   trim the tutorial week by a day to keep him where he is?
3. **The end of World.** The buff lands ~2 OVR short there. Leave it to World's content, or nudge
   the pool once World is written.
4. **Feel.** A session pays more on screen from day 1 (B: a perfect serve session 10 Power, 5 Mind
   instead of 8, 4). Nothing else about the screen changes.

## Reproducing

`MIX` and `TRAIN_BASE` were added to careerSim for this. Each run is ~2 minutes.

```
# The stage table (§2): everything ×1.35 from day 1
PAR=1 RUNS=8 N=40 DAYS=114 CHECK=15,20,25,30,58,86,114 FOCUS_FROM=30 TIER_PAY=1:1.35 \
  npx tsx src/test/analysis/careerSim.ts

# A and B (§3)
PAR=1 RUNS=8 N=40 DAYS=114 CHECK=30,58,86,114 FOCUS_FROM=30 \
  MIX=3,1 MATCH_POOL=34 MATCH_BASE=4,2,4,5/5,3,5,6 npx tsx src/test/analysis/careerSim.ts
PAR=1 RUNS=8 N=40 DAYS=114 CHECK=30,58,86,114 FOCUS_FROM=30 \
  TRAIN_BASE=2 MATCH_POOL=34 MATCH_BASE=4,2,4,5/5,3,5,6 npx tsx src/test/analysis/careerSim.ts
```

The sim still plays Club's current calendar (five matches on days 15-31). Its two extra matches
are a few units of pay, inside the noise; re-measure once `club.ts` changes. Confirm the chosen
option with `RUNS=20` before building.
