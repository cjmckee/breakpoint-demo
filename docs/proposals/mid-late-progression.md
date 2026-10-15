# Mid-to-late progression: Regional, Tour and World

**Status:** structure agreed (§0). The season template (§3) and pacing bands (§2) are proposals
waiting on review. The open questions are in §9.
**Scope:** everything after the Riverside Open: how the three tiers above Club are structured,
how fast the player grows through them, what silver and gold training are, and where content
goes. This doc does not write any content. It names the slots that content goes into.
**Ground rule:** anything above bronze can be wiped. That covers the tier 2-4 rosters, item tier
pools, drop rates, and the `TrainingSessionTier` values nothing uses yet.

---

## 0. Decisions

| question                            | decision                                                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure                           | **Repeat bronze each tier.** A team season, then a tier-final tournament                                                                                                   |
| Pacing                              | **Same speed per tier, flat pay.** Each tier takes about as long as bronze. Measured, that needs no tier multiplier: the price steps taper gains inside each season (§2.1) |
| Losing the tier-final (Regional on) | **Retry, never stuck.** Promotion is earned, a loss always leads to another shot, nobody is demoted                                                                        |
| Length and ending                   | **Hard ending.** Four seasons, then the story ends at the top. No post-game                                                                                                |
| Tour team matches                   | **A pro team league** with sponsor-named franchises (§3.2)                                                                                                                 |
| Content per season                  | **The full template** (~60 events). Team matches stay in every season, but how many is a number in the season file, so it can drop to three once balancing says so         |

What that rules out: the open circuit, rankings as a promotion gate, stat caps, and anything
open-ended (aging, records). Those ideas are still in git history (`1d01e22`) if one is wanted
later.

---

## Summary

1. **Bronze is the template, and it repeats.** Each tier is one season of about 40 days. It
   opens with intros for the tier's new systems, has five team matches four days apart, and
   ends with a tier-final tournament. Four seasons, Club to World, run about 160 in-game days
   plus any retries (§3).
2. **Pacing: keep pay flat. The price curve already fits four seasons (§2).** Measured over a
   160-day career, flat pay takes the average build's key stats from 52 at promotion to 73, 89
   and 99 at the end of each later season. OVR goes 42 → 56 → 66 → 77. Pay that scales with the
   tier (×2/×3) maxes key stats in the middle of Tour, and ×1.5/×2/×2.5 by the end of Tour. Gains
   taper by tier (+21, +15, +10 key stat points), so new systems carry the late-game feeling of
   progress (§5).
3. **The existing tier 2-4 rosters are a cliff.** The player leaves bronze at ~OVR 40 against a
   Jordan of 46. The tier 2 practice roster is 56-57, tier 3 is 66-69 and tier 4 is 81-85.
   Rebuild them against the bands in §2.2.
4. **Retrying is a promotion playoff, not a replayed tournament (§3.3).** Lose the tier-final
   and a named playoff opponent is scheduled a few days later. Win, you're promoted. Lose, it
   comes round again. The player keeps growing in between, so the playoff is always eventually
   won. It needs one engine change: story events can't fire twice today.
