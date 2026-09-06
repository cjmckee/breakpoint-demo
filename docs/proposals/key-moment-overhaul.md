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
        │    family:   flavour / content grouping      │
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
| `tempo` | Change the rhythm — take it early or slow it right down | anticipation, tactics, speed |

### The matchup matrix

Replaces 33 hand-authored `strongAgainst`/`weakAgainst` lists with one 6 × 5 table that
can be read, reviewed and validated at a glance.

|              | power | net | neutralize | deception | attrition | tempo |
|--------------|-------|-----|------------|-----------|-----------|-------|
| **aggressive**     | ✗ | ✗ | ✓ | ✓ | – | – |
| **defensive**      | ✓ | ✓ | ✗ | – | ✗ | – |
| **counterpuncher** | ✗ | – | – | ✓ | ✗ | ✓ |
| **serve_volley**   | – | ✗ | ✗ | ✓ | ✓ | – |
| **all_court**      | – | – | – | – | – | – |

Every archetype gets exactly two postures that beat it and two that play into its hands, so
coverage is symmetric by construction and a new option cannot quietly break it.

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

### Repeat-posture penalty

Track postures the player has already used this match. Repeating one attracts a growing
penalty, surfaced as *"they're sitting on it."* This is what makes the same card play
differently the third time, and it is how all-court is countered — the adaptation penalty
scales up against an opponent whose whole identity is reading you.

---

## Chunks of work

Ordered by dependency. Each lands independently and is measurable on its own.

### 1. Tag the options *(foundation — everything else depends on it)*

Add `posture`, `risk` and `family` to `TacticalOption`; tag the existing 33. No behaviour
change, no new content. Ships as a pure refactor with the probe confirming identical output.

### 2. Derive the matchup from the matrix

Add `POSTURE_VS_ARCHETYPE` to config; `KeyMomentResolver` reads the matrix instead of
`strongAgainst`/`weakAgainst`, and those two fields come off `TacticalOption`. Add a probe
assertion that coverage stays symmetric. **This is the chunk that fixes all-court and the
aggressive/counterpuncher skew**, and it fixes them structurally rather than by re-authoring.

Open question: `counterBonus: +15` / `weakPenalty: -8` are currently asymmetric. With a
symmetric matrix there is no longer a reason for that; worth testing ±12 both ways.

### 3. Outcome model

Two independent changes:

- **Crit reordering.** Roll the outcome, then roll whether it was critical *within* that
  outcome. Today crit bands are carved off the ends of a 0-100 roll, which makes crit rate
  ~13-16% regardless of the odds and *anti*-correlated with choice quality: 48% of a bad
  read's wins get flagged CRITICAL SUCCESS against 30% of a good read's. Roughly a third of
  all key moments currently fire the loudest banner in the game, carrying no information.
- **Variance by risk tag.** Crit width and authored swing scale with `risk`.

### 4. Menu draw

Implement the constrained draw over the tagged pool. Depends on 1. Low risk, immediately
visible.

### 5. New tactic families

Content, unblocked by 1-4: deception, attrition, target-the-weakness, tempo, gamesmanship,
percentage play, signature shots, surface-specific plays. Each new option is now three tags
plus stat weights, not 33 relationships. Surface is worth calling out — it is on
`InteractiveMatchConfig` today and has zero effect on key moments.

### 6. Legibility

- Fold the matchup into the card's verdict chip. Today the Advantage/Even chip is computed
  from stat differential alone — the *weakest* term, worth ±2-6pp — while the counter that
  decides the point (±8-15pp) appears only on the result screen, after the player commits.
  One word per card; the breakdown (read / stats / conditions) in the detail pane that
  already exists. No percentages.
- Risk-shape bar per card, from the `risk` tag.
- Separate choice-grade from point-result on the reveal.

### 7. Re-baseline

`baseChance` is currently 40, tuned against all-court — the worst-case archetype — so it
is very likely too high once the matrix lands. Re-measure across the real archetype spread,
and fix the probe fixture, which produces an all-court opponent by accident because
`createUniformPlayer` has no archetype profile.

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
