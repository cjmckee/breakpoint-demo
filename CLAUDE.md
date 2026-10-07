# Tennis RPG Development Guide for Claude

This document provides comprehensive guidelines for maintaining and extending the Tennis RPG codebase. Follow these principles to ensure consistent, high-quality code.

## Project Overview

**Breakpoint - Tennis RPG** is a stat-based tennis simulation game built with React, TypeScript, and Zustand. The game simulates tennis matches using detailed player statistics, realistic shot mechanics, and transparent probability calculations.

### Tech Stack

- **Frontend**: React 19.2.0 with TypeScript
- **State Management**: Zustand 5.0.8 with persistence
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.4.0
- **Type Safety**: TypeScript 5.0+ with strict mode enabled

---

## Core Architecture Principles

### 1. Separation of Concerns

The codebase follows a clear separation between:

- **Core Logic** (`src/core/`): Pure TypeScript classes for game simulation
  - No React dependencies
  - No side effects
  - Fully testable in isolation
  - Examples: `ShotCalculator`, `PointSimulator`, `MatchSimulator`

- **State Management** (`src/stores/`): Zustand stores for application state
  - Game state (`gameStore.ts`)
  - Match state (`matchStore.ts`)
  - Use middleware for persistence where needed

- **Components** (`src/components/`): React presentation layer
  - Consume stores via hooks
  - Focus on UI/UX
  - Minimal business logic

- **Types** (`src/types/`): Comprehensive TypeScript interfaces
  - All domain types in `types/index.ts`
  - Game-specific types in `types/game.ts`
  - Never use `any` or `unknown` without explicit justification

### 2. Type Safety First

**Always prioritize type safety:**

```typescript
// ✅ GOOD: Explicit types, no any
interface PlayerStats {
  technical: TechnicalStats;
  physical: PhysicalStats;
  mental: MentalStats;
}

// ❌ BAD: Using any
function updateStats(stats: any) { ... }

// ✅ GOOD: Type guards for runtime safety
function isPlayerProfile(obj: unknown): obj is PlayerProfile {
  return typeof obj === 'object' && obj !== null && 'stats' in obj;
}
```

**Key type safety rules:**

- Enable all strict TypeScript flags (already configured)
- Never use `any` - use `unknown` and type guards instead
- Use discriminated unions for result types
- Leverage TypeScript's utility types (`Partial`, `Pick`, `Omit`, etc.)
- Define explicit return types for all functions

### 3. Immutability

**All state updates must be immutable:**

```typescript
// ✅ GOOD: Immutable updates
const updatedPlayer = {
  ...player,
  stats: {
    ...player.stats,
    technical: {
      ...player.stats.technical,
      serve: player.stats.technical.serve + 5,
    },
  },
};

// ❌ BAD: Direct mutation
player.stats.technical.serve += 5;
```

**Zustand store patterns:**

```typescript
// ✅ GOOD: Immutable state updates in stores
set((state) => ({
  player: {
    ...state.player,
    energy: newEnergy,
  },
}));

// ❌ BAD: Mutating state directly
set((state) => {
  state.player.energy = newEnergy;
  return state;
});
```

---

## TypeScript Best Practices

### Interface vs Type

**Prefer interfaces for object shapes:**

```typescript
// ✅ GOOD: Interface for extensible objects
interface PlayerProfile {
  id: string;
  name: string;
  stats: PlayerStats;
}

// ✅ GOOD: Type for unions and complex types
type ShotOutcome = 'winner' | 'in_play' | 'error' | 'forced_error';
type StatName = keyof TechnicalStats | keyof PhysicalStats | keyof MentalStats;
```

### Utility Types

**Leverage built-in utility types:**

```typescript
// ✅ GOOD: Reuse existing types
type PartialStats = Partial<PlayerStats>;
type StatNames = keyof PlayerStats['technical'];
type ReadOnlyPlayer = Readonly<PlayerProfile>;

// ✅ GOOD: Extract types from existing interfaces
type MatchOutcome = MatchResult['winner'];
```

### Type Narrowing

**Use type guards for runtime safety:**

