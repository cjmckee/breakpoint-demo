# Balance testing — how to check whether a change did what you wanted

Every harness lives in `src/test/analysis/` and runs as a plain node script. There is no test
runner; each one prints a table.

```bash
npm run build:node                                   # required after ANY source edit
node dist/src/test/analysis/<harness>.js             # then run one
```

Options are environment variables, listed in each file's header and summarised below.

---

## The loop

1. **Run `matchAnatomy` and keep the output.** This is the before picture.
2. **Make the change.** One constant at a time if you can — the tables below cannot tell you which
   of two simultaneous changes caused what.
3. **`npm run build:node`.** Easy to forget; the harnesses run compiled output, so skipping this
   silently measures the old code.
4. **Run `matchAnatomy` again and diff.** Look at the sections you did *not* aim at. Most balance
   changes have a side effect somewhere else, and the point of this report is to show it.
5. **If the change touches what a stat is worth**, also run `statChannels`. It takes ~12 minutes.

That is the whole workflow. The rest of this document is about not fooling yourself.

---

## Which harness answers which question

| question | harness | runtime |
|---|---|---|
| What does a match look like right now? | `matchAnatomy` | ~1 min |
| What is each stat worth, and through which mechanism? | `statChannels` | ~12 min |
| What is a stat worth to the build that actually uses it? | `statInContext` | ~1 min |
| Does the population I am measuring contain the thing I care about? | `populationProbe` | ~5 s |
| Does a single shot type scale across the stat range? | `shotCurve`, `serveCurve` | ~10 s |
| How often does the player come to the net, by every denominator? | `netProbe`, `matchAnatomy` §D | ~30 s |
| What shots does each build actually hit? | `shotMixProbe` | ~30 s |
| Do the support bands read match context or just shot type? | `bandGateProbe` | ~30 s |
| Is the winner floor still doing its job? | `winnerFloorProbe` | instant, analytic |
| Does a save survive the stat consolidation? | `npm test` | ~5 s |

`sliceProbe` and `netCoverageProbe` are worked examples of the targeted pattern in §"Three ways to
fool yourself" below — copy one when you need to ask about a specific constant.

### The rest of what is in the folder

| harness | what it is | state |
|---|---|---|
| `tier1Probe` | the shipped ladder: serve behaviour, real matchups, point endings, progression. `PARTS=ABCDE` | current |
| `statSensitivity` | the original two designs — one-at-a-time and randomized regression | superseded by `statChannels`, whose `full` column is the same regression |
| `statExposure` | composite exposure for hand-picked builds | generalised by `populationProbe`, still useful for one build |
| `anchorProbe` | what `matchLevel` controls; the rating-tax falsification | question resolved — the tax was withdrawn |
| `breakEvenProbe` | the break-even frequency a stat needs to pay | premise withdrawn; kept as the record |
| `balanceAnalysis` | broad ratings sweep, `npm run analyze` | older, pre-consolidation framing |
| `statsCheck` | quick distribution sanity check | fine |
| `characterSim` | the shipped character against the real roster | **does not run** — `src/data/*` uses extensionless relative imports that Vite resolves and node ESM does not, so it dies on `ERR_MODULE_NOT_FOUND`. Fixing the ~32 import sites in `src/data` would unblock it, and would also let `tier1Probe` stop inlining roster stats, which can silently drift from the real data |

---

## Two conventions, and why they exist

**Every ablation prints a `control` column.** It re-measures the *unmodified* config, so the table
reports its own noise floor. Any column smaller than the control is a mechanism you could delete
without anyone noticing. Three separate mechanisms looked real before this column existed.

**Every rate names its denominator.** "Players reach the net 6% of the time" and "13% of the time"
were both true at once — of all points, and of rallies that got past the return. If you are
comparing a number in your head to a number in a table, check you are dividing by the same thing
first. This was the single most common source of wrong conclusions during the work that produced
these harnesses.

---

## Sample sizes

The defaults are set so a run means something. If you lower them, know what you are giving up.

| harness | design | default | interval |
|---|---|---|---|
| `statChannels` | regression over a randomized population | N=1500 | ±0.18 at N=8000, `U(25,90)` |
| `statInContext` | one-at-a-time, two cells | N=1000 | ~±0.5 per cell |
| `tier1Probe` part C | one-at-a-time, two cells | N_C=1000 | ~±0.5 per cell |
| `matchAnatomy` | descriptive | N=150 | rates stable to ~±1pp |

**One-at-a-time designs are much noisier than they look.** They compare two cells and read the
answer off the difference, so the noise is per-cell rather than pooled. At N=150, `statInContext`
reported `forehand` +1.91 against `backhand` +4.49 — two stats that should agree. At N=1000 the
same pair reads +1.58 and +1.66.

