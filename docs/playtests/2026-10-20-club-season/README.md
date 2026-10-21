# Club season playtest — 2026-10-20

Ten whole careers played through the real UI (Playwright, the creator to the `thanks_for_playing`
end screen), and 1,896 careerSim careers across a wide sweep of player types. What patterns show
up, and what looks broken.

- UI runs: `e2e/playtest.spec.ts` (`PLAYTEST=1 npx playwright test playtest`). End screens in
  [`screenshots/`](screenshots/), each run's log, build and errors in [`ui-runs/`](ui-runs/).
- Sims: `careerSim.ts` `CAREERS=` mode, swept by [`sim/sweep.sh`](sim/sweep.sh), summarised by
  [`sim/analyze.py`](sim/analyze.py) into [`sim/summary.json`](sim/summary.json); every career is
  in `sim/careers.jsonl.gz`.

## Headlines

1. **The game holds together end to end.** 10/10 UI careers reached the end screen with no
   softlock and no unhandled phase, in 5–8 minutes of instant-speed play (day 41–44).
2. **A React "Maximum update depth exceeded" error fires during live matches in 6 of 10 runs.**
   Intermittent; caught once at day 23, mid team match (`match_active`, story match). See Issues.
3. **Skill is the biggest lever, and spending style is a close second.** A skilled player's
   chance of winning the Riverside Open is ~5× a casual player's (37% vs 7%); spending whatever
   is affordable beats the default patient spender by +1.7 OVR and +10 points of title chance.
4. **Every focused build earns a currency it never needs.** bigServer finishes the season with
   ~100 unspendable Quickness in every setting; the baseliner hoards Mind and Quickness, the
   counter Technique. Nothing converts it.
5. **netRusher is the strongest identity, the baseliner the weakest**, mostly because of the
   final: netRusher beats Jordan 53% of the time, the baseliner 29%.
6. **Olivia Gulp (team match 5) is a wall in the UI**: lost in 8/10 UI careers, mostly 0-6 0-6,
   while careerSim rates that match a coin flip. The biggest UI-vs-sim gap found.
7. **The first matches are mostly lost.** The day-5 tutorial matches went 3/10 (Keith) and 1/10
   (Jen), and practice before day 15 won 25% (14/55), against ~49% for the rest of the season.

## Issues

| #   | Severity  | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Medium    | **`Maximum update depth exceeded` in live matches** (console.error from react-dom), 1–4 times in runs 1, 2, 6, 7, 8 and 10 and once in the debug rerun of run 2 (day 23, team match vs Martia Estrella, `match_active`). Not every run, not reproducible on demand. All runs used instant match speed, where `MatchOrchestrator` plays `INSTANT_POINTS_PER_YIELD` points between yields, so the per-point `setState` effects in `MatchCourt` (rally frames), `MatchStatsCompare` (flashes) and `MatchToasts` are the first suspects. Root cause not confirmed. |
| 2   | Low       | **Raw ability ids on the pre-match screen.** "Their abilities" shows `spin_master` instead of "Spin Master": `PreMatchScreen.tsx:156` renders `ability.name` without `formatAbilityName`, which every other ability list uses.                                                                                                                                                                                                                                                                                                                                 |
| 3   | Design    | **Consolation bracket replays the main bracket.** After a loss the player still faces the remaining rounds' opponents, Jordan included (run 2 lost to Max, then beat Jordan "in the consolation"). The rival final reads oddly when it happens off the main bracket.                                                                                                                                                                                                                                                                                           |
| 4   | Design    | **Dead currency** (Headline 4, table below). With no exchange, 9–11% of a bigServer's or baseliner's lifetime earnings is unusable under the default spender, 17–18% under the impatient one.                                                                                                                                                                                                                                                                                                                                                                  |
| 5   | Balance   | **Olivia Gulp / team match 5** (Headline 6). Even each UI run's day-44 build only beats her 40–96% in the quick sim (the lowest of the five opponents for every run), and the live UI matches did far worse at day 31. Worth a targeted probe of the live engine (key moments, posture) against the quick sim on that matchup.                                                                                                                                                                                                                                 |
| 6   | Balance   | **Rough first week.** The day-5 tutorial losses and a 25% early practice record mean a new player's first ~10 matches are mostly losses.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | Harness   | `careerSim` played team-match opponents **without their abilities**; the game gives them (Slider, Spin Master, Netcrasher, Baseliner, Soft Hands). Now `TEAM_ABILITIES=1`. Off by default to keep existing calibration; across 200 baseline careers it changed mean team wins by only 0.02, but per identity by up to ±0.5 (netRusher 3.22 → 2.74, baseliner 2.18 → 2.62).                                                                                                                                                                                     |
| 8   | Harness   | careerSim's default has **no gear shop** (`GEAR` off). Gear doubles title odds (14% → 35% pTitle), and real players buy gear, so careerSim's default numbers understate a real career. The UI runs (gear, 7–13 items each) won the title 3/10, in line with `GEAR=all`.                                                                                                                                                                                                                                                                                        |
| 9   | Harness   | The bot never claims challenges (every end screen says "Challenges done 0"), and the default policy never spends specialty points (run 8 ended with 6 unspent). Its numbers understate income accordingly.                                                                                                                                                                                                                                                                                                                                                     |
| 10  | Not a bug | Scorelines are bimodal: many 6-0 6-0 both ways. That is the per-match form roll (`MATCH_FORM.variance` 8, in both engines) doing what its comment says: a good or bad day decides the match. Worth knowing if matches feel decided before they start.                                                                                                                                                                                                                                                                                                          |

