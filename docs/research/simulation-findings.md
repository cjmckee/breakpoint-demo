# Five simulation findings

Measured on the real MatchSimulator (and the live MatchOrchestrator for key moments), after the
one-pass fixes in `be89530` (ability level scaling, the clay net multiplier, Spin Master). Each
finding has the probe that found it, a proposal, and the before/after data. Only finding 1 is
applied; 2–4 are proposals, reproducible in memory with `tuneRun.ts` without editing config;
5 is a proposal only (abilities are not to be retuned yet).

The question behind all five: does a player's choice of stats matter, and can a weaker player
still win sometimes?

| #   | finding                                                                               | status                                       |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Net play was capped by rally structure, not by archetype                              | applied, `efac2ed`                           |
| 2   | Double faults end a quarter of early-game points; servers can't hold                  | proposed: second-serve midpoint              |
| 3   | Upsets are near impossible past a 6-point rating gap                                  | proposed: match-form variance 8 → 14         |
| 4   | An identity's key stats are its worst buys, but the curve isn't why identities differ | proposed: keep the curve; look at identities |
| 5   | Abilities: four are dead, rarity is inverted, levels make commons dominant            | proposal only                                |

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

| gap | point-win, before → after | game-win    | weaker player's match-win |
| --- | ------------------------- | ----------- | ------------------------- |
| 0   | 50.6 → 52.1               | 51.6 → 53.5 | 53.0 → 54.5               |
| 3   | 42.7 → 45.5               | 36.6 → 42.9 | 29.3 → **41.0**           |
| 6   | 34.5 → 37.0               | 23.1 → 29.9 | 15.5 → **26.0**           |
| 10  | 23.6 → 29.2               | 9.5 → 20.1  | 2.3 → **14.8**            |
| 15  | 12.0 → 16.8               | 1.2 → 7.2   | 0.0 → **3.0**             |
| 20  | 7.5 → 9.1                 | 0.2 → 2.0   | 0.0 → 0.0                 |

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

## Reproducing

All probes take `N`, and the career-sim comparisons take `STEP_FROM`, `INCOME_SCALE` and
`SYSTEMS=currency`. `tuneRun.ts` overrides any number inside an exported config object for one
run: `TUNE='A.b=1;C.d=2' PROBE=<harness> npx tsx src/test/analysis/tuneRun.ts`.
