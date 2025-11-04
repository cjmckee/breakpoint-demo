# Relative Quality Threshold System - Implementation Plan

## Overview

Replace the current probability-based winner system with a **relative quality threshold system** where shot outcomes are determined by comparing the generated quality against requirements derived from the opponent's previous shot quality.

## Core Philosophy

- **Incoming shot quality determines what you need to produce** to continue the rally
- High quality shots require high quality responses
- Weak shots can be answered with weaker shots (but still need minimum execution)
- Different shot types have different difficulty requirements (defensive shots easier, offensive shots riskier)
- Winners are earned by significantly exceeding requirements
- Opponent stats raise requirements (defensive players harder to beat)

## Relative Quality Mechanics

### Quality Requirement Formula

```typescript
const baseRequirement = incomingQuality × shotTypeMultiplier;
const minRequirement = MIN_QUALITY_FLOOR[shotCategory];
const adjustedRequirement = max(baseRequirement, minRequirement) + opponentAdjustments + positionAdjustments;

// Outcome thresholds
const winnerThreshold = adjustedRequirement × 2.0;
const inPlayThreshold = adjustedRequirement;
const forcedErrorThreshold = adjustedRequirement × 0.7;
// Below forcedErrorThreshold = unforced error
```

### Shot Type Multipliers

Different shots require different percentages of incoming quality:

**Offensive shots (risky, high requirement):**
- `forehand_power`, `backhand_power`: 0.70
- `passing_shot`: 0.75
- `return_power`: 0.70

**Neutral shots (moderate requirement):**
- `forehand`, `backhand`: 0.50
- `volley`: 0.60
- `approach_shot`: 0.60

**Defensive shots (forgiving, low requirement):**
- `slice`: 0.35
- `defensive_slice`: 0.25
- `lob`: 0.30

### Minimum Quality Floors

Even against terrible incoming shots, you still need minimum quality:

- Offensive shots: 20
- Neutral shots: 15
- Defensive shots: 10

This prevents requirements from becoming impossibly low.

## Rally Flow Examples

### Example 1: High Quality Rally

1. Player A hits forehand quality **85**
2. Player B needs: 85 × 0.50 = **42.5** to keep in play
3. Player B generates quality **75**
   - 75 > 42.5 → **in play**
   - Winner threshold: 42.5 × 2.0 = 85
   - 75 < 85 → not a winner
4. Player B's quality **75** becomes incoming for A
5. Player A needs: 75 × 0.50 = **37.5**
6. Rally continues with both players generating high quality

### Example 2: Weak Shot Exploitation

1. Player A hits weak forehand quality **40**
2. Player B needs: 40 × 0.50 = **20** to keep in play
3. Player B generates quality **60**
   - 60 > 20 → **in play**
   - Winner threshold: 20 × 2.0 = 40
   - 60 > 40 → **WINNER!**
4. Weak shots are easily punished

### Example 3: Defensive Survival

1. Player A bombs quality **90** power forehand
2. Player B hits defensive slice
3. Player B needs: 90 × 0.25 = **22.5** to keep in play
4. Player B generates quality **35**
   - 35 > 22.5 → **survives!**
5. Player B's slice quality **35** becomes incoming
6. Player A needs: 35 × 0.50 = **17.5** (very easy)
7. Player A has huge opportunity to attack

### Example 4: Low-Rated Player Rally

1. Beginner A hits quality **30**
2. Beginner B needs: 30 × 0.50 = **15**
3. Beginner B generates quality **25**
   - 25 > 15 → **in play**
4. Rally continues at low quality level (realistic for beginners)

## Serve Handling (No Incoming Shot)

Serves use absolute baseline thresholds:

### Serve Quality Requirements

```typescript
const SERVE_BASELINE = {
  serve_first: {
    inPlayThreshold: 55,      // Need 55+ quality to get serve in
    aceMultiplier: 0.85,      // Ace if quality > (opponent return stat × 0.85)
  },
  serve_second: {
    inPlayThreshold: 45,      // Easier to get in
    aceMultiplier: 0.90,      // Much harder to ace
  },
};
```

### Serve Outcome Logic

```typescript
// Is serve in?
const serveIn = serveQuality >= SERVE_BASELINE[serveType].inPlayThreshold;

// Is it an ace?
const aceThreshold = opponentReturnStat × SERVE_BASELINE[serveType].aceMultiplier;
const isAce = serveIn && (serveQuality >= aceThreshold);
```

