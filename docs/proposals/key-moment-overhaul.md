# Key Moment Overhaul

**Status:** Proposal
**Scope:** Rebuild the key-moment tactical layer around option *tags* — replacing the
hand-authored per-option matchup lists with a posture × archetype matrix, drawing option
menus from a tagged pool instead of a fixed triple, and making risk mean variance rather
than an energy cost.

---

## Motivation

The key-moment layer is meant to be a small skill layer sitting beside the rally sim: know
roughly who you are playing, pick accordingly, feel some control over the biggest points.
It half-works. Three measured problems, and they share a root cause.

**Every situation offers the same three choices.** Eleven key-moment types, 33 options, and
every menu is the same triad — power, safe, net. `getOptionsForSituation` returns the whole
fixed array and `createKeyMoment` only shuffles the display order, so a player sees the same
three cards at every break point of every match. Names repeat verbatim: "Serve and volley"
appears three times, "Chip and charge" and "Aggressive return" twice each.

**The matchup chart has drifted.** `strongAgainst`/`weakAgainst` are hand-authored per
option, 33 times, with nothing checking the result. What that produced:

| Opponent archetype | Options strong vs. | Neutral | Weak vs. | % counterable |
|---|---|---|---|---|
| Aggressive Baseliner | 11 | 10 | 12 | 33.3% |
| Defensive Pusher | 22 | 6 | 5 | 66.7% |
| Counter-Puncher | 22 | 1 | 10 | 66.7% |
| Serve & Volleyer | 10 | 12 | 11 | 30.3% |
| All-Court Player | **1** | 20 | 12 | **3.0%** |

Ten of the eleven menus contain no countering option against an all-courter. Against that
archetype the skill layer does not exist, and a player is right to read it as random. The
distortion is not cosmetic — it moves the numbers the whole system is tuned against:

| archetype | random-pick EV | best pick | worst pick | skill spread |
|---|---|---|---|---|
| aggressive | 42.1% | 55.0% | 32.0% | 23.0pp |
| defensive | 48.8% | 55.0% | 36.4% | 18.6pp |
| counterpuncher | 47.6% | 55.0% | 32.7% | 22.3pp |
| serve_volley | 41.9% | 53.6% | 32.0% | 21.6pp |
| all_court | 37.5% | 41.4% | 32.0% | **9.4pp** |

An 11pp EV swing and a 2.4× difference in how much reading the matchup is worth, decided
by which opponent you drew.

**Risk is a fiction.** Options are described as safe or aggressive, but every option
resolves through the same four bands with the same crit widths. The only encoded difference
is the mean and some authored momentum/energy numbers. A "safe" option and a "risky" option
at the same success chance produce statistically identical outcomes. Risk is currently
proxied by an energy cost, which is a resource players do not watch and a stat they do not
read.

The root cause is shared: **the option is a bag of hand-authored numbers rather than a
typed thing with properties.** Adding the tactic families we want (deception, attrition,
gamesmanship, surface plays) makes all three problems worse, because each new option is 33
more hand-authored relationships and one more menu slot competing for attention.

So the fix is not "rebalance the chart" or "add more options". It is to give an option a
small set of tags, and derive the chart, the menu and the variance from them.

---

## The model

```
        ┌──────────────────────────────────────────────┐
        │  TacticalOption                              │
        │    posture:  how you are playing the point   │
        │    risk:     how wide the outcome spread is  │
        └───────┬─────────────┬────────────────┬───────┘
                │             │                │
    ┌───────────▼──┐  ┌───────▼────────┐  ┌────▼──────────┐
    │ Matchup       │  │ Outcome bands  │  │ Menu draw     │
    │ posture ×     │  │ risk widens or │  │ constraints   │
    │ archetype     │  │ narrows spread │  │ over tags     │
    └───────────────┘  └────────────────┘  └───────────────┘
```

One authored fact per option feeds three systems. A new option inherits sane matchup
coverage, a real risk profile and menu eligibility from its tags, instead of needing 33
new hand-authored relationships.

### Situation eligibility — role, stakes, pressure

An option is not valid everywhere. Facing break point **on your serve**, every option must be
a serve; converting break point **on their serve**, every option must be a return. That
constraint is real and the draw has to respect it.

