# Mid-to-late progression: Regional, Tour and World

**Status:** brainstorm. Nothing is agreed yet. The open questions are in §9.
**Scope:** everything after the Riverside Open: how the three tiers above Club are structured,
how fast the player grows through them, what silver and gold training are, and where content
goes. This doc does not write any content. It names the slots that content goes into.
**Ground rule:** anything above bronze can be wiped. That covers the tier 2-4 rosters, item tier
pools, drop rates, and the `TrainingSessionTier` values nothing uses yet.

---

## Summary

1. **Bronze works as a template.** It is a 36-day authored spine. Tutorial, then the team, the
   coach and your archetype. Then five team matches, four days apart, then a four-round
   tournament that always promotes you. Free slots in between go to training (68% of slots),
   practice and random events. The player goes from OVR 20 to about 40. Key stats reach the high
   40s, the rest the low 30s.
2. **The price curve sets the pacing problem.** Each tier costs more than the last: +1 on every
   stat costs 43 units at ×1. Bronze income is ~30 units a day.

   | band     | units | days at bronze income | days if income scales with the step |
   | -------- | ----- | --------------------- | ----------------------------------- |
   | 20 → 40  | 860   | ~29 (this is bronze)  | ~29                                 |
   | 40 → 60  | 1,720 | ~57                   | ~29 (×2)                            |
   | 60 → 80  | 2,580 | ~86                   | ~29 (×3)                            |
   | 80 → 100 | 3,440 | ~115                  | ~29 (×4)                            |

   At flat income, Club-to-World is ~260 more days of grind. The first decision is whether each
   tier lasts about as long as bronze (income scales with the tier) or gets longer and slower (§2).

3. **The existing tier 2-4 rosters are a cliff.** The player leaves bronze at ~OVR 40 against a
   Jordan of 46. The tier 2 practice roster is 56-57, tier 3 is 66-69 and tier 4 is 81-85.
   Rebuild them as overlapping bands (§2.3).
4. **Structure: an authored spine plus a circuit (§3, option C).** Every tier keeps a bronze-style
   authored spine: a team season, a rival beat, a tier-final tournament. From Regional on, a
   circuit of repeatable tournaments sits around it, so the player chooses where to play and
   isn't stuck waiting for the next scheduled event. Content cost per tier stays close to
   bronze's.
5. **Silver and gold training (§4).** Silver: same minigames, a harder speed ramp, ×2 pay, and
   a **focus** that steers the secondary currency. That fixes the "big server trains backhand
   for Technique" finding. Gold: **training partners** (relationship-gated, they pay what they're
   good at) and multi-day **camps**. Each tier adds one new decision, not just a bigger number.
6. **Late game, progression moves from stats to decisions (§5).** Stats cost ×3-4, so specialty
   tiers II/III, ability levels, scouting, adaptive opponents and longer formats have to carry
   more of the growth. Most of these are already scaffolded.
7. **Six engineering gaps need fixing before any of this is safe to build (§7).** The worst:
   the calendar rolls over at day 90 and resets `currentDay` to 1. That breaks every `minDay`
   prerequisite and every absolute `scheduledDay`. There is also no tier prerequisite for story
   events, so club-flavoured random events would keep firing on the Tour.

---

## 1. What bronze is, measured

### 1.1 The calendar

| days  | what happens                                                                                    |
| ----- | ----------------------------------------------------------------------------------------------- |
| 1-7   | tutorial chain, one scheduled event per morning (`gameStore.createPlayer`)                      |
| 8-12  | rival encounter, club team intro, coach, archetype pick, first practice                         |
| 13-31 | five team matches on days 15, 19, 23, 27, 31. Each announcement fires two days before its match |
| 33-36 | Riverside Open prep, then the ceremony, then four rounds with a winner and a loser bracket      |
| 37    | `thanks_for_playing`. Winning and the consolation bracket both set `tierChange: 2`              |

The whole spine is scheduled by absolute day in `createPlayer`. Random events (40% trigger
chance) and hangouts fill the gaps.

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

### 2.1 Three ways to pace it

**A. Income scales with the tier (recommended).** Silver training and matches pay ×2, gold ×3,
World ×4: the same step the price curve takes. Each 20-point band then takes about as long as
bronze did (~30 days of play), and the player's sense of speed doesn't change.

- One side effect: stats below 40 still cost ×1, so off-stats get cheap to backfill once income
  doubles. Most players round out early in Regional. That is probably fine, and it closes the
  "specialisation tax" gap from `stat-currency-progression.md` §10.5 by itself.
- Implemented as a tier multiplier in `CurrencyIncome`. One number per tier in `economy.ts`.