### Examples

**Andy serves first serve quality 75 vs Dan (return: 85):**
- In-play check: 75 ≥ 55 → **serve is in**
- Ace threshold: 85 × 0.85 = 72.25
- 75 ≥ 72.25 → **ACE!**

**Andy serves first serve quality 70 vs Dan (return: 85):**
- In-play check: 70 ≥ 55 → **serve is in**
- Ace threshold: 85 × 0.85 = 72.25
- 70 < 72.25 → **NOT an ace**, Dan returns

**Andy serves second serve quality 75 vs Dan (return: 85):**
- In-play check: 75 ≥ 45 → **serve is in**
- Ace threshold: 85 × 0.90 = 76.5
- 75 < 76.5 → **NOT an ace**, Dan returns

**Andy serves second serve quality 40:**
- In-play check: 40 < 45 → **FAULT** (double fault if second serve)

### Serve Variance Creates Natural Percentages

First serve (high variance ±20):
- serve:80 generates range 60-100
- In-play threshold: 55
- Sometimes quality < 55 → fault
- Natural first serve percentage: ~70%

Second serve (low variance ±8):
- serve:80 generates range 72-88
- In-play threshold: 45
- Almost always > 45
- Natural second serve percentage: ~90-95%

## Return Difficulty (Based on Serve Quality)

Returns use the serve quality as incoming shot:

```typescript
// Dan returning Andy's serve (quality 80)
const returnRequirement = 80 × 0.55; // return_forehand multiplier
// = 44 required quality

// Against weak serve (quality 50)
const returnRequirement = 50 × 0.55;
// = 27.5 required quality (much easier)
```

This creates natural serve → return difficulty chain.

## Opponent Stats Integration

Defensive players raise quality requirements:

### Stat Adjustments

```typescript
// Defensive stat makes winners harder
const defensiveAdj = (opponentDefensive - 50) × 0.10;
// defensive: 95 → +4.5 to requirement
// defensive: 30 → -2.0 to requirement

// Speed helps cover court
const speedAdj = (opponentSpeed - 50) × 0.05;
// speed: 85 → +1.75

// Return stat makes aces harder (serves only)
const returnAdj = (opponentReturn - 50) × 0.15;
// return: 85 → +5.25 to ace threshold
```

### Position Adjustments

```typescript
const positionAdj = {
  well_positioned: +3,
  slightly_off: +0,
  way_out_wide: -8,      // Much easier to hit winners
  way_back_deep: -5,
  recovering: -3,
  at_net: +10,           // Very hard to pass
};
```

### Example: Dan (defensive: 95, speed: 85) vs Andy's Quality 75 Shot

```
Base requirement: 75 × 0.50 (forehand) = 37.5
+ Defensive adj: (95-50) × 0.10 = +4.5
+ Speed adj: (85-50) × 0.05 = +1.75
+ Position (well_positioned): +3
= In-play requirement: 46.75
= Winner requirement: 93.5 (46.75 × 2.0)

Andy generates quality 80:
- 80 < 93.5 → NOT a winner
- 80 > 46.75 → in play
Rally continues
```

If Dan is out of position:
```
Base requirement: 37.5
+ Defensive adj: +4.5
+ Speed adj: +1.75
+ Position (way_out_wide): -8
= In-play requirement: 35.75
= Winner requirement: 71.5

Andy generates quality 75:
- 75 > 71.5 → WINNER!
(Andy capitalized on Dan being out of position)
```

## Outcome Determination

### Four Possible Outcomes

```typescript
if (myQuality >= winnerRequirement) return 'winner';
if (myQuality >= inPlayRequirement) return 'in_play';
if (myQuality >= forcedErrorRequirement) return 'forced_error';
return 'unforced_error';
```

### Examples

**Winner:**
```
Incoming: 60, Shot: forehand (0.50)
Requirement: 30
Winner threshold: 60
Generate: 65 → WINNER
```

**In Play:**
```
Incoming: 80, Shot: forehand (0.50)
Requirement: 40
Winner threshold: 80
Generate: 55 → IN PLAY (good shot but not winner)
```

**Forced Error:**
```
Incoming: 90, Shot: defensive_slice (0.25)
Requirement: 22.5
Forced threshold: 15.75 (22.5 × 0.7)
Generate: 18 → FORCED ERROR (tried to defend but couldn't)
```

**Unforced Error:**
```
Incoming: 50, Shot: forehand (0.50)
Requirement: 25
Forced threshold: 17.5
Generate: 12 → UNFORCED ERROR (easy ball, just missed)
```

