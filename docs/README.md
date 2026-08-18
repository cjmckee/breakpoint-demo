# Docs

Split by what you would use the document for, not by subject.

```
docs/
├── balance-testing.md    how to verify a simulation change      <- start here
├── research/             what was measured, and what it settled
└── proposals/            designs not yet built
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
- **[`research/stat-channels.md`](./research/stat-channels.md)** — a stat reaches a shot through
  several mechanisms; which ones carry load. Settles that `bonus` was the band channel in different
  units, that `slice` is conditional rather than broken, and that the band channel earns its
  separate existence on two stats rather than eight.

Note the **measurement baseline** headers. Figures are only valid for the config they were taken
under, and a behaviour change invalidates every number measured before it.

## Proposals

Designs that have not shipped. Check the code before trusting one — a proposal that has been built
belongs in git history, not here.

- **[`proposals/story-minigames.md`](./proposals/story-minigames.md)** — a context-agnostic scoring
  contract so one minigame runtime can serve both training and story events. Not built.

Executed plans are deleted rather than archived. The code and its comments are the outcome, and a
stale plan next to shipped code is worse than no plan.
