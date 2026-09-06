# Key Moment Option Catalogue — draft

**Status:** Draft, for review before implementation
**Companion to:** [`key-moment-overhaul.md`](./key-moment-overhaul.md)

Options drafted against the six postures, split by role. Names and framing are first-pass;
the point of the draft is the **shape** — which posture × role cells exist, how many options
each holds, and which situations can therefore offer which postures.

`[existing]` marks a tactic already written; the number in brackets is how many near-duplicate
copies exist today across stakes tiers, all of which collapse into one entry.

---

## Why the counts look like this

Grouping today's 33 options by role and posture leaves **13 distinct tactics**. The rest are
the same tactic rewritten because the stakes tier changed. Under the eligibility model an
option declares `roles` / `stakes` / `pressure` instead of belonging to a menu, so the
duplicates collapse and the real gaps become visible:

| Posture | serve (today → draft) | return (today → draft) |
|---|---|---|
| power | 1 → 4 | 1 → 4 |
| net | 1 → 3 | 1 → 3 |
| neutralize | 1 → 3 | 1 → 3 |
| deception | 0 → 3 | 1 → 3 |
| attrition | 1 → 3 | 1 → 3 |
| tempo | 1 → 3 | 1 → 3 |
| **total** | **5 → 19** | **6 → 19** |

38 options against 13 real ones today. Every posture reaches both roles, so every situation
can offer any of the six and the constrained draw always has something to pick.

---

## Serve

### power — overpower them, end it early

| Option | Risk | Notes |
|---|---|---|
| Power serve down the T | bold | `[existing ×5]` |
| Big serve out wide | bold | Drag them off the court; sets up the open forehand |
| Second-serve gamble | bold | Go big on a second serve. Higher double-fault tail |
| Flat serve into the body | balanced | Cramps the return without the T's miss rate |

### net — take the net, finish short

| Option | Risk | Notes |
|---|---|---|
| Serve and volley | bold | `[existing ×5]` |
| Serve wide, close the angle | balanced | Wide serve then cover the line; safer than a blind rush |
| Sneak in behind a kick serve | balanced | High ball buys the approach time |

### neutralize — absorb, reset, start on your terms

| Option | Risk | Notes |
|---|---|---|
| Heavy kick serve | safe | `[existing ×3]` |
| High-percentage serve to the backhand | safe | Low variance, concedes the initiative |
| Slice serve wide, reset from the baseline | safe | Gets a rally started on neutral terms |

### deception — wrong-foot them

| Option | Risk | Notes |
|---|---|---|
| Body serve to jam them | balanced | Reads as power, plays as touch |
| Disguised second serve | bold | Same toss, different spin |
| Serve wide, drop the reply | bold | Two-shot pattern; big payoff, big miss |

### attrition — extend it, make them pay later

| Option | Risk | Notes |
|---|---|---|
| Kick serve deep and grind | safe | `[existing]` (Slice serve and grind) |
| Hammer the backhand every ball | balanced | Reads the opponent's actual weaker wing |
| Accept the long rally | safe | Explicitly trades this point's odds for their legs |

### tempo — change the rhythm

| Option | Risk | Notes |
|---|---|---|
| Slice serve to disrupt their timing | balanced | `[existing]` |
| Quick-serve them before they're set | balanced | Rushes a returner who likes a routine |
| Take your time, then the big one | balanced | The gamesmanship slot; pressure/mood effects lead |

---

## Return

### power

| Option | Risk | Notes |
|---|---|---|
| Aggressive crosscourt return | bold | `[existing ×5]` |
| Step in and take it early down the line | bold | Highest ceiling, highest miss rate |
| Rip the second serve | bold | Wants a `stakes`-agnostic but second-serve-aware hook |
| Nothing-to-lose swing | bold | `[existing]` — `pressure: ['defending']` only |

### net

| Option | Risk | Notes |
|---|---|---|
| Chip and charge | balanced | `[existing ×2]` |
| Block return and follow it in | balanced | Lower-risk approach off a big serve |
| Attack the short reply | bold | Commits to coming in only if the ball sits up |

### neutralize

| Option | Risk | Notes |
|---|---|---|
| Deep neutralizing return | safe | `[existing ×4]` |
| Lob return and reset | safe | `[existing]` — the answer to a serve-volleyer |
| Block it back and start again | safe | The true percentage play |

### deception

| Option | Risk | Notes |
|---|---|---|
| Drop shot off the return | bold | `[existing ×2]` |
| Disguised slice, short and low | bold | Punishes a deep-camping returner-of-serve |
| Fake the drive, roll it deep | balanced | Cheaper deception; smaller payoff |

### attrition

| Option | Risk | Notes |
|---|---|---|
| Deep return and grind | safe | `[existing]` |
| Return to the backhand and extend | balanced | Weakness-targeting on the return side |
| Make them play five more | safe | Trades the point for their stamina |

### tempo

| Option | Risk | Notes |
|---|---|---|
| Read and react | balanced | `[existing]` |
| Stand deep, take the pace off | balanced | Slows a big server's rhythm |
| Stand in, rush their rhythm | bold | Court position as a tempo lever |

---

## What this implies for the matchup matrix

The draft fills all twelve posture × role cells, so the matrix can be authored on the
assumption that any posture is reachable in any situation. Three consequences:

1. **The matrix is exercised evenly.** Today `power` appears in all eleven menus while
   `deception` reaches two, so most matrix cells would never be consulted. With the draft,
   every cell gets used.
2. **All-court's neutrality becomes fair.** Being neutral to all six postures is only a real
   identity if the player *has* six postures to rotate through. Against today's pool the
   repeat-posture decay would bite almost immediately, because there is nothing to rotate to.
3. **Risk becomes a spine.** Today 58% of options are `bold`; the draft is closer to a third
   each, so the "at least two distinct risk levels" draw constraint can always be satisfied.

---

## Open questions

- **Gamesmanship has no posture.** "Take your time", "big fist pump" are tactics whose payoff
  is pressure and mood rather than the point. The draft parks the timing one under `tempo`
  and drops the rest. The alternative is a seventh posture — but a posture the matchup matrix
  cannot meaningfully rank against archetypes is not really a posture, so it may want a
  different mechanism entirely.
- **Weakness-targeting is a modifier, not a tactic.** "Hammer the backhand" reads the
  opponent's actual lowest stat. That could be a property any option carries rather than two
  dedicated options.
- **Second-serve awareness.** "Rip the second serve" only makes sense on a second serve, which
  the key-moment layer does not currently model — key moments resolve on one roll with no
  serve count.
- **Stat weights are not drafted here.** Each option still needs `playerStatWeights` /
  `opponentStatWeights`, and the posture's stat leanings from the overhaul doc are the
  starting point.