## Implementation Changes

### 1. NEW: `src/config/shotThresholds.ts`

Create centralized configuration:

```typescript
export const RELATIVE_QUALITY_REQUIREMENTS: Record<ShotType, number> = {
  // Offensive shots (high requirement, risky)
  'forehand_power': 0.70,
  'backhand_power': 0.70,
  'overhead': 0.60,
  'passing_shot_forehand': 0.75,
  'passing_shot_backhand': 0.75,

  // Neutral shots (moderate requirement)
  'forehand': 0.50,
  'backhand': 0.50,
  'volley_forehand': 0.60,
  'volley_backhand': 0.60,
  'approach_forehand': 0.60,
  'approach_backhand': 0.60,

  // Defensive shots (low requirement, forgiving)
  'slice_forehand': 0.35,
  'slice_backhand': 0.35,
  'defensive_slice_forehand': 0.25,
  'defensive_slice_backhand': 0.25,
  'lob_forehand': 0.30,
  'lob_backhand': 0.30,

  // Returns
  'return_forehand': 0.55,
  'return_backhand': 0.55,
  'return_forehand_power': 0.70,
  'return_backhand_power': 0.70,

  // ... all other shot types
};

export const MIN_QUALITY_FLOORS = {
  offensive: 20,
  neutral: 15,
  defensive: 10,
};

export const OUTCOME_MULTIPLIERS = {
  winner: 2.0,
  forcedError: 0.7,
};

export const SERVE_BASELINE = {
  serve_first: {
    inPlayThreshold: 55,
    aceMultiplier: 0.85,
  },
  serve_second: {
    inPlayThreshold: 45,
    aceMultiplier: 0.90,
  },
  kick_serve: {
    inPlayThreshold: 50,
    aceMultiplier: 0.87,
  },
};

export const OPPONENT_STAT_ADJUSTMENTS = {
  defensive: 0.10,
  speed: 0.05,
  return: 0.15, // Applies to serve ace threshold only
};

export const POSITION_ADJUSTMENTS: Record<CourtPosition, number> = {
  well_positioned: +3,
  slightly_off: +0,
  way_out_wide: -8,
  way_back_deep: -5,
  recovering: -3,
  at_net: +10,
};

export const SERVE_VARIANCE = {
  first: 20,
  second: 8,
};

export const SERVE_BONUSES = {
  first: {
    offensive: 0.20,
    strength: 0.15,
    spin: 0.10,
  },
  second: {
    consistency: 0.20,
    spin: 0.15,
    defensive: 0.10,
  },
};

// Helper to categorize shot types
export function getShotCategory(shotType: ShotType): 'offensive' | 'neutral' | 'defensive' {
  if (shotType.includes('power') || shotType.includes('overhead') || shotType.includes('passing')) {
    return 'offensive';
  }
  if (shotType.includes('slice') || shotType.includes('lob') || shotType.includes('defensive')) {
    return 'defensive';
  }
  return 'neutral';
}
```

### 2. MODIFY: `src/types/index.ts`

Add new types:

```typescript
export interface QualityThresholds {
  winner: number;
  inPlay: number;
  forcedError: number;
}

export interface ShotOutcomeContext {
  incomingQuality: number;
  incomingType: ShotType;
  opponentStats: PlayerStats;
  opponentPosition: CourtPosition;
  calculatedThresholds: QualityThresholds;
}

// Update ShotResult to include threshold context
export interface ShotResult {
  success: boolean;
  outcome: 'winner' | 'in_play' | 'forced_error' | 'unforced_error';
  quality: number;
  shotType: ShotType;
  statUsed: string;
  modifiers: ShotModifiers;
  thresholds?: QualityThresholds; // NEW: for transparency
}

// Update ShotDetail to include outcome context
export interface ShotDetail {
  // ... existing fields ...
  outcomeContext?: ShotOutcomeContext; // NEW: for match analysis
}
```

### 3. MODIFY: `src/core/ShotCalculator.ts`

**Major changes:**

#### Remove:
- `SHOT_RANGES.winnerRates` (lines 37-42)
- `calculateBaseSuccessRate()` method (lines 133-140)
- Current `determineOutcome()` probability logic (lines 351-380)

#### Add new methods:

