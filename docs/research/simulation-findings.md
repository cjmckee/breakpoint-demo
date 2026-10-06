# Five simulation findings

Measured on the real MatchSimulator (and the live MatchOrchestrator for key moments), after the
one-pass fixes in `be89530` (ability level scaling, the clay net multiplier, Spin Master). Each
finding has the probe that found it, a proposal, and the before/after data. Only finding 1 is
applied; 2–4 are proposals, reproducible in memory with `tuneRun.ts` without editing config;
5 is a proposal only (abilities are not to be retuned yet).

The question behind all five: does a player's choice of stats matter, and can a weaker player
still win sometimes?

| #   | finding                                                                        | status                                     |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| 1   | Net play was capped by rally structure, not by archetype                       | applied, `efac2ed`                         |
| 2   | Double faults end a quarter of early-game points; servers can't hold           | not an issue (decided)                     |
| 3   | Upsets are near impossible past a 6-point rating gap                           | proposed: in-match rhythm (round 2)        |
| 4   | Key stats are an identity's worst buys; specialties don't grow with their stat | investigating: specialty synergy (round 2) |
| 5   | Abilities: four are dead, rarity is inverted, levels make commons dominant     | proposal only                              |

---

## 1. Net play was capped by rally structure

**Probe.** `netForward` (scratch, matchAnatomy's definition): "came forward" = an approach that
landed or a shot struck from the net, per rally that got past the return. Uniform 35 v uniform
35 with no archetype, hard.

**Finding.** Approaching was only possible on a baseline ball after the return, and most points
end within four shots, so a player gets about one such ball per rally. Approaching on every one
of them (base chance forced to the cap) still topped out near 26%. Aggressive players sat at
24%; you wanted 30–40%. Separately, clay added −0.35 to a 0.2 base and stopped everyone but
serve-and-volleyers coming in at all (fixed in `be89530`). And `rt_sneaky_beaky` described
chip-and-charge that no mechanic performed.

**Change (applied).** `NET_RUSH` in `shotThresholds.ts`: a server with SERVE_AND_VOLLEY_BIAS
follows the serve in (5% per point of bias, 40% of that on second serves); a returner with
NET_APPROACH_BIAS follows a good return in (2% per point of bias). Both capped at 80%.

| build                 | came forward / past return, before → after | / all points | point-win after |
| --------------------- | ------------------------------------------ | ------------ | --------------- |
| unspecialized         | 16.6 → 16.7                                | 9.3 → 9.3    | 50.2            |
| aggressive (legacy)   | 24.3 → **32.2**                            | 13.1 → 17.3  | 53.6            |
| all-court (legacy)    | 24.3 → 23.8                                | 13.6 → 13.3  | 52.0            |
| serve-volley (legacy) | 31.6 → **43.3**                            | 16.8 → 23.0  | 50.8            |
| big server (career)   | 23.2 → **30.3**                            | 12.6 → 16.5  | 49.1            |
| net rusher (career)   | 33.7 → **42.7**                            | 18.3 → 22.6  | 48.1            |
| counterpuncher        | 4.6 → 5.2                                  | 2.6 → 2.9    | 50.8            |
| baseliner (career)    | 4.8 → 4.0                                  | 2.6 → 2.2    | 50.8            |

Point-win in these mirrors stays 48–54%: coming forward more is a style, not a free win.
matchAnatomy texture: net builds' rallies shorten slightly (6+ shots 12.6% → 10.8% for the
net specialist); point endings unchanged within noise; net points won fall from ~79% to ~61%
for the specialist, because arriving no longer requires a perfect approach ball.

---

## 2. Double faults end a quarter of early-game points

**Probe.** `serveAndUpsetProbe` (serve section), uniform mirror matches, N=400 BO3.

**Finding.** `SERVE_CONSISTENCY` was fitted to "a double-fault rate around 28% for a beginner".
It does that, but a career spends its first month at overall 20–40, where it means about a
quarter of all points end on a double fault and servers lose serve more often than not. The
serve stat's main early job becomes avoiding a giveaway rather than winning points.

