# New Match Simulation Architecture Design

## Overview
Clean, simplified match simulation architecture that fixes the stat integration issues in the current implementation. Focus on direct correlation between player stats and match outcomes.

## Core Principles

### 1. Direct Stat-to-Outcome Mapping
Every player stat must have a clear, documented impact on specific match situations:
- **No hidden calculations** - Every formula is transparent
- **No abstraction layers** - Stats directly influence outcomes
- **Predictable results** - Same stats produce consistent results
- **Easy debugging** - Clear path from stat to result

### 2. Transparent Shot Calculation
Each shot success should be:
- Calculable by hand for verification
- Based on specific player stats
- Influenced by clear situational factors
- Producing realistic tennis outcomes

### 3. Minimal Complexity
- Single file per major component
- No circular dependencies
- Clear data flow
- Simple state management

## Architecture Components

### Core Engine Structure

```
MatchSimulator (main orchestrator)
├── PlayerProfile (stat management)
├── ShotCalculator (individual shot logic)
├── PointSimulator (point-by-point logic)
├── ScoreTracker (tennis scoring rules)
└── MatchStatistics (essential metrics only)
```

### Data Flow
```
Player Stats → Shot Probability → Shot Outcome → Point Result → Game Score → Set Score → Match Result
```

## Player Stats System (20 Total)

### Technical Skills (10 stats)
1. **serve** - Serve power and accuracy
2. **forehand** - Forehand groundstroke effectiveness
3. **backhand** - Backhand groundstroke effectiveness
4. **volley** - Net play effectiveness
5. **overhead** - Overhead/smash shots
6. **drop_shot** - Drop shot placement and execution
7. **slice** - Slice shot effectiveness (defensive shots)
8. **return** - Return of serve capability
9. **spin** - Topspin application affecting ball physics and bounce
10. **placement** - Shot placement accuracy and court targeting

### Physical Stats (5 stats)
1. **speed** - Court movement speed and foot speed
2. **stamina** - Overall endurance and energy reserves
3. **strength** - Shot power and physical strength
4. **agility** - Quick directional changes and balance
5. **recovery** - Recovery between points, after tough rallies and key moments

### Mental Stats (5 stats)
1. **focus** - Concentration under pressure and key moments
2. **anticipation** - Reading opponent shots and positioning
3. **shot_variety** - Tactical shot selection and strategic options
4. **offensive** - Aggressive play style effectiveness
5. **defensive** - Defensive play style effectiveness

## Detailed Component Design

### 1. PlayerProfile Class

```typescript
interface PlayerProfile {
  // All 20 stats (0-100 range)
  technical: {
    serve: number;
    forehand: number;
    backhand: number;
    volley: number;
    overhead: number;
    drop_shot: number;
    slice: number;
    return: number;
    spin: number;
    placement: number;
  };
  physical: {
    speed: number;
    stamina: number;
    strength: number;
    agility: number;
    recovery: number;
  };
  mental: {
    focus: number;
    anticipation: number;
    shot_variety: number;
    offensive: number;
    defensive: number;
  };

  // Computed properties
  getOverallRating(): number;
  getStatForShot(shotType: ShotType): number;
  getCurrentForm(): number; // Based on energy/fatigue
  getPlayStyle(): PlayStyle; // Based on offensive/defensive balance
}
```

### 2. ShotCalculator Class

```typescript
interface ShotCalculator {
  calculateShotSuccess(
    shooterProfile: PlayerProfile,
    shotType: ShotType,
    situationContext: ShotContext
  ): ShotResult;
}

interface ShotContext {
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  pressure: 'low' | 'medium' | 'high';
  courtPosition: 'baseline' | 'net' | 'defensive';
  rallyLength: number;
  opponentPosition: 'poor' | 'good' | 'excellent';
}

interface ShotResult {
  success: boolean;
  outcome: 'winner' | 'in_play' | 'error';
  quality: number; // 0-100
  shotType: ShotType;
}
```

**Complete Stat-to-Shot Mapping:**

**Primary Stat Influences:**
- **serve** → serve_first, serve_second
- **forehand** → forehand, forehand_winner, forehand_approach
- **backhand** → backhand, backhand_winner, backhand_approach
- **volley** → volley_forehand, volley_backhand, half_volley
- **overhead** → overhead, defensive_overhead
- **drop_shot** → drop_shot, short_angle
- **slice** → slice_forehand, slice_backhand, defensive_slice
- **return** → return_forehand, return_backhand, return_winner
- **spin** → topspin_shots (affects all groundstrokes), kick_serve
- **placement** → angle_shots, down_the_line, cross_court

**Secondary Stat Influences:**
- **speed** → defensive retrieval, wide shot coverage, net approach speed
- **stamina** → performance decline over long matches/rallies
- **strength** → shot depth, passing shot power, serve speed
- **agility** → quick direction changes, defensive positioning
- **recovery** → performance after tough points, stamina restoration
- **focus** → performance under pressure (break points, set points)
- **anticipation** → early positioning, reading opponent shots
- **shot_variety** → tactical shot selection, unpredictability
- **offensive** → winner attempt rate, net approach frequency
- **defensive** → error reduction, consistent shot making

### 3. Shot Success Formula

