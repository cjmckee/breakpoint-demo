# Key moments — what the tactical layer was doing, and what it does now

**Status:** measurement, plus the rebuild it argued for (applied)
**Scope:** whether the key-moment layer delivers the skill test it is meant to — read the
opponent, choose accordingly — and what each of its systems was actually contributing
**Harness:** [`src/test/analysis/keyMomentProbe.ts`](../../src/test/analysis/keyMomentProbe.ts)

---

## Summary

1. **The matchup chart had drifted so far that one archetype had no counter at all.** Of 33
   authored options, exactly **one** was strong against an all-court player — 3% — and ten of
   the eleven menus offered no good read against them. Random-pick EV swung 11pp by which
   opponent you drew, and how much reading the matchup was worth varied 2.4×.
2. **Two of the four context channels could only ever subtract.** Pressure and energy ran 0 to
   −10 with no positive half, and key moments fire *only* on the high-pressure points that
   `updatePressure()` scores highest. Neutral conditions netted **−5%**; a set-two break point
   ran ~8pp below the intended base chance. Clutch was a tax, not a test.
3. **Criticals were anti-correlated with choosing well.** Both crit bands were carved off the
   ends of one 0-100 roll, so the rate moved with the odds: **48%** of a bad read's wins were
   flagged CRITICAL SUCCESS against **30%** of a good read's. Roughly a third of all key moments
   fired the loudest banner in the game, carrying no information.
4. **Risk was a label with nothing behind it.** Every option resolved through identical bands.
   Measured at match level, "take the highest odds" and "take the highest odds but prefer safe"
   scored **identically** — 65.3% and 65.3%. The risk axis contributed nothing.
5. **33 options were 13 distinct tactics.** Grouped by role and posture, serve-and-volley was
   written five times because the stakes tier changed, not because the tactic did.
6. **Every match-level number measured before this work was taken against all-court.**
   `createUniformPlayer` carries no archetype profile, so `PlayerProfile.playStyle` derives the
   one archetype neutral to every posture. See §5.

---

## Measurement baseline

Figures below were taken at `KEY_MOMENT.baseChance = 40`, `counterBonus ±12`, best-of-1,
uniform-rating players, unless a row says otherwise. Any behaviour change invalidates them.

---

## 1. The chart, before and after

Counterability by archetype, over the whole option pool:

| archetype | before | after |
|---|---|---|
| Aggressive Baseliner | 33.3% | 30.6% |
| Defensive Pusher | 66.7% | 36.7% |
| Counter-Puncher | 66.7% | 32.7% |
| Serve & Volleyer | 30.3% | 36.7% |
| All-Court Player | **3.0%** | **0% by design** |

The matchup now derives from a 6 × 5 posture × archetype matrix
(`src/data/postures.ts`) rather than from `strongAgainst`/`weakAgainst` authored per option.
All-court is deliberately neutral to every posture: it is the archetype with no hole, and the
matrix says so rather than leaving it as an accident.

**On how many postures the matrix needs.** With A real archetypes, k postures strong against
each and m archetypes each posture beats, a fully symmetric design needs `A·k = P·m` with
`m ≤ A/2`. **Four is the minimum**, and **five admits no symmetric design at all**. Six is not
required by the matrix — it is justified by the draw needing enough distinct kinds of play.

---

## 2. Context modifiers

Pressure is now scored against the player's focus rather than charged flat, and energy gained a
freshness bonus above its neutral point:

| context | before | after |
|---|---|---|
| best case | +20.0 | +30.0 |
| neutral | **−5.0** | **0.0** |
| worst case | −40.0 | −35.0 |

`MENTAL_RESILIENCE` buys effective focus rather than attenuating a penalty, which also fixed a
display bug: the ability moved the maths but not the number the UI showed.

---

## 3. Criticals and risk

The outcome is now rolled first, on the probability alone; whether it reads as critical is a
second roll against the option's risk.

| choice | win rate | of wins, crit (before → after) |
|---|---|---|
| Good read | 52.1% | 30% → 20.3% |
| Neutral | 40.4% | 38% → 20.4% |
| Bad read | 28.2% | 48% → 20.3% |

Risk now carries the variance instead:

| risk | win rate | critical either way | self-inflicted failure | outright win |
|---|---|---|---|---|
| safe | 39.9% | 8.0% | 0/18 | 0/18 |
| balanced | 40.1% | 18.1% | 2/18 | 11/18 |
| bold | 39.7% | 32.2% | 16/18 | 15/18 |

Identical odds, four times the emphatic outcomes, and the difference now shows in the
commentary and match statistics rather than only in the crit rate.

---

## 4. Base chance, and why the format decides it

`baseChance` trades off steeply — roughly **+10pp of match win rate per +5** — because key
moments land only on break/set/match points.