```typescript
// ✅ GOOD: Type guard functions
function isShotResult(value: unknown): value is ShotResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'outcome' in value &&
    'quality' in value
  );
}

// ✅ GOOD: Discriminated unions
type ActivityResult = TrainingResult | MatchResult | RestResult;

function processActivity(activity: ActivityResult) {
  switch (activity.type) {
    case 'training':
      // TypeScript knows activity is TrainingResult here
      return processTraining(activity);
    case 'match':
      return processMatch(activity);
    case 'rest':
      return processRest(activity);
  }
}
```

### Avoid Type Assertions

**Minimize `as` usage:**

```typescript
// ❌ BAD: Type assertion without validation
const player = data as PlayerProfile;

// ✅ GOOD: Validate and narrow
function parsePlayerProfile(data: unknown): PlayerProfile | null {
  if (!isPlayerProfile(data)) {
    return null;
  }
  return data;
}
```

---

## React Best Practices

### Component Structure

**Follow this component pattern:**

```typescript
// ✅ GOOD: Well-structured component
interface PlayerStatsDisplayProps {
  player: PlayerProfile;
  showDetailedStats?: boolean;
  onStatClick?: (stat: StatName) => void;
}

export function PlayerStatsDisplay({
  player,
  showDetailedStats = false,
  onStatClick,
}: PlayerStatsDisplayProps): JSX.Element {
  // Hooks first
  const [expanded, setExpanded] = useState(false);

  // Derived state
  const overallRating = calculateOverallRating(player.stats);

  // Event handlers
  const handleStatClick = useCallback((stat: StatName) => {
    onStatClick?.(stat);
  }, [onStatClick]);

  // Render
  return (
    <div className="player-stats">
      {/* Component JSX */}
    </div>
  );
}
```

**Component organization:**

1. Props interface definition
2. Component function with explicit return type
3. Hooks (state, effects, context)
4. Derived values (useMemo, calculations)
5. Event handlers (useCallback)
6. Render logic

### Hooks Best Practices

**Use hooks correctly:**

```typescript
// ✅ GOOD: Memoize expensive calculations
const shotProbabilities = useMemo(() => {
  return calculateShotProbabilities(player.stats, opponent.stats);
}, [player.stats, opponent.stats]);

// ✅ GOOD: Callback with proper dependencies
const handleMatchComplete = useCallback(
  (result: MatchResult) => {
    addMatchResult(result);
    updatePlayerStats(result.playerPerformance);
  },
  [addMatchResult, updatePlayerStats],
);

// ❌ BAD: Missing dependencies
const handleClick = useCallback(() => {
  console.log(player.name); // 'player' not in deps
}, []);

// ✅ GOOD: Cleanup effects
useEffect(() => {
  const interval = setInterval(updateTimer, 1000);
  return () => clearInterval(interval);
}, []);
```

### State Management with Zustand

**Follow Zustand patterns:**

```typescript
// ✅ GOOD: Well-typed store
interface GameStore {
  // State
  player: PlayerProfile | null;
  matches: MatchResult[];

  // Actions
  createPlayer: (name: string, playStyle: PlayStyle) => void;
  addMatchResult: (result: MatchResult) => void;
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  player: null,
  matches: [],

  createPlayer: (name, playStyle) => {
    const player = PlayerManager.createPlayer(name, playStyle);
    set({ player });
  },

  addMatchResult: (result) => {
    set((state) => ({
      matches: [...state.matches, result],
    }));
  },

  updatePlayerStats: (stats) => {
    set((state) => ({
      player: state.player
        ? {
            ...state.player,
            stats: {
              ...state.player.stats,
              ...stats,
            },
          }
        : null,
    }));
  },
}));
```

**Store usage in components:**

```typescript
// ✅ GOOD: Select only needed state
const player = useGameStore((state) => state.player);
const addMatch = useGameStore((state) => state.addMatchResult);

// ❌ BAD: Select entire store
const store = useGameStore();
```

---

## Code Organization

### File Structure