```typescript
function calculateShotSuccess(profile: PlayerProfile, shotType: ShotType, context: ShotContext): ShotResult {
  // 1. Get primary stat for shot type
  const primaryStat = profile.getStatForShot(shotType);

  // 2. Apply secondary stat influences
  const spinBonus = getShotSpinBonus(shotType, profile.technical.spin);
  const placementBonus = getShotPlacementBonus(shotType, profile.technical.placement);
  const physicalModifier = getPhysicalModifier(context, profile.physical);
  const mentalModifier = getMentalModifier(context, profile.mental);

  // 3. Calculate base success rate
  const adjustedStat = Math.min(100, Math.max(0,
    primaryStat + spinBonus + placementBonus
  ));

  // 4. Apply situational modifiers
  const difficultyModifier = getDifficultyModifier(context.difficulty);
  const pressureModifier = getPressureModifier(context.pressure, profile.mental.focus);
  const rallyLengthModifier = getRallyLengthModifier(context.rallyLength, profile.physical.stamina);

  // 5. Final probability calculation
  const finalStat = adjustedStat * difficultyModifier * pressureModifier * rallyLengthModifier * physicalModifier * mentalModifier;
  const successProbability = Math.min(0.98, Math.max(0.02, finalStat / 100));

  // 6. Determine outcome with realistic distributions
  const roll = Math.random();
  const playStyle = profile.getPlayStyle();

  if (roll < getWinnerProbability(finalStat, shotType, playStyle)) {
    return { success: true, outcome: 'winner', quality: finalStat, shotType };
  } else if (roll < successProbability) {
    return { success: true, outcome: 'in_play', quality: finalStat, shotType };
  } else {
    return { success: false, outcome: 'error', quality: finalStat, shotType };
  }
}
```

### 4. PointSimulator Class

```typescript
interface PointSimulator {
  simulatePoint(
    server: PlayerProfile,
    returner: PlayerProfile,
    matchState: MatchState
  ): PointResult;
}

interface PointResult {
  winner: 'server' | 'returner';
  shots: ShotDetail[];
  rallyLength: number;
  keyShot?: ShotDetail; // The decisive shot
  pointType: 'ace' | 'winner' | 'forced_error' | 'unforced_error' | 'double_fault';
  statistics: PointStatistics;
}

interface ShotDetail {
  shotType: ShotType;
  shooter: 'server' | 'returner';
  success: boolean;
  quality: number;
  outcome: 'winner' | 'in_play' | 'error';
  statUsed: string; // Primary stat that influenced this shot
  timestamp: number;
}
```

### 5. Realistic Probability Tables

**Base Success Rates by Stat Level:**

| Stat Range | Easy Shot | Normal Shot | Hard Shot | Extreme Shot |
|------------|-----------|-------------|-----------|--------------|
| 0-20       | 45%       | 30%         | 15%       | 5%           |
| 21-40      | 65%       | 50%         | 30%       | 15%          |
| 41-60      | 80%       | 70%         | 50%       | 25%          |
| 61-80      | 90%       | 85%         | 70%       | 40%          |
| 81-100     | 95%       | 90%         | 85%       | 60%          |

**Spin Bonus by Shot Type:**

| Spin Level | Groundstrokes | Serves | Defensive Shots |
|------------|---------------|--------|-----------------|
| 0-20       | +0%           | +0%    | +0%             |
| 21-40      | +5%           | +3%    | +5%             |
| 41-60      | +10%          | +7%    | +10%            |
| 61-80      | +15%          | +12%   | +15%            |
| 81-100     | +20%          | +15%   | +20%            |

**Pressure Modifiers (Focus-based):**

| Focus Range | Low Pressure | Medium Pressure | High Pressure |
|-------------|--------------|-----------------|---------------|
| 0-20        | -0%          | -25%            | -50%          |
| 21-40       | -0%          | -20%            | -40%          |
| 41-60       | -0%          | -15%            | -30%          |
| 61-80       | -0%          | -10%            | -15%          |
| 81-100      | +5%          | +0%             | +10%          |

**Winner Probability by Stat Level:**

| Stat Range | Offensive Player | Balanced Player | Defensive Player |
|------------|------------------|------------------|------------------|
| 0-20       | 8%               | 5%               | 3%               |
| 21-40      | 15%              | 10%              | 7%               |
| 41-60      | 25%              | 18%              | 12%              |
| 61-80      | 35%              | 28%              | 20%              |
| 81-100     | 45%              | 35%              | 25%              |

## Implementation Benefits

### Clear Stat Impact
Every stat has documented, verifiable impact:
- **Training serve** → better service games → more holds → better match results
- **Training focus** → better pressure point performance → more clutch wins
- **Training speed** → better defensive coverage → fewer winners conceded

### Transparent Calculations
Players can understand exactly why they won/lost:
- "Lost because opponent's 85 forehand overcame my 60 speed on defense"
- "Won with 90 serve stat producing 12 aces against opponent's 40 return"
- "Focus training paid off - went 4/5 on break points with 75 focus stat"

### Realistic Tennis
- Rally lengths depend on offensive/defensive balance
- Shot selection reflects player strengths/weaknesses
- Pressure situations properly test mental stats
- Physical stats matter more in longer matches

This architecture preserves all 20 tennis stats while ensuring each one has clear, direct impact on match outcomes through transparent calculations.