# Enhanced Match Preview - Implementation Plan

## Overview

Replace the current match preview (which shows averaged categorical stats) with a comprehensive side-by-side matchup view that shows both players' strengths, weaknesses, playstyles, and a detailed scouting report.

---

## Files to Modify

1. `src/components/PreMatchScreen.tsx` - Main component with new layout
2. `src/components/PracticeMatch.tsx` - Pass new player props
3. `src/components/TournamentMatch.tsx` - Pass new player props
4. `src/components/StoryMatch.tsx` - Pass new player props

---

## 1. Update `PreMatchScreenProps` Interface

**Location:** `src/components/PreMatchScreen.tsx:12-36`

**New Props to Add:**
```typescript
// Player info (currently not passed)
playerStats: PlayerStats;
playerPlayStyle: PlayStyle;
playerOverallRating: number;
playerLevel: number;

// Opponent (additional data)
opponentPlayStyle: PlayStyle;
```

---

## 2. Add Utility Functions

**Location:** `src/components/PreMatchScreen.tsx`

Add these helper functions:

### `getTopNStats(stats: PlayerStats, n: number): StatDisplay[]`
- Flattens all 20 stats into a single array with category info
- Sorts descending by value
- Returns top N stats with labels

### `getBottomNStats(stats: PlayerStats, n: number): StatDisplay[]`
- Same as above but sorts ascending
- Returns bottom N stats

### `getScoutingReport(playStyle: PlayStyle): ScoutingReport`
- Return serving/returning/rally tendencies from `ARCHETYPE_DATA`
- Generate tactical tip based on archetype matchup

### `getSurfaceEffectsDisplay(surface: CourtSurface): SurfaceEffect[]`
Returns human-readable descriptions of surface effects:

```typescript
interface SurfaceEffect {
  label: string;
  value: string;
  positive: boolean; // green vs red
}

// Example outputs:
hard:    []  // No special effects
clay:    [
  { label: "Serves", value: "-6%", positive: false },
  { label: "Defense", value: "+25%", positive: true },
  { label: "Net Play", value: "-35%", positive: false },
]
grass:   [
  { label: "Serves", value: "+5%", positive: true },
  { label: "Net Play", value: "+40%", positive: true },
  { label: "Defense", value: "-15%", positive: false },
]
carpet:  [
  { label: "Serves", value: "+4%", positive: true },
  { label: "Net Play", value: "+25%", positive: true },
  { label: "Defense", value: "-10%", positive: false },
]
```

---

## 3. New UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Match Header (existing content - surface, tournament info)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────┐     ┌─────────────────────────┐            │
│  │  YOU                   │     │  OPPONENT               │            │
│  │  Level X  |  Rating:XX │     │  Tier: Elite            │            │
│  ├─────────────────────────┤     ├─────────────────────────┤            │
│  │  STRENGTHS              │     │  STRENGTHS              │            │
│  │  • Forehand: 82 ▲       │     │  • Serve: 88 ▲          │            │
│  │  • Serve: 78 ▲         │     │  • Power: 85 ▲          │            │
│  │  • Focus: 75            │     │  • Aggression: 80       │            │
│  ├─────────────────────────┤     ├─────────────────────────┤            │
│  │  WEAKNESSES             │     │  WEAKNESSES             │            │
│  │  • Volley: 45 ▼        │     │  • Stamina: 42 ▼       │            │
│  │  • Agility: 52 ▼       │     │  • Consistency: 55 ▼    │            │
│  │  • Backhand: 58         │     │  • Recovery: 50        │            │
│  ├─────────────────────────┤     ├─────────────────────────┤            │
│  │  PLAYSTYLE              │     │  PLAYSTYLE              │            │
│  │  All-Court Player       │     │  Aggressive Baseliner   │            │
│  │  "Switches between..."  │     │  "Goes for big serves..."│          │
│  └─────────────────────────┘     └─────────────────────────┘            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐   │
│  │  Overall Rating: 72           │   │  Overall Rating: 68           │   │
│  └─────────────────────────────────┘   └─────────────────────────────────┘   │
│                                                                         │
│  SURFACE: GRASS                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  Serves: ▲    Net Play: ▲    Defense: ▼                          │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ▼ SCOUTING REPORT (click to expand)                            │    │
│  │                                                                 │    │
│  │  Serving Style:                                                  │    │
│  │  "Goes for big serves, looks to end points early"              │    │
│  │                                                                 │    │
│  │  Returning Style:                                               │    │
│  │  "Attacks the return with power, takes control immediately"    │    │
│  │                                                                 │    │
│  │  Rally Behavior:                                                │    │
│  │  "Hits hard from the baseline, always looking for winners"     │    │
│  │                                                                 │    │
│  │  ┌─────────────────────────────────────────────────────────┐   │    │
│  │  │  TACTICAL TIP                                            │   │    │
│  │  │  "Be patient in rallies - their stamina is a weakness.  │   │    │
│  │  │   Extending points could force errors."                  │   │    │
│  │  └─────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Match Details                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Energy Cost: 20 Energy (You have 85 / 100 available)          │    │
│  │  Match Format: Best of 1 Set                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  [  🎾 Start Match vs OpponentName  ]                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Breakdown