```
src/
├── core/                 # Pure business logic (no React)
│   ├── ShotCalculator.ts
│   ├── PointSimulator.ts
│   ├── MatchSimulator.ts
│   └── PlayerProfile.ts
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── PlayerStatsDisplay.tsx
│   ├── MatchSetup.tsx
│   └── LiveMatchViewer.tsx
├── stores/              # Zustand state management
│   ├── gameStore.ts
│   └── matchStore.ts
├── types/               # TypeScript definitions
│   ├── index.ts         # Core types
│   ├── game.ts          # Game-specific types
│   └── keyMoments.ts    # Key moment types
├── config/              # Configuration
│   └── shotThresholds.ts
├── utils/               # Utility functions
│   └── matchAnalysis.ts
└── game/                # Game systems (managers, orchestrators)
    ├── PlayerManager.ts
    ├── MatchOrchestrator.ts
    └── KeyMomentResolver.ts
```

### Naming Conventions

**Files:**

- Components: PascalCase (`PlayerStatsDisplay.tsx`)
- Types: PascalCase (`index.ts` for types/index.ts)
- Utilities: camelCase (`matchAnalysis.ts`)
- Stores: camelCase with suffix (`gameStore.ts`)

**Code:**

- Interfaces/Types: PascalCase (`PlayerProfile`, `ShotResult`)
- Variables/Functions: camelCase (`calculateShot`, `playerStats`)
- Constants: UPPER_SNAKE_CASE (`MAX_STAT_VALUE`, `DEFAULT_ENERGY`)
- React Components: PascalCase (`PlayerStatsDisplay`)
- Hooks: camelCase with `use` prefix (`useGameStore`, `useMatchSimulation`)

### Imports

**Organize imports consistently:**

```typescript
// ✅ GOOD: Organized imports
// 1. External dependencies
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 2. Types
import type { PlayerProfile, MatchResult, ShotResult } from '../types';

// 3. Internal modules
import { ShotCalculator } from '../core/ShotCalculator';
import { PointSimulator } from '../core/PointSimulator';

// 4. Relative imports
import { useGameStore } from './stores/gameStore';
```

---

## Functional Programming Principles

### Pure Functions

**Write pure, testable functions:**

```typescript
// ✅ GOOD: Pure function
function calculateShotQuality(
  playerStat: number,
  difficulty: number,
  modifiers: ShotModifiers,
): number {
  const base = playerStat;
  const adjusted = base + modifiers.spinBonus + modifiers.placementBonus;
  const final = adjusted * (1 - difficulty * 0.01);
  return Math.max(0, Math.min(100, final));
}

// ❌ BAD: Impure function with side effects
let globalModifier = 0;
function calculateShotQuality(stat: number): number {
  globalModifier += 1; // Side effect!
  return stat + globalModifier;
}
```

### Composition Over Inheritance

**Favor composition:**

```typescript
// ✅ GOOD: Compose functionality
class MatchSimulator {
  constructor(
    private shotCalculator: ShotCalculator,
    private pointSimulator: PointSimulator,
    private scoreTracker: ScoreTracker,
  ) {}

  simulateMatch(player: PlayerProfile, opponent: PlayerProfile): MatchResult {
    // Use composed dependencies
  }
}

// ❌ BAD: Deep inheritance hierarchies
class BaseSimulator {}
class TennisSimulator extends BaseSimulator {}
class MatchSimulator extends TennisSimulator {}
```

### Avoid Premature Abstraction

**Keep it simple until you need complexity:**

```typescript
// ✅ GOOD: Simple, direct implementation
function getPlayerEnergy(player: PlayerProfile): number {
  return player.energy;
}

// ❌ BAD: Over-engineered
interface EnergyProvider {
  getEnergy(): number;
}

class PlayerEnergyAdapter implements EnergyProvider {
  constructor(private player: PlayerProfile) {}
  getEnergy(): number {
    return this.player.energy;
  }
}
```

---

## Error Handling

### Result Types

**Use result types instead of throwing:**

```typescript
// ✅ GOOD: Result type pattern
interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

function simulatePoint(
  server: PlayerProfile,
  returner: PlayerProfile,
): OperationResult<PointResult> {
  try {
    const result = internalSimulation(server, returner);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

// Usage
const result = simulatePoint(player1, player2);
if (result.success && result.data) {
  processPointResult(result.data);
} else {
  console.error(result.error);
}
```

### Validation

**Validate inputs explicitly:**