**The match format changes the answer more than the constant does.** Measured over 200 even
matches against a 49% key-moments-disabled control:

| baseChance | best-of-1 match win rate | best-of-3 |
|---|---|---|
| 35 | **30.0%** | **50.7%** |
| 40 | 49.0% | 60.0% |
| 45 | 60.0% | 72.7% |

The same constant is 20pp apart across formats. A single set fires ~8.5 key moments but they
cover most of that set's pivotal points; a best-of-3 spreads ~15 across three times the games,
so the layer has *more* leverage in the shorter format despite firing fewer moments. Best-of-1
is what the game plays outside team matches.

---

## 5. The fixture was measuring the wrong opponent

`createUniformPlayer` carries no archetype profile, so every match-level figure in this repo
before this work was taken against all-court — the one archetype with nothing to read. The
probe now builds opponents with `profileForArchetype`, selected by `OPPONENT=`.

| KM policy | vs all_court | vs defensive | vs counterpuncher |
|---|---|---|---|
| Always best read | 47.5% | 69.0% | 71.0% |
| Random pick | 50.0% | 62.0% | 60.0% |
| Always worst read | 40.0% | 35.0% | 41.0% |

A ~7pp spread (noise) against all-court, 30-34pp once there is a matchup to read.

**And a finding outside this layer.** A uniform-50 player beats a uniform-50 *defensive*
opponent **63.3%** of the time with key moments disabled entirely. The archetype profile changes
how the opponent plays ordinary rally points and the rally sim is not neutral across archetypes.
This means "near 50% match win rate" is not a reachable tuning target per archetype, because the
*control* is not 50% per archetype — the layer should instead be roughly neutral relative to its
own control. It also means the 63% is worth understanding on its own terms.

---

## 6. Stats barely separate the options in a menu

The stat differential does two jobs through one number, and only one of them is small:

| what it carries | worth |
|---|---|
| which option suits you (spread across one menu, level-matched) | 2.8 – 4.4pp |
| how outmatched you are (20-point rating gap) | ±8.8pp |

An earlier draft of this document claimed "stats are decoration" in the key-moment layer. That
was drawn from the level-matched case only, which zeroes out the level component, and is
**withdrawn**. Stats matter for whether you are outmatched; they barely separate the three cards
in front of you.

The chip that reports this was thresholded at ±10, above the 90th percentile of the
level-matched gap at every tier, so it read "even" almost everywhere. At ±5 it tracks: 97-100%
"favour them" at a 10-20 point deficit, 74% "even" when level-matched.

---

## 7. Hypotheses tested and withdrawn

- **A serve/return asymmetry in outcomes.** A 120-match best-of-3 run showed the player winning
  29.2% of key moments serving against 37.7% returning, which looked like a real bias worth a
  server-relative base chance. At best-of-1 over 250 matches it is 32.4% / 34.9% — noise. The
  gap did not survive the larger sample or the correct format, and the fix was never built.
- **Showing the player the folded success probability.** A one-word verdict chip combining every
  term measured as an answer key: "take the highest verdict" beat every other policy and *tied*
  a resource-aware version of itself, so it was solving the point rather than informing it. The
  card now shows the stat comparison only, and the matchup reaches the player as prose they have
  to map onto the opponent themselves.
- **Mixing rally options with serve/return ones at deuce.** Justified by a deuce point still
  having a server, but it doubled every posture × risk cell in that pool — a menu could show two
  cards carrying identical badges — and left two genuinely distinct option sets rather than
  three. The three roles are now discrete.
- **Stakes and pressure as eligibility axes.** `TacticalOption` could restrict itself by what was
  on the line and by whether the player was converting or defending. Nothing ever used the stakes
  filter, and only one authored pair used pressure — a "nothing to lose" swing that existed to
  avoid deleting a duplicate. Both axes were removed with it. Role is the only thing that decides
  which shots are physically available.
- **A repeat-posture decay.** A growing penalty for reusing a posture, surfaced as depleting
  "surprise" pips. With 54 options across six postures and a draw that already prefers unused
  ones, there is enough variety without taxing a player for having a favourite.

---

## 8. What is still open

- **`baseChance` is untuned at 40.** It was set against all-court under the old chart. Re-measure
  across the real archetype spread, against each archetype's own control (§5), before trusting it.
- **Risk is a lever, not a trade-off.** After decorrelating risk from posture, "highest odds" and
  "highest odds, prefer safe" moved from identical to 9.3pp apart — but in bold's favour. Bold is
  rewarded twice (opponent fatigue drain scales with energy spent, momentum swings harder) against
  a cost of four energy, so safe has no reason to exist yet.
- **Best-of-3 is untuned.** One constant cannot serve both formats given the leverage difference
  in §4. Low priority — team matches only.
