# Story Minigames & the Unified Minigame Score

**Status:** Partially built. The training half shipped in #78; the story half has not.
**Scope:** Generalize the minigame harness so round count and scoring are inputs
rather than constants, and add a minigame phase that a story event can route
through and come back from.

---

## What already exists

The original version of this proposal was written before #78. Most of its
training-side argument has since shipped, so this section is the baseline — do not
re-plan it.

| Original proposal item | Status |
| --- | --- |
| Standardized entry screen | **Built.** `StartGate` in `MinigameShell.tsx` gates the first attempt behind a how-to line and a Start button |
| Minigames stop applying stats themselves | **Built.** They report through `onComplete` and nothing else |
| Continuous drills bucketed to discrete attempts | **Built.** Every game runs three pass/fail attempts via `useMinigameRounds` |
| Training resolver reads the count directly | **Built.** `AnchorTrainingSystem` takes the success count as the support count |
| A `MinigameId` registry | **Built**, but living in `AnchorTrainingSystem.ts` with the id→component map inline in `AnchorTraining.tsx` |
| Per-attempt difficulty ramp | **Built** (`ROUND_SPEED`), and was not in the original proposal |

What did *not* ship: any notion of a score that is not "successes out of three",
and any consumer other than training.

---

## Correcting the original story-side design

The first version specified a `MinigameStoryStep` with `onPass` / `onFail`
pointing at named outcomes. **Story events have no step machine and no outcome
registry.** A `StoryEvent` is flat: description, dialogue, and `options[]`, each
carrying one inlined `StoryEventOutcome`. There is nothing for `onPass:
'keith_impressed'` to reference, and building a step runtime to support it would
be a far larger project than this one.

The design below attaches the minigame to an **option** instead, which needs no
new runtime — only a branch at the single point where the outcome is already
chosen.

---

## 1. The harness takes its shape and its scale as inputs

`useMinigameRounds` currently hardcodes `TOTAL_ROUNDS = 3`, and `MinigameShell`'s
`RoundPips` imports that constant to decide how many pips to draw.

**Round count and score scale are independent axes.** Three pass/fail attempts is
one shape; so is a single round in which the player lands several catches or scores
one action out of a hundred. Nothing says a game's scale equals its attempt count,
so the harness takes both:

```typescript
export interface MinigameConfig {
  /** Attempts the player gets. Default 3. */
  rounds?: number;
  /** Per-attempt speed multipliers; the last entry repeats if rounds exceed it.
   *  Default [1, 1.1, 1.22]. */
  speedRamp?: number[];
  /** The score scale this run reports against. Defaults to `rounds`, which is the
   *  pass/fail case where a clean attempt is worth one point. */
  maxScore?: number;
}

useMinigameRounds(config, onComplete, onFirstAttempt);
```

An attempt reports what it was worth, rather than only whether it landed:

```typescript
commit(passed: boolean, points?: number)
```

`points` defaults to 1 on a pass and 0 on a miss, so every call site in the five
shipped games is unchanged. `passed` keeps driving the pips; `points` accumulates
into `score`. A one-round game scoring out of 100 is
`{ rounds: 1, maxScore: 100 }` with a single `commit(true, 78)`.

Consequences:

- `TOTAL_ROUNDS` stops being exported. `MinigameRounds` gains a `total` field and
  `RoundPips` reads it from the rounds object it is already handed.
- `roundSpeed()` takes the ramp from config rather than a module constant. Its
  existing clamp already gives the "last entry repeats" behavior for free.
- The clean-sweep sting fires on `score === maxScore`, not on three successes.

**The shell already tolerates the odd shapes.** `footer` is a per-game slot and
`RoundPips` is an opt-in component each game imports, so a one-round scored game
renders its own progress display without touching `MinigameShell`. Three pips for
three reps is a convention of the training games, not a rule of the harness.

One thing does need to move: `SupportResult` lives in `MinigameShell` but reads
`"+N bonus stats earned"` and `"the core rep still counts"` — training vocabulary
in the context-agnostic shell, and precisely the coupling this proposal exists to
remove. It belongs beside the training screen that means it.

---

## 2. The score contract

A minigame reports its result in its own units, plus the scale. It does not know
whether it was played for training or for a story beat.

```typescript
export interface MinigameScore {
  minigame: MinigameId;
  /** Raw score in this game's own units. */
  score: number;
  /** The scale — 3 for a three-rep drill, 100 for a single scored action. Not
   *  derivable from the round count, so the run reports it. */
  maxScore: number;
}

export interface MinigameRequest {
  minigame: MinigameId;
  config?: MinigameConfig;
}
```

`MinigameProps.onComplete` changes from `(successes: number)` to
`(score: MinigameScore)`. Training's resolver keeps reading `score.score` as its
support count, which is the identity mapping it already uses.

**Dropped from the original proposal:** `difficulty` and `seed`. Nothing needs
either yet, and `config` already carries the only knob a harder variant actually
wants. Add them when a second consumer asks.

**Registry move:** `MinigameId` and the id→component map move out of
`AnchorTrainingSystem.ts` and `AnchorTraining.tsx` into a runtime module that both
consumers import. A training system owning the identity of a story minigame is the
exact coupling this proposal exists to remove.