The end screen itself held up on desktop and on the Pixel 5 (no overflow, all panels present). Its
record excludes the two day-5 tutorial matches, so it reads two fewer than the matches played.

## UI runs

Each run plays one career identity, answers Coach Gonzalez with its archetype, and differs in
tactics (first or random key-moment tactic), story choices (first or random) and spending.
"Shaped" runs spend toward the identity's build (`IDENTITY_BUILDS`), take its specialties and
play practice every other day; run 8 is the default bot (top-to-bottom spending, practice
whenever possible, no specialties).

| Run | Identity  | Device  | Tactics | Story  | Shaped | End day | OVR | Team (TM1–5) | Riverside main bracket | Practice | Errors |
| --- | --------- | ------- | ------- | ------ | ------ | ------- | --- | ------------ | ---------------------- | -------- | ------ |
| 1   | bigServer | desktop | first   | first  | yes    | 44      | 45  | L L W L L    | R2 loss (Chris)        | 9/20     | 1      |
| 2   | counter   | desktop | random  | random | yes    | 44      | 46  | W W L W W    | R3 loss (Max)          | 9/20     | 2      |
| 3   | netRusher | desktop | first   | random | yes    | 41      | 47  | W L W W L    | **Champion**           | 11/18    | 0      |
| 4   | baseliner | desktop | random  | first  | yes    | 44      | 42  | L L L W L    | R3 loss (Max)          | 8/20     | 0      |
| 5   | bigServer | desktop | random  | random | yes    | 43      | 42  | W W L L L    | R1 loss (Keith)        | 9/19     | 0      |
| 6   | counter   | desktop | first   | first  | yes    | 41      | 46  | W W W W L    | **Champion**           | 9/18     | 1      |
| 7   | netRusher | desktop | random  | random | yes    | 44      | 47  | W L L W L    | Final loss (Jordan)    | 10/20    | 2      |
| 8   | baseliner | desktop | first   | first  | no     | 43      | 43  | L L W L L    | R2 loss (Chris)        | 8/37     | 1      |
| 9   | netRusher | mobile  | random  | random | yes    | 41      | 49  | W W W W L    | **Champion**           | 8/18     | 0      |
| 10  | counter   | mobile  | first   | random | yes    | 44      | 45  | L W L W W    | R3 loss (Max)          | 9/20     | 4      |

By match, the UI careers won TM1 6/10, TM2 5/10, TM3 4/10, TM4 7/10, **TM5 2/10**.

What the runs show beyond the issues:

- **netRusher won 2 of its 3 titles** (and reached the final in the third); no baseliner got
  past Max.
- **Return is the stat everyone skips.** It ended 21–27 for every serve-first build, below every
  key stat.
- **The default bot plays itself into the ground**: practice every slot it can (37 matches, 22%
  won) and buying top to bottom gave serve 68 / backhand 70 / focus 81 next to slice, spin and
  placement at 20 — a lopsided build with no specialties that still finished at OVR 43.

## Career sims

1,896 careers, each to day 35 (the eve of the Riverside Open), then the Riverside Open with that
build: once as a bracket and 20 BO3s per round for each round's win share. **pTitle** is the
product of the four win shares (the steadier estimate); **champion** is the single bracket.

