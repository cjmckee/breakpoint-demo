# Story Flow Manager Skill

Manage the dependency graph between story events, matches, tournaments, and ceremonies. Understands event prerequisites, chains, and branching so you don't have to manually wire up `completedEvents`, `excludedEvents`, `completedEventChoices`, etc.

## When to use

Use this skill when the user wants to:
- Add new events to an existing chain (insert between, append after, prepend before)
- Create a new storyline or event chain from scratch
- Reorder events within a chain
- Add branching paths (choice-based forks)
- Connect events to tournaments (pre-match, win, loss, ceremony)
- Understand what events are available after a given event
- Debug why an event isn't triggering (prerequisite analysis)
- Visualize or list the event flow for a storyline

## Core concepts

### Event chains
A linear sequence where each event requires the previous one via `completedEvents`. Example from welcomeEvents:
```
welcome_to_tennis_rpg -> making_connections -> food_hall_gossip -> player_tier_intro -> training_session_intro -> [relationship_basics, abilities_basics] -> riverside_open_prep
```

### Branching
Events can fork based on:
- **Choice branches**: `completedEventChoices` / `excludedEventChoices` - require or block based on which option was picked in a prior event
- **Condition branches**: Different `stats`, `relationships`, `minMatchesWon`, etc. prerequisites on sibling events that share the same `completedEvents` parent
- **Tournament brackets**: `tournamentBracket: 'winner' | 'loser'` for winner/loser path events

### Tournament event structure
Each tournament round has up to 4 associated story events:
- `prematchEventWinner` - before match, winner bracket
- `prematchEventLoser` - before match, loser bracket
- `winEventId` - after winning
- `lossEventId` - after losing

Plus global events: `openingCeremonyEventId`, `victoryEventId`, `eliminationEventId`

## Operations

### 1. Insert event into chain

When the user says "add event X after event Y" or "insert event between A and B":

1. Read the target storyline file to understand the current chain
2. Identify the insertion point by finding:
   - The **predecessor** event (the one the new event should come after)
   - The **successor** event(s) (events that currently require the predecessor)
3. Create the new event with `prerequisites.completedEvents: ['predecessor_id']`
4. Update all successor events: change their `completedEvents` to require the new event's ID instead of the predecessor's ID
5. Add the event to the storyline array in the correct position

**Example**: Insert `court_tour` between `making_connections` and `food_hall_gossip`:
- New event: `court_tour` with `completedEvents: ['making_connections']`
- Update `food_hall_gossip`: change `completedEvents: ['making_connections']` to `completedEvents: ['court_tour']`

### 2. Append event to end of chain

When the user says "add event after X" and X is currently the last event:

1. Create new event with `prerequisites.completedEvents: ['last_event_id']`
2. Add to the storyline array
3. No other events need updating

### 3. Create a branching fork

When the user wants two events available after one event, based on a choice:

1. The parent event must have `options` with distinct `id` values
2. Create branch A event with `completedEventChoices: { 'parent_id': 'option_a_id' }`
3. Create branch B event with `completedEventChoices: { 'parent_id': 'option_b_id' }`
4. Both should also have `completedEvents: ['parent_id']`

For condition-based branching (not choice-based):
1. Create sibling events that share the same `completedEvents` parent
2. Use `excludedEvents` on each to prevent both paths from being taken
3. Differentiate with stat/relationship/other prerequisites

### 4. Merge branches back together

When two branches should converge to a single event:

1. The merge event should list ALL possible predecessor events in `completedEvents`
   - **Important**: `completedEvents` is an AND list - ALL must be completed
   - If you want OR behavior (either branch), you need a different approach:
     - Use separate wrapper events on each branch that both lead to the merge point
     - Or restructure so the merge event checks for a common downstream event

### 5. Remove event from chain

When removing an event:

1. Find all events that have the removed event in their `completedEvents`
2. Replace the removed event's ID with its own `completedEvents` predecessors
3. Remove the event from the storyline array

### 6. Connect event to tournament

When tying a story event to a tournament round:

1. Set tournament prerequisites on the event: `activeTournament`, `tournamentRound`, `tournamentBracket`
2. Reference the event ID in the appropriate field of the `TournamentRound` config:
   - `prematchEventWinner` / `prematchEventLoser` for pre-match events
   - `winEventId` / `lossEventId` for post-match events
3. Tag the event appropriately: `tournament_match`, `tournament_ceremony`

### 7. Analyze event flow

When the user asks "what events come after X" or "show me the flow":

1. Read ALL storyline files from `src/data/storyEvents/`
2. Build a dependency graph: for each event, find what it requires and what requires it
3. Present the chain as an indented tree or arrow notation:
```
welcome_to_tennis_rpg
  -> making_connections
    -> food_hall_gossip
      -> player_tier_intro
        -> training_session_intro
          -> relationship_basics
          -> abilities_basics (parallel with above)
            -> riverside_open_prep (requires: abilities_basics + stats + matchesWon)
```
4. Note any non-event prerequisites (stats, relationships, day requirements) on relevant nodes

### 8. Debug prerequisite issues

When the user says "event X isn't showing up" or "why can't I trigger X":

1. Read the event definition and its full prerequisites
2. Check each prerequisite type:
   - `completedEvents`: Are all listed events actually reachable? Do their IDs match exactly?
   - `excludedEvents`: Could any of these be completed before reaching this point?
   - `completedEventChoices`: Does the referenced event actually have the specified option ID?
   - `stats/relationships/day/season`: Are the thresholds reasonable given the game state at that point?
   - `activeTournament/tournamentRound/tournamentBracket`: Is the event properly connected to tournament config?
3. Report findings clearly

## File locations

- **Type definitions**: `src/types/storyEvents.ts`
- **Tournament types**: `src/types/tournaments.ts`
- **Game types** (scheduling): `src/types/game.ts`
- **Event data**: `src/data/storyEvents/*.ts`
- **Event index/repository**: `src/data/storyEvents/index.ts`
- **Tournament configs**: `src/data/tournaments/*.ts`
- **PrerequisiteChecker**: `src/game/PrerequisiteChecker.ts`
- **StoryEventManager**: `src/game/StoryEventManager.ts`
- **TournamentManager**: `src/game/TournamentManager.ts`
- **ScheduledEventManager**: `src/game/ScheduledEventManager.ts`

## Important rules

1. **Always read the target file first** before making changes - understand the current chain
2. **Update ALL downstream prerequisites** when inserting or removing events from a chain
3. **Preserve existing prerequisites** - when updating `completedEvents`, keep any other prerequisite fields (stats, relationships, etc.) unchanged
4. **Use exact event IDs** - IDs are snake_case strings, must match exactly
5. **Register new storyline files** in `src/data/storyEvents/index.ts` if creating a new storyline
6. **Tag events correctly** - use appropriate `StoryEventTag` values; tournament-related events need `tournament_match` or `tournament_ceremony` tags
7. **Events with `timeSlotsRequired: 0`** are instant/informational and don't consume a time slot
8. **Tournament events are manually queued** - they're triggered by the tournament system, not by the general event eligibility check. Their prerequisites are checked but they aren't surfaced in `getAllEligibleEvents()`
9. When creating new events, follow the patterns in existing storyline files for consistency (dialogue format, outcome structure, etc.)
10. **Use the dialogue-converter skill** if the user provides plain-text dialogue for new events
