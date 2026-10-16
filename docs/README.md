# Docs

Split by what you would use the document for, not by subject.

```
docs/
├── balance-testing.md    how to verify a simulation change      <- start here
├── research/             what was measured, and what it settled
└── proposals/            designs, built or not, and the measurements behind them
```

## Active guidance

**[`balance-testing.md`](./balance-testing.md)** — the before/after loop for any change to the
simulation. Which harness answers which question, what sample size each design needs, how to measure
the shipped OVR 20-49 ladder rather than the wide default, and the current baseline tables to diff
against. Read this before touching a constant in `src/config/shotThresholds.ts`.

## Research

Findings, not instructions. The value here is knowing what has already been tried, so read before
re-deriving — several of these record hypotheses that were tested and **withdrawn**, which is
exactly the kind of thing that gets rediscovered otherwise.

- **[`research/stat-system-audit.md`](./research/stat-system-audit.md)** — whether stats scale
  across the 0-100 range at the ratings the game actually ships. Found that every harness in the
  repo had been measuring content that does not exist, that the support modifiers double-counted
  skill, and that winner rates inverted with skill. Section 5 records the "rating tax" hypothesis
  being falsified by its own test.
- **[`research/key-moment-matchups.md`](./research/key-moment-matchups.md)** — whether the
  key-moment layer delivers the skill test it is meant to. Settles that the matchup chart had
  drifted to leave one archetype 3% counterable, that two of the four context channels could only
  subtract, that criticals were anti-correlated with choosing well, and that every match-level
  figure in the repo had been measured against the one archetype with nothing to read. Section 7
  records five hypotheses tested and withdrawn, including a serve/return asymmetry that did not
  survive the correct match format.
- **[`research/stat-channels.md`](./research/stat-channels.md)** — a stat reaches a shot through
  several mechanisms; which ones carry load. Settles that `bonus` was the band channel in different
  units, that `slice` is conditional rather than broken, and that the band channel earns its
  separate existence on two stats rather than eight.
- **[`research/slice-at-tier-1.md`](./research/slice-at-tier-1.md)** — why the slice stat paid
  almost nothing at the ratings that ship. At equal rating the slice was a dominated shot, taxed by
  three below-neutral support bands no drive touches, and its usage could not grow with the stat.
  Records five levers that did not help, and the three-part change that roughly doubled its value.
- **[`research/stamina-at-tier-1.md`](./research/stamina-at-tier-1.md)** — why stamina was the
  worst buy per unit, and the change that followed. Nobody starts a match tired now. The fatigue
  penalty is squared and steeper, and recovery at set breaks leans on stamina. The result is
  that stamina barely matters early and opens an 11-point gap late in long matches. Team match 1
  against Chet Vale is the worked example. Fatigue rules now live in one module,
  `src/core/fatigue.ts`.
- **[`research/simulation-findings.md`](./research/simulation-findings.md)** — five findings
  with before/after data. Net play was capped by rally structure (serve-and-volley and
  chip-and-charge added). Double faults ended a quarter of early points. Upsets were near
  impossible past a 6-point gap. Key stats are an identity's worst buys, though the price curve
  isn't why identities differ. Four abilities were dead, rarity was inverted and levels ran away;
  the later rounds retuned the abilities to budgets by rarity, so rarity is now in order.

- **[`research/identity-drift.md`](./research/identity-drift.md)** — why identities even at Club
  end up 40 points of point-win apart on the Tour. Builds let serve and return lag, and the Tour
  plays as a serve-and-return game. Serve and return specialties grow from +1-5 to +7-18 while
  groundstroke specialties stay at 0. OVR reads strength almost backwards. Measures the levers
  (several dead ends) and proposes a fix in parts, since applied.

Note the **measurement baseline** headers. Figures are only valid for the config they were taken
under, and a behaviour change invalidates every number measured before it.

## Proposals

Designs, and plans that have been applied but are kept as a record because they hold the
measurements behind the code. Each one states its status at the top. Check the code before
trusting one: where a built plan and the code differ, the code is right.

Not shipped, or only in part:

- **[`proposals/mid-late-progression.md`](./proposals/mid-late-progression.md)** — everything
  after the Riverside Open. Agreed: each tier repeats bronze's season (team matches, then a
  tier-final), a promotion playoff means a loss is never a dead end, and the game ends at the
  top. Measured with `careerSim PAR=1`: flat pay already fits four ~40-day seasons into 0-100
  (any tier multiplier maxes key stats by mid-Tour), target opponent OVRs per tier calibrated
  on bronze, and identities drifting ~20 OVR apart by Tour. Also the season template and its
  calendar groundwork, silver and gold training, and content slots.

- **[`proposals/regional-season-worksheet.md`](./proposals/regional-season-worksheet.md)** — the
  Regional season's content to write: every event id, the day it runs, what fires it and what it
  must do, plus each opponent slot's target and how to fit stats to it with `bandCheck FIT=1`.

- **[`proposals/xp-for-abilities.md`](./proposals/xp-for-abilities.md)** — measured, not applied.
  XP piles up with little to spend it on. The option: currency buys an ability and XP buys its
  levels. It is a config value, off by default (`ABILITY_LEVEL_PRICE.xpOnlyFrom`).

Applied, kept as records:

- **[`proposals/stat-currency-progression.md`](./proposals/stat-currency-progression.md)** —
  earning currencies (Power, Quickness, Technique, Mind) and spending them on stats instead of
  receiving stats directly. Built in #101-106; the numbers have moved since, and
  `src/config/economy.ts` is the source of truth. Kept for its measurements: free allocation at a
  flat price is a solved game, escalating cost alone does not fix it, and per-stat price bands do
  (§3). The career sim (§9) sized the economy.

- **[`proposals/content-conversion-dry-run.md`](./proposals/content-conversion-dry-run.md)** —
  every story and challenge stat grant and the currency it became. Applied; kept as the record
  that `contentCurrency` in the code cites.

- **[`proposals/identity-drift-fixes.md`](./proposals/identity-drift-fixes.md)** — make every
  stat worth its OVR weight, with core stats heaviest. Applied. Five measured mechanisms cause
  drift: support stats anchored at 50, multiplicative bands, the shot selector going defensive,
  specialty amplification, and speed and anticipation's many channels. A five-step package takes
  OVR from explaining 50-76% of the predictable result to 93-95% at every level, keeps all 9 Club
  story opponents on band, and halves the Tour identity spread. Specialty parity followed, also
  applied.

`story-minigames.md` was executed and deleted; the
minigame runtime lives in [`src/minigames/`](../src/minigames/) and the story route runs through the
`minigame_active` phase.

Other executed plans are deleted rather than archived. The code and its comments are the outcome,
and a stale plan next to shipped code is worse than no plan. The applied plans above are kept only
for their measurements.
