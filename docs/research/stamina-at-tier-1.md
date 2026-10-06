# Stamina at tier 1 — what the stat buys, and the change that followed

**Status:** findings, a design decision, and the change it led to (applied, §6). §2–§4 describe
the model before the change.
**Scope:** the stamina stat at the ratings the game ships, through the real `MatchSimulator`
**Harnesses:** [`staminaAnatomy.ts`](../../src/test/analysis/staminaAnatomy.ts),
[`staminaProbe.ts`](../../src/test/analysis/staminaProbe.ts),
[`staminaCurve.ts`](../../src/test/analysis/staminaCurve.ts)

---

## Summary

1. **Stamina works only through match fatigue.** It has four paths in the code, and two of them
   do nothing measurable. The rally-length modifier never costs more than 0.5% of quality,
   because 95% of tier-1 shots come in the first five of a rally. The very-long-rally tiebreak
   is negligible too.
2. **It is weak, not saturated.** +20 stamina is worth about +1.4 points of point-win in
   best-of-three and about +0.6 in best-of-one. +20 forehand is worth about +3. Measured per
   unit of recipe cost, that makes stamina the worst buy in the game (§6.5 of the proposal).
3. **Format decides most of it.** Best-of-three roughly doubles fatigue, so stamina is worth
   about twice as much in team matches and tournaments as in best-of-one practice.
4. **Recovery is not the problem.** Stamina is read three times: fatigue gain, per-point recovery
   and changeover recovery. The obvious hypothesis was that it recovers so well past 50 that the
   curve collapses. Holding recovery flat changes nothing.
5. **The fatigue penalty is the lever.** `FATIGUE_MODIFIER.minModifier` 0.8 → 0.6 roughly doubles
   stamina's value in both formats, enough for a cheap-priced stat. Rested players barely notice.
   Players who walk into a match tired do: match wins in team match 1 drop from 32% to 25% at
   energy 30.
6. **The analysis harnesses had been under-modelling fatigue.** Their hand-copied point loops
   leave out changeover and set-break recovery, and the starting fatigue of a tired player. Both
   read stamina. `careerSim` now plays every match through `MatchSimulator`.

---

## 1. Where stamina is read

| path                      | where                                   | what it does                                              |
| ------------------------- | --------------------------------------- | --------------------------------------------------------- |
| fatigue gain              | `MatchSimulator.calculateNewFatigue`    | stamina 0 builds fatigue at full rate, stamina 100 at 30% |
| per-point recovery        | same                                    | 0.08 to 0.25 fatigue back per point, by stamina           |
| changeover / set recovery | `MatchSimulator.recoverFatigue`         | 2–6 back per game, 8–18 per set, by stamina               |
| rally-length modifier     | `ShotCalculator.getRallyLengthModifier` | ×0.75–1.0 on shots past the fifth of a rally, by stamina  |
| long-rally tiebreak       | `PointSimulator`                        | a 30-shot rally goes to the higher stamina                |

Fatigue becomes quality through `getFatigueModifier`, which is 1 − fatigue/100 × (1 − 0.8). That
is up to a 20% penalty at fatigue 100. Low energy going into a match adds starting fatigue: at
energy 30 a player starts on 8.

## 2. What it costs a player's shots

`staminaAnatomy`: a uniform-30 player with stamina swept, against uniform 30. Real
`MatchSimulator`, 600 matches per row, player shots only.

| format | energy | stamina | pt-win % | shots past the 5th | rally-length loss | fatigue loss | peak fatigue |
| ------ | ------ | ------- | -------- | ------------------ | ----------------- | ------------ | ------------ |
| BO1    | 100    | 20      | 48.8     | 5.5%               | 0.47%             | 4.98%        | 41           |
| BO1    | 100    | 40      | 50.3     | 5.4%               | 0.34%             | 2.98%        | 25           |
| BO1    | 100    | 60      | 50.0     | 5.3%               | 0.22%             | 1.34%        | 12           |
| BO1    | 100    | 80      | 51.2     | 5.4%               | 0.11%             | 0.50%        | 6            |
| BO3    | 100    | 20      | 49.1     | 5.3%               | 0.45%             | 8.72%        | 67           |
| BO3    | 100    | 40      | 52.0     | 5.4%               | 0.34%             | 5.10%        | 40           |
| BO3    | 100    | 60      | 52.3     | 5.4%               | 0.23%             | 1.74%        | 16           |
| BO3    | 100    | 80      | 52.5     | 5.4%               | 0.12%             | 0.54%        | 8            |
| BO3    | 30     | 20      | 49.4     | 5.3%               | 0.46%             | 10.26%       | 74           |
| BO3    | 30     | 80      | 52.7     | 5.2%               | 0.11%             | 0.77%        | 11           |