Today it is enforced by enumerating eleven `KeyMomentType`s and authoring a separate menu for
each. That is why the pool duplicates so heavily — grouping the 33 options by role and
posture shows only **13 distinct tactics**:

| Role | Posture / risk | Copies | Written as |
|---|---|---|---|
| serve | power / bold | 5 | Power serve down the T, Clutch power serve, Big serve under pressure, Championship serve, Big serve to survive |
| serve | net / bold | 5 | Serve and charge the net, Serve and volley, Serve and charge |
| serve | neutralize / safe | 3 | Safe spin serve, Smart spin serve |
| return | power / bold | 5 | Aggressive crosscourt return, Aggressive return, All-out attack return, Nothing-to-lose swing |
| return | neutralize / safe | 4 | Deep neutralizing return, Block return and rally, Defensive rally setup, Lob and reset |

The same serve-and-volley is written five times because the stakes tier changed, not because
the tactic did. Decompose the situation instead:

```typescript
/** Which side of the ball — decides which options are physically possible. */
export type KeyMomentRole = 'serve' | 'return' | 'rally';

/** What is on the line. */
export type KeyMomentStakes = 'deuce' | 'break' | 'set' | 'match';

/** Whether the player is chasing the point or hanging on to it. */
export type KeyMomentPressure = 'converting' | 'defending';
```

An option declares eligibility rather than belonging to a menu:

```typescript
interface TacticalOption {
  roles: KeyMomentRole[];       // most options are one; rally tactics reach more
  posture: KeyMomentPosture;
  risk: KeyMomentRisk;
  stakes?: KeyMomentStakes[];   // omitted = any
  pressure?: KeyMomentPressure[]; // omitted = either
}
```

The draw filters the pool by the situation, then applies the tag constraints. "Nothing-to-lose
swing" declares `pressure: ['defending']` and simply never appears when you are the one
converting — which is the behaviour the eleven hand-authored menus were approximating.

The eleven current types decompose cleanly, so this is a re-description rather than a
redesign:

| `KeyMomentType` | role | stakes | pressure |
|---|---|---|---|
| `break-point-serve` | serve | break | defending |
| `break-point-return` | return | break | converting |
| `set-point-player-serve` | serve | set | converting |
| `set-point-player-return` | return | set | converting |
| `set-point-opponent-serve` | serve | set | defending |
| `set-point-opponent-return` | return | set | defending |
| `match-point-player-serve` | serve | match | converting |
| `match-point-player-return` | return | match | converting |
| `match-point-opponent-serve` | serve | match | defending |
| `match-point-opponent-return` | return | match | defending |
| `key-rally` | rally + the server's side | deuce | — |

Stakes stop being a content bucket and become what they always were: a pressure level, which
`updatePressure()` already computes.

**The rally role is not optional.** `isDeucePoint` fires at 30-30 and 40-40, and those moments
test how you *construct* the point rather than how you start it — that is what the existing
`key-rally` menu is for. But a deuce point still has a server, so its menu should draw from
the rally pool **and** the serving or returning pool as appropriate, mixing "attack the net
mid-rally" with "big serve down the T". That mix is exactly why `roles` is a list rather than
a single value.

| Situation | Draws from |
|---|---|
| break / set / match point, player serving | `serve` |
| break / set / match point, player returning | `return` |
| 30-30 or 40-40, player serving | `rally` + `serve` |
| 30-30 or 40-40, player returning | `rally` + `return` |

### Postures

A posture is *how you are playing the point* — the thing an opponent's style is strong or
weak against. Six, chosen to span the tactic families we want and to give the underused
stats (`slice`, `backhand`) somewhere to live:

| Posture | What it means | Leans on |
|---|---|---|
| `power` | Overpower them, end it early | serve, strength, forehand |
| `net` | Take the net, finish short | net, speed, anticipation |
| `neutralize` | Absorb pace, reset, start the rally on your terms | spin, slice, tactics |
| `deception` | Drop shot, disguise, wrong-foot | placement, spin, slice |
| `attrition` | Extend it, make them run, win the next one | stamina, backhand, focus |
| `variety` | Refuse to be predictable — change pace, angle, court position | anticipation, tactics, speed |

### The matchup matrix

Replaces 33 hand-authored `strongAgainst`/`weakAgainst` lists with one 6 × 5 table that
can be read, reviewed and validated at a glance.

