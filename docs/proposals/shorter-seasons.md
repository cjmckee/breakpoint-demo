# Shorter seasons: ~28 days, flexible beats, faster pay

**Status:** proposal, measured, not built. Waiting until silver (Regional) is further written, so
the calendar can be checked against real content before the economy moves.
**Builds on:** [`mid-late-progression.md`](./mid-late-progression.md) (the pacing contract, §2) and
[`regional-season-worksheet.md`](./regional-season-worksheet.md) (Regional's beats and slots).

## Decisions

| question                | proposal                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Season length           | **About 28 days**, every season, Club included. The career is ~112 days instead of ~160                                                                                      |
| Club                    | **Keeps its five team matches**, three days apart instead of four, and a tutorial week squeezed into days 1-9                                                                |
| Later seasons           | **No fixed shape.** Each season mixes team matches, tournaments and story matches as its story needs, inside the same ~28 days, and ends with its tier-final                 |
| How the player keeps up | **Training and matches pay more, from day 1, in whole units.** No tier multiplier: pay stays flat across tiers (§2.1 holds), the whole economy just runs faster              |
| The targets             | **A curve, not a list of slots.** An opponent's target is the player's expected OVR on that season day plus a margin for the kind of match, so any calendar gets its targets |
| Training buff           | **Open: A or B (§3).** Leaning B                                                                                                                                             |

## 1. Why

Each season is ~40 days with five team matches. That's a lot of content per tier (§6 of
`mid-late-progression.md`: ~60 events and ~10 named opponents a season), and a long stretch of the
same loop between beats. A ~28-day season is tighter. And a fixed five-team-match template makes
every season read the same; a season that can swap two team matches for a small tournament or a
story match has room to tell its own story.

## 2. The targets are stages, not days