**B. Flat income, longer tiers.** Keep bronze income and let each tier take longer: ~57, ~86 and
~115 days. That is a classic RPG slow-down, but it is 260 days of mostly training. It only works
if the non-stat systems (§5) carry the late game.

**C. Scale income, cap stats per tier.** Do A, and also add a ceiling per tier. A stat can't be
bought past it until you are promoted. For example: Club 50, Regional 65, Tour 80, World 100.

- This makes the player's strength at each tier predictable, which is what balancing needs.
  It also stops a player out-grinding the tier.
- It costs something real. A struggling player is never near the cap, so it only bites the
  strong one, and that player may feel walled. The Development screen would need to show it
  (a cap marker on the bar).

### 2.2 Target bands

These follow from A, with each tier about the same length as bronze. They are the first thing to
agree on, because every opponent stat block is written against them.

| tier     | player OVR in → out | key stats out | spine opponents | practice base |
| -------- | ------------------- | ------------- | --------------- | ------------- |
| Club     | 20 → 40             | 45-50         | 29 → 46         | 26-29         |
| Regional | 40 → 55             | 60-65         | 42 → 58         | 40-44         |
| Tour     | 55 → 70             | 72-78         | 56 → 72         | 54-58         |
| World    | 70 → 85             | 85-92         | 70 → 88         | 68-72         |

- The first opponent of each tier sits just above where the player arrives. That matches how
  bronze opens (Chet Vale is 29 against a ~25 player).
- The bands overlap by four points or so. Jordan at 46 and Regional's first team match at ~42
  means promotion feels like a step up, not a wall.
- Growth per tier shrinks from +20 to +15 because steps get dearer while each tier also adds
  non-stat strength (specialty tiers, abilities). That's a guess; `careerSim` would set it (§8).

### 2.3 The rosters

Wipe `TIER_2_OPPONENTS` and up and rebuild against the bands above. Keep the five-archetype
shape per tier, since it is the variety key moments are tuned on. Also give the rebuilt rosters:

- **specialties at tier II/III.** Today opponents carry a broad archetype profile only;
- **two abilities** from Tour on;
- **a stat spread that grows with the tier.** A World player has a 90 and a 60, not 14 stats
  at 84. Shape is what makes opponents feel different once everyone is good.

---

## 3. Structure options for a tier

### A. Repeat the bronze season

Each tier is a new team season. A new division, five team matches, one tier-final tournament,
promotion.

- **For:** proven, and the content pipeline is the one you already use. Easy to balance because
  the schedule is fixed.
- **Against:** a fourth time through the same rhythm is a lot. The player still never chooses
  what to play. It also keeps the team going into the Tour, which doesn't fit the fiction past
  Regional.
- **Content:** ~50 events and ~9 named opponents per tier, so ~150 for the three.

### B. Open circuit

After bronze the calendar opens up. Tournaments run on fixed weeks, and the player chooses which
to enter. Each entry costs a fee or a prep day, and tournaments overlap so you can't play
everything. Results earn **ranking points**, and promotion comes at a ranking threshold.

- **For:** player agency, replay value, and a real reason to manage energy and form across
  weeks. Rankings give XP and "how am I doing" a home.
- **Against:** the most systems work: rankings, generated draws, generic events for rounds
  nobody wrote. Harder to balance because the player chooses the order. Authored story has to
  hang off flexible hooks.
- **Content:** fewer bespoke events, but many short generic ones (a draw announcement, an
  opponent intro, win and loss lines) that work for any round.

### C. Authored spine plus circuit (recommended)

Every tier keeps a short authored spine, and a circuit fills the time around it.

- **Spine:** tier opener, a team or rival arc of 3-4 scheduled matches, a mid-tier story beat,
  and the tier-final tournament. It is fixed in the calendar, written like bronze, and it is
  where the comedy lives.
- **Circuit:** 2-4 repeatable tournaments per tier with drawn opponents from the tier roster.
  Each pays currency, XP and ranking points. The circuit gives a player who is behind somewhere
  to catch up, and a player who is ahead somewhere to spend the time.
- **Promotion:** comes from the tier-final, but entry needs a ranking. Play enough of the
  circuit to earn the wildcard. Failing the final means another circuit swing and another try,
  never a dead end.

It also lets the structure change from tier to tier:

| tier     | shape                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regional | mostly A. The Academy moves up a division (Keith, Jen and Jordan come with you). Four team matches, one circuit event, then the Regional Championship. It introduces rankings while the frame is still familiar |
| Tour     | mostly B. The team is behind you. Agent, sponsor, travel. A season of circuit events by surface (clay swing, grass swing), and an authored spine for the rival and the agent                                    |
| World    | short and authored. Qualify for the slams, best-of-five, the last rival meeting, an ending                                                                                                                      |

The circuit can be built once and reused in all three tiers, and its generic events stay short.