```typescript
/**
 * Calculate quality requirements based on incoming shot
 */
private calculateQualityRequirements(
  incomingQuality: number,
  shotType: ShotType,
  opponentStats: PlayerStats,
  opponentPosition: CourtPosition
): QualityThresholds {

  // Get base multiplier for this shot type
  const baseMultiplier = RELATIVE_QUALITY_REQUIREMENTS[shotType];
  const baseRequirement = incomingQuality * baseMultiplier;

  // Apply minimum floor
  const shotCategory = getShotCategory(shotType);
  const minFloor = MIN_QUALITY_FLOORS[shotCategory];
  let inPlayReq = Math.max(baseRequirement, minFloor);

  // Opponent defensive stat adjustment
  const defensiveAdj = (opponentStats.mental.defensive - 50) * OPPONENT_STAT_ADJUSTMENTS.defensive;
  inPlayReq += defensiveAdj;

  // Opponent speed adjustment
  const speedAdj = (opponentStats.physical.speed - 50) * OPPONENT_STAT_ADJUSTMENTS.speed;
  inPlayReq += speedAdj;

  // Position adjustment
  const positionAdj = POSITION_ADJUSTMENTS[opponentPosition];
  inPlayReq += positionAdj;

  // Calculate derived thresholds
  return {
    winner: inPlayReq * OUTCOME_MULTIPLIERS.winner,
    inPlay: inPlayReq,
    forcedError: inPlayReq * OUTCOME_MULTIPLIERS.forcedError,
  };
}

/**
 * Determine outcome based on quality vs thresholds
 */
private determineOutcome(
  quality: number,
  thresholds: QualityThresholds
): 'winner' | 'in_play' | 'forced_error' | 'unforced_error' {

  if (quality >= thresholds.winner) return 'winner';
  if (quality >= thresholds.inPlay) return 'in_play';
  if (quality >= thresholds.forcedError) return 'forced_error';
  return 'unforced_error';
}

/**
 * Handle serve outcome (special case with no incoming shot)
 */
private determineServeOutcome(
  serveQuality: number,
  serveType: 'serve_first' | 'serve_second' | 'kick_serve',
  opponentReturnStat: number
): { outcome: 'winner' | 'in_play' | 'error'; thresholds: QualityThresholds } {

  const baseline = SERVE_BASELINE[serveType];

  // Check if serve is in
  const serveIn = serveQuality >= baseline.inPlayThreshold;

  if (!serveIn) {
    return {
      outcome: 'error',
      thresholds: {
        winner: opponentReturnStat * baseline.aceMultiplier,
        inPlay: baseline.inPlayThreshold,
        forcedError: 0, // Not applicable for serves
      },
    };
  }

  // Check for ace
  const aceThreshold = opponentReturnStat * baseline.aceMultiplier;
  const isAce = serveQuality >= aceThreshold;

  return {
    outcome: isAce ? 'winner' : 'in_play',
    thresholds: {
      winner: aceThreshold,
      inPlay: baseline.inPlayThreshold,
      forcedError: 0,
    },
  };
}
```

#### Modify `calculateShotSuccess()`:

```typescript
public calculateShotSuccess(
  shooterProfile: PlayerProfile,
  shotType: ShotType,
  context: ShotContext,
  opponentProfile: PlayerProfile,      // NEW: required
  opponentPosition: CourtPosition,     // NEW: required
  incomingShot?: ShotDetail            // NEW: for quality/type
): ShotResult {

  // Step 1: Get primary stat
  const primaryStat = shooterProfile.getStatForShot(shotType);

  // Step 2: Calculate modifiers (includes serve-specific logic)
  const modifiers = this.calculateModifiers(
    shooterProfile,
    shotType,
    context,
    incomingShot
  );

  // Step 3: Apply modifiers to get quality
  const quality = this.applyModifiers(primaryStat, modifiers);

  // Step 4: Determine outcome based on shot type
  let outcome: 'winner' | 'in_play' | 'forced_error' | 'unforced_error' | 'error';
  let thresholds: QualityThresholds;

  if (shotType.includes('serve')) {
    // Special handling for serves
    const serveOutcome = this.determineServeOutcome(
      quality,
      shotType as 'serve_first' | 'serve_second',
      opponentProfile.stats.technical.return
    );
    outcome = serveOutcome.outcome as any;
    thresholds = serveOutcome.thresholds;
  } else {
    // Regular shots use relative quality system
    const incomingQuality = incomingShot?.quality ?? 50; // Default if no incoming
    const incomingType = incomingShot?.shotType ?? shotType;

    thresholds = this.calculateQualityRequirements(
      incomingQuality,
      shotType,
      opponentProfile.stats,
      opponentPosition
    );

    outcome = this.determineOutcome(quality, thresholds);
  }

  return {
    success: outcome !== 'error' && outcome !== 'forced_error' && outcome !== 'unforced_error',
    outcome: outcome as any,
    quality,
    shotType,
    statUsed: this.getPrimaryStatName(shotType),
    modifiers,
    thresholds, // Include for transparency
  };
}
```