Nothing ties a band to a day. A band is "how strong the player is at this point in the story". If
the whole economy runs faster, the player reaches every point sooner, and the bands hold.

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
partway through World. For the record, the alternative of leaving Club alone and multiplying pay
×1.3 from Regional also lands at 76/98, and flat pay on the short calendar ends the career at OVR
68 (where today's player starts World).

## 3. Faster pay in whole units

×1.35 is a measuring device, not something the game can pay: every amount is a whole unit. The
buff goes on training and matches, which are ~85% of income, and leaves authored story amounts as
they are. Both options below land within a point of every stage (8 careers per identity, ±1 OVR;
Club ~30 days, then 28-day seasons):

| stage (target)           | A: drills pay 3 + 1 a rep | B: a session pays mix × (reps + 2) |
| ------------------------ | ------------------------- | ---------------------------------- |
| end of Club, day 30 (42) | 42.0                      | 41.8                               |
| end of Regional, 58 (56) | 55.5                      | 55.8                               |
| end of Tour, 86 (66)     | 65.8                      | 65.5                               |
| end of World, 114 (77)   | 75.0, key 97.5            | 75.2, key 97.2                     |

Matches, in both: the performance pool 20 → **34**, and the base +1 in every currency (won
5/3/5/6, lost 4/2/4/5 as P/Q/T/M). A pool of 27 left both options 1-3 OVR short; 40 adds under a
point, so 34 is about where the match lever stops mattering.

At the end of World the counter sits at 72-73 and the others at 75-77; that's the existing
identity gap, not this change.

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

## 4. Club in 28 days, five matches

### 4.1 The calendar

The team matches move from every 4 days (15-31) to every 3 (10-22). The tutorial week is what
has to give: today's beats on days 2-12 fit into 2-9 by using more than one slot a day.

| season day | beat                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 1-7        | the tutorial chain, two beats on some days (morning and evening)                     |
| 6-9        | the rival, the club team intro, the coach, the archetype (day 8), the first practice |
| 8-20       | team match announcements every 3 days; the matches play on 10, 13, 16, 19 and 22     |
| 23         | Riverside Open prep                                                                  |
| 24-27      | the opening ceremony, then the four rounds                                           |
| 28         | promotion, win or lose; Regional starts the next morning                             |

Two things move with it. The archetype pick comes on day 8, not 11, so specialties start three
days sooner. And today a player who loses the Riverside Open waits three days for the consolation
promotion; that becomes the next day, like the winner's `thanks_for_playing`, so no one's Club
runs past 28.

Exact slots are for the build: some tutorial events take more than one slot
(`timeSlotsRequired`), and each pair of same-day beats has to fit.

### 4.2 Does the player keep up?

With B's pay, matches on the new days (`TEAM_DAYS=10,13,16,19,22`, 10 careers per identity),
against today's calendar and pay:

| match            | opp. OVR | today: day, player par | 28 days: day, player par | harder by |
| ---------------- | -------- | ---------------------- | ------------------------ | --------- |
| Chet Vale        | 30       | 15, 29.8               | 10, 28.5                 | 1.3       |
| Rich Soil        | 33       | 19, 33.0               | 13, 31.5                 | 1.5       |
| Martia Estrella  | 37       | 23, 34.8               | 16, 32.8                 | 2.0       |
| Reginald Werther | 38       | 27, 37.8               | 19, 35.5                 | 2.3       |
| Olivia Gulp      | 41       | 31, 39.2               | 22, 37.8                 | 1.4       |
| end of Club      | —        | 37-41, ~41-42          | 28, 41.0                 | —         |

Every match comes out 1.5-2 points harder: the tutorial week shrinks by three days, so the
player gets less training before the first match, and each later gap is a day shorter. The end of
Club lands where it does today. The fix is cheap: refit the five Club opponents 1-2 OVR down with
`bandCheck FIT=1`, or accept a slightly harder Club (§7).

### 4.3 The rest of the career

On the same run, with 28-day seasons after Club: OVR 54 at the end of Regional (day 56), 65 at
the end of Tour (84), 74-75 and key stats 97 at the end of World (112). About 1.5 below the §2
stages throughout, because Club ends at 41 rather than 42.5. That doesn't matter on its own: the
targets are built on the curve the economy produces (§5), not on fixed numbers. What matters is
that key stats still reach the top of the range at the end of World, and they do.

## 5. Flexible seasons: targets from a curve

Today a season is a fixed template: team matches 1-5 on days 15-31, a tier-final on 36-39, a
playoff on 45, and `bandSlots.ts` lists one target per slot. If seasons mix team matches,
tournaments and story matches freely, a fixed slot list can't describe them.

**The proposal:** a target is the player's expected OVR on that season day plus a margin for the
kind of match.

```
target = expected OVR (tier, season day) + margin (kind of match, how far into its run)
```

- **The expected OVR** comes from careerSim, which already writes each identity's mean build by
  day (`careerBuilds.json`). Snapshot every day (or every other day) of the career instead of only
  the slot days, and a target exists for any day a writer picks.
- **The margins** are the ones bronze was tuned on (§2.2 of `mid-late-progression.md`):

  | kind of match                         | margin                                           |
  | ------------------------------------- | ------------------------------------------------ |
  | team match / story match              | 0 early in the season, rising to +3 by its end   |
  | tournament rounds (tier-final or not) | −4, −1, +4, +5 (a three-round event: −4, +1, +5) |
  | promotion playoff                     | the final round's                                |
  | practice roster                       | the season's starting OVR, +2 per win as today   |

- **bandCheck reads the season files.** Each match in a season (a team match a beat schedules, a
  tournament's rounds, a story match) becomes a slot with its day and kind, named after its config
  (`regional-tm-harbour`, `regional-cup-r2`). `ONLY=… FIT=1` keeps working on those names.

**Does the number of matches change the pacing?** Barely. A season's growth comes from its
days: training is ~65% of income, and a team match takes the slot a practice match would have,
at similar pay. Three team matches or five, a mid-season tournament or not, the player ends the
season about the same. What a writer does decide is difficulty: two matches on consecutive days
have almost the same target, and a tournament's last round is a wall by design.

**What a season needs, then:** a tier-final in its last few days (promotion ~day 28), a few
matches between days ~8 and ~22 spaced to taste, and the beats around them. The worksheet becomes
"the fixed beats and the end", with the middle left to the story.

### 5.1 Content per season

| slot                               | today (5 matches) | a 28-day season, for example      |
| ---------------------------------- | ----------------- | --------------------------------- |
| opener, intros, team intro         | 6-8               | 6-8                               |
| team matches                       | 20 (5 × 4)        | 12-20 (3-5 × 4)                   |
| a mid-season tournament (optional) | —                 | ~14 (2 ceremonies + 3 rounds × 4) |
| storyline beats                    | 8-10              | 5-6                               |
| tier-final                         | 20                | 20                                |
| playoff                            | 5                 | 5                                 |
| **per season**                     | **~60**           | **~50-60**, depending on the mix  |

Shorter seasons don't cut content much on their own; the mix decides. The cheapest season is three
team matches and the tier-final (~45 events, ~8 named opponents).

## 6. What changes when it's built

1. **Economy** (`src/config/economy.ts`): A or B for training; `MATCH_PAYOUT` pool 34 and base +1.
   CLAUDE.md's "Training Currency" section names the mix (two main, one secondary): update it.
2. **Club** (`src/data/seasons/club.ts`): the §4.1 calendar; the consolation promotion the day
   after the last round. Optionally the five Club opponents refitted 1-2 down (§4.2).
3. **Targets** (`src/test/analysis/bandSlots.ts`, `bandCheck.ts`): slots read from the season
   files with a kind each; targets from the curve and the §5 margins; `careerSim BUILDS` snapshots
   every day; seasons start on career days 0/28/56/84.
4. **Regional** (`src/data/seasons/regional.ts`, the worksheet): the fixed beats (opener, intros,
   team intro, tier-final near day 24-27) and a note that the middle is the writer's.
5. **Saves and specs**: re-record the season-start saves; the e2e specs that walk to a team match
   or the Riverside Open by day need the new days.
6. **Docs**: `mid-late-progression.md` §1.1, §2.1 ("each season is ~40 days") and §2.2 take the
   new calendar; CLAUDE.md's Seasons section names the curve.

## 7. Open questions

1. **A or B** (§3).
2. **Club's difficulty.** The 28-day Club is 1.5-2 OVR harder at every team match (§4.2). Refit the
   opponents down, or keep it?
3. **The tutorial in nine days.** Two beats on some days may read as a lot at once. The
   alternative is a 30-day Club with matches on 12-24.
4. **The end of World.** ~74-75 OVR, key stats 97. Leave it to World's content, or nudge the pool
   once World is written.
5. **Feel.** A session pays more on screen from day 1 (B: a perfect serve session 10 Power, 5 Mind
   instead of 8, 4).

## Reproducing

careerSim takes `MIX`, `TRAIN_BASE` (training pay), `TEAM_DAYS` (Club's match days) and
`ARCHETYPE_DAY`. Each run is ~2 minutes.

```
# The stage table (§2): everything ×1.35 from day 1
PAR=1 RUNS=8 N=40 DAYS=114 CHECK=15,20,25,30,58,86,114 FOCUS_FROM=30 TIER_PAY=1:1.35 \
  npx tsx src/test/analysis/careerSim.ts

# A and B (§3)
PAR=1 RUNS=8 N=40 DAYS=114 CHECK=30,58,86,114 FOCUS_FROM=30 \
  MIX=3,1 MATCH_POOL=34 MATCH_BASE=4,2,4,5/5,3,5,6 npx tsx src/test/analysis/careerSim.ts
PAR=1 RUNS=8 N=40 DAYS=114 CHECK=30,58,86,114 FOCUS_FROM=30 \
  TRAIN_BASE=2 MATCH_POOL=34 MATCH_BASE=4,2,4,5/5,3,5,6 npx tsx src/test/analysis/careerSim.ts

# Club in 28 days with five matches (§4.2, §4.3), and today's Club to compare
PAR=1 RUNS=10 N=40 DAYS=112 CHECK=10,13,16,19,22,28,56,84,112 FOCUS_FROM=28 \
  TEAM_DAYS=10,13,16,19,22 ARCHETYPE_DAY=8 \
  TRAIN_BASE=2 MATCH_POOL=34 MATCH_BASE=4,2,4,5/5,3,5,6 npx tsx src/test/analysis/careerSim.ts
PAR=1 RUNS=10 N=40 DAYS=37 CHECK=15,19,23,27,31,37 npx tsx src/test/analysis/careerSim.ts
```

The sim's story slots still follow today's `club.ts`; re-measure once it changes. Confirm the
chosen option with `RUNS=20` before building.