```typescript
// ✅ GOOD: Validate and provide clear errors
function updatePlayerStat(
  player: PlayerProfile,
  stat: StatName,
  value: number,
): OperationResult<PlayerProfile> {
  if (value < 0 || value > 100) {
    return {
      success: false,
      error: `Stat value must be between 0-100, got ${value}`,
      timestamp: Date.now(),
    };
  }

  if (!isValidStatName(stat)) {
    return {
      success: false,
      error: `Invalid stat name: ${stat}`,
      timestamp: Date.now(),
    };
  }

  // Proceed with update
  const updated = { ...player };
  // ... update logic

  return {
    success: true,
    data: updated,
    timestamp: Date.now(),
  };
}
```

---

## Performance Considerations

### React Performance

**Optimize renders:**

```typescript
// ✅ GOOD: Memoize expensive components
export const MatchViewer = React.memo(({ match }: MatchViewerProps) => {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.match.matchId === nextProps.match.matchId;
});

// ✅ GOOD: Use useMemo for expensive calculations
const statistics = useMemo(() => {
  return calculateMatchStatistics(match.pointResults);
}, [match.pointResults]);

// ✅ GOOD: Virtualize long lists
import { FixedSizeList } from 'react-window';

function PointList({ points }: { points: PointResult[] }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={points.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <div style={style}>
          <PointDisplay point={points[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Avoid Unnecessary Re-renders

```typescript
// ✅ GOOD: Stable references
const handleClick = useCallback(() => {
  doSomething();
}, []);

const config = useMemo(
  () => ({
    setting1: value1,
    setting2: value2,
  }),
  [value1, value2],
);

// ❌ BAD: New reference on every render
const handleClick = () => {
  doSomething();
};
const config = { setting1: value1, setting2: value2 };
```

---

## Testing Philosophy

### Write Testable Code

**Design for testability:**

```typescript
// ✅ GOOD: Testable pure function
export function calculateWinProbability(
  playerStats: PlayerStats,
  opponentStats: PlayerStats,
  surface: CourtSurface,
): number {
  // Pure calculation
  const playerRating = calculateRating(playerStats, surface);
  const opponentRating = calculateRating(opponentStats, surface);
  return playerRating / (playerRating + opponentRating);
}

// Test:
describe('calculateWinProbability', () => {
  it('returns 0.5 for equal players', () => {
    const stats = createTestStats(70);
    const prob = calculateWinProbability(stats, stats, 'hard');
    expect(prob).toBe(0.5);
  });
});
```

### Test Data Builders

**Create test helpers:**

```typescript
// test/builders/playerBuilder.ts
export function createTestPlayer(overrides?: Partial<PlayerProfile>): PlayerProfile {
  return {
    id: 'test-player',
    name: 'Test Player',
    stats: createTestStats(),
    energy: 100,
    form: 50,
    confidence: 50,
    level: 1,
    experience: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    overallRating: 50,
    playStyle: createTestPlayStyle(),
    preferredSurface: 'hard',
    ...overrides,
  };
}
```

---

## Documentation

### Code Comments

**When to comment:**

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Use exponential decay to prevent momentum from swinging too rapidly
// This creates more realistic match flow
const decayFactor = 0.85;
momentum *= decayFactor;

// ✅ GOOD: Document complex algorithms
/**
 * Calculates shot quality using a multi-factor model:
 * 1. Base stat (e.g., forehand: 75)
 * 2. Physical modifiers (stamina, position)
 * 3. Mental modifiers (pressure, focus)
 * 4. Situational context (rally length, difficulty)
 * 5. Random variance (±15 points)
 *
 * Returns a value 0-100 representing shot execution quality
 */
function calculateShotQuality(/* ... */): number {
  // Implementation
}

// ❌ BAD: State the obvious
// Increment counter by 1
counter += 1;
```

### Interface Documentation

**Document complex types:**

```typescript
/**
 * Complete rally state for shot selection
 * Used by ShotSelector to determine available shots and probabilities
 */
export interface RallyState {
  /** Number of shots exchanged in current rally */
  rallyLength: number;

  /** Quality of previous shot (0-100), affects incoming ball difficulty */
  lastShotQuality: number;

  /** Type of shot that was just hit */
  lastShotType: ShotType;

  /** Current position of player about to hit */
  shooterPosition: CourtPosition;

  /** Current position of opponent */
  opponentPosition: CourtPosition;

  /** Characteristics of incoming ball */
  ballQuality: BallQuality;
}
```