### PlayerCard Component (inline or extracted)
**Props:** `{ name, level, rating, stats, playStyle, isPlayer: boolean }`

**Sections:**
1. Header with name, level/rating badge
2. Strengths section (top 3 stats)
3. Weaknesses section (bottom 3 stats)
4. Playstyle with label + description

### Overall Rating Display

- Shown in each player card header
- Uses weighted average from `PlayerProfile.overallRating`:
  - Core stats: 45%
  - Technical stats: 15%
  - Physical stats: 25%
  - Mental stats: 15%
- Simple numeric display (e.g., "Overall: 72")

### SurfaceEffectsDisplay Component (inline)
**Props:** `{ surface: CourtSurface }`

- Uses `SURFACE_EFFECTS` from `src/config/shotThresholds.ts`
- Shows only effects that differ from baseline (hard = 1.00)
- Arrow indicators only (▲/▼), no percentages
- Green for positive effects, red for negative

### MatchDetails Component (simplified)
**Keeps:**
- Energy Cost (with current/max display)
- Match Format

**Removes:**
- Surface (now shown prominently above)
- Key Moments (unnecessary info - player will experience during match)

### ScoutingReport Component (inline with collapsible)
**Props:** `{ playStyle: PlayStyle }`

- Collapsible section using React state
- Shows serving/returning/rally tendencies from `ARCHETYPE_DATA`
- Generates tactical tip based on archetype

---

## 5. Stat Display Format

**Each stat shows:**
- Stat name (friendly label, e.g., "Forehand" not "forehand")
- Value (0-100)
- Indicator icon (▲ for strengths, ▼ for weaknesses)

**Stat Name Mapping:**
```typescript
const STAT_LABELS: Record<StatName, string> = {
  serve: 'Serve',
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  slice: 'Slice',
  volley: 'Volley',
  overhead: 'Overhead',
  dropShot: 'Drop Shot',
  spin: 'Spin',
  placement: 'Placement',
  speed: 'Speed',
  stamina: 'Stamina',
  strength: 'Strength',
  agility: 'Agility',
  recovery: 'Recovery',
  focus: 'Focus',
  anticipation: 'Anticipation',
  shotVariety: 'Shot Variety',
  offensive: 'Offensive',
  defensive: 'Defensive',
};
```

---

## 6. Update Caller Components

### PracticeMatch.tsx
Add to `PreMatchScreen` props:
```typescript
<PreMatchScreen
  playerStats={player.stats}
  playerPlayStyle={player.playStyle}
  playerOverallRating={player.overallRating}
  playerLevel={player.level}
  opponentPlayStyle={matchConfig.opponentPlayStyle}
  // ... existing props
/>
```

### TournamentMatch.tsx
Same additions as PracticeMatch.

### StoryMatch.tsx
Same additions as PracticeMatch.

---

## 7. Type Additions (if needed)

May need to extend `PreMatchConfig` in `src/types/gamePhase.ts` to include:
```typescript
interface PreMatchConfig {
  // ... existing
  opponentPlayStyle: PlayStyle;
}
```

Check if these are already present in the type definition.

---

## 8. Styling Guidelines

**Colors:**
- Player card: Blue accent (`border-blue-500`)
- Opponent card: Red accent (`border-red-500`)
- Strengths: Green text
- Weaknesses: Orange/red text
- Positive surface effects: Green
- Negative surface effects: Red

**Spacing:**
- Card padding: `p-4`
- Section spacing: `space-y-3`
- Stat items: `flex justify-between`

**Layout:**
- Two-column grid: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Collapsible: Use controlled React state

---

## 9. Surface Effects Reference

**From `src/config/shotThresholds.ts`:**

| Surface | Serves | Net Play | Defense | Returns |
|---------|--------|----------|---------|---------|
| Hard    | —      | —        | —       | —       |
| Clay    | ▼      | ▼▼       | ▲▲      | ▲       |
| Grass   | ▲      | ▲▲▲      | ▼       | ▼       |
| Carpet  | ▲      | ▲▲       | ▼       | ▼       |

**Display (arrows only, no percentages):**
- `serveQualityMultiplier` → "Serves"
- `netApproachBonus` → "Net Play"
- `defensiveAdjustmentMultiplier` → "Defense"
- `returnAdjustmentMultiplier` → "Returns"

**Note:** Rally Pace effect is internal-only (affects shot penetration), not shown to player.

---

## 11. Implementation Order

1. Add utility functions to `PreMatchScreen.tsx`
2. Update `PreMatchScreenProps` interface
3. Build `PlayerCard` section with overall rating
4. Build `SurfaceEffectsDisplay` (arrows only)
5. Build collapsible `ScoutingReport`
6. Update `PracticeMatch.tsx` with new props
7. Update `TournamentMatch.tsx` with new props
8. Update `StoryMatch.tsx` with new props
9. Test all three match types

---

## 12. Verification Checklist

- [ ] Practice match preview displays correctly
- [ ] Tournament match preview displays correctly
- [ ] Story match preview displays correctly
- [ ] Overall ratings display correctly for both players
- [ ] Surface effects show arrows (not percentages) for each surface
- [ ] Scouting report expands/collapses properly
- [ ] Energy check still works (not enough energy disables button)
- [ ] Back navigation still works
- [ ] Responsive layout on mobile (stacked cards)