|              | power | net | neutralize | deception | attrition | variety |
|--------------|-------|-----|------------|-----------|-----------|---------|
| **aggressive**     | ✗ | ✗ | ✓ | ✓ | – | – |
| **defensive**      | ✓ | ✓ | ✗ | – | – | ✗ |
| **counterpuncher** | ✗ | ✓ | – | – | ✗ | ✓ |
| **serve_volley**   | ✓ | ✗ | – | ✗ | ✓ | – |
| **all_court**      | – | – | – | – | – | – |

Read as tennis:

- **power** beats a pusher (overpower them) and a serve-volleyer (returns at their feet); loses
  to a bigger hitter and to a counterpuncher who feeds on pace.
- **net** beats a pusher (finish the floaters) and a counterpuncher (they need time); loses to a
  baseliner who passes and to someone better at the net than you.
- **neutralize** beats a big hitter (absorb, make them over-hit); loses to a pusher, whose game
  it is.
- **deception** beats a hitter committed early; loses to a serve-volleyer, because a short ball
  is an invitation forward.
- **attrition** beats a serve-volleyer (make them rally); loses to a counterpuncher, who wants
  the long one.
- **variety** beats a counterpuncher (break the rhythm they feed on); loses to a pusher, who
  does not care how pretty it is — you have to actually hurt them.

Balanced on **both** axes, which the first draft was not:

- every archetype has exactly 2 postures strong against it, 2 weak, 2 neutral
- every posture is strong against exactly as many archetypes as it is weak against — `power`
  and `net` at 2/2, the other four at 1/1

The first draft balanced rows only, which left `deception` strong against three archetypes
and weak against none, and `tempo` strong against one and weak against none: two postures
that were strictly better than neutral and could never be punished.

### How many postures does the matrix actually need?

Worth stating, because six is not obviously the right number. With `A` real archetypes (4 —
all-court is neutral everywhere, so it constrains nothing), `k` postures strong against each
archetype and `m` archetypes each posture is strong against, a fully symmetric design needs
`A·k = P·m`, with `m ≤ A/2` so no posture beats more than half the field.

| Postures | Per archetype | Per posture | Neutral cells per archetype |
|---|---|---|---|
| **4** | 2 strong, 2 weak | 2 / 2 | 0 |
| 4 | 1 strong, 1 weak | 1 / 1 | 2 |
| 6 | 3 strong, 3 weak | 2 / 2 | 0 |
| 8 | 2 strong, 2 weak | 1 / 1 | 4 |

**Four is the mathematical minimum**, and five admits no fully symmetric design at all
(`4k = 5m` has no valid integer solution). At six, full symmetry forces 3 strong and 3 weak
per archetype — *every* posture matters against every archetype, no neutral cells, which makes
every pick a hard read with no middle ground.

The matrix above instead relaxes the constraint to the one that actually matters — **no
posture is strictly better than another** — while letting postures differ in how polarising
they are. That admits 2 strong / 2 weak / 2 neutral per archetype at six postures, with two
broad postures (power, net) and four specialised ones.

So six is not required by the matrix; four would do. Six is justified by the **draw**: the
repeat-posture decay needs somewhere to rotate to, and four postures at three options each is
a thin pool that would go stale inside one match. The matrix is the constraint that six must
satisfy, not the reason for it.

**All-court is deliberately neutral to every posture.** It is not an oversight to be filled
in; it is the archetype that has no hole. What beats it is *variety* — see the repeat-posture
penalty below — which gives it a real identity, makes the one archetype nothing counters
into the one archetype that punishes predictability, and means the matrix has no cell that
exists only because something had to go there.

### Risk as variance

Risk stops being an energy cost and becomes the shape of the outcome distribution. Same
expected value, different spread:

| `risk` | Crit share of outcomes | Momentum swing | Reads as |
|---|---|---|---|
| `safe` | low | small | predictable, few disasters, few heroics |
| `balanced` | medium | medium | the current behaviour |
| `bold` | high | large | swingy — big wins, big losses |

A safe option and a bold option at the same success chance win the point equally often. The
bold one is far more likely to resolve as a critical either way, and moves momentum harder
when it does. That is what "risky" has always claimed to mean, and the energy cost was
standing in for it.

This also gives the card a truthful visual: a three-segment bar showing the outcome spread,
tight for safe and fat-tailed for bold, with no percentages on screen.

### Menu draw