---

## 3. The minigame canvas phase

The story flow needs to leave the event, hand the screen to a minigame, and come
back with a result. **This is the same route story matches already take**, so it
should be built the same way rather than invented:

```
story event → continuation: match_setup → match plays → result → back
story event → continuation: minigame    → game plays  → score  → outcome
```

```typescript
/** A minigame has the screen. Its score decides where we go next. */
export interface MinigamePhase {
  type: 'minigame_active';
  request: MinigameRequest;
  continuation: PhaseContinuation;
}

// PhaseContinuation gains the return path that carries the score home:
| { type: 'story_outcome'; event: StoryEvent; optionId: string }
```

The canvas is deliberately thin. Minigames already own their own arena, controls,
and footer through `MinigameShell`, so the phase renders the game from the registry
and does nothing else. On completion it calls a `completeMinigame(score)` store
action, which reads the phase's continuation and dispatches — for a story event,
into `executeStoryEvent(eventId, optionId, score)`.

Training does **not** route through this phase. It already has a screen and mounts
the game inline; the component is context-agnostic, so where it is mounted is the
caller's business. Both paths render the same component from the same registry.

**Refresh recovery needs no work.** `gamePhase` is not in the store's `partialize`
selection — it resets to `uninitialized` on load, and `initializeGame` rebuilds the
screen from `eventRecovery`, which *is* persisted. So a `minigame_active` phase
cannot survive a refresh even deliberately, and the minigame route inherits
whatever mid-event refresh already does today. Do **not** add a `pendingMinigame`
alongside `pendingMatchSetup`: a half-played minigame cannot be meaningfully
resumed, and `selectedChoices` already brings the player back to the event with
their option still selected. They replay the game. That is the correct behavior and
it is free.

---

## 4. The story consumer

The minigame hangs off the option the player picked. `outcome` stays the pass
branch, so every existing option in the data is untouched.

```typescript
interface StoryEventOption {
  // ...existing fields
  /** Play a minigame after this choice; the score picks which outcome lands. */
  minigame?: {
    request: MinigameRequest;
    /** Pass line in the game's own units (e.g. 3 of 5). */
    passThreshold: number;
    /** `outcome` is the pass branch; this is the miss. */
    failOutcome: StoryEventOutcome;
  };
}
```

Resolution needs one branch, at `StoryEventManager.getOutcome` — already the single
choke point that `gameStore.executeStoryEvent` funnels through:

```typescript
const passed = score !== undefined && score.score >= option.minigame.passThreshold;
const outcome = passed ? option.outcome : option.minigame.failOutcome;
```

Because the resolver keeps the raw score rather than a boolean, today's pass/fail
can grow into tiered outcomes later without touching the runtime.

**What this shape costs.** Every minigame option needs two complete
`StoryEventOutcome` bodies — result text, dialogue, and effects for both the pass
and the miss. For a handful of set-pieces that is the right trade against building
a step machine. If minigame checks ever become common, that authoring tax is the
argument for revisiting the step-machine design, and it is the reason to keep them
rare rather than sprinkling them through ordinary events.

### Worked example — the aquarium event

An option that reads "Try to out-fish him", a five-cast fishing game, and a pass
line of three:

```typescript
{
  id: 'try_to_outfish',
  text: 'Try to out-fish him',
  minigame: {
    request: { minigame: 'fishing_cast', config: { rounds: 5 } },
    passThreshold: 3,
    failOutcome: { /* Keith laughs it off */ },
  },
  outcome: { /* Keith is impressed */ },
}
```

---

## Rollout

1. Introduce `MinigameScore` / `MinigameRequest`; move `MinigameId` and the
   component registry out of the training system into their own module; switch
   `onComplete` to the score. Pure refactor, no player-visible change, lands alone.
2. Add the `minigame_active` phase, the `story_outcome` continuation, and
   `completeMinigame`.
3. Add `option.minigame` and the branch in `getOutcome`; thread the score through
   `executeStoryEvent`.
4. Build the fishing game and the aquarium event, and parameterize
   `useMinigameRounds` / `RoundPips` on `MinigameConfig` *as part of it* — the
   first game that is not three pass/fail reps is what forces round count and
   score scale to become inputs. Move `SupportResult` out of the shell here too,
   since this is the first game that must not show it.

The harness parameterization is deliberately last rather than first. Done up front
it is a generalization with nothing exercising it; done alongside the first game
with a different shape, that game proves the shape is right. Only step 1 is worth
landing on its own.

---

## Still open

- **Does the pass line want to be a fraction?** `passThreshold` is authored in the
  game's own units, which is right while a game's scale is stable. If the same
  game is ever launched at two different scales, every event authored against it
  needs revisiting. Worth watching, not worth pre-solving.
- **Retry on fail.** Training has no retry and a miss simply costs a support. A
  story fail branch is heavier — decide whether a failed check is final, and
  whether an event should signal that in the option text before it is played.
- **Does the fail branch cost the time slot?** Slot consumption is decided in
  `executeStoryEvent` before the outcome is applied, so the answer is currently
  "yes, always" by construction. That is probably right, but it is a decision
  rather than an accident and should be stated.