**Proposal.** `SERVE_CONSISTENCY.serve_second.base` 11.3 → **−6** (second serves land more
often; first serves untouched).

| rating | hold %, before → after | DF % of points | DF per service game | aces %    | server point-win |
| ------ | ---------------------- | -------------- | ------------------- | --------- | ---------------- |
| 25     | 41.1 → **53.9**        | 28.7 → 14.6    | 1.78 → 0.85         | 2.2 → 3.1 | 45.7 → 52.6      |
| 35     | 48.1 → **56.5**        | 22.3 → 9.9     | 1.34 → 0.55         | 2.6 → 3.3 | 49.0 → 54.0      |
| 50     | 57.7 → 58.0            | 12.8 → 5.7     | 0.73 → 0.31         | 4.2 → 5.0 | 54.5 → 55.7      |
| 70     | 59.2 → 58.7            | 4.4 → 1.4      | 0.24 → 0.07         | 6.5 → 8.1 | 56.0 → 56.4      |

(After = this change together with finding 3's. Form variance barely moves these rows: the
second-serve change alone, N=150, gave holds 56/59/62/59% and double faults 13.3/9.4/4.6/1.3%.)
Beginners still double-fault more than experts, and holds now rise with skill from the first
day instead of starting below 50%. Holds stay under 60% at 70; a higher-rating serve edge is a
separate question.

Reproduce: `TUNE='SERVE_CONSISTENCY.serve_second.base=-6' PROBE=serveAndUpsetProbe SECTIONS=serve npx tsx src/test/analysis/tuneRun.ts`

---

## 3. Upsets are near impossible past a 6-point gap

**Probe.** `serveAndUpsetProbe` (upset section): uniform 35 against uniform 35+gap, N=400 BO3.

**Finding.** Point-win falls ~2.7 points per point of rating gap, and tennis scoring amplifies
that, so a 10-point gap left the weaker player 2% of matches and 15 points 0%. Per-shot variance
cannot fix this (it averages out: rally variance 9 → 14 moved a 10-point gap from 1.5% to 2.0%);
`MATCH_FORM`, rolled once per match, is the lever its own doc names for upsets.

**Proposal.** `MATCH_FORM.variance` 8 → **14**.

| gap | point-win, before → after                            | game-win                            | weaker player's match-win |
| --- | ---------------------------------------------------- | ----------------------------------- | ------------------------- |
| 0   | 50.6 → 52.1                                          | 51.6 → 53.5                         | 53.0 → 54.5               |
| 3   | Upsets are near impossible past a 6-point rating gap | proposed: in-match rhythm (round 2) |
| 6   | 34.5 → 37.0                                          | 23.1 → 29.9                         | 15.5 → **26.0**           |
| 10  | 23.6 → 29.2                                          | 9.5 → 20.1                          | 2.3 → **14.8**            |
| 15  | 12.0 → 16.8                                          | 1.2 → 7.2                           | 0.0 → **3.0**             |
| 20  | 7.5 → 9.1                                            | 0.2 → 2.0                           | 0.0 → 0.0                 |

Stats still decide most matches (a 10-point edge wins 85%), but a one-tier-up story opponent is
beatable on a good day. Tested alternatives: variance 12 gives 25% / 11% / 1% at gaps 6/10/15;
16 gives 33.5% / 16.5% / 2.5%.

Reproduce: `TUNE='MATCH_FORM.variance=14' PROBE=serveAndUpsetProbe SECTIONS=upset npx tsx src/test/analysis/tuneRun.ts`

**Findings 2 + 3 together in the career** (`careerSim`, 30 careers per identity, readiness on
300 BO3 against each team-match opponent; A = today, A+tune = both proposals):

| day / opponent | match-win spread across identities, A → A+tune | point-win spread | holds (range)   |
| -------------- | ---------------------------------------------- | ---------------- | --------------- |
| 19 Rich Soil   | 14.0 → 10.7                                    | 6.1 → 6.5        | 43–57% → 52–67% |
| 23 Martia      | 18.0 → 14.6                                    | 8.3 → 6.8        | 25–41% → 38–50% |
| 27 Reginald    | 20.0 → 13.3                                    | 8.4 → 6.7        | 36–59% → 48–60% |
| 31 Olivia      | 27.0 → 17.0                                    | 9.4 → 8.8        | 24–51% → 36–55% |