Fatigue is a real cost at low stamina: 9–10% of shot quality across a best-of-three at stamina 20.
But the opponent here sits at 30 and tires too, and most of the gap closes by 40. Against an
opponent whose stamina rises with the player's (§3), the value holds up past 50.

## 3. Levers

`staminaProbe`: point-win gained by a +20 stamina bump, against an opponent at the bump's starting
stamina, everything else uniform 30. Real `MatchSimulator`. 1500 best-of-three or 3000
best-of-one per cell, so a cell is good to about ±0.7. Each lever's own control column sat within
±0.65.

| lever                                             | BO3 30→50 | BO3 50→70 | BO1 30→50 | BO1 50→70 |
| ------------------------------------------------- | --------- | --------- | --------- | --------- |
| shipped (penalty ×0.8)                            | +1.53     | +1.20     | −0.18     | +1.28     |
| **flat recovery**: recovery stops reading stamina | +1.54     | +0.80     |           |           |
| penalty ×0.7                                      | +2.05     | +2.51     | +1.03     | +0.77     |
| **penalty ×0.6**                                  | **+3.85** | +1.58     | **+2.05** | +1.11     |
| flat recovery + penalty ×0.7                      | +2.01     | +1.38     |           |           |

For flat recovery, per-point and changeover recovery are held at their stamina-50 values, so a
stamina-50 player's match is unchanged.

- **Flat recovery does nothing.** It would have helped if the triple read made the curve
  collapse, and it does not.
- **The penalty moves it.** At ×0.6, stamina averages about +2.7 per +20 in best-of-three and
  +1.6 in best-of-one. That is a little under a standard stat, which is right for a cheap-priced
  one (2 units against 3).

## 4. The penalty alone, and why it was not the answer

The penalty is global. Fatigue costs more for everyone, not only for low-stamina players. A
quick check on the early team matches, real `MatchSimulator`, 800 best-of-three each:

| case                                  | ×0.8    | ×0.7 | ×0.6    |
| ------------------------------------- | ------- | ---- | ------- |
| day-15 build (uniform 28) v Chet Vale | 33% won | 31%  | 32%     |
| same, going in at energy 30           | 32%     | 28%  | **25%** |
| day-23 build (uniform 33) v Martia    | 20%     | 23%  | 22%     |

A rested player hardly notices, because opponents tire too. A player who trains before a team
match and walks in tired loses a quarter of their chances. That may be exactly what the energy
system should mean, or it may feel punishing in the first week. It is a design call, not a
measurement.

**Options:**

1. **Penalty ×0.6**, accepting that energy management before story matches matters more.
2. **Penalty ×0.7** as a middle step. In best-of-three it lifts stamina above 50 more than below.
3. **Leave the sim alone** and price stamina at 1 unit, so its value per unit sits in the pack.
4. **Give stamina an out-of-match job**, for example a smaller energy cost for training or
   matches. It would pay in every format. But in a currency economy it compounds: more sessions
   means more currency means more stamina.

## 5. The harness gap

The analysis harnesses (`characterSim`, `tier1Probe`, `allocationProbe`, `statChannels` and,
until now, `careerSim`) run their own copy of the point loop. The copies apply per-point fatigue
and recovery, but not changeover or set-break recovery, and not the starting fatigue that low
energy brings.

That makes their matches more tiring than the game's at high stamina and less tiring for a tired
player. It does not change which stats rank where, but it misstates stamina specifically.
`careerSim` now plays through `MatchSimulator`. The others are left as they are, so their
recorded baselines stay comparable.

```
N=600 npx tsx src/test/analysis/staminaAnatomy.ts
npx tsx src/test/analysis/staminaProbe.ts                        # BO3, ~2 min per lever
FORMAT=bo1 N=3000 npx tsx src/test/analysis/staminaProbe.ts
```

## 6. The decision, and the change

**Decision (from review).**

- Nobody starts a match tired: remove the starting fatigue that low energy brought.
- Widen the gap between low- and high-stamina players. A high-stamina player should tire
  noticeably slower and recover more easily, and it should show late in long matches.
- The test case is team match 1. Coach Gonzalez warns that Aspen Slopes "practice at a higher
  altitude … which gives them an advantage when it comes to endurance", and Chet Vale's stamina
  (39) is his second-best stat.

**What the curve showed first.** `staminaCurve` splits best-of-three matches by point number
and tracks both players' fatigue. The fatigue spread was already wide: late in a match, stamina
20 sat at ~80 fatigue, stamina 40 at ~55, and stamina 60–80 at under 16. The gap barely mattered,
because the penalty was linear and capped at 20%. Widening the build-up and recovery rates
instead pushed _average_ players to ~80 too, so everyone was exhausted and the late difference
shrank. The lever was the shape of the penalty.