---

## Common Patterns

### State Updates

**Player stat updates:**

```typescript
// ✅ GOOD: Deep immutable update
function updatePlayerStat(
  player: PlayerProfile,
  category: 'technical' | 'physical' | 'mental',
  stat: string,
  value: number,
): PlayerProfile {
  return {
    ...player,
    stats: {
      ...player.stats,
      [category]: {
        ...player.stats[category],
        [stat]: Math.max(0, Math.min(100, value)),
      },
    },
  };
}
```

### Calculations

**Probability-based outcomes:**

```typescript
// ✅ GOOD: Clear probability logic
function determineOutcome(quality: number, thresholds: QualityThresholds): ShotOutcome {
  const roll = Math.random() * 100;

  if (quality >= thresholds.winner && roll < quality) {
    return 'winner';
  }

  if (quality >= thresholds.inPlay) {
    return 'in_play';
  }

  if (quality >= thresholds.forcedError) {
    return 'forced_error';
  }

  return 'unforced_error';
}
```

### Zustand Actions

**Complex state updates:**

```typescript
// ✅ GOOD: Transaction-like updates
addMatchResult: (result: MatchResult) => {
  const state = get();
  if (!state.player) return;

  // Calculate changes
  const updatedPlayer = applyMatchExperience(state.player, result);
  const newHistory = [result, ...state.matchHistory].slice(0, 50);
  const updatedStats = calculateUpdatedStats(state.player, result);

  // Apply all changes atomically
  set({
    player: updatedPlayer,
    matchHistory: newHistory,
    statistics: updatedStats,
  });

  // Persist
  get().saveGame();
},
```

---

## Anti-Patterns to Avoid

### React Anti-Patterns

```typescript
// ❌ BAD: Mutating state
const [player, setPlayer] = useState(initialPlayer);
player.energy = 50; // NEVER do this

// ❌ BAD: Derived state
const [player, setPlayer] = useState(initialPlayer);
const [rating, setRating] = useState(0);
// Don't sync derived values - calculate directly

// ✅ GOOD: Calculate derived values
const rating = useMemo(() => calculateRating(player), [player]);

// ❌ BAD: Prop drilling through many levels
<Level1 player={player}>
  <Level2 player={player}>
    <Level3 player={player}>
      <Level4 player={player} />

// ✅ GOOD: Use context or Zustand
const player = useGameStore(state => state.player);
```

### TypeScript Anti-Patterns

```typescript
// ❌ BAD: Type assertions without validation
const data = JSON.parse(jsonString) as PlayerProfile;

// ✅ GOOD: Validate unknown data
function parsePlayerProfile(json: string): PlayerProfile | null {
  try {
    const data = JSON.parse(json);
    if (!isPlayerProfile(data)) return null;
    return data;
  } catch {
    return null;
  }
}

// ❌ BAD: Optional chaining everywhere
player?.stats?.technical?.serve; // If this is needed, structure is wrong

// ✅ GOOD: Validate at boundaries
if (!player || !player.stats) {
  return <ErrorState />;
}
return <PlayerDisplay stats={player.stats} />;
```

---

## Git Commit Guidelines

**Format:**

```
<type>: <description>

[optional body]
[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change without behavior change
- `perf`: Performance improvement
- `test`: Adding tests
- `docs`: Documentation only
- `style`: Formatting, whitespace
- `chore`: Build, dependencies, tooling

**Examples:**

```
feat: add key moment system for interactive match decisions

Implements interactive key moments during matches where players can
choose shot selection. Includes modal UI and decision resolution logic.

Closes #42

fix: prevent negative energy values after match

Energy calculation could go negative when player exhausted.
Added Math.max(0, ...) to clamp to valid range.

refactor: extract shot calculation to pure functions