#### Modify `calculateModifiers()` for serves:

```typescript
private calculateModifiers(
  shooterProfile: PlayerProfile,
  shotType: ShotType,
  context: ShotContext,
  incomingShot?: ShotDetail
): ShotModifiers {

  const stats = shooterProfile.stats;

  // Existing modifier calculations...
  let spinBonus = this.calculateSpinBonus(shotType, stats.technical.spin);
  let placementBonus = this.calculatePlacementBonus(shotType, stats.technical.placement);
  let physicalModifier = this.calculatePhysicalModifier(shotType, context, stats.physical);
  let mentalModifier = this.calculateMentalModifier(context, stats.mental, shooterProfile.playStyle);

  // NEW: Serve-specific bonuses and variance
  let serveVariance = 0;
  if (shotType === 'serve_first') {
    const offensiveBonus = (stats.mental.offensive / 100) * SERVE_BONUSES.first.offensive;
    const strengthBonus = (stats.physical.strength / 100) * SERVE_BONUSES.first.strength;
    const spinBonus = (stats.technical.spin / 100) * SERVE_BONUSES.first.spin;

    physicalModifier *= (1 + offensiveBonus + strengthBonus);
    serveVariance = (Math.random() - 0.5) * 2 * SERVE_VARIANCE.first; // ±20
  } else if (shotType === 'serve_second') {
    const consistencyBonus = (shooterProfile.playStyle.consistency / 100) * SERVE_BONUSES.second.consistency;
    const spinBonus = (stats.technical.spin / 100) * SERVE_BONUSES.second.spin;
    const defensiveBonus = (stats.mental.defensive / 100) * SERVE_BONUSES.second.defensive;

    mentalModifier *= (1 + consistencyBonus + defensiveBonus);
    serveVariance = (Math.random() - 0.5) * 2 * SERVE_VARIANCE.second; // ±8
  }

  // ... rest of modifier calculations

  return {
    spinBonus,
    placementBonus,
    physicalModifier,
    mentalModifier,
    difficultyModifier,
    pressureModifier,
    rallyLengthModifier,
    finalAdjustment,
    serveVariance, // NEW: track serve variance
  };
}
```

### 4. MODIFY: `src/core/PointSimulator.ts`

**Update serve simulation:**

```typescript
private simulateServe(
  server: PlayerProfile,
  returner: PlayerProfile,
  matchState: MatchState,
  pointId: string,
  shotNumber: number
): ServeResult {

  const shots: ShotDetail[] = [];

  // First serve
  const firstServeContext = this.createServeContext(matchState, true);
  const firstServeResult = this.shotCalculator.calculateShotSuccess(
    server,
    'serve_first',
    firstServeContext,
    returner,                    // NEW: pass opponent
    'well_positioned',           // NEW: returner position
    undefined                    // NEW: no incoming shot for serve
  );

  // ... rest of serve logic
}
```

**Update rally simulation:**

```typescript
private simulateRally(
  server: PlayerProfile,
  returner: PlayerProfile,
  matchState: MatchState,
  pointId: string,
  startingShotNumber: number,
  firstShooter: 'server' | 'returner'
): RallyResult {

  const shots: ShotDetail[] = [];
  let currentShooter = firstShooter;
  let shotNumber = startingShotNumber;
  let previousShot: ShotDetail | null = null;

  // Get the serve shot (last shot from simulateServe)
  const serveShot = shots.length > 0 ? shots[shots.length - 1] : null;

  while (shotNumber - startingShotNumber < maxRallyLength) {
    const shooterProfile = currentShooter === 'server' ? server : returner;
    const opponentProfile = currentShooter === 'server' ? returner : server;
    const opponentPosition = currentShooter === 'server' ? returnerPosition : serverPosition;

    // Select shot type
    const shotType = this.shotSelector.selectShot(
      shooterProfile,
      opponentProfile,
      rallyState,
      matchState
    );

    // Create context
    const shotContext = this.createRallyContext(rallyLength, matchState, shooterProfile);

    // Calculate shot result with NEW parameters
    const shotResult = this.shotCalculator.calculateShotSuccess(
      shooterProfile,
      shotType,
      shotContext,
      opponentProfile,    // NEW: required
      opponentPosition,   // NEW: required
      previousShot        // NEW: for incoming quality
    );

    // ... rest of rally logic
  }
}
```