**The change.**

| setting                                      | before     | after       |
| -------------------------------------------- | ---------- | ----------- |
| starting fatigue from low energy             | up to 20   | **none**    |
| `FATIGUE_MODIFIER` at exhaustion             | ×0.80      | ×0.65       |
| `FATIGUE_MODIFIER.exponent`                  | 1 (linear) | **2**       |
| `MATCH_FATIGUE.minFatigueRate` (stamina 100) | 0.30       | 0.20        |
| `MATCH_FATIGUE.maxRecoveryPerPoint`          | 0.25       | 0.30        |
| changeover recovery                          | 2 + 4 × s  | 1.5 + 5 × s |
| set-break recovery                           | 8 + 10 × s | 5 + 20 × s  |

Here s = stamina / 100. Squared, fatigue 30 costs 3% of quality, 50 costs 9% and 80 costs 22%,
so a tired opponent is a late-match story. Recovery now leans much harder on stamina at set
breaks: a stamina-80 player gets 21 fatigue back, a stamina-20 player 9.

The fatigue rules also moved into one module, `src/core/fatigue.ts`, which both match engines
and every analysis harness now call. There had been four drifting copies.

**Result.** `staminaCurve`, 600 best-of-three matches per row, against a uniform-32 opponent at
stamina 40. Cells are point-win %, then mean fatigue (player v opponent) in that stretch.

| stamina | pt-win% | game-win% | hold% | break% | match-win% | points 1–40   | 41–80          | 81–120         |
| ------- | ------- | --------- | ----- | ------ | ---------- | ------------- | -------------- | -------------- |
| 20      | 47.0    | 44.0      | 40.3  | 47.8   | 36         | 50.0 (16 v 8) | 46.5 (42 v 18) | 42.1 (71 v 33) |
| 40      | 50.5    | 50.8      | 47.4  | 54.3   | 49         | 51.0 (8 v 8)  | 50.3 (18 v 18) | 49.6 (36 v 36) |
| 60      | 51.0    | 52.0      | 47.4  | 56.6   | 55         | 49.9 (3 v 8)  | 51.0 (4 v 18)  | 52.5 (6 v 33)  |
| 80      | 51.8    | 53.8      | 50.5  | 57.2   | 58         | 50.2 (1 v 8)  | 51.7 (1 v 19)  | 53.6 (2 v 36)  |

Before the change, the same rows read 48.1 / 49.7 / 51.9 / 52.6 point-win, with a 81–120 gap of
46.5 against 52.9.

- **It shows late, not early.** In the first 40 points stamina is worth under a point. By points
  81–120, stamina 20 against stamina 80 is 42.1% against 53.6%.
- **The fatigue tanks separate.** Late in a match, a stamina-20 player sits at ~70 while its
  opponent has recovered to ~33. A stamina-80 player stays under 3.
- **Ignore the last bucket's point-win.** Points past 120 only exist in close matches, so that
  column is biased toward whoever stayed in it. Read the fatigue there, not the win rate.

**Team match 1, Chet Vale** (hard court, best of three; a day-15 build of uniform 28):

| player stamina | pt-win% | game-win% | hold% | break% | match-win% | late fatigue, player v Chet |
| -------------- | ------- | --------- | ----- | ------ | ---------- | --------------------------- |
| 21 (new)       | 43.4    | 37.2      | 28.2  | 46.3   | 26         | 79 v 45                     |
| 28             | 44.4    | 39.1      | 28.9  | 49.2   | 29         | 69 v 44                     |
| 40             | 46.3    | 42.8      | 33.4  | 52.1   | 37         | 47 v 51                     |

Before the change, a stamina-28 player won 33% and finished at 71 v 53. Now Chet's endurance is
visible in the tanks and in the result. A player who trained stamina to 40 erases it, as the
Coach's warning implies they should.

**Texture.** `matchAnatomy` at L=30, 200 best-of-three per build, against the pre-change run:
rally length, point endings, shot mix and net play are all within noise.

**Career.** `careerSim` on the real engine still calibrates to income ×1.2 through day 27 and
×1.3 by day 31 (proposal §9.9).

**Not fixed here:** the hand-rolled point loops in most analysis harnesses (§5) still skip
changeover and set-break recovery. That recovery now carries much of stamina's effect, so those
harnesses understate stamina until they move onto `MatchSimulator`.

```
CHET=1 npx tsx src/test/analysis/staminaCurve.ts                 # ~4 min
VARIANTS=current,curve,curveRecover CHET=1 npx tsx src/test/analysis/staminaCurve.ts
```