Draw 3–4 from a tagged pool per situation, under constraints rather than fixed slots:

- at least two distinct `risk` levels, so there is always a real choice of exposure
- at least two distinct `posture` values, so there is always a matchup decision
- never repeat the exact hand from the previous moment of the same type

Constraints rather than one-of-each keeps the *shape* of the hand varying — sometimes
safe/bold/net, sometimes two different bold postures — and lets the situation shape it
further: down 0-40 the hand can omit the safe option entirely, because there isn't a safe
play.

### Repeat-posture decay, and how to show it

Track postures the player has already used this match. Repeating one attracts a growing
penalty. This is what makes the same card play differently the third time, and it is how
all-court is countered — the decay scales up against an opponent whose whole identity is
reading you.

Surfacing it as commentary ("they're sitting on it") is the wrong register: it reads as
flavour text, it costs a whole line of card space, and it does not tell the player how much
is left. It is a depleting resource, so show it as one:

> **Surprise** — a short pip row on the card, full when a posture is fresh, depleting as it
> is reused. `●●●` → `●●○` → `●○○`.

Why this shape:

- **It is the mechanic, not a comment on it.** Pips deplete; that is what the penalty does.
- **It costs almost nothing.** One small row on a card that already carries an emoji, a
  name, a verdict chip and a stat grid.
- **It teaches posture implicitly.** The pips are per-*posture*, so every card sharing a
  posture depletes together. A player who serve-and-volleys twice sees the chip-and-charge
  card dim too, and learns that the game groups them — without a tutorial.
- **It needs no number.** Hover can carry one line ("you have gone to the net three times")
  for players who want it.

The penalty also flows into the card's verdict chip, so a player who never looks at the pips
still *feels* the decay as the verdict softens from Strong toward Even. The pips only answer
"why did that change".

Open: whether surprise recovers over time (a posture unused for several games freshening
back up) or decays monotonically for the match. Recovery is more forgiving and rewards
rotation rather than rationing; monotonic is simpler and makes the endgame tighter. Leaning
recovery, on a slow per-game tick.

---

## Chunks of work

Ordered by dependency. Each lands independently and is measurable on its own.

### 1. Tag the options *(foundation — everything else depends on it)* — **done**

Added `posture` and `risk` to `TacticalOption` and tagged the existing 33. (A `family` tag was
considered and dropped — it would have carried flavour only, and nothing reads it.) No behaviour
change; nothing reads the tags yet.

Still to add here: `roles`, `stakes` and `pressure` per the eligibility model above, which is
what lets the eleven authored menus collapse into one filtered pool.

### 2. Derive the matchup from the matrix — **done**

Add `POSTURE_VS_ARCHETYPE` to config; `KeyMomentResolver` reads the matrix instead of
`strongAgainst`/`weakAgainst`, and those two fields come off `TacticalOption`. Add a probe
assertion that coverage stays symmetric. **This is the chunk that fixes all-court and the
aggressive/counterpuncher skew**, and it fixes them structurally rather than by re-authoring.

**Done:** `counterBonus` / `weakPenalty` are now symmetric at ±12. They landed with
this chunk rather than before it — a symmetric penalty applied to today's skewed chart would
deepen the all-court hole rather than fix it, since all-court currently has one strong option
against twelve weak ones.

### 3. Outcome model — **done**

Two independent changes:

- **Crit reordering.** The outcome is rolled first, on the probability alone; whether it reads
  as critical is a second roll against the option's risk. Previously the crit bands were
  carved off the ends of one 0-100 roll, which made the crit rate move with the odds and
  *anti*-correlate with choice quality — 48% of a bad read's wins were flagged CRITICAL
  SUCCESS against 30% of a good read's. Now flat at ~20% of wins and ~20% of losses whatever
  the read.
- **Variance by risk tag.** `criticalShareByRisk` (8 / 18 / 32%) and
  `criticalEffectMultiplierByRisk` (1.5 / 2 / 2.5) make risk mean variance. Measured: win
  rate 39.9 / 40.1 / 39.7% across safe / balanced / bold — identical odds — against critical
  rates of 8.0 / 18.1 / 32.2%. A bold option does not win more often; it resolves emphatically
  four times as often, in both directions.

### 4. Menu draw — **done**

Implement the constrained draw over the tagged pool. Depends on 1. Low risk, immediately
visible.