**Remove `classifyError()` method** - now handled by ShotCalculator thresholds.

### 5. UPDATE: `src/types/index.ts` - ShotModifiers

Add serve variance tracking:

```typescript
export interface ShotModifiers {
  spinBonus: number;
  placementBonus: number;
  physicalModifier: number;
  mentalModifier: number;
  difficultyModifier: number;
  pressureModifier: number;
  rallyLengthModifier: number;
  finalAdjustment: number;
  serveVariance?: number;  // NEW: track serve-specific variance
}
```

## Expected Match Behavior Changes

### Before (Probability System):
- Dan (return:85) hits return winners: ~21% of returns
- Andy (serve:80) second serve aces: ~26% of second serves
- Rally lengths: Short (6-8 shots) due to frequent winners
- Match outcome: Andy 6-1 despite lower overall rating

### After (Relative Quality System):
- Dan (return:85) hits return winners: ~2-5% (needs quality 85+ vs threshold 85)
- Andy (serve:80) second serve aces: ~1-2% (quality 75-85 vs Dan's threshold 76.5)
- Rally lengths: Longer (10-15+ shots) between two consistent players
- Match outcome: Dan wins more often (better stats, higher consistency)

### Return Winner Scenario:
**Before:** Dan returns with quality 78 → 21.4% random chance → winner

**After:**
- Andy serves quality 82
- Return requirement: 82 × 0.55 = 45.1
- Dan generates quality 78
- Winner threshold: 45.1 × 2.0 = 90.2
- 78 < 90.2 → **in play** (not a winner)
- Dan would need quality 90+ to hit return winner (rare, but possible with great execution)

### Defensive Rally Scenario:
1. Andy hits quality 85 power forehand
2. Dan defensive slice needs: 85 × 0.25 = 21.25
3. Dan generates quality 40 → 40 > 21.25 → **survives**
4. Andy receives quality 40 ball
5. Andy needs: 40 × 0.50 = 20
6. Andy generates quality 70
7. Winner threshold: 20 × 2.0 = 40
8. 70 > 40 → **WINNER** (punished weak slice)

This creates realistic defensive play: you can survive with slices, but opponent gets easy balls.

## Configuration Tuning Guidelines

All values are in `src/config/shotThresholds.ts` for easy adjustment:

### Shot Type Multipliers
- **Lower = easier to execute** (defensive shots: 0.25-0.35)
- **Higher = riskier** (offensive shots: 0.70-0.75)
- Adjust if seeing too many/few errors with certain shot types

### Winner Multiplier (currently 2.0)
- **Lower = more winners** (e.g., 1.8 means need 1.8x requirement)
- **Higher = fewer winners** (e.g., 2.2 means need 2.2x requirement)
- Adjust if matches have too many/few winners

### Opponent Stat Adjustments
- **Defensive multiplier (0.10)**: Adjust if defensive players aren't hard enough to beat
- **Speed multiplier (0.05)**: Adjust if fast players aren't covering court well enough
- **Return multiplier (0.15)**: Adjust if good returners are getting aced too often

### Serve Baselines
- **First serve in-play (55)**: Lower if seeing too many faults, raise if too many aces
- **Second serve in-play (45)**: Adjust for double fault frequency
- **Ace multipliers (0.85/0.90)**: Raise if seeing too many aces, lower if too few

### Position Adjustments
- **way_out_wide (-8)**: Adjust how much easier it is to win when opponent is out of position
- **at_net (+10)**: Adjust difficulty of passing shots

## Testing Strategy

1. **Run Andy vs Dan rematch** - verify return winners drop from 40% to ~2-5%
2. **Check second serve aces** - should be <2% against good returners
3. **Rally length distribution** - should see 8-12 shot rallies more common
4. **Low-rated players** - verify they can rally at low quality levels
5. **High-rated vs low-rated** - verify mismatch produces expected domination
6. **Defensive player effectiveness** - Dan should be harder to hit winners against

## Migration Notes

- Existing match data will not be affected (historical)
- New matches will use new system
- No database migrations needed
- All changes are in calculation logic only
