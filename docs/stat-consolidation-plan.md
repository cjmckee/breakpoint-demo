# Stat consolidation plan — 20 stats to 14

**Status:** implemented
**Evidence:** [`stat-system-audit.md`](./stat-system-audit.md), measured against the current sim
**Shape:** 5 core (one per `GamePhase`) + 3 technical + 3 physical + 3 mental

---

## 1. Why consolidate at all

Seven stats are statistically indistinguishable from zero, measured across 1400 randomized builds
and re-measured after every scaling fix in the audit: `agility`, `recovery`, `overhead`, `slice`,
`volley`, `dropShot`, `shotVariety`. None of the scaling work rescued any of them, which is the
point — their problem is not a broken curve, it is that nobody hits those shots often enough for
the stat to matter. `dropShot` is the primary stat for 0.15% of rally shots.

**The argument from the first version of this document is withdrawn.** It claimed merging two
1%-frequency stats "more than doubles" their value because the rating tax is paid once instead of
twice. There is no rating tax — see audit section 5. Merging two 1% stats gives a 2% stat, linearly.
That is still worth doing; it is just a smaller and more honest claim.

The training economy compounds it. An anchor session grants +1 to the chosen core plus up to 3
supports drawn from a 6-stat pool ([`AnchorTrainingSystem.ts:140`](../src/game/AnchorTrainingSystem.ts#L140)),
so a specific support accrues ~0.5/session — roughly 20 sessions to move one support stat by 10
points, into stats that do not measurably change outcomes.

---

## 2. The proposed shape

Core maps one-to-one onto `GamePhase` (`first_serve | second_serve | return | forehand | backhand |
net`, with the two serve phases sharing the `serve` stat). That is the organising principle: a core
stat is a phase of the point.

| bucket | stats | change |
|---|---|---|
| **core** (5) | serve, return, forehand, backhand, **net** | `volley` + `overhead` merge and promote |
| **technical** (3) | **slice**, spin, placement | `slice` demotes; `dropShot` folds into `placement` |
| **physical** (3) | speed, stamina, strength | `agility`→`speed`, `recovery`→`stamina` |
| **mental** (3) | focus, anticipation, **tactics** | `offensive` + `defensive` merge; `shotVariety` folds into `placement` |

### net becomes core; slice becomes technical

`net` is a phase. `slice` is a stroke shape applied within the forehand and backhand phases — it is
technical by construction, and it is the only "core" stat that is not a phase.

This reverses the first version of this document, which argued **against** promoting the net stat on
the grounds that it would triple its rating tax. That objection dies with the tax.

Merging `overhead` into `volley` is separately well-supported. Tracing the net sequence, the overhead
is the *more* common of the two net strokes — of the balls a net player strikes after a successful
approach, 16.8% are overheads and 29.1% volleys in play, and on the second net shot an overhead
winner is the single most common outcome at 26.8%. A net player currently pays for two stats to be
competent at one phase while a baseliner pays one. Merged, the stat covers 5.7-6.6% of a net
specialist's rally shots against 3.2% for `volley` alone.

### tactics = offensive + defensive

The extra merge the 3/3/3 shape requires. They measure +0.66 and +0.73, they are conceptually one
axis, and they already apply to disjoint shot sets (`isOffensiveShot` / `isDefensiveShot`), so a
single stat applying to whichever shot you chose is coherent rather than a fudge. If you would
rather keep them separate, the alternative even shape is 4/4/4 = 17 stats, which also lets
`shotVariety` survive.

### What each merge is worth

| merge | evidence |
|---|---|
| `overhead` → `net` | both noise alone (−0.12, −0.24); overhead is the finisher of the net phase |
| `agility` → `speed` | `agility` is noise (+0.14); the code already averages them literally in `ShotCalculator.getBallQualityModifier` |
| `recovery` → `stamina` | `recovery` is noise (+0.01) with exactly one read site, fatigue recovery |
| `dropShot` → `placement` | weakest stat in the game (−0.33), primary for 0.15% of shots |
| `shotVariety` → `placement` | noise (−0.37); fires only on tactical shots, which `placement` is already primary for |
| `offensive` + `defensive` → `tactics` | both moderate, one axis, disjoint shot sets |

### slice stays, and stays conditional

`slice` measures as noise in a randomized population but is the most playstyle-expressive stat in
the game: 26× frequency swing with archetype, against volley's 1.6×. It is conditional, not weak.
Demoting it to technical is a re-bucketing, not a deletion — it keeps its shots and its identity.

---

## 3. Prerequisite: the net phase has to be worth a core slot

A core stat used on 3% of shots is a trap. Two of the three pieces are done; the third is not.

### Done

- **Overheads count as net shots.** Fixed by the merge itself.
- **The net player now applies pressure.** Volleys and overheads label the incoming ball `rushed`
  at `thresholds.average` rather than `thresholds.high`, a bar an average volley never cleared. The
  ball coming back off a volley used to measure *higher* quality than the volley itself (53.4 against
  50.1); it is now 46.5 against 49.2. Passing shots dropped from 0.75 to 0.60 in
  `RELATIVE_QUALITY_REQUIREMENTS`, since the defender already pays `POSITION_ADJUSTMENTS.at_net`
  (+10) and the net player's advantage was being counted twice.

Measured effect, share of rallies past the return for a `net_downhill` T3 build: striking a ball
from the net went 9.2% → 11.8%, passing shots in play 18.8% → 25.4%, and the second net shot is now
most often an overhead winner.

### Not done: how often a player goes to the net

Target is ~50% arrival for a net specialist against ~16% for everyone else. Currently:

| build | ARRIVED | approach per chance | chances per rally |
|---|---|---|---|
| no specialization | 18.7% | 17.7% | 1.53 |
| broad net_attacker | 20.1% | 20.1% | 1.48 |
| net_downhill T1 | 23.7% | 25.0% | 1.45 |
| net_downhill T3 | 28.4% | 29.7% | 1.40 |
| net_apologist (averse) | 10.7% | 10.3% | 1.57 |

The ceiling is not the probability, it is the number of moments. A player gets only **~1.4 baseline
shots per rally** where an approach is even possible, because rallies are short. Arrival works out
as `1 − (1 − p)^chances` times the approach success rate:

```
T3:  1 − (1 − 0.297)^1.40 = 38.6%,  × 0.753 approaches landing = 29%   ✓ matches
```

To reach 50% arrival the per-chance rate needs to go from **29.7% to about 53%**. In
`shouldApproachNet` that is the `NET_APPROACH_BIAS` coefficient:

```ts
let baseProbability = Math.max(0, 0.12 + (netBias / 100) * 0.50);
baseProbability += (offensive / 100) * 0.08;
```

Roughly doubling the 0.50 coefficient gets there. `netApproachSuitable` (`attackScore >= 10 &&
rallyLength >= 2 && !defensiveRequired && shooterPosition !== 'at_net'`) is a situational gate and
should stay one — situation deciding *whether an approach makes sense* is correct.

### The principle, and the one place the code breaks it

> **Playstyle determines how often you approach. The net rating determines your success there.**

The code follows this everywhere except one line: `baseProbability += (offensive / 100) * 0.08`
makes a *stat* set approach frequency. It is small — up to +8 percentage points of base probability
— but it is the wrong axis, and under the 3/3/3 shape `offensive` disappears into `tactics` anyway.
It should be removed rather than remapped.

Note also that tiers 2 and 3 of `net_downhill` add `putaway_volley_bias` and no approach bias, so
frequency is flat from T1 to T3 while success improves. That is the principle working as intended
and should be preserved.

---

## 4. Order of work

1. **Remove `offensive` from `shouldApproachNet`** and raise the `NET_APPROACH_BIAS` coefficient
   until a net specialist arrives ~50% and an unspecialized player stays ~16%. Sweep and measure with
   `netProbe.ts`; this is the prerequisite for step 3.
2. **Re-measure the net stat's usage share** once frequency is right. If the merged `net` stat is
   still under ~8% of a specialist's rally shots, reconsider the core slot before committing.
3. **Do the merges.** Types first (`PlayerStats` in `types/index.ts`), then `getStatForShot` and the
   composites in `PlayerProfile`, then the data.
4. **Re-run the whole harness set** — `statSensitivity`, `tier1Probe`, `shotCurve`, `netProbe` — and
   re-fit the winner tables, which were fitted per shot and will shift when stats merge.

### Blast radius

Stat names appear across ~30 files each. The ones that define stat blocks and must all change
together:

```
src/types/game.ts          DEFAULT_PLAYER_STATS
src/types/index.ts         PlayerStats and the four category interfaces
src/core/PlayerProfile.ts  getStatForShot, composites, calculateOverallRating
src/utils/playerStats.ts   duplicate calculateOverallRating — merge these two while here
src/game/PlayerManager.ts  starting stats and playstyle bonuses
src/data/opponents.ts      every opponent across all four tiers
src/data/teamMatches.ts    five storyline opponents
src/data/tournaments/      Riverside Open
src/data/storyEvents/      welcomeEvents
src/components/PlayerStatsDisplay.tsx and the training UI
```

Saved games store `PlayerStats` directly, so this is a save-breaking change. Per `CLAUDE.md`,
backwards compatibility is not required — clear the persistence key on the version bump.

---

## 5. Result

Every one of the fourteen stats now measures as materially non-zero. There were seven that could not
be distinguished from noise across 1400 randomized builds, and that was true before the
consolidation and after every scaling fix that preceded it.

| stat | bucket | per +10 | 95% CI |
|---|---|---|---|
| anticipation | mental | +2.91 | [+2.50, +3.32] |
| return | core | +2.89 | [+2.46, +3.32] |
| speed | physical | +2.65 | [+2.23, +3.07] |
| serve | core | +2.56 | [+2.14, +2.98] |
| tactics | mental | +2.42 | [+1.98, +2.86] |
| forehand | core | +1.84 | [+1.39, +2.29] |
| spin | technical | +1.78 | [+1.34, +2.22] |
| focus | mental | +1.72 | [+1.29, +2.16] |
| strength | physical | +1.50 | [+1.06, +1.95] |
| stamina | physical | +1.29 | [+0.82, +1.75] |
| placement | technical | +1.07 | [+0.60, +1.53] |
| backhand | core | +0.90 | [+0.45, +1.34] |
| net | core | +0.52 | [+0.09, +0.95] |
| slice | technical | +0.50 | [+0.05, +0.95] |

Bucket totals: core +8.70, mental +7.05, physical +5.44, technical +3.34.

`net` and `slice` are the weakest, and both are conditional stats — this population is randomized
builds, most of which are neither net players nor slicers. Both clear zero, which neither did as
`volley`/`overhead`/`slice` before.

### The net phase, after the approach work

`NET_APPROACH_BIAS_SCALE` went from 0.50 to 3.0, and the `offensive` term came out of
`shouldApproachNet` entirely. Arrival, as a share of rallies past the return:

| build | before | after |
|---|---|---|
| no specialization | 18.7% | 15.7% |
| broad net_attacker | 20.1% | 31.3% |
| net_downhill T1 | 23.7% | 46.9% |
| net_downhill T3 | 28.4% | 47.9% |
| net-averse | 10.7% | 3.0% |

That is the split working: playstyle sets the spread from 3% to 48%, and no stat appears in it. The
merged `net` stat now covers **11.0%** of a specialist's rally shots against 5.2% before, which
clears the ~8% bar this document set for the core slot in section 3.

The net-averse floor is deliberate: `baseProbability` floors at 0.02 rather than 0, because at scale
3.0 a negative bias drove it below zero and a `net_apologist` build stopped approaching entirely.
Rarely, not never.

### Training economy

Support pools shrank from 6 stats to 4, so a specific support now accrues ~0.75 per session against
~0.5 — roughly 13 sessions to move a support 10 points rather than 20. The `slice` anchor became the
`net` anchor, keeping five anchors, one per core.

---

## 6. Open decisions

- **`WINNER_FLOOR_OFFSET`**, still 0, unrelated to consolidation but outstanding: winners are 4.3%
  of points for a new player and 15.1% for Jordan; −8 gives 7.1% and 20.4%.
- **Opponent ratings shifted** with the merges, since a merged stat takes the average of its parents.
  Big Steve went from OVR 28 to 29 and Jordan from 45 to 47. The tier-1 ladder is still coherent but
  the roster was authored against the old buckets and is worth a pass.
- **The double-fault rate rose slightly at the bottom** — 33.5% for a new player against 31.6% before
  — for the same reason. If that reads too punishing, `SERVE_CONSISTENCY` is the dial.
- **The approach weight.** `SHOT_COMPOSITE_WEIGHTS.approach` gives `net` 0.35 against the wing's
  0.50. Raising it to 0.50 (wing 0.35) is worth about +0.4 unspecialized and +0.8 to a net build —
  see section 7. It is a design call, not a measurement one: how much of an approach shot is a
  groundstroke and how much is the first shot of the net phase.

---

## 7. Is `net` worth the core slot? — measured

Section 3 set the bar as usage share and it now clears easily: `net` is primary or major partner on
**42.3%** of a net specialist's rally shots (32.2% approaches + 10.1% volley/overhead), against
10.2% for an unspecialized player. Usage was the wrong bar. The real question is what the stat is
worth to the player who uses it, so `statInContext.ts` measures that directly: both players carry
the same archetype, one gets 50→75 on a single stat, and the number is the bumped player's point
win rate minus 50.

**Sample size matters more than it looks here.** At N=120 BO3 per cell the control column swings
±2 points, which is larger than the entire net effect. Every number below is N=2500, where the
control resolves to about ±0.5. Two earlier readings in this document's history — `net` at +3.59 in
a net build, and a monotonic response to net coverage — were noise at N=120 and N=700 and do not
survive.

| change | net, unspecialized | net, `net_downhill` T3 | forehand (control) |
|---|---|---|---|
| after the consolidation | +0.22 | +0.51 | +5.11 |
| **+ approach composite** | **+0.82** | **+1.92** | +4.84 |
| + net coverage at the net | +0.94 | +2.45 | +4.77 |
| + approach net weight 0.50 | +1.22 | +3.11 | +4.96 |

### What actually moved it: the approach shot

An approach is the first shot of the net phase, but it was priced as a plain groundstroke, so `net`
only touched the volley and the overhead — 10.1% of a net specialist's rally shots — while
approaches were another 32.2% and paid the forehand. Giving `net` a 0.35 share of an `approach`
composite roughly quadrupled the stat's value in both the specialized and unspecialized rows. This
is the single largest change available and it is landed.

### What did not move it: net coverage

`POSITION_ADJUSTMENTS.at_net` was a flat `+10` regardless of how good the volleyer was, which is
wrong on its face — a player who cannot cover the net is not as hard to pass as one who can. It now
scales with the net rating (`OPPONENT_STAT_ADJUSTMENTS.netCoverage`, 0.20 per point, clamped never
to fall below `well_positioned`), so the bar runs +4 at net 20 to +18 at net 90 and is exactly
neutral at 50.

It measures as noise: +0.01 unspecialized and +0.37 in a net build, both inside the ±0.5 control
band. It is kept as a correctness fix, not as part of the case for the core slot, and it is the
mechanism that would start to matter if net frequency ever rose.

### The honest position

`net` is worth about **+0.9 to a player with no net specialization and +2.2 to a net build**, against
roughly **+4.8** for the forehand. It will not close that gap, and the reason is structural rather
than fixable: the wings and the return are on 30-45% of rally shots for *everyone*, while `net` is on
10% of shots for a player who does not seek the net out. Getting the numbers level would take far
more net play than the game wants — an unspecialized player arrives at the net on 13.7% of rallies
past the return, which is the 10-15% target.

So the case for the core slot does not rest on equal sensitivity, and should not:

1. **Core means a phase of the point.** `net` is a `GamePhase`; `slice` is a stroke shape used
   inside the forehand and backhand phases. That is the organising principle section 2 states, and
   it decides this on its own.
2. **The inversion held up, twice.** In a randomized population `net` now clears the noise floor and
   `slice` does not. Two independent `statSensitivity` runs give `net` +0.94 (CI [+0.49, +1.38]) and
   +0.55 (CI [+0.12, +0.98]) against `slice` at +0.22 both times, with a CI spanning zero on each.
   Before the approach fix they were tied at +0.52 and +0.50. Note the run-to-run spread on `net`:
   the reported CI understates the real uncertainty, so treat this as "net is somewhere around +0.75
   and slice is indistinguishable from zero" rather than as two precise figures.
3. **It is no longer conditional.** Every build comes forward at some rate — 13.7% unspecialized,
   48.3% for a net specialist, and even a deliberately net-averse `net_apologist` still arrives 2.9%
   of the time. `slice` remains genuinely conditional, with a 26× frequency swing across archetypes.

The remaining lever, if `net` should be felt harder, is the approach weight in section 6 — not more
net play.