**Measuring the shipped ladder costs 4.7× the samples.** `statChannels` at `LO=25 HI=50` has an
interval of ±0.39 against ±0.18 over `U(25,90)`, at the same N, because narrowing the stat draw
shrinks the regressor's spread. Matching wide-range confidence on tier-1 content needs ~38,000
pairings per column.

---

## Measuring the ratings the game actually ships

The implemented ladder is OVR 20–49. The wide default describes a population the game does not yet
contain, which is fine for "what is this stat worth in general" and wrong for "what will a player
feel". For shipped content:

```bash
# stat values at tier-1 ratings and tier-1 build constraints
N=8000 LO=25 HI=50 POINTS=3 MAX_TIER=1 PARTS=A node dist/src/test/analysis/statChannels.js

# what a tier-1 match looks like
L=35 node dist/src/test/analysis/matchAnatomy.js
L=35 node dist/src/test/analysis/shotMixProbe.js
```

`MAX_TIER=1` matters: `gameStore.upgradePhase` blocks every specialty upgrade below player tier 2,
so a club player is capped at tier I on every phase. `POINTS=3` is roughly what they will have
spent.

---

## Three ways to fool yourself

**1. The population does not contain the situation.** A conditional mechanism measured against a
population that rarely triggers it always reads as noise, and that reading says nothing about
whether it works. `OPPONENT_STAT_ADJUSTMENTS.netCoverage` read as noise because its gate is open on
1.6% of rally shots — not because it is broken.

> Run `populationProbe` first. It reports each stat's share of the shot-quality budget and how
> often each conditional gate is open. **Low exposure and low value** means the population never
> asked the question. **High exposure and low value** means the stat was asked and did not matter.
> Those need opposite fixes.

**2. Conditional mechanisms need a targeted probe.** When `populationProbe` says the gate is rarely
open, build a scenario that holds it open and sweep the constant there. `netCoverageProbe` puts a
net specialist against a baseliner and varies both the attacker's `net` rating and the constant;
`sliceProbe` sweeps the two constants behind the defensive slice across three builds. Both print a
control row. Copy whichever is closer to your question.

**3. Your own change invalidates your earlier measurements.** Anything that shifts shot mix
invalidates every number taken before it, including numbers already written into a document.
Raising `NET_APPROACH_BASE` moved `net`'s tier-1 value from +0.77 to +1.35 — the largest single
move in that table, and it would have been missed by trusting the earlier run.

> When you change behaviour, re-run the tables you are about to cite, and say which config they were
> taken under.

---

## Current baseline

Uniform-45 mirror matches, `matchAnatomy` defaults, as of this document. Diff against these.

| | no specialization | net_downhill T3 | bh_samurai T3 |
|---|---|---|---|
| mean shots per point | 3.2 | 3.0 | 3.4 |
| % past the return | 51.0% | 51.7% | 51.1% |
| winners | 13.7% | 12.6% | 13.7% |
| double faults | 17.7% | 17.5% | 17.9% |
| unforced errors | 18.2% | 20.4% | 17.0% |
| CAME FORWARD / past return | 20.4% | 34.0% | 11.2% |
| slice family, share of rally shots | 4.5% | 3.0% | 16.9% |

Stat values, `statChannels` `full` column, real build population:

| stat | U(25,90) | U(25,50), tier-1 |
|---|---|---|
| anticipation | +2.85 | +2.87 |
| return | +2.75 | +3.19 |
| serve | +2.50 | +3.16 |
| speed | +2.45 | +2.99 |
| tactics | +2.22 | +2.25 |
| focus | +1.83 | +1.39 |
| placement | +1.58 | +1.60 |
| spin | +1.31 | +1.65 |
| strength | +1.24 | +1.22 |
| forehand | +1.03 | +1.43 |
| stamina | +1.02 | +0.67 |
| backhand | +0.96 | +1.15 |
| net | +0.79 | +1.35 |
| slice | +0.52 | −0.24 |

Units are point-win-% per +10 stat. Intervals are ±0.18 and ±0.40 respectively — over the tier-1
band the bottom half of that table is not separable, and the `slice` and `backhand` cells in
particular swing that far in the control column alone.

---

## Where the reasoning lives

Constants carry their own rationale and measured curves in
[`src/config/shotThresholds.ts`](../src/config/shotThresholds.ts) — read the comment before changing
a value; several record what was already tried and rejected.

[`stat-system-audit.md`](./stat-system-audit.md) and [`stat-channels.md`](./stat-channels.md) are
the findings record: what was measured, what changed as a result, and which hypotheses were tested
and withdrawn. Check them before re-deriving something.
