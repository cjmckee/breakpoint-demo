# Story Minigames & the Unified Minigame Score

**Status:** Proposal
**Scope:** Refactor the training minigames onto a single, context-agnostic scoring
contract so the same runtime can power both training sessions and interactive
story events.

---

## Motivation

Today the training minigames each do two jobs: they run a small skill game **and**
they know how to turn the result into stat gains. That couples the game to
training and blocks reuse.

We want to queue minigames inside story events too — e.g. an aquarium event with
Keith where you play a fishing minigame, and clearing a threshold picks the "pass"
branch. That only works if a minigame is a **self-contained, scorable unit** that
reports how you did and lets the *caller* decide what the score means.

One runtime, two consumers:

```
        ┌──────────────────────────────────┐
        │   Minigame runtime (shell)        │
        │   preview → play → MinigameScore  │
        └─────────────────┬────────────────┘
              ┌───────────┴────────────┐
   ┌──────────▼──────────┐   ┌──────────▼───────────┐
   │  Training resolver   │   │   Story resolver      │
   │  score → supports    │   │  score ≥ threshold?   │
   │  (+ anchor +1)       │   │  → pass / fail branch │
   └──────────────────────┘   └───────────────────────┘
```

---

## The contract

A minigame owns its own scoring and counting system. It reports the raw score in
**its own units**, plus the scale, and nothing else. It does not know whether it
is being played for training or for a story beat.

```typescript
/** The single unit every minigame returns. */
export interface MinigameScore {
  minigame: MinigameId;
  /** Raw score, in this game's own units. */
  score: number;
  /** The scale — e.g. 3 for a discrete three-attempt drill, 100 for accuracy. */
  maxScore: number;
}

/** How a caller launches a minigame. */
export interface MinigameRequest {
  minigame: MinigameId;
  /** 0 = default. Story events may raise difficulty for the same game. */
  difficulty?: number;
  /** Optional determinism for replays. */
  seed?: string;
}

/** The runtime is context-agnostic: it plays and scores, nothing more. */
export type RunMinigame = (req: MinigameRequest) => Promise<MinigameScore>;
```

Notes:

- **No normalization.** A discrete drill returns `{ score: 2, maxScore: 3 }`; an
  accuracy game returns `{ score: 78, maxScore: 100 }`. Consumers interpret the
  score against the scale they know the game uses.
- **`detail` is deferred.** If a future story event needs a non-score fact (biggest
  fish, fastest reaction), we add an optional `detail?: Record<string, number>`
  then — not before something needs it.

---

## Training consumer — score *is* supports

**Training minigames are always `maxScore: 3` by design.** They exist to compute
supports, and supports are discrete (0–3), so the game must be too. Each game is
three discrete attempts, each a clean/miss; the score is how many landed.

That means the score maps to supports as the identity — there is no threshold and
no mapping function:

```typescript
// A training minigame returns { score: 2, maxScore: 3 }.
const supportCount = result.score; // 0–3, used directly

// AnchorTrainingSystem then runs unchanged:
//   • anchor stat  → +1
//   • supportCount → that many supports drawn from the anchor's themed pool
```

This lands back on the original anchor model (three reps → up to three supports),
so `AnchorTrainingSystem`'s support-drawing logic needs essentially no change. The
only thing that moves is *where* the result is applied: the minigame stops
applying stats itself and simply returns a `MinigameScore`.

### Bucketing continuous drills to 0–3

Drills whose feel is continuous still report a discrete score. The interesting
mechanic lives *inside* a rep; the countable unit stays discrete.

| Drill | Internal feel | Reported score |
| --- | --- | --- |
| Toss & Strike (Serve) | track + strike the toss | 3 tosses, each hit/miss → 0–3 |
| Corner Painter (Backhand) | two-axis placement | 3 corners, each on-target/not → 0–3 |
| Rally Rhythm (Forehand) | lane + timing | 3 exchanges, each on-beat/not → 0–3 |
| Touch Carve (Slice) | carve rally that eases in | 3 carves, each in-zone/not → 0–3 |
| Catch Return (Return) | catch the falling balls | existing count → 0–3 |

Existing mechanics are preserved — Catch Return keeps its current game exactly;
it only needs to *report* a `MinigameScore` instead of applying stats.

---

## Story consumer — score vs. a per-event threshold

A story event step declares a minigame check and its branches. The pass line is
authored **per event, in that game's own units**.

```typescript
export interface MinigameStoryStep {
  type: 'minigame';
  request: MinigameRequest;
  /** Pass line, in the game's own units (e.g. 3 out of 5, or 70 out of 100). */
  passThreshold: number;
  onPass: StoryOutcomeRef;
  onFail: StoryOutcomeRef;
}

// Resolution:
//   const result = await runMinigame(step.request);
//   const branch = result.score >= step.passThreshold ? step.onPass : step.onFail;
```

Examples across scales:

| Minigame | `maxScore` | `passThreshold` | Meaning |
| --- | --- | --- | --- |
| Rally Rhythm (reused for a story practice set) | 3 | 2 | 2 of 3 clean exchanges |
| Fishing Cast (Keith aquarium event) | 5 | 3 | land 3 of 5 casts |
| An accuracy-based game | 100 | 70 | 70% accuracy |

Because the story resolver keeps the raw `score` (not a boolean), today's pass/fail
can grow into tiered outcomes later — `>= 4` great, `>= 3` ok, else fail — with no
change to the runtime.

### Worked example — the aquarium event

```typescript
const aquariumWithKeith: MinigameStoryStep = {
  type: 'minigame',
  request: { minigame: 'fishing_cast', difficulty: 1 },
  passThreshold: 3, // out of the game's maxScore of 5
  onPass: 'keith_impressed',
  onFail: 'keith_laughs_it_off',
};
```

---

## Why this shape

- **One place to build minigames.** Training drills and story set-pieces share the
  same shell, standardized entry screen, and scoring. No divergent code paths.
- **Reuse both directions.** A training game (Rally Rhythm) can appear in a story;
  a story game (fishing) is just another `MinigameId` and could later become a
  trainable drill.
- **Separation of concerns.** The minigame owns scoring; the consumer owns meaning.
  A minigame that "knows" it is training becomes unrepresentable — matching the
  project's type-safety and pure-logic principles.
- **Simplifies training.** The minigame components stop importing `StatBoosts`,
  energy, or supports. They return a number; `AnchorTrainingSystem` does the rest.

---

## Standardized entry screen

Every minigame — training or story — opens on the same preview screen: icon, the
one-line "how to play", the controls, and a Start button, followed by a short
ready beat before live play. This is a shell responsibility, not per-game, and it
fixes the current issue where a game that drops you straight in (Catch Return)
makes the first attempt an easy miss.

---

## Open decisions

- **Difficulty knob.** Start with a single scalar `difficulty`? A per-game config
  object is more expressive for story set-pieces but heavier; scalar is enough for
  the first pass.
- **Registry location.** A single `MinigameId` registry with training and
  story-only games living side by side (e.g. `minigames/` with the shell,
  `minigames/story/` for story-only games).

---

## Rollout sketch

1. Introduce `MinigameScore` / `MinigameRequest` and the shell entry screen.
2. Move stat application out of the training minigames; have them return
   `{ score, maxScore: 3 }`.
3. Point `AnchorTrainingSystem` at `result.score` for its support count.
4. Add the `MinigameStoryStep` resolver and wire the first story minigame.