---

## 4. Key stats are the worst buys, but the price curve isn't why identities differ

**Probe.** `statValueProbe`: +5 to each of the 14 stats on each identity's day-23 build,
N=1000 BO3 v Reginald, point-win gain per unit at that build's real prices.

**Finding A: no stat is dead where it's used.** Every stat moves point-win on every build by
+0.5 to +2.5 per +5, except `net` for players who never come forward (+0.1–0.3), which is
expected.

**Finding B: escalating prices make an identity's key stats its worst buys.** The engine pays
roughly the same per +5 at 28 as at 46, but the price doubles at 40, which is where key stats
sit by day 23. So the economy pays players to spread:

| identity   | key-stat value per 10 units | off-stat | key/off | key stats' ranks of 14 |
| ---------- | --------------------------- | -------- | ------- | ---------------------- |
| big server | 0.39                        | 0.78     | 0.50    | 6, 8, 10, 11, 13, 14   |
| counter    | 0.41                        | 0.64     | 0.64    | 8, 9, 10, 11, 12, 13   |
| net rusher | 0.48                        | 0.64     | 0.75    | 4, 6, 9, 10, 12, 13    |
| baseliner  | 0.48                        | 0.72     | 0.67    | 7, 9, 10, 11, 12, 13   |

Re-pricing the same measured gains: moving every step up 10 (×1 below 50) lifts key/off to
0.87–1.36; a gentler ×1.5 step to 0.66–0.97; no escalation to 0.97–1.41.

**Finding C: but the curve isn't what separates the identities.** In the career sim, step-at-50
with income lowered to land day-31 builds at today's strength (D, income ×1.0, plus the
finding 2–3 tuning):

| day 31 v Olivia | point-win A → D | match-win A → D |
| --------------- | --------------- | --------------- |
| big server      | 41.9 → 40.7     | 23.3 → 26.3     |
| counter         | 44.7 → 45.8     | 32.3 → 40.7     |
| net rusher      | 51.3 → 51.6     | 50.3 → 50.0     |
| baseliner       | 43.2 → 40.2     | 31.0 → 28.7     |
| spread          | 9.4 → 11.4      | 27.0 → 23.7     |

Without the income cut (B: step at 50, ×1.2), players end ~3 overall points stronger and the net
rusher pulls further ahead (point-win spread 12.0). At equal rating the net rusher wins ~9 more
points in 100 than the big server whatever the prices: the gap is in what each identity's stats
and specialties do in a match.

**Proposal.** Keep the price curve. The per-unit penalty on key stats is real but small next to
the identity gap, and changing the curve means re-calibrating income. Next: a per-identity probe
of why the big server and baseliner trail at equal rating (the big server holds 37–46% against
Olivia despite a serve-first build).

---

## 5. Abilities: dead ones, inverted rarity, and levels that run away

**Probes.** `abilityProbe` (Layer 1, MatchSimulator, N=1000 BO3 per condition, levels 1–3) and
`mentalAbilityProbe` (live MatchOrchestrator with key moments, N=600). For scale, +5 to a useful
stat is worth about +1.0 point-win.

Point-win gain, level 1 / 2 / 3:

| ability (rarity)      | baseliner     | net rusher   | big server   | counter      |
| --------------------- | ------------- | ------------ | ------------ | ------------ |
| Heavy Hitter (C)      | +4.9/8.5/11.4 | +2.2/3.6/4.4 | +1.8/3.8/5.0 | +1.1/2.3/3.0 |
| Baseliner (C)         | +2.8/5.2/6.5  | +1.5/3.1/4.0 | +2.1/4.3/5.8 | +3.6/6.9/9.9 |
| Netcrasher (C)        | +0.5/0.9/0.9  | +3.6/6.3/7.3 | +3.9/6.5/7.4 | +0.2/0.4/0.3 |
| Soft Hands (C)        | +0.4/0.5/0.6  | +3.3/6.0/7.0 | +2.9/5.4/6.6 | +0.2/0.3/0.4 |
| Spin Master (C)       | +1.2/1.7/2.4  | +0.0/0.2/0.3 | +0.2/0.3/0.9 | +0.8/1.2/2.0 |
| Overhead Smash (C)    | +0.5/0.4/0.3  | +0.8/0.8/0.9 | +0.9/1.3/1.2 | +0.1/0.1/0.1 |
| Rangy Return (C)      | +0.4/0.6/0.8  | +0.3/0.5/0.5 | +0.1/0.2/0.3 | +0.1/0.2/0.4 |
| Slider (C)            | 0             | 0            | 0            | +0.1         |
| Serve Cannon (U)      | +3.2/5.6/8.1  | +1.8/3.1/4.3 | +2.1/3.4/5.1 | +1.1/1.8/2.3 |
| Speed Demon (U)       | +0.1          | +0.1         | +0.1         | +0.2         |
| Iron Legs (U)         | +0.1          | 0            | 0            | +0.1         |
| Pressure Cooker (R)   | +1.2/1.9/2.6  | +0.6/1.8/2.3 | +0.5/1.1/1.9 | +0.7/1.5/2.4 |
| All-Court Maestro (R) | +0.1/0.5/0.6  | +0.1/0.4/0.5 | −0.1/0.1/0.1 | +0.2/0.1/0.2 |

Live engine, level 1 (key moments won, baseline 33–36%):

| ability (rarity)     | point-win    | key moments won                                 |
| -------------------- | ------------ | ----------------------------------------------- |
| Mental Fortitude (R) | +2.4 to +2.8 | 44–47%                                          |
| Clutch (U)           | +1.3 to +1.8 | 40–42%                                          |
| Iron Will (R)        | +1.1 to +1.6 | ~unchanged; match-win +5–8 (late-match fatigue) |
| Pressure Cooker (R)  | +1.0 to +1.5 | 38–41%                                          |

**Findings.**

- **Dead at every level:** Slider, Speed Demon, Iron Legs (in matches) and All-Court Maestro, a
  rare. Court coverage is an on/off switch every carrier already flips; recovery speed and reach
  barely register.
- **Rarity is inverted.** The strongest abilities are commons (Heavy Hitter, Baseliner) and an
  uncommon (Serve Cannon); the shot-based rares sit at +0.5–1.2.
- **Fit works.** Heavy Hitter is worth 4× more to the power baseliner than to the counterpuncher;
  the net abilities are worth 10× more to net players. That's the variety you want.
- **Levels run away.** Linear scaling makes level 3 Heavy Hitter +11.4 point-win, worth about 35
  forehand points on that build, and moves a 29% match-win to 50%.
- **The mental abilities are healthy:** similar value on every build, ordered roughly by rarity,
  and a natural Mind sink.

**Proposal (not applied).**

1. Give each rarity a point-win budget at level 1 on the build it suits: common ~+1, uncommon
   ~+1.5–2, rare ~+2.5. Today's Heavy Hitter and Baseliner would drop to about a third; the
   shot-based rares rise.
2. Rebuild the dead ones around something they can scale: court coverage as a chance per point
   to recover a position step, reach as a difficulty reduction that grows with value.
3. Give Serve Cannon a serve effect.
4. Level curve with diminishing returns (e.g. ×1, ×1.6, ×2) rather than ×level, or keep ×level
   and price the levels steeply. Measure with `LEVEL=2,3` on `abilityProbe`.

---

## Round 2: randomness that comes from the match, and why identities differ

Decisions after round 1: finding 2 is not an issue; finding 3 wants a lever less crude than a
wider pre-match roll; finding 4 keeps the price curve and investigates the identities.

### Randomness: in-match rhythm instead of a wider match-day roll

**Probe.** `serveAndUpsetProbe` (upset section) now also reports matches that went the
distance, comebacks (the match winner lost the first set) and the longest run of games.