| Batch                    | Careers | What varies                                                                                    |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| baseline                 | 200     | defaults, 50 per identity, team-match abilities on                                             |
| baseline-noTeamAbilities | 200     | the same, abilities off (careerSim's old behaviour)                                            |
| sweep                    | 1,296   | skill (4) × SPEND (3) × ADAPT 0.4/0.7/1.0 × MATCH_EVERY 1/2/4, 3 careers per identity per cell |
| gear                     | 100     | `GEAR=all`                                                                                     |
| storyHeavy               | 100     | `STORY_CHANCE=70`                                                                              |

Skill profiles: casual `REPS_P=0.5 MINIGAME_PASS=0.4 CHALLENGE_P=0.3`, average (the defaults),
averageBest (defaults with `STORY_PICK=best`), skilled `REPS_P=0.9 MINIGAME_PASS=0.85
CHALLENGE_P=0.8 STORY_PICK=best`.

### By identity (baseline, n = 50 each)

| Identity  | OVR d35 | Team wins /5 | TM1–5 win %    | R1–R4 win share (Keith, Chris, Max, Jordan) | pTitle | Unspent P/Q/T/M   |
| --------- | ------- | ------------ | -------------- | ------------------------------------------- | ------ | ----------------- |
| netRusher | 45.1    | 2.74         | 62 58 50 50 54 | 91 83 54 53                                 | 25.6%  | 13/31/13/2        |
| bigServer | 44.3    | 2.18         | 50 52 36 38 42 | 85 72 40 38                                 | 11.5%  | 6/**101**/6/10    |
| counter   | 43.7    | 2.30         | 50 40 40 52 48 | 88 74 43 31                                 | 10.5%  | 12/8/**40**/6     |
| baseliner | 42.6    | 2.62         | 56 60 48 56 42 | 85 80 48 **23**                             | 9.0%   | 2/**60**/5/**75** |

- The bracket gets steeply harder: ~87% → 77% → 46% → 36% across the four rounds for the average
  player, so a title takes winning two coin flips after two near-certain rounds.
- Jordan is the baseliner's problem matchup (23–33% in every batch); netRusher handles him best.
- OVR spreads very little: sd 2.6 at day 35, so build _shape_ and specialties, not OVR, decide
  most matchups.

### What moves the outcome (sweep, n = 324–432 per row)

| Factor      | Setting     | OVR  | Team wins | pTitle | Unspent share |
| ----------- | ----------- | ---- | --------- | ------ | ------------- |
| Skill       | casual      | 41.4 | 2.04      | 6.9%   |               |
|             | average     | 43.9 | 2.50      | 15.5%  |               |
|             | averageBest | 45.1 | 2.57      | 20.4%  |               |
|             | skilled     | 47.9 | 3.10      | 36.6%  |               |
| Spending    | impatient   | 42.5 | 2.25      | 10.5%  | 11–18%        |
|             | patient     | 44.8 | 2.57      | 19.7%  | 4–11%         |
|             | affordable  | 46.5 | 2.84      | 29.2%  | 0–6%          |
| Practice    | every day   | 45.1 | 2.61      | 22.5%  |               |
|             | every 2nd   | 44.4 | 2.56      | 18.9%  |               |
|             | every 4th   | 44.3 | 2.49      | 18.1%  |               |
| Drill focus | ADAPT 0.4   | 44.3 | 2.47      | 19.1%  |               |
|             | ADAPT 0.7   | 44.8 | 2.64      | 20.7%  |               |
|             | ADAPT 1.0   | 44.6 | 2.55      | 19.8%  |               |

- **Picking the best story option is worth as much as a skill tier in minigames**: average →
  averageBest is +1.2 OVR and +5 points of title chance from story choices alone.
- **Spending wins by not sitting on currency.** "Affordable" buys off-identity stats with what
  the build can't use; that's +1.7 OVR over "patient" and it nearly erases the dead currency
  (bigServer still keeps 80 Quickness).
- **How strictly you follow your identity's drills doesn't matter** (ADAPT moves nothing
  beyond noise). Drill choice is not a meaningful decision as tuned.
- **More practice helps a little** (+0.8 OVR every day vs every 4th day) even though
  practice win rate drops (56% vs 60%), so playing more matches always pays.
- **Gear doubles the title** (pTitle 14% → 35%, team wins 2.46 → 2.97); a story-heavy
  calendar adds +0.7 OVR and +0.5 team wins.
- **Story pays most of the money**: ~45% of lifetime currency (≈620 of ≈1,380 units) against
  ≈505 from training, while taking a third of all slots (35 of ~105).
- **bigServer never buys an ability** in any of its 474 sim careers: none of the shop's offers
  clear careerSim's value bar for it (its cheap abilities rate 0.1–1.0 points of point-win). The UI bigServer runs did get
  abilities, from story and items.

### Dead currency

None of bigServer's key stats (serve, strength, placement, spin, focus, forehand) costs
Quickness (`STAT_RECIPES`), yet every match base, `split_step` and many story outcomes pay it.
Likewise none of the baseliner's key stats costs Mind, and the counter's need little Technique.

| Identity  | Lifetime earned P/Q/T/M | Unspent at day 35 (patient) | Share unspent |
| --------- | ----------------------- | --------------------------- | ------------- |
| bigServer | 442/245/370/278         | 6/101/6/10                  | 9%            |
| baseliner | 401/265/446/265         | 2/60/5/75                   | 10%           |
| counter   | 268/374/362/348         | 12/8/40/6                   | 5%            |
| netRusher | 337/347/358/344         | 13/31/13/2                  | 4%            |

The UI runs agree: runs 1 and 5 (bigServer) ended with 128 and 141 Quickness, run 4 (baseliner)
with 81.

## Method notes

- UI runs play at instant match speed with Quick Sim training (the bot's default), seeded
  (`?seed` via `reseed` and a per-run rng), from an isolated copy of the repo so editing files
  could not hot-reload the page mid-run (one early trial was lost to exactly that).
- careerSim's Riverside Open plays each round fresh (100 energy), at the venue, against the
  round's opponent with their abilities. It doesn't model the consolation bracket.
- Single-bracket champion rates are noisy (±3 points at n = 200); read pTitle for comparisons.
- Reproduce: `PAR=2 docs/playtests/2026-10-20-club-season/sim/sweep.sh <out-dir>` then
  `python3 docs/playtests/2026-10-20-club-season/sim/analyze.py <out-dir> summary.json`.