Moved shot quality calculation out of PointSimulator into
standalone ShotCalculator class for better testability.
```

---

## When Adding New Features

### Checklist

1. **Define Types First**
   - Add interfaces to `src/types/`
   - Export from appropriate type file
   - Document complex types with JSDoc

2. **Implement Core Logic**
   - Pure functions in `src/core/`
   - No React dependencies
   - Write with testing in mind

3. **Update State Management**
   - Add actions to appropriate Zustand store
   - Ensure immutability
   - Add persistence if needed

4. **Create Components**
   - Build UI in `src/components/`
   - Use proper TypeScript types
   - Follow React best practices
   - Follow **UI and Visual Design** below: `ScreenFrame`, `Modal` footer, colour meanings

5. **Test**
   - Test core logic in isolation
   - Test components with React Testing Library
   - Validate edge cases

6. **Document**
   - Add JSDoc to complex functions
   - Update this CLAUDE.md if adding new patterns
   - Update README if user-facing

---

## Project-Specific Conventions

### Stats System

All stats use 0-100 range:

- Never allow stats outside this range
- Use `Math.max(0, Math.min(100, value))` when updating
- Consider diminishing returns for high stats

### Training Currency

Stats are bought, not granted. Activities pay currency (`power`, `quickness`,
`technique`, `mind`), and the Development screen spends it.

- **One copy of the economy**: recipes, price steps, payouts and ability prices live in
  `src/config/economy.ts`. The game and the analysis harnesses (`careerSim`,
  `abilityEconomy`) both read it — never restate a number elsewhere.
- **Pure logic**: pricing and purchases in `src/game/StatDevelopment.ts`, payouts in
  `src/game/CurrencyIncome.ts`. Payouts are whole units.
- **Wallet changes go through `applyCurrency`**, which clamps each currency at zero: a
  loss bigger than the balance ends at 0. Charge a price with `applyCurrency(wallet,
negate(price))` after checking `canAfford`.
- **Content pays currency**: a story outcome's `effects.currency` and a challenge's
  `reward.currency`, negative for a penalty. Size a grant with `contentCurrency` from the
  stat points it is meant to be worth rather than by hand. A story outcome may instead
  carry `effects.statChanges` (signed, clamped to 0-100), but keep that for rare or
  hard-to-reach moments — most outcomes should pay currency.
- **Development is one screen** with two tabs: Stats (currency) and Specialties
  (specialization points from levelling). `navigateTo('archetype')` opens the Specialties tab.
- **Display** amounts with `CurrencyAmounts` (`src/components/currency/`), so every
  currency has one icon and colour everywhere.

### Match Simulation

The simulation is deterministic with explicit randomness:

- All random decisions use `Math.random()`
- Document variance ranges in code
- Store random seed for replay (future feature)

### Quality Calculations

Shot quality follows this pattern:

1. Base stat value (0-100)
2. Apply bonuses (spin, placement, etc.)
3. Apply modifiers (physical, mental, situational)
4. Add variance (±15 for rallies, specific ranges for serves)
5. Clamp to 0-100
6. Compare to thresholds for outcome

### State Persistence

Use Zustand persistence:

- Game state auto-saves via `gameStore`
- Match state is transient (not persisted)
- Clear persistence keys on version changes

### Formatting

Prettier owns formatting (`.prettierrc`: single quotes, 100 columns). Run
`npm run format` before committing; `npm run format:check` verifies without writing.
Don't hand-align comments or values into columns — Prettier collapses them.

### UI and Visual Design

Draw the player's eye to what matters and what to do next, without making them
read. If a line of text explains where a control is or how to use it, move the
control instead. The tutorials are the exception. Desktop comes first, but about
30% of players are on phones, so check every UI change on the `mobile` e2e
project (Pixel 5) as well.

**Every screen sits in the same frame.** Full-screen phases render inside
`ScreenFrame` (`src/components/ui/ScreenFrame.tsx`). It owns the status bar, the
title row and the back control (`screen-back`, in a fixed slot), so none of these
move between screens. Use one of its two widths: `standard` (4xl) for lists and
forms, `wide` (6xl) for the menu, the inventory and the court. Don't set your own
`max-w-*`, add a second back button, or let tabs change the page width.
`screenLayout.spec.ts` checks that the status bar, title and tabs hold their place.

- A screen whose main action costs or restores energy passes `energyPreview`, so the
  status bar shows the change. Don't write the cost out as a sentence.
- Scroll resets on every `screenKey` change. A second page inside one phase needs its
  own key, or a `useScrollToTopOn` call.

**Modals** come in two sizes: `notice` for one fact to acknowledge, `scene` for
something to read or decide. They hang from a fixed top edge. The main action
(Confirm, Continue, Go!) goes in `footer`, which stays on screen however long the
body runs. Never put it at the end of a scrolling body.

**Colour has one meaning each:**

| Colour               | Means                                    | Use                                                   |
| -------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Accent (grass green) | Primary action, selection, highlight     | `pixel-accent`, `text-pixel-on-accent` for text on it |
| Red                  | Error, loss, the opponent, "against you" | `pixel-error` / `red-*`                               |
| Success green        | Gains, ahead, "for you"                  | `pixel-success` / `green-*`                           |
| Yellow               | Neutral but important (a key rally)      | `yellow-*`                                            |

- The accent is four CSS variables in `src/index.css`. Never hard-code its hex; in an
  inline style or SVG, use `rgb(var(--pixel-accent))`.
- Posture colours belong to key moment tactics only.
- Key moment headers are coloured by `keyMomentStakes`.

**The dark theme is the only theme.** No white or pastel cards. Show a selection
with an accent border and a check, not a light fill. Wrap hover styles in
`[@media(hover:hover)]:` where a stuck hover on a phone would look like a selection.

**Badges and states:**

- `UnseenBadge` is a still dot meaning "new". Something the player can claim says so
  in words ("2 ready to collect").
- Don't add red or bouncing badges, or a second badge for something already flagged.
- A disabled `ActionTile` turns grey on its own. Its caption says why ("Unlocks Day 5").

**Show comparisons and costs, don't describe them.** Use bars, chips, icons and
before→after previews over sentences: head-to-head bars rather than two stat lists,
"100→50" on the energy bar rather than "You have 80 / 100 energy available".

**Phones:** the floating ☰ hides while a modal is open. `ScreenFrame` leaves bottom
padding for it, so don't dock your own controls in the bottom-right corner.

### Test IDs

E2E specs address the UI through `data-testid`, not through visible text. Text
changes whenever the copy does, several buttons carry only an emoji, and some
labels are authored data (a story option's `text`) rather than anything a spec
can predict. A test id is a contract: renaming one should be a deliberate act.

The shared primitives take an optional `testId` prop — `Button`, `ActionTile`
and `Modal` — so most surfaces get one without touching their markup. Reach for
a raw `data-testid` attribute only on bespoke elements.

**Naming**: `surface-element`, kebab-case, with the id naming the _role_ rather
than the current label. `action-rest` stays correct when the tile reads "Sleep"
at night; `action-sleep` would not.

```tsx
<Button testId="story-confirm">Confirm Choice</Button>
<ActionTile testId="action-training" label="Training" />
```

**Collections** suffix the member's stable identity, and carry the data a driver
needs to choose without reading layout:

```tsx
<button data-testid={`km-tactic-${index}`} data-tactic-id={option.id} data-posture={option.posture}>
<div data-testid={`equipment-slot-${slot}`} data-equipped={equippedItem?.id ?? ''}>
```

Prefer a fixed domain key over an index where one exists — `equipment-slot-racquet`
survives a reordering that `equipment-slot-0` would not. Index is fine where the
set genuinely is positional, as with the tactic menu.

**Two of the same action need two ids.** `PreMatchScreen` offers Start Match at
the top and bottom of the page, so they are `start-match-header` and
`start-match-footer` — a bare `start-match` would be a strict-mode violation.

### Backwards Compatibility

Backwards compatibility is NOT required. Do not create fallbacks for types as we make changes in the code.

- No need to write comments such as "legacy code did X, now we do Y."
- Simply update the code to use the newest version of data

---

## Questions and Clarifications

When encountering ambiguity:

1. **Check existing code** - Look for similar patterns
2. **Refer to types** - Type definitions are source of truth
3. **Maintain consistency** - Match existing style
4. **Ask for clarification** - If truly unclear, ask the user
5. **Document decisions** - Add comments explaining choices

---

## Summary

**Core Principles:**

- Type safety above all
- Immutability for state
- Pure functions for logic
- Composition over inheritance
- React components consume, don't compute
- Test core logic in isolation
- Document complex algorithms
- Keep it simple until complexity is needed

**When in doubt:**

- Choose the simpler approach
- Favor readability over cleverness
- Make invalid states unrepresentable in types
- Write code that's easy to delete

This is a living document. Update it as new patterns emerge or architectural decisions are made.