---

## 4. Silver and gold training

What exists: five anchors, each a minigame. Three reps, a speed ramp, and a payout of the
anchor's mix × (reps + 1). `sessionTier` is hard-coded to `'bronze'`, and the minigame API
already takes `rounds`, `speedRamp` and `maxScore`. The code notes "DR via cost scaling is
deferred".

Rule: each tier's training should add **one new decision**, not only a bigger number.

| option                    | what it is                                                                                                                                       | for                                                                                                                           | against                                                                         | cost   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| **T1. Better drills**     | Silver ×2 pay and a faster ramp. Gold ×3, four reps out of four, faster still                                                                    | Trivial. Matches the price step (§2.1A)                                                                                       | No new decision. A harder minigame only adds pay for players who can execute it | small  |
| **T2. Focus**             | From silver, a session also picks a focus currency that replaces the anchor's secondary. A serve with a Technique focus pays Power and Technique | Fixes `stat-currency-progression` §9.10: players train the shot they care about and still earn what their next purchase needs | Weakens the anchor-recipe link, which was a design goal                         | small  |
| **T3. Training partners** | Train with Keith, Jen, Jordan and others. A partner adds their own currency lean and relationship points, gated on hangout tier                  | Ties relationships to progression. Partner banter is a natural content slot                                                   | Needs a partner picker and one line set per partner                             | medium |
| **T4. Specialty drills**  | Gold sessions on a specialty instead of a shot. They pay towards specialization points                                                           | A second track once stats cost ×3-4                                                                                           | Spec points are scarce and tuned through levelling today                        | medium |
| **T5. Camps**             | A multi-day block at a facility, such as a clay camp. It pays a lot and costs the days, and opens with a story event                             | Real time trade-offs against the circuit. Very good with B or C                                                               | Needs calendar blocking                                                         | medium |
| **T6. Facilities**        | The training tier is bought (XP or prize money) rather than given at promotion                                                                   | Gives XP an outlet                                                                                                            | Promotion feels less like a reward                                              | small  |

**Recommendation.** Silver is T1 + T2: double pay, a harder ramp, and a focus. Gold is T1 + T3,
and T5 if the circuit ships. T4 waits until specialties have been measured at tier II.

---

## 5. Other progression vectors, by tier

These are mostly scaffolded. The question is which tier opens each one, so each tier has
something new besides bigger numbers.

| vector           | today                                                                                                                                          | proposal                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specialty tiers  | Tier I only at Club (`gameStore` checks `player.tier <= 1`). Tiers II/III exist in data                                                        | Regional opens II, Tour opens III. Points still come from levels                                                                                                                                                |
| Abilities        | 28: 10 common, 5 uncommon, 6 rare, 7 legendary. Drop rates by opponent tier. Rarity is inverted and levels run away (`simulation-findings` §5) | Fix rarity before Tour. Gate shop rarity by tier: uncommon at Regional, rare at Tour. Legendaries are story rewards in Tour and World                                                                           |
| Gear             | Item pools by tier 1-4 exist                                                                                                                   | Keep the four pools and rebuild their boosts against §2.2. Surface shoes matter at Tour, where the surfaces swing                                                                                               |
| XP               | Shop currency plus levels. ~600 unspent at the end of bronze                                                                                   | Pick one job. **(a)** XP keeps buying things, and facilities (T6) and coaching soak it up. **(b)** A new prize-money currency from tournaments and sponsors buys gear, and XP becomes levels and abilities only |
| Relationships    | Hangout tiers 0-3 at 25/50/75                                                                                                                  | Hangout tier 2 lands in Regional and tier 3 in Tour, so the tier 3 events are late-game content. Partners (T3) give them a gameplay job                                                                         |
| Rankings         | none                                                                                                                                           | Regional introduces them, the circuit (option C) runs on them, and promotion needs them                                                                                                                         |
| Scouting         | The opponent's archetype is always shown before a match                                                                                        | From Tour, hide the archetype and abilities until scouted. Scouting costs a slot (or Mind) and makes key-moment reads a skill again                                                                             |
| Opponent tactics | Opponents don't adapt in key moments                                                                                                           | From Tour, opponents counter your most-used tactic. Progression in reading, not stats                                                                                                                           |
| Formats          | The engine supports best-of-five (`MatchFormat.bestOfSets`). Story and tournament types only allow BO1/BO3                                     | Slams are best-of-five. Stamina's late-match value grows with match length (`stamina-at-tier-1.md`), which gives it a late-game job                                                                             |
| Surfaces         | Per match, cosmetic in strategy terms                                                                                                          | The Tour season runs by surface. Your build has a best and a worst swing                                                                                                                                        |

---

## 6. Where content goes