**Finding.** Between equal players only 11.5% of best-of-threes go to a third set (tennis:
roughly 35–40%) and 5.5% are comebacks. Momentum is not the cause: switching it off changes
neither. The match-day roll is: whoever rolls the better day tends to win both sets. Widening
the roll (round 1's proposal) buys upsets but makes matches even more decided at the first ball
(three-setters 7.5%).

**New mechanics (off by default).** Rhythm, first built as its own system (`88d39c8`) and then
folded into momentum: `MomentumEngine` now has a slow, per-player part next to the fast,
result-driven one. After every game each player's rhythm takes a random step and drifts back
toward zero, so it runs in spells about a set long; focus steadies it. Breaks and set resets act
on the result-driven part only, so a set won does not end a hot spell. Rhythm is in shot-quality
points and reaches shots through match-day form, because momentum's own quality modifier is
capped at ±10%, too small to carry it. Config: `MOMENTUM.rhythm`. `BIG_POINT_NERVES`: shot
variance widens on key points, narrowed by focus.

Momentum alone cannot do this job: it follows results (winning points pushes it your way), so
it reinforces whoever is already ahead, usually the stronger player, and it fades within a game
(×0.9 per point).

N=400–500 BO3 per row; "impact kept" is the point-win drop from a 0- to a 10-point gap, relative
to today, so 100% means stats move point-win exactly as much as now:

| variant                     | impact kept | weaker wins at gap 3 / 6 / 10 / 15 | 3 sets, equal | comebacks, equal |
| --------------------------- | ----------- | ---------------------------------- | ------------- | ---------------- |
| today (form ±8)             | 100%        | 29 / 16 / 2.0 / 0.0                | 11.5%         | 5.5%             |
| form ±14 (round 1)          | 83%         | 41 / 22 / 12 / 4.0                 | 7.5%          | 4.5%             |
| momentum off                | —           | 29 / 13 / 1.5 / 0.0                | 11.0%         | 6.3%             |
| nerves ×2                   | —           | 29 / 19 / 3.0 / 0.0                | 10.5%         | 5.0%             |
| form ±4, rhythm 5           | 88%         | 28 / 9.5 / 2.0 / 0.3               | 33.0%         | 18.3%            |
| form ±4, rhythm 6, slow     | 68%         | 36 / 20 / 10 / 2.5                 | 28.5%         | 20.8%            |
| form ±12, rhythm 3, slow    | 71%         | 36 / 23 / 14 / 2.2                 | 14.0%         | 6.8%             |
| **form ±8, rhythm 4, slow** | **84%**     | **38 / 22 / 6.2 / 1.6**            | **23.6%**     | **15.2%**        |

("slow" = reversion 0.12, longer spells. Re-run after folding rhythm into momentum, N=1000:
form ±8, rhythm 4 gives 22% / 7.9% upsets at gaps 6 / 10, 21.6% three-setters, 14.4% comebacks.)

**Proposal.** `MOMENTUM.rhythm.swing` 0 → 4 (reversion 0.12 is the default); leave `MATCH_FORM` at 8. Same
cost to stat impact as the wider roll, same upset rate at small and medium gaps, twice the
three-set matches and three times the comebacks, and big mismatches stay mostly safe (6% at a
10-point gap rather than 12%). Weaker players win by getting hot mid-match, not by rolling a good
day; focus gains a job. Nerves add little and can stay off.

Reproduce: `TUNE='MOMENTUM.rhythm.swing=4' PROBE=serveAndUpsetProbe SECTIONS=upset npx tsx src/test/analysis/tuneRun.ts`

### Identities: specialties are flat trades that don't grow with their stat

**Probe 1, `identityGapProbe`.** Each identity's day-23 stats crossed with each identity's
profile, against a uniform 35 with no archetype (N=600 BO3; Reginald and Olivia agree):

| stats \ profile | big server | counter  | net rusher | baseliner | none |
| --------------- | ---------- | -------- | ---------- | --------- | ---- |
| big server      | **49.6**   | 50.4     | 49.8       | 50.5      | 50.3 |
| counter         | 52.8       | **51.6** | 54.2       | 52.0      | 52.7 |
| net rusher      | 53.4       | 50.3     | **56.1**   | 50.8      | 51.5 |
| baseliner       | 48.0       | 49.5     | 47.4       | **49.6**  | 49.0 |
| uniform 35      | 49.9       | 49.5     | 51.8       | 49.5      | 49.7 |

- Only the net rusher's profile helps: +2.1 on a uniform build, +4.6 on its own stats. The other
  three add −1.1 to +0.6 on their own builds.
- The mechanics behind it (own stats, own profile v none): the bomber doubles aces (1.8 → 3.8%)
  and adds double faults (9.7 → 10.9%), and the opportunist path sends a net-28 player forward on
  10.5% of points to win half; the baseliner's power paths nearly double winners (5.8 → 9.7%) and
  add unforced errors (11.6 → 13.0%); the counter's apologist path gives up net points it wins
  69% of the time. Coming forward pays for everyone (60–81% of net points won).
- Allocation matters too: the counter's movement-and-mind buys are worth +3.0 over spreading
  evenly, the baseliner's power buys −0.7.

**Probe 2, `specialtySynergyProbe`.** Each of the 18 phase paths alone on a uniform 35, and again
with its phase stat raised to 50 (N=800 BO3, ± ~0.3):

| path             | alone | backed (stat 50) | synergy  |
| ---------------- | ----- | ---------------- | -------- |
| net_downhill     | +2.7  | +4.7             | **+2.0** |
| net_opportunist  | +0.9  | +1.3             | +0.4     |
| ss_kicker        | −0.2  | −0.2             | +0.1     |
| rt_sneaky_beaky  | +2.1  | +2.0             | −0.1     |
| rt_redliner      | +0.5  | +0.4             | −0.1     |
| bh_brick_wall    | +0.2  | +0.0             | −0.2     |
| fh_rpm_overdrive | +0.3  | +0.0             | −0.3     |
| rt_extinguisher  | +0.2  | −0.1             | −0.3     |
| ss_pancake       | −0.2  | −0.5             | −0.3     |
| ss_gambler       | −0.1  | −0.5             | −0.5     |
| bh_bazooka       | +0.3  | −0.2             | −0.5     |
| fs_curveball     | −0.2  | −0.7             | −0.6     |
| fh_survivor      | +0.7  | +0.1             | −0.6     |
| bh_samurai       | +0.1  | −0.5             | −0.6     |
| fs_bomber        | +0.5  | −0.3             | −0.8     |
| fs_sniper        | +2.2  | +1.4             | −0.8     |
| fh_laserbeam     | +0.8  | −0.1             | −0.8     |
| net_apologist    | −0.4  | −1.9             | −1.5     |

**Finding.** For 16 of 18 paths the matching stat makes the specialty worth the same or less.
Most specialties are flat trades (extra variance, fault risk, shot-choice biases) whose costs do
not shrink as the player gets better at the shot, and added variance hurts whoever is favoured.
A player who invests in their specialty's stat gets less from the specialty, the opposite of the
design goal that committing to an archetype should pay.

**Proposal (next).** Make each specialty's cost shrink, or its gain grow, with its phase stat:
e.g. power variance that narrows as forehand rises, bomber fault risk that falls as serve rises,
sniper and kicker accuracy that scales with serve. Then re-run `specialtySynergyProbe`; the target
is positive synergy for every path and own-profile gains for every identity in
`identityGapProbe`.

### Round 3: specialties amplify their stat

Decision: a specialty should make the stat behind it count extra (option "amplify the stat").

**Change (`0ac2fcc`).** `SPECIALTY_AMPLIFY`: on a path's own phase shots (forehand drives for
forehand paths, the matching serve's quality and accuracy for serve paths, returns, volleys and
overheads), `effective = stat + byTier[tier] × (stat − 30)`, tiers 0.5 / 0.75 / 1.0. A flat ×1.1
was tried first: it gave every path value on its own but almost no synergy (10% of a 15-point
stat gain is 1.5 points); amplifying the excess over 30 is what makes investment pay. Serve paths
needed accuracy amplified too, because serve-in is rolled on accuracy against a midpoint that
moves with the player's own accuracy. Before this, 6 of 18 paths cost more than they gave
(STRIP showed costs explain about a third of the negative synergy; the rest was unscoped biases).