5. **Each season needs a schedule of its own (§3.4).** Bronze's spine is a hard-coded list in
   `createPlayer`. Seasons should be data files, scheduled when the season starts, with days
   counted from that start, so Regional can be written exactly like bronze ("day 15: first team
   match"). The 90-day calendar rollover has to go first: it resets `currentDay` to 1 and breaks
   every `minDay` and `scheduledDay`.
6. **Silver and gold training (§4).** Silver: a harder ramp and a **focus** that picks
   the secondary currency. That fixes the "big server trains backhand for Technique" finding.
   Gold: **training partners** (relationship-gated, they pay what they're good at). Each tier adds
   one new decision, not just a bigger number.
7. **Each season opens one new system (§5).** Regional opens specialty tier II and silver training.
   Tour opens tier III, gold training and scouting. World opens best-of-five. This is the
   equivalent of bronze's tutorial week.
8. **Content is roughly 60 events and 10 named opponents per tier (§6),** about 180 events for
   the three. Most of it fills the same slots bronze has.
9. **Identities drift apart as stats rise (§2.3).** At promotion the four identities play within
   ±3 OVR of their rating. By the end of Tour the net rusher plays 10-12 points above its OVR and
   the baseliner 10-12 below. That is the bronze-era baseliner trap growing with the stat range.
   It has to be fixed before Tour opponents can be balanced for everyone.

---

## 1. What bronze is, measured

### 1.1 The calendar

| days  | what happens                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1-7   | tutorial chain, one scheduled event per morning (`gameStore.createPlayer`)                                                                        |
| 8-12  | rival encounter, club team intro, coach, archetype pick, first practice                                                                           |
| 13-31 | five team matches on days 15, 19, 23, 27, 31. Each announcement fires two days before its match                                                   |
| 33-39 | Riverside Open prep, then the ceremony, then four rounds with a winner and a loser bracket                                                        |
| 40-43 | a winner gets `thanks_for_playing` the next day. A loser gets the consolation promotion three days after the last round. Both set `tierChange: 2` |

The whole spine is scheduled by absolute day in `createPlayer`. Random events (40% trigger
chance) and hangouts fill the gaps. In a bot career that lost in round 2, the tournament ended on
day 39 and the promotion was queued for day 42.

### 1.2 Content per unit

| unit                 | events                                                  | other data                                           |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| team match           | 4 (scheduled, prematch, win, loss)                      | a named opponent: stats, archetype, ability, surface |
| tournament (4 round) | 4 ceremonies + 4 per round (2 prematch, win, loss) = 20 | four named opponents                                 |
| a tier's spine       | ~13 tutorial/intro + 20 team + 20 tournament ≈ 50       | 9 named opponents                                    |

### 1.3 Numbers at the end of bronze

From `careerSim LEDGER=1 RUNS=30 DAYS=31` on the current economy:

- **Income:** ~950 units by day 31. 61% training, 22% matches, 17% story and challenges.
  About 30 a day.
- **Build:** six key stats at 44-49, the other eight at 29-38. OVR about 38-40.
- **XP:** ~830 earned, 150-340 spent on abilities, 530-680 unspent. XP has no outlet worth
  spending on, which `progress.ts` also notes.

Opponent OVR, for the ladder:

| opponents               | OVR                         |
| ----------------------- | --------------------------- |
| tier 1 practice (base)  | 26-29, +2 per win up to +20 |
| team matches 1-5        | 29, 34, 36, 38, 41          |
| Riverside R1-R4         | 36, 39, 44, 46              |
| tier 2 practice (today) | 56-57                       |
| tier 3 practice (today) | 66-69                       |
| tier 4 practice (today) | 81-85                       |

---

## 2. The pacing contract

Content can only be balanced against a known player. So first, write down how strong the player
is at each point in each tier, then build the opponents to that.

### 2.1 Pay: flat, because the price curve already tapers

The first draft of this section did the arithmetic for raising **all 14 stats** together: +1 on
every stat costs 43 units at ×1, so 40 → 60 costs 1,720 units, 60 → 80 costs 2,580 and 80 → 100
costs 3,440. At bronze income that is ~260 days, which suggested the tier multiplier. It was the
wrong model. Players concentrate on six key stats, and those reach the top of the range long
before OVR does.

`careerSim PAR=1` measures it. It plays bronze's calendar, then keeps training and playing
practice matches, with the patient spender and abilities on (20 careers per identity to day 120,
12 from day 121). Season starts are taken as days 41, 81 and 121. Mean of the four identities:

| day | season          | flat: OVR | flat: key avg | ×2/×3: OVR | ×2/×3: key avg | ×1.5/2/2.5: key avg |
| --- | --------------- | --------- | ------------- | ---------- | -------------- | ------------------- |
| 31  | Club, TM5       | 38        | 46            | 38         | 46             | 46                  |
| 41  | Regional starts | 42        | 52            | 43         | 53             | 53                  |
| 56  | Regional, TM1   | 48        | 61            | 53         | 69             | 66                  |
| 72  | Regional, TM5   | 53        | 69            | 62         | 82             | 76                  |
| 81  | Tour starts     | 56        | 73            | 67         | 90             | 82                  |
| 96  | Tour, TM1       | 60        | 79            | 78         | **100**        | 92                  |
| 112 | Tour, TM5       | 64        | 85            | 87         | 100            | **100**             |
| 121 | World starts    | 66        | 89            | 91         | 100            | 100                 |
| 136 | World, TM1      | 70        | 94            | —          | —              | 100                 |
| 160 | World ends      | 77        | 99            | —          | —              | 100                 |

- **Flat pay ends the career at the top of the range.** Key stats reach ~99 on the last day of
  World. Any multiplier above ×1 hits the ceiling before the story does, and leaves World with
  nothing to buy.
- **"Same days per tier" holds.** Each season is ~40 days. What tapers is the gain inside it:
  key stats +32, +21, +15, +10, and OVR +20, +14, +10, +10.
- **The price steps are doing their job.** They are why a 160-day career fits 0-100 at all. Keep
  `PRICE_STEP` as it is.
- **Any new pay source has to come out of this budget.** Sponsors, partners and prize money all
  push key stats to 100 sooner. Where one is added, take the same amount from somewhere else,
  or raise the step.
- **Ability prices** (`ABILITY_PRICES`) are flat units and stay flat. Against dearer stats they
  get relatively cheaper each tier, which is fine: late-game growth should lean on them.

One thing this does change: training numbers on screen don't grow. A Tour session pays what a
Club session pays, and buys a third as much. If that feels flat, the fix is presentational
(scale pay and prices by the same factor, so numbers grow but the pacing doesn't), not economic.

### 2.2 Target bands

The probe also finds each build's **par**: the opponent OVR it beats in half its best-of-three
matches, against the team-match opponents' stat shapes moved to that OVR. On average par sits
within a point of the player's own OVR, so a band is written as "expected OVR on that day,
plus N".

Bronze, which you've tuned by feel, calibrates N:

| bronze opponent | day | player OVR (mean) | opponent OVR | N   |
| --------------- | --- | ----------------- | ------------ | --- |
| Chet Vale, TM1  | 15  | 29                | 29           | +0  |
| Martia, TM3     | 23  | 34                | 36           | +2  |
| Olivia, TM5     | 31  | 38                | 41           | +3  |
| Keith, R1       | ~36 | ~40               | 36           | −4  |
| Chris, R2       | ~37 | ~40               | 39           | −1  |
| Max, R3         | ~38 | ~40               | 44           | +4  |
| Jordan, R4      | ~39 | ~41               | 46           | +5  |

Applied to the flat curve, with each season's days laid out like bronze (§3.1):

| tier     | player OVR in → out | key stats out | team matches 1-5   | tier-final rounds        | playoff | practice base |
| -------- | ------------------- | ------------- | ------------------ | ------------------------ | ------- | ------------- |
| Club     | 20 → 41             | 46-52         | 29, 34, 36, 38, 41 | 36, 39, 44, 46           | none    | 26-29         |
| Regional | 42 → 56             | 70-75         | 48, 50, 52, 54, 56 | 51, 54, 58, 60           | ~57     | 42-45         |
| Tour     | 56 → 66             | 86-90         | 60, 62, 64, 66, 67 | 61, 64, 68, 70           | ~67     | 56-59         |
| World    | 66 → 77             | 97-100        | 70, 72, 74, 76, 77 | 72, 75, 77, 79, 81 (BO5) | rematch | 66-69         |

- Each new tier opens below the last tier-final (Regional TM1 at 48, against Jordan's 46 plus
  the days in between), so promotion is a step up, not a wall.
- These are averages across identities, which hides the problem in §2.3.
- Specialty tiers II/III and abilities aren't in OVR. The probe's careers buy abilities, but
  stay on tier I specialties. Re-measure once tier II is in the sim.

### 2.3 Identities drift apart as stats rise

Par minus OVR, per identity, flat pay:

| day | bigServer | counter | netRusher | baseliner |
| --- | --------- | ------- | --------- | --------- |
| 31  | −1        | 0       | +2        | −2        |
| 56  | +2        | +1      | +6        | −6        |
| 81  | +1        | 0       | +9        | −8        |
| 112 | +1        | 0       | +10       | −10       |
| 160 | −6        | +3      | +13       | −11       |

At the end of bronze, every identity plays within two points of its rating. By the end of Tour
the net rusher and the baseliner, at the same OVR, play about 20 OVR apart. Against an opponent
set at par+3, one finds the Tour easy and the other can't win. That's the baseliner trap
`stat-currency-progression.md` §3.4 measured at tier 1, getting worse as stats climb.

Before Tour opponents are written, either:

- **fix the cause.** The tier-1 finding was that the baseliner's key stats (slice, spin, strength,
  stamina) are worth less than the net rusher's (anticipation, speed, tactics, serve). Re-run
  `statChannels` at a Tour-level baseline to see which stats stop paying at 70-90; or
- **balance per identity.** That isn't possible for authored opponents, who meet every player
  the same way.

The first is the real answer, and it's the biggest balance job this proposal uncovers.

### 2.4 The rosters

Wipe `TIER_2_OPPONENTS` and up and rebuild against the bands above. Keep the five-archetype
shape per tier, since key moments are tuned on that variety. Also give the rebuilt rosters:

- **specialties that grow with the tier.** Today `profileForArchetype` gives every opponent of
  an archetype the same profile, a mix of tier I and II specialties, whether it is Chet Vale or a
  tier 4 champion. (So Club opponents already play specialties at tier II while the player is
  capped at I.) Make the profile take the tier: mostly I at Club, II at Regional, III at Tour and
  World;
- **two abilities** from Tour on;
- **a stat spread that grows with the tier.** A World player has a 90 and a 60, not 14 stats at 84. Once everyone is good, the shape is what makes opponents feel different.

---

## 3. The season template

### 3.1 What a season is

One tier, about 40 days, laid out like bronze. Days are counted from the start of the season
(§3.4), so these numbers are the same in every tier.

| season days | slot                     | Club (exists)                         | Regional, Tour, World                                                    |
| ----------- | ------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| 1-2         | season opener            | welcome, making connections           | the promotion aftermath, a new venue, who moved up with you              |
| 2-8         | system intros            | the tutorial chain, one system a day  | one event per new system: training tier, specialty tier, what's new (§5) |
| 8-12        | team intro               | club team intro, first practice       | the new team or division, first practice, the season's rival team        |
| 13-31       | five team matches        | days 15, 19, 23, 27, 31               | same days. Same four events each                                         |
| 13-31       | storyline beats          | coach, rival, family, romance, career | the same storylines, one or two beats each, gated by tier (§7.2)         |
| 33-39       | tier-final               | Riverside Open prep, four rounds      | prep, four rounds (five at World)                                        |
| 40+         | promotion or the playoff | always promoted                       | win and you're promoted. Lose and you go to the playoff (§3.3)           |

Between scheduled events the loop is bronze's: training, practice matches, random events, hangouts.

### 3.2 What "team" means at each tier

Repeating bronze means a team match slot at every tier, which needs a fiction that survives
turning pro. Real tennis has one: pros play team events (Davis Cup, United Cup, Laver Cup)
alongside the tour.

| tier     | team matches                                               | tier-final                                          |
| -------- | ---------------------------------------------------------- | --------------------------------------------------- |
| Club     | the Academy team, lowest division                          | the Riverside Open                                  |
| Regional | the Academy team, promoted to the regional division        | a Regional Championship                             |
| Tour     | a pro team league: sponsor-named franchises, new teammates | a Tour Finals / Masters event                       |
| World    | the national team in a world team cup                      | a Grand Slam, best-of-five. The final is the ending |

Keith and Jen work as teammates through Regional. Jordan is the obvious final-round opponent of
each tier-final. That's a lot of Jordan, so one tier-final could go to someone who knocked him
out.

### 3.3 Losing the tier-final: the promotion playoff

Bronze's consolation promotion (the pasta heist) stays as it is. From Regional on, promotion is
earned, with a loop that always gives you another shot:

1. Lose in the tier-final and the elimination ceremony plays as it does today.
2. A few days later (5-7, so there is time to train), a **playoff match** is scheduled against
   one named opponent at about the tier's exit band (§2.2). This is a story match with the usual
   prematch, win and loss events.
3. **Win:** the promotion ceremony, and the next season starts.
4. **Lose:** a loss event, then the playoff is rescheduled 5-7 days on. The player keeps
   training in between, so they grow and the opponent doesn't.
5. **Safety net:** each failed attempt takes 2 OVR off the playoff opponent ("they had a tough
   week"), so even a player who doesn't train wins it eventually. That's optional, and it can be
   invisible.

Why a playoff instead of replaying the tournament:

- **Content.** A playoff is about 5 events. A replayed tournament needs rematch versions of 20.
- **No dead time.** It's a few days away, not a whole season.
- **It fits the existing story-match machinery.** Team matches already work this way.

What it needs from the engine:

- **Repeatable events.** `StoryEventManager` refuses any event in `completedStoryEvents`, so a
  loss event can't fire twice. Either add `repeatable: true` to `StoryEvent`, or author two loss
  variants and make only the third repeatable. The second is better comedy: "lost to the same
  guy twice" deserves its own lines.
- **A rescheduling loss outcome.** The loss outcome schedules the next attempt with
  `scheduledEvents`. That already works.

World is the exception, because its tier-final is the ending. Losing the Slam final can't
schedule "next season". There, the playoff is a **rematch**: the same final against the same
opponent, rescheduled the same way, with rematch dialogue. The ending only plays on a win.

### 3.4 Seasons in the calendar

Two changes, needed before anything above Club ships:

1. **Remove the 90-day rollover.** `TimeManager.advanceDay` resets `currentDay` to 1 after day 90. A Club-plus-Regional career reaches day ~85, so Tour would hit it. Today the reset breaks
   every `minDay`/`maxDay`, every absolute `scheduledDay`, and the "event is in the past"
   pruning in `ScheduledEventManager`.
2. **Season = tier, with season days.** Keep an absolute day for ordering, and add the day the
   current season started. "S2 · Day 15" is shown, and `minDay` and season schedules read the
   season day. Promotion starts the next season.

Then each season's spine becomes data instead of the hard-coded list in `createPlayer`:

```ts
// src/data/seasons/regional.ts
export const REGIONAL_SEASON: SeasonSchedule = {
  tier: 2,
  events: [
    { day: 1, slot: TimeSlot.MORNING, storyEventId: 'regional_opener' },
    { day: 13, slot: TimeSlot.MORNING, storyEventId: 'regional_team_match_1_scheduled' },
    // ...
  ],
};
```

The promotion outcome (`tierChange`) schedules the next season's file. Bronze's list moves into
`seasons/club.ts` with no behaviour change. That move is a safe first PR. Writing a season then
means writing events and one schedule file, which the `story-flow-manager` skill can wire.

---

## 4. Silver and gold training

What exists: five anchors, each a minigame. Three reps, a speed ramp, and a payout of the
anchor's mix × (reps + 1). `sessionTier` is hard-coded to `'bronze'`. The minigame API already
takes `rounds`, `speedRamp` and `maxScore`. The code notes "DR via cost scaling is deferred".

Rule: each tier's training adds **one new decision**, not a bigger number. Pay stays flat (§2.1),
so no option below may raise what a session pays on average. Each one changes _what_ it pays.

| option                    | what it is                                                                                                                                       | for                                                                                                                           | against                                                                                                        | cost   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| **T1. Better drills**     | A faster ramp each tier                                                                                                                          | Trivial, and the minigames get harder as the player does                                                                      | No new decision. A harder minigame is a hidden pay cut unless the typical clean-rep rate is held near bronze's | small  |
| **T2. Focus**             | From silver, a session also picks a focus currency that replaces the anchor's secondary. A serve with a Technique focus pays Power and Technique | Fixes `stat-currency-progression` §9.10: players train the shot they care about and still earn what their next purchase needs | Weakens the anchor-recipe link, which was a design goal                                                        | small  |
| **T3. Training partners** | From gold, train with Keith, Jen, Jordan and others. A partner adds their own currency lean and relationship points, gated on hangout tier       | Ties relationships to progression. Partner banter is a natural content slot                                                   | Needs a partner picker and a set of lines per partner                                                          | medium |
| **T4. Specialty drills**  | Gold sessions on a specialty instead of a shot. They pay towards specialization points                                                           | A second track once stats cost ×3-4                                                                                           | Spec points are scarce and tuned through levelling today                                                       | medium |
| **T5. Camps**             | A multi-day block at a facility, such as a clay camp. It pays a lot and costs the days                                                           | A real time trade-off                                                                                                         | A fixed season calendar leaves little room to give up days. Better as a story reward                           | medium |

**Recommendation.** Silver is T1 + T2: a harder ramp and a focus. Gold is T1 + T3. World adds no
new training: its new thing is best-of-five (§5). T4 waits until specialties have been measured
at tier II. T5 fits better as a one-off story event ("the coach sends you to clay camp") than as
a system.

### 4.1 Silver, concretely

Today's screen is five anchor cards, each showing what a perfect session pays ("up to 8 Power,
4 Mind" for serve). Silver adds one row above the cards: **Focus**, four currency chips, starting
on "Natural" (the anchor's own secondary). Picking a chip rewrites every card's preview, so the
choice is shown, not explained.

| session (3 clean reps)              | Club (today)         | Regional, natural    | Regional, Technique focus |
| ----------------------------------- | -------------------- | -------------------- | ------------------------- |
| Serve: main Power, second Mind      | 8 Power · 4 Mind     | 8 Power · 4 Mind     | 8 Power · 4 Technique     |
| Return: main Quickness, second Mind | 8 Quickness · 4 Mind | 8 Quickness · 4 Mind | 8 Quickness · 4 Technique |

- The formula stays `mix × (reps + 1)`, with the mix's secondary swapped for the focus. It's one
  extra argument to `trainingPayout`.
- Focus never touches the main currency. The shot you train still decides most of what you earn.
- The minigame's ramp starts faster at silver (`speedRamp`), so training feels like a step up.
  Tune it so a typical player still lands about two clean reps in three, or it quietly slows
  the curve in §2.1.
- The silver intro event (a season-2 system intro, §3.1) is where the coach explains it.

### 4.2 Gold, concretely

Gold keeps the focus row and adds a **partner** row: whoever you're close enough to train with.
A partner takes the focus slot: their currency instead of one you pick, plus a little
relationship and a line of banter. That keeps the pay flat. A partner who _added_ a unit per rep
would raise training pay by a third and cap key stats a season early.

| partner        | pays      | unlocked at            | flavour slot                                   |
| -------------- | --------- | ---------------------- | ---------------------------------------------- |
| Keith          | Power     | hangout tier 2         | hits every ball as hard as he can              |
| Jen            | Quickness | hangout tier 2         | makes you chase                                |
| Coach Gonzalez | Mind      | hangout tier 2         | brutal drills: costs a little mood             |
| Jordan         | Technique | hangout tier 2 (rival) | turns every drill into a competition           |
| Alex           | any       | hangout tier 3         | rotates. Romance points instead of a currency? |

- Each partner needs three to five lines for the result screen. That's the content cost.
- Training alone stays available and pays the same as silver.
- Partners are why hangouts matter for progression, which they don't today.

---

## 5. What each season opens

Each season's system-intro events (§3.1) introduce what's new. These are mostly scaffolded, so
the work is choosing which tier opens which, and what's new each season besides bigger numbers.

| season   | new systems                                                                                                                                 | other changes                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Regional | silver training with focus (T2). Specialty tier II (`gameStore` stops at `player.tier <= 1`)                                                | uncommon abilities in the shop. Hangout tier 2 events. The sponsor and media events move here |
| Tour     | gold training with partners (T3). Specialty tier III. **Scouting**: the archetype and abilities are hidden until you spend a slot (or Mind) | rare abilities. Opponents with two abilities. The agent arc. Hangout tier 3 events            |
| World    | **best-of-five** at the Slam. Stamina gets a late-match job (`stamina-at-tier-1.md`)                                                        | legendary abilities as story rewards. Opponents counter your most-used key-moment tactic      |

Notes:

- **Abilities.** There are 28: 10 common, 5 uncommon, 6 rare, 7 legendary. Rarity is inverted and
  levels run away (`simulation-findings` §5). Fix that before Tour, where rares arrive.
- **Gear.** The item pools for tiers 1-4 exist. Keep the four pools and rebuild their boosts
  against §2.2.
- **XP.** It buys shop items and levels, and ~600 sits unspent at the end of bronze. Under a
  repeated-season structure the simplest outlet is pricing gear and abilities by tier. Whether
  XP should also buy something new is open (§9).
- **Opponent tactics.** Key moments resolve your posture against a fixed archetype chart. The
  opponent never chooses. An opponent that adapts is new engine work, so it goes last.
- **Best-of-five.** The engine supports it (`MatchFormat.bestOfSets`), but `StoryMatchMetadata`,
  `TeamMatchConfig` and the game phase only allow BO1/BO3.

---

## 6. Where content goes

Per season, in the template's slots. Every slot is something you would write. "Named" means it
needs a character with an `appearance` and `plays` (see `spriteCheck`).

| slot            | events per season                         | named opponents | notes                                                                   |
| --------------- | ----------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| season opener   | 2-3                                       | —               | Regional can pay off the pasta heist                                    |
| system intros   | 2-3                                       | —               | one per new system (§5), told in a character's voice like the tutorial  |
| team intro      | 2                                         | —               | the new team or division and the season's rival team                    |
| team matches    | 20 (5 × 4)                                | 5               | the same shape as bronze, opponent flavour and all                      |
| storyline beats | 8-10                                      | —               | coach, rival, family, romance, career. Existing career events move here |
| tier-final      | 20 (4 ceremonies + 4 × 4)                 | 4               | World has five rounds, best-of-five                                     |
| playoff         | 5 (intro, prematch, win, 2 loss variants) | 1               | the World version is the final rematch                                  |
| **per season**  | **~60**                                   | **~10**         |                                                                         |

That's about 180 events and 30 named opponents for the three seasons. Ways to cut it if needed:

- **Loser-bracket prematch events.** These are 4 of the 20 tier-final events. They could become
  one generic line per round.
- **Storyline beats** can thin out at World, which is short on purpose.
- **Random misc events** need tier gating (§7.2), but not new content. Bronze's work at Regional
  if they're tagged `max: 2`.

Where today's events go:

- `sponsor_first_offer` (day 15, 3 wins) and `media_interview` (day 20, 5 wins) fire in bronze
  today. They fit Regional.
- `agent_approach` (day 30) and `equipment_upgrade` fit Tour.
- `romance_professional_match` and `family_care_package` sit late in their chains, and are natural
  Regional beats.

---

## 7. Engineering gaps found while reading

Ordered by how badly they would bite.

1. **The 90-day rollover** (§3.4). It resets the day, so Tour would break.
2. **Story events have no tier prerequisite.** `StoryEventPrerequisite` has `minSeason` but no
   tier. Random club events (the juggler, the old man) would keep firing on the Tour, and Tour
   events could fire at Club. Fix: add `tier: { min, max }`, and tag bronze random events
   `max: 1` (or `max: 2` for the ones that still fit). Once season = tier, `minSeason` is nearly
   the same thing, but tier says what the author means.
3. **Events and tournaments only fire once.** `completedStoryEvents` blocks repeats, and
   `getEligibleTournaments` drops anything in `completedTournaments`. The playoff (§3.3) needs a
   repeatable event.
4. **Training has no tier.** `buildAnchorTrainingResult` hard-codes `sessionTier: 'bronze'`.
   `TrainingSessionTier` and the copy in `types/index.ts` disagree (one has `'platinum'`).
5. **Dead tier state.** Nothing calls `unlockedTiers`/`unlockNextTier`. `player.tier` is the real
   gate. Delete it while touching tiers.
6. **BO5 isn't plumbed** through story and tournament types (§5).
7. **`progress.ts` is stale.** It says tiebreaks are missing, but `ScoreTracker` plays them.

---

## 8. How we would test it

- **The pacing probe** (done, §2.1-2.3): `careerSim PAR=1`, with `TIER_PAY` to try a
  multiplier. It still models the time after bronze as training and practice only. Give it each
  season's calendar (team matches, the tier-final) and specialty tier II/III once those are
  decided, then re-run §2.2.

  ```
  PAR=1 RUNS=20 N=150 DAYS=120 CHECK=15,23,31,41,48,56,64,72,81,88,96,104,112,120 \
    npx tsx src/test/analysis/careerSim.ts                       # flat, ~35 min
  PAR=1 RUNS=12 N=100 DAYS=160 CHECK=121,136,152,160 npx tsx src/test/analysis/careerSim.ts
  PAR=1 ... TIER_PAY=41:2,81:3 npx tsx src/test/analysis/careerSim.ts    # the ×tier curve
  ```

- **A `tierProbe`** generalising `tier1Probe`: check that each spine opponent is beatable by the
  mean build of each identity on its scheduled day (point-win 45-60%, say).
- **Saves.** Record end-of-bronze saves for each broad archetype (`src/debug/saves/`). They are
  the starting point for every Regional playtest. The bot can make them, but its spending is not
  a real player's (one bot career finished bronze with focus 91 and slice 21), so set the stats
  up by hand.
- **Bot runs.** `runBot` already plays the bronze career end to end (`e2e/bot.ts`). A Regional
  soak needs the playoff loop and the season start handled.

---

## 9. Open questions

1. **Who comes with you.** Do Keith and Jen stay teammates through Regional? Does anyone come
   onto the Tour?
2. **The playoff safety net.** Should the opponent visibly get weaker each attempt, invisibly, or
   not at all?
3. **XP.** Is pricing gear and abilities by tier enough of an outlet, or does it want a new job?
4. **Doubles.** In scope ever? `rival_doubles_disaster` hints at it, but it is a simulation
   rewrite.