Per tier, under option C. Every slot is something you would write. "Named" means it needs a
character with an `appearance` and `plays` (see `spriteCheck`).

**Regional (Academy, second division).**

- Opener. A new division, who made it up with you, and a new rival team. Payoff for the
  consolation-promotion gag ("the pasta heist") in the press.
- A Regional team season: four team matches, 4 events each, 4 named opponents.
- One circuit event: short generic lines plus one bespoke round of comedy.
- Mid-tier beats: the sponsor offer and the media interview move here from bronze (they gate
  only on day and wins today). Rival arc beat two, and family investment.
- The Regional Championship: 4-5 rounds, 4 events each. The final is Jordan, or someone who beat
  him.
- Promotion and consolation: the team breaks up. Turning pro.

**Tour.**

- Opener. The agent (`agent_approach` moves here), moving out, a travel montage.
- Circuit by surface: 4-6 tournaments, one bespoke character per swing.
- Spine: the agent and sponsor arc, the rival on tour, the romance's long-distance turn, the
  coach deciding whether to come with you.
- The Tour Finals: the tier-final tournament.

**World.**

- Qualifying for the slams. Each slam is a short bespoke tournament.
- Last rival meeting, an ending, and post-game (§9).

Rough counts. The generic circuit lines are written once and reused.

| tier     | bespoke events | generic lines | named opponents |
| -------- | -------------- | ------------- | --------------- |
| Regional | ~40            | ~15           | ~9              |
| Tour     | ~35            | reuse         | ~8              |
| World    | ~25            | reuse         | ~5              |

---

## 7. Engineering gaps found while reading

Ordered by how badly they would bite.

1. **The season rollover resets the day.** `TimeManager.advanceDay` sets `currentDay: 1` after
   day 90. That breaks every `minDay`/`maxDay`, every absolute `scheduledDay`, and the "past
   event" pruning in `ScheduledEventManager`. Regional would cross day 90. Fix: an absolute day,
   with the season derived from it.
2. **Story events have no tier prerequisite.** `StoryEventPrerequisite` has `minSeason` but no
   `minTier`/`maxTier`. Random club events (the juggler, the old man) would keep firing on the
   Tour, and Tour events could fire at Club. Fix: add `tier: { min, max }`, and tag bronze
   random events `max: 1` (or `max: 2` for the ones that still fit).
3. **Training has no tier.** `buildAnchorTrainingResult` hard-codes `sessionTier: 'bronze'`.
   `TrainingSessionTier` and `index.ts` disagree (`'platinum'`). Fix it when T1 lands.
4. **Tournaments only play once.** `getEligibleTournaments` drops anything in
   `completedTournaments`, and rounds are fixed opponents. The circuit needs a recurring
   tournament and a draw generator.
5. **Dead tier state.** `unlockedTiers`/`unlockNextTier` is never called. `player.tier` is the
   real gate. Delete it while touching tiers.
6. **BO5 isn't plumbed.** The engine takes it, but `StoryMatchMetadata`, `TeamMatchConfig` and
   the game phase only allow BO1/BO3.
7. **`progress.ts` is stale.** It says tiebreaks are missing, but `ScoreTracker` plays them.

---

## 8. How we would test it

- **Extend `careerSim` past day 31,** through the Riverside Open and into a Regional calendar with
  the tier multiplier. This is the harness that turns §2.2 from a guess into a table. Do it
  before writing any Regional opponent.
- **A `tierProbe`** generalising `tier1Probe`: given a tier's band, check that each spine
  opponent is beatable by the mean build of each identity at its scheduled day (point-win
  45-60%, say).
- **Saves.** Record end-of-bronze saves for each broad archetype (`src/debug/saves/`). They are
  the starting point for every Regional playtest, and the bot can produce them.
- **Bot runs.** `runBot` already plays the bronze career end to end. A Regional soak needs the
  circuit phases handled.

---

## 9. Open questions

The answers change which option above is right.

1. **Length and ending.** How long should the whole game be, in days or hours? Does it end, with
   credits after a slam, or is there a post-game (defend titles, new seasons)?
2. **Structure.** Repeat-bronze (A), open circuit (B), or the hybrid (C)? And should Regional
   still be an Academy team season?
3. **Failure.** Bronze always promotes. From Regional on, can a player fail the tier-final and
   go again, or stay stuck? Should demotion ever exist (`TierModification` has it)?
4. **Pacing.** Should each tier feel as fast as bronze (income ×tier), or slower and more
   precious? Is a stat cap per tier acceptable?
5. **Content budget.** Roughly how many events can you write per tier? That sets how much the
   circuit has to carry.
6. **Doubles.** In scope ever? `rival_doubles_disaster` hints at it, but it is a simulation
   rewrite.
7. **XP's job.** Keep XP as shop money, or add prize money?