### 5. Write more options — **done**

Draft catalogue: **[`key-moment-option-catalogue.md`](./key-moment-option-catalogue.md)**.

Not optional polish — the matrix is only as good as the pool feeding it. Tagging the existing
33 (chunk 1, done) shows how thin the new postures are:

| Posture | Options | Share |
|---|---|---|
| power | 11 | 33.3% |
| net | 8 | 24.2% |
| neutralize | 7 | 21.2% |
| attrition | 3 | 9.1% |
| deception | 2 | 6.1% |
| tempo | 2 | 6.1% |

| Risk | Options | Share |
|---|---|---|
| bold | 19 | 57.6% |
| safe | 9 | 27.3% |
| balanced | 5 | 15.2% |

**`power` appears in all eleven menus.** That, more than the count of three, is why every key
moment feels the same — one of your options is always the same posture. `deception`, `tempo`
and `attrition` together appear in six menus and never more than one at a time, so the
constrained draw has nothing to draw from and the matrix has three columns that barely exist.

Rough target: enough per posture that every situation can offer at least three of the six,
and enough `balanced` options that the risk axis is a real spine rather than a bold/safe
binary. Each new option is two tags plus stat weights, not 33 hand-authored relationships.

Content to write, from the earlier brainstorm: deception (drop shot, disguised slice, body
serve), attrition (heavy ball to the backhand, extend the rally), target-the-weakness (reads
the opponent's actual lowest stat), tempo (take it early, slow it down), gamesmanship (take
time, big fist pump — low win chance, large pressure and mood swings), true percentage play,
signature shots gated on abilities, and surface-specific plays. Surface is worth calling out:
it is on `InteractiveMatchConfig` today and has zero effect on key moments.

### 6. Legibility — **done**

- **Verdict chip.** One word per card — Strong / Favoured / Even / Risky / Poor — from the
  full success probability, computed by the same resolver call that will decide the point, so
  the chip cannot disagree with the outcome it predicts. Replaces a chip computed from the
  stat differential alone: the weakest of the four terms, which meant a card could show a
  confident "Advantage" while carrying a matchup penalty three times larger.

  Bucketed **relative to `baseChance`**, not to 50%. A key moment is a break/set/match point,
  so its absolute odds sit well under half; judging against 50 labelled every ordinary option
  "Risky" and left the scale nowhere to put an actually bad one. Relative thresholds also
  survive chunk 7's re-tune without the labels drifting.
- **Risk-shape bar.** Four segments — critical success / success / failure / critical failure —
  so two options at the same odds look different when their risk differs. A safe option at 38%
  draws one bright segment and one dark tail; a bold option at the same 38% draws two and four.
- **Breakdown rows** in the detail pane: the read, the stats, the conditions, each as a word
  with no numbers, so the verdict is accountable without inviting arithmetic.
- **Choice grade split from point result** on the reveal: the outcome banner says what happened
  to the point, and a separate line grades the decision — "Great read … it just did not land
  this time" reads differently from a plain ❌, which is the whole complaint about a correct
  choice on a lost point.

Not done here: the **Surprise pips**, because the repeat-posture *decay* they surface is not
built yet — the draw currently prefers fresh postures but nothing penalises repetition.

### 6b. Decorrelate risk from posture — **done**

The generated pool had risk confounded with posture — four postures had no safe option and
two had no bold one, so "play it safe" meant "play neutralize or attrition" and risk was a
second name for a matchup decision. Every posture now spans the range (safe 32% / balanced
32% / bold 36% overall, no empty cells).

Measured against a defensive opponent, 150 best-of-1 matches per policy:

| KM policy | before decorrelation | after |
|---|---|---|
| Highest odds | 65.3% | 72.0% |
| Highest odds, prefer safe | 65.3% | 62.7% |
| Always safest | 44.0% | 54.0% |
| Always boldest | 61.3% | 57.3% |
| Random pick | 54.0% | 46.0% |

The first two rows are the point. They were **identical** before — the risk axis contributed
nothing at match level — and are now 9.3pp apart at near-identical key-moment win rates
(52.0% vs 52.1%). Risk now does something.

