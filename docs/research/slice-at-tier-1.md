# Slice at tier 1 — why the stat did not pay, and the change that followed

**Status:** findings plus the change they argued for (applied: `SLICE_TUNING`, chip-return
composite)
**Scope:** the slice stat at the ratings the game ships (OVR 20-50, tier-I specialties)
**Harnesses:** [`sliceProbe.ts`](../../src/test/analysis/sliceProbe.ts),
[`sliceAnatomy.ts`](../../src/test/analysis/sliceAnatomy.ts)
**Builds on:** [`stat-channels.md` §10](./stat-channels.md), which measured slice over 50→75 with
tier-III specialties and called it a conditional stat

---

## Summary

1. **§10's conclusion does not hold at tier 1.** It found slice core-grade for a build made for it
   (+4.67 at the max slice build, slice 50→75, tier III). A tier-1 player cannot hold tier III.
   At slice 30→50 with tier-I specialties the same builds measure +0.6 (unspecialized), +0.9
   (`bh_samurai`) and +1.3 (max slicer). Against that, +20 forehand is worth about +3.
2. **The stat works whenever the player slices.** On points where the player hits a slice, win
   rate climbs from 35% to 61% as slice goes 30→70. Slicing happens on a fixed ~10.5% of points,
   whatever the stat is. The forehand's share grows as it improves.
3. **At equal rating the slice was a dominated shot.** A slice passes three support bands no drive
   touches. All of them are centred on 50, and every tier-1 player sits below 50. A uniform-30
   slice carried ×0.68–0.71 total adjustment against a drive's ×0.98.
4. **Five quality levers did nothing measurable.** Neither did the selection lever on its own.
   What worked was combining frequency (the chip return), removing the tax (bonus-only bands) and
   selection. Together they take slice's value to 1.7–2.6× the shipped figure, with no change to
   match texture.
5. **The rating tax stays withdrawn.** It looked as if raising slice made the player's other
   points worse. Pinning OVR showed that was noise.

---

## 1. Where the value goes

`sliceAnatomy`: uniform-30 player with a tier-I slicer archetype, against uniform 30. The player's
slice is swept. 1500 BO3 per row.

|                                    | slice 30 | slice 50 | slice 70  |
| ---------------------------------- | -------- | -------- | --------- |
| point-win %                        | 49.8     | 50.6     | 52.1      |
| points where the player slices     | 10.6%    | 10.6%    | 10.4%     |
| …won                               | 34.6%    | 47.3%    | **60.9%** |
| points without a player slice, won | 51.6%    | 51.0%    | 51.1%     |

The total is all frequency: +26 points on ~10.5% of points is +2.8 expected, against +2.3
measured.

The same sweep for forehand, for scale: 50.1 → 53.2 → 55.6. Forehand share of rally shots goes
from 14% to 20% as it rises, because `calculateShotPreference` moves the wing ratio toward the
better wing. Slice share does not move.

The 35% is the other half of the story. At equal ratings, a point where you slice is a point you
are losing. Shot by shot at 30/30:

| per rally shot           | slice | forehand |
| ------------------------ | ----- | -------- |
| lands in                 | 71%   | 71%      |
| winner                   | 2.0%  | 6.3%     |
| opponent's reply error   | 24%   | 30%      |
| opponent's reply quality | 25.6  | 21.8     |

The two shots land in equally often, but the slice ends fewer points and pressures the reply
less. Using a dominated shot more often cannot help, which is why the selection lever alone did
nothing (§3).

### The rating tax, checked