**Synergy (`specialtySynergyProbe`, N=800, ± ~0.4):** 17 of 18 paths now gain from their stat:
first serve −0.8…−0.6 → +0.6…+1.7; second serve −0.5…+0.1 → +0.5…+1.0; return −0.3…−0.1 →
+1.5…+2.1; forehand −0.8…−0.3 → +0.5…+1.1; backhand −0.6…−0.2 → +0.3…+1.1; net_downhill +2.0 →
+1.9. `net_apologist` stays at −1.5: it stays back, so its net boost never applies.

**Identity matrix (own profile on own stats, v uniform 35):** big server −0.7 → +1.7, counter
−1.1 → +1.5, baseliner +0.6 → +2.3, net rusher +4.6 → +8.0. Every identity's specialties now help.

**But the career got less even** (`careerSim`, 30 careers, readiness N=300; point-win, match-win):

| day v opponent | big server        | counter           | net rusher        | baseliner         | point-win spread |
| -------------- | ----------------- | ----------------- | ----------------- | ----------------- | ---------------- |
| 19 Rich Soil   | 50.8 → 51.0 (51%) | 50.7 → 50.5 (52%) | 53.1 → 58.6 (72%) | 47.0 → 46.2 (41%) | 6.1 → 12.4       |
| 23 Martia      | 45.2 → 41.8 (25%) | 47.3 → 45.1 (35%) | 49.6 → 49.2 (41%) | 41.3 → 39.0 (23%) | 8.3 → 10.2       |
| 27 Reginald    | 45.6 → 44.7 (30%) | 47.6 → 45.2 (40%) | 52.8 → 53.7 (56%) | 44.4 → 44.1 (38%) | 8.4 → 9.6        |
| 31 Olivia      | 41.9 → 41.9 (23%) | 44.7 → 43.3 (28%) | 51.3 → 51.4 (48%) | 43.2 → 36.1 (17%) | 9.4 → 15.3       |