**But it is a lever, not yet a trade-off.** It rewards bold unconditionally: a bold win drains
the opponent 3.6 fatigue against a safe win's 1.2 (`fatiguePerEnergySpent` × energy spent) and
banks +14 momentum against safe's zero, while the only cost is 4 more energy. Safe's upside —
mood +2, pressure -3 — does not compete. Until safe has a reason to exist, "bold with a good
read" is simply the answer.

### 6c. Chip shows less — **done**

The verdict chip folded every term into one word, which measured as an answer key: "take the
highest verdict" beat every other policy and tied even a resource-aware version of itself. The
card now shows the weighted **stat** comparison, labelled as such, and the matchup reaches the
player only as prose ("retrievers who sit back") that has to be mapped onto the opponent in
the header. That mapping is the skill, and the result screen's read-grade is where it is
learned over a career.

The outcome-spread bar went with it — the split between its light and dark halves *is* the
success probability. Replaced by a volatility indicator (Steady / Mixed / Swingy) from the
risk tag alone, which says how emphatic an option is without saying how likely.

`getVerdict` and `getOutcomeSpread` are deleted rather than left unused.

### 7. Re-baseline — **now blocking**

`baseChance` 40 was tuned against all-court under the *old* skewed chart. Under the matrix,
all-court is exactly neutral, so it is now a clean "no matchup" baseline rather than a
worst case — an even matchup against it measures 50.0% match win rate at 40, which is the
right number for the situation it describes.

**Fixture fixed.** The probe now builds its opponent with `profileForArchetype`, selected by
`OPPONENT=` (default `defensive`); all five legacy archetypes verified to resolve to
themselves. Previously `createUniformPlayer` carried no archetype profile, so every
match-level number in this repo was measured against all-court.

That mattered exactly as much as expected. Against all-court every policy converges, because
an archetype neutral to every posture offers nothing to read:

| KM policy | vs all_court | vs defensive | vs counterpuncher |
|---|---|---|---|
| Always best read | 47.5% | 69.0% | 71.0% |
| Random pick | 50.0% | 62.0% | 60.0% |
| Always worst read | 40.0% | 35.0% | 41.0% |

A ~7pp spread against all-court (noise) against 30-34pp once there is a matchup to read.
That is the skill layer the overhaul was for, and it was invisible until the fixture changed.

**And the control says that 60-62% is not the key-moment layer's doing.** Against a defensive
opponent, 120 best-of-1 matches with key moments *disabled*:

| baseChance | Match win rate | KM win rate |
|---|---|---|
| (control: KMs off) | **63.3%** | — |
| 32 | 43.3% | 33.5% |
| 36 | 44.2% | 36.1% |
| 40 | 58.3% | 43.3% |

A uniform-50 player beats a uniform-50 *defensive* opponent 63% of the time with no key
moments at all. The archetype profile changes how the opponent plays ordinary rally points,
and the rally sim is not neutral across archetypes — which is a finding about the sim, not
about this layer.

This changes what `baseChance` should be tuned against. "Near 50% match win rate" is not a
reachable target per archetype, because the *control* is not 50% per archetype. The right
target is that the key-moment layer be roughly **neutral relative to its own control** for a
random picker: with key moments on, an uninformed player should land near where they would
have landed without them, and the read is what moves them off it. By that standard 40 is
close (58.3% against a 63.3% control, so about -5pp) and 32/36 are far too punishing.

Before finalising, run the sweep for all five archetypes and tune against the average gap to
control — and raise the archetype rally imbalance separately, because a 63% control is worth
understanding on its own terms.

Also open: best-of-3 is untuned. One base cannot serve both formats, because a single set
fires ~8.5 key moments that cover most of that set's pivotal points while a best-of-3
spreads ~15 across three times the games. Low priority — best-of-1 is what the game plays
outside team matches.

---

## What this does not change

- Key moments stay a single roll, not a rally sim. The multi-beat idea is out of scope.
- The four outcome bands stay.
- Momentum, mood, pressure and energy remain the context channels.

---

## Measurement baseline

Figures above were taken at `KEY_MOMENT.baseChance = 40`, `counterBonus: +15`,
`weakPenalty: -8`, after the two-sided context modifier fix, best-of-1, uniform-50 players
(which yields an all-court opponent). Reproduce with `src/test/analysis/keyMomentProbe.ts`
— `SECTIONS=sweep|grid|split|impact`, `FORMAT`, `N_MATCHES`.

Any behaviour change in this document invalidates every number in it.