At N=1000 the "without a slice" column fell from 52.5% to 51.2% as slice rose. That looked like
the [rating tax](./stat-system-audit.md#5-the-rating-tax--withdrawn): more slice → higher OVR →
higher `matchLevel`. At N=1500, with the player's `overallRating` pinned (`PIN_OVR=1`), it moves
51.5 → 50.9. Without the pin it moves 51.6 → 51.1. Both are noise. The tax stays withdrawn.

## 2. Why the slice was dominated

Mean modifier stack per shot family, uniform-30 mirror (`bh_samurai` T1), 300 BO3:

| factor              | drive     | slice     | defensive slice |
| ------------------- | --------- | --------- | --------------- |
| spin (`shape`)      | 1.000     | 0.960     | 0.960           |
| physical            | 1.000     | 0.974     | 0.939           |
| mental              | 0.970     | 0.935     | 0.935           |
| difficulty          | 1.019     | 0.894     | 0.892           |
| **finalAdjustment** | **0.979** | **0.680** | **0.712**       |
| incoming quality    | 26.9      | 34.0      | 34.9            |

Difficulty is context. Slices are chosen off harder balls (52% hard or extreme), and that is
correct. The rest is the bands:

- `shape` (spin) gates on slice shots.
- `courtCoverage` (speed) and `tactics` gate on defensive shots, and `isDefensiveShot` matches
  anything containing `slice`.
- A drive passes none of them.

`statModifier` is centred on `NEUTRAL_STAT = 50`, so below 50 every band subtracts. The product
is the convexity [`stat-channels.md` §4](./stat-channels.md) noted, concentrated on one shot.

At ratings above 50 the same bands turn into bonuses. That is why §10, measuring 50→75 at tier
III, found a strong specialist stat. By accident, slice was a late-game shot.

## 3. Levers

`sliceProbe`, slice 30→50, everything else uniform 30, tier-I specialties. 3000 BO3 per cell, so
the control column is the noise floor (about ±0.6). "Shipped" is the config before this change,
pooled over four runs.

| lever                                                  | control | no spec   | `bh_samurai` T1 | max slicer |
| ------------------------------------------------------ | ------- | --------- | --------------- | ---------- |
| **shipped, before** (4 runs)                           | +0.06   | +0.59     | +0.94           | +1.32      |
| defensive-slice requirement 0.25 → 0.40                | +0.38   | +0.20     | +1.34           | +1.21      |
| defensive-slice winner floor 105 → 85                  | −0.01   | +0.59     | +0.67           | +1.56      |
| **skid**: a good slice gives normal time, not plenty   | −0.24   | +0.24     | +0.82           | +1.07      |
| skid from average quality                              | +0.13   | +0.56     | +0.85           | +1.49      |
| **low ball**: attacking a good slice ×0.90             | +0.12   | +0.25     | +1.09           | +1.07      |
| low ball ×0.80                                         | +0.06   | +0.31     | +0.91           | +0.87      |
| **selection**: slice more when slice > wing (0.005/pt) | −0.25   | +0.13     | +1.33           | +1.44      |
| selection 0.010/pt                                     | +0.42   | +0.51     | +1.27           | +2.27      |
| **band floor**: slice bands bonus-only                 | +0.32   | +0.44     | +1.17           | +1.30      |
| band floor + selection (2 runs)                        | −0.09   | +0.70     | +1.35           | +2.21      |
| **chip return**: slice 0.1 of the return composite     | +0.21   | +1.06     | +1.59           | +1.84      |
| slice 0.1 of the groundstroke composite                | +0.41   | +0.51     | +1.83           | +1.46      |
| **chip return + band floor + selection** (2 runs)      | +0.07   | **+1.39** | **+2.04**       | **+2.25**  |

Reading it:

- **Quality levers cannot work alone.** Skid and low ball came from the observation that every
  slice handed the receiver `timeAvailable: 'plenty'` and that its `spin: 'slice'` tag was read
  by nothing. Both are true. But at tier-1 qualities most drives give `plenty` too, and anything
  that improves the slice shot improves it for the opponent as well. They were removed from the
  sim.
- **Frequency is the binding constraint.** The chip return is the only single lever that moves
  the unspecialized column past noise. It is the same fix that made `net` pay once approaches
  carried it ([`stat-channels.md` §7](./stat-channels.md)).
- **Selection needs the band floor.** Selection only pays once the slice is no longer dominated.
  Together they help the slicer most.
- **The three together** lift every column by 1.7–2.6× (§5). +1.4 per +20 for an unspecialized
  player is about +0.7 per +10, in line with the technical stats at tier 1 (`spin` +1.36,
  `placement` +1.77 per +10 in the 25-50 population).

## 4. The change

```
RETURN_COMPOSITE_WEIGHTS  return 0.6 → 0.5, slice 0.1 (the chip and the block)
SLICE_TUNING.supportFloor            1      — spin, physical and mental factors on a slice are max(1, x)
SLICE_TUNING.selectionPerStatPoint   0.005  — +0.5% slice chance per point slice sits above the wing
SLICE_TUNING.selectionCap            0.35
```

The groundstroke-composite variant was not taken. It helps `bh_samurai` but not the
unspecialized player, and it would make slice a stat every drive pays for.

**Validated** against the code as committed (§5).

**Match texture is unchanged.** `matchAnatomy` at L=30, 200 BO3 per build, before against after:
every rally-length, point-ending and shot-mix row is within noise for all five builds. A uniform
build has slice equal to its wings, so selection does not fire, and the band floor moves slices
by a few points of quality.

**Cost to `return`.** A tenth of the return composite moves from `return` to `slice`, so
`return`'s value falls by about one interval (§5).

**What it does not fix.** In `careerSim`, the slice change moves the baseliner identity by +0.6
at day 40, which is noise. The baseliner's gap
([`stat-currency-progression.md` §3.4](../proposals/stat-currency-progression.md)) comes from
skipping serve and return, not from slice alone.

## 5. Validation

**Against the committed code.** `sliceProbe` at the same settings, with the change shipped and
with every part switched back off (`pre-fix`). 3000 BO3 per cell:

| config  | control | no spec   | `bh_samurai` T1 | max slicer |
| ------- | ------- | --------- | --------------- | ---------- |
| pre-fix | +0.16   | +0.66     | +0.77           | +0.83      |
| shipped | +0.43   | **+1.33** | **+1.96**       | **+2.20**  |

This matches the combined lever in §3 (+1.39 / +2.04 / +2.25). Against the pre-fix runs (the four
pooled in §3 plus this one) the multiplier is 1.7–2.6× depending on column and run.

**Across the population.** `statChannels` PART A over U(25, 50), tier-I builds, 8000 pairings,
±0.39. "Before" is the table in [`stat-channels.md` §5](./stat-channels.md):

| stat         | before | after     |
| ------------ | ------ | --------- |
| anticipation | +3.27  | +3.12     |
| return       | +2.96  | +2.52     |
| serve        | +2.81  | +2.62     |
| speed        | +2.72  | +2.62     |
| tactics      | +2.32  | +2.32     |
| backhand     | +1.90  | +1.33     |
| net          | +0.77  | +1.31     |
| **slice**    | +0.48  | **+1.13** |
| stamina      | +0.90  | +0.64     |

`slice` moves from inside noise to beside `net` and `backhand`. That was the goal: a technical
stat that pays everyone something and its specialists more.

`return` falls by 0.44, about one interval. That is the expected price of giving a tenth of its
composite away, and it stays fourth. The top five keep their order.

The `backhand` and `net` moves are as large, but neither stat was touched. That is the tier-1
control swing [`stat-channels.md` §5](./stat-channels.md) warns about at this sample size, and
should not be read as an effect.

```
N=3000 BASE=30 BUMP=50 TIER=1 LEVERS='^shipped|^pre-fix' npx tsx src/test/analysis/sliceProbe.ts
N=1500 FH=1 npx tsx src/test/analysis/sliceAnatomy.ts
N=8000 SEED=7 PARTS=A LO=25 HI=50 POINTS=3 MAX_TIER=1 npx tsx src/test/analysis/statChannels.ts
```

**Measurement baseline:** every figure above is pre-change except the "shipped" and "after"
columns. Any table elsewhere in `docs/` that ranks `slice` or `return` at tier 1 predates this
change.