Two causes. Story opponents carry tier-2 specialties, so they get the bigger boost (0.75 v the
player's 0.5): Olivia's tier-2 forehand and serve make her much harder for the baseliner. And
coming to the net pays for everyone (60–81% of net points won), so the net rusher's paths
compound.

**Next.** (1) Price coming forward: net points won should fall nearer 55–65% for a player who
isn't built for it, so the net rusher's lead rests on its stats. (2) Re-tune story opponents
for the boost (their tiers, or byTier for tier 2). (3) Re-check the career spread.

### Round 4: abilities to budget, abilities in the economy, loose ends

Decisions: rarity budgets confirmed (common ~+1, uncommon +1.5–2, rare ~+2.5 point-win at level 1 on
the build each suits); rhythm on; balance between identities accepted for now (net play is strong
in tennis too).

**Rhythm on (`cad6547`).** `MOMENTUM.rhythm.swing` 4.

**Ability retune (`5dd874c`).** Measured on the current engine with `abilityProbe` (N=1000) and
`mentalAbilityProbe` (N=600), rhythm off in memory so seeds stay paired. Best-build point-win at
level 1, before → after:

| ability           | rarity   | before | after | change                                          |
| ----------------- | -------- | ------ | ----- | ----------------------------------------------- |
| Heavy Hitter      | common   | +3.0   | +1.3  | pace 7 → 2.5                                    |
| Baseliner         | common   | +3.2   | +0.9  | rally momentum 6 → 2.4                          |
| Netcrasher        | common   | +3.6   | +1.05 | net game 5 → 1.1, touch 2 → 0.4                 |
| Soft Hands        | common   | +3.5   | +1.0  | touch 7 → 1.6                                   |
| Overhead Smash    | common   | +1.1   | +1.0  | unchanged                                       |
| Spin Master       | common   | +0.5   | +1.1  | side spin 7 → 9, slices and drop shots only     |
| Rangy Return      | common   | +0.3   | +1.0  | reach 7 → 5.5, reach now adds quality           |
| Slider            | common   | 0      | +0.65 | coverage rebuilt, reach 7 added                 |
| Serve Cannon      | uncommon | +2.2   | +1.6  | real serve effect: serve speed 1.5, smash 4     |
| Speed Demon       | uncommon | 0      | +1.7  | coverage and recovery rebuilt, reach 8, rally 2 |
| Clutch            | uncommon | +1.8   | +1.8  | unchanged                                       |
| Pressure Cooker   | rare     | +1.3   | +2.4  | timing 7 → 14, resilience 3 → 6                 |
| All-Court Maestro | rare     | +0.2   | +2.7  | coverage 12, reach 8, rally momentum 4          |
| Mental Fortitude  | rare     | +2.7   | +2.9  | unchanged                                       |
| Iron Will         | rare     | +1.7   | +2.9  | focus duration 2 → 4, fatigue floor 0.8 → 0.5   |

Engine changes behind it: **serves never received ability effects** (both serve calls left the
argument out); court coverage is a chance per point to hold position when an opponent's shot
pushes you out of it, recovery speed a chance to recover in one ball, reach also adds quality on
stretched balls (`MOVEMENT_ABILITIES`); levels follow `ABILITY_LEVEL_MULTIPLIER` (×1, ×1.6, ×2,
×2.3, ×2.5). Level 3 now measures 1.6–2.7× level 1 (Heavy Hitter used to go +4.9 → +11.4).

**Abilities in the career economy (`e4da89f`).** `careerSim` buys abilities (`abilityEconomy.ts`):
two offers a day (50% common, 35% uncommon, 15% rare), a fixed price per rarity in the effect's
currency (15 / 28 / 40 units) plus the shop's XP (70 / 140 / 250), levels escalating as the shop
does; the player buys when point-win per unit beats a typical stat buy (0.05). 30 careers, day 31:

| identity   | ability levels | most owned                                   | unspent Mind, off → on |
| ---------- | -------------- | -------------------------------------------- | ---------------------- |
| big server | 2.2            | Clutch, Overhead Smash, Mental Fortitude     | 58 → 25                |
| counter    | 2.3            | Baseliner, Clutch, Rangy Return              | 27 → 14                |
| net rusher | 1.8            | Rangy Return, Clutch, Soft Hands, Netcrasher | 15 → 12                |
| baseliner  | 3.5            | Clutch, Spin Master, Mental Fortitude        | 132 → 66               |

Abilities trade evenly with stats (readiness within noise of stats-only; the identity match-win
spread against Olivia 36 → 29), which is what pricing them at the stat exchange rate should do.
XP does not bind: careers earn ~850 by day 31 and spend 200–430 on abilities, so XP is free to
become the match → ability pipeline if Mind is rebalanced.

**Loose ends.**

- Income needs no recalibration: day-31 readiness after all of this (33 / 36 / 54 / 25% match-win
  for big server / counter / net rusher / baseliner) is close to before the engine changes
  (23 / 32 / 50 / 31%).
- `net_apologist`'s specialty boost goes to forehand and backhand drives at half strength; its
  synergy with those stats −1.5 → +1.8.
- The shop no longer offers legendaries (one was still buyable, and they were 10% of offers);
  offers are 50% common, 35% uncommon, 15% rare.
- Content conversion dry run: `docs/proposals/content-conversion-dry-run.md`, 158 sites, 835 stat
  points → 3,034 currency units; 13 story penalties need a decision.
- Development screen: a clickable paper prototype with the real recipes and price steps.

---

## Reproducing

All probes take `N`, and the career-sim comparisons take `STEP_FROM`, `INCOME_SCALE` and
`SYSTEMS=currency`. `tuneRun.ts` overrides any number inside an exported config object for one
run: `TUNE='A.b=1;C.d=2' PROBE=<harness> npx tsx src/test/analysis/tuneRun.ts`.
