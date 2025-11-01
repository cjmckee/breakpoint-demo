# Shot Selection System Overhaul

## Current Problems

The existing shot selection system in `PointSimulator.ts:411-471` has several limitations:

1. **Rally-length-based only**: Decisions are primarily based on what shot number we're on (1, 2-4, 5-10, 11+) rather than the actual game situation
2. **No shot preference**: Players choose 50/50 between forehand and backhand regardless of their stat differential (e.g., 85 forehand vs 60 backhand)
3. **Random net approaches**: Net approaches happen based on random chance + stat thresholds, not tactical opportunities
4. **No opponent tracking**: System assumes opponent is always in "good" position, missing opportunities to exploit weaknesses
5. **Weak playstyle differentiation**: While aggression/netApproach stats are used, the behavioral differences between playstyles aren't pronounced enough

## Design Goals

Based on user requirements, the new system should:

1. **Track opponent position dynamically** and exploit it when they're out of position
2. **Favor stronger shots** - players with 85 forehand vs 60 backhand should hit ~70% forehands naturally
3. **Hybrid net approach** - stats determine how often players look for net opportunities, but situation determines when they actually approach
4. **Keep surface simple** - court surface only affects success rates (handled by ShotCalculator), not shot selection logic
5. **Playstyle-driven behavior** - clear, recognizable differences between aggressive/defensive/serve-volley/counterpuncher/all-court players

## Architecture

### New Component: ShotSelector Class

Extract shot selection into a dedicated class with clear responsibilities:

```typescript
class ShotSelector {
  // Main entry point
  selectShot(
    shooter: PlayerProfile,
    opponent: PlayerProfile,
    rallyState: RallyState,
    matchState: MatchState
  ): ShotType;

  // Helper methods
  private calculateShotPreference(shooter: PlayerProfile): ShotPreference;
  private evaluateTacticalSituation(rallyState: RallyState): TacticalOpportunity;
  private shouldApproachNet(shooter: PlayerProfile, opportunity: TacticalOpportunity): boolean;
  private shouldAttemptWinner(shooter: PlayerProfile, opportunity: TacticalOpportunity): boolean;
  private shouldUseTacticalShot(shooter: PlayerProfile, rallyState: RallyState): boolean;
  private selectGroundstroke(shooter: PlayerProfile, preference: ShotPreference): ShotType;
}
```

### Enhanced Data Structures

#### RallyState
```typescript
interface RallyState {
  rallyLength: number;
  lastShotQuality: number; // 0-100 from previous ShotResult
  lastShotType: ShotType;
  shooterPosition: CourtPosition;
  opponentPosition: OpponentPosition; // NEW
  shooterCourt: 'deuce' | 'ad' | 'center'; // NEW - where on court
  ballQuality: BallQuality; // NEW - incoming ball characteristics
}
```

#### OpponentPosition (NEW)
```typescript
type OpponentPosition =
  | 'well_positioned'     // Centered, ready, good coverage
  | 'slightly_off'        // A bit off center or slightly back
  | 'way_out_wide'        // Pushed wide to deuce or ad side
  | 'way_back_deep'       // Pushed behind baseline
  | 'at_net'              // Opponent at net (pass or lob)
  | 'recovering';         // In transition, moving to position
```

#### BallQuality (NEW)
```typescript
interface BallQuality {
  height: 'low' | 'medium' | 'high';
  speed: 'slow' | 'medium' | 'fast';
  depth: 'short' | 'mid' | 'deep';
  spin: 'flat' | 'topspin' | 'slice' | 'heavy_topspin';
  timeAvailable: 'plenty' | 'normal' | 'rushed';
}
```

#### ShotPreference (NEW)
```typescript
interface ShotPreference {
  forehandProbability: number; // 0.3-0.7 based on stat differential
  preferredSide: 'forehand' | 'backhand' | 'balanced';
  runAroundBackhand: boolean; // If FH much stronger, run around BH
  strongShotStat: number; // The better stat value
  weakShotStat: number; // The weaker stat value
}
```

#### TacticalOpportunity (NEW)
```typescript
interface TacticalOpportunity {
  attackOpportunity: 'none' | 'low' | 'medium' | 'high';
  netApproachSuitable: boolean;
  winnerAttemptSuitable: boolean;
  defensiveRequired: boolean;
  tacticalShotSuitable: boolean; // drop shot, lob, angle
  recommendedAggression: number; // 0-100
}
```

## Decision Flow

### 1. Shot Preference Calculation

When selecting any groundstroke, calculate forehand/backhand preference based on stat differential:

```typescript
calculateShotPreference(shooter: PlayerProfile): ShotPreference {
  const fh = shooter.stats.technical.forehand;
  const bh = shooter.stats.technical.backhand;
  const diff = fh - bh;

  // Linear interpolation: -50 diff = 30% FH, 0 diff = 50% FH, +50 diff = 70% FH
  // Formula: 0.5 + (diff / 200), clamped to [0.3, 0.7]
  const forehandProb = Math.max(0.3, Math.min(0.7, 0.5 + diff / 200));

  return {
    forehandProbability: forehandProb,
    preferredSide: diff > 15 ? 'forehand' : diff < -15 ? 'backhand' : 'balanced',
    runAroundBackhand: diff > 20, // 20+ point advantage
    strongShotStat: Math.max(fh, bh),
    weakShotStat: Math.min(fh, bh)
  };
}
```

**Examples:**
- FH 85, BH 60 (diff +25) → 62.5% forehands, runs around backhand
- FH 70, BH 70 (diff 0) → 50% forehands, balanced
- FH 60, BH 80 (diff -20) → 40% forehands, runs around forehand to hit backhand

### 2. Tactical Situation Evaluation

Analyze the current situation to determine what types of shots are appropriate:

```typescript
evaluateTacticalSituation(rallyState: RallyState): TacticalOpportunity {
  const { opponentPosition, lastShotQuality, ballQuality, rallyLength } = rallyState;

  // Attack opportunity scoring
  let attackScore = 0;

  if (opponentPosition === 'way_out_wide') attackScore += 40;
  if (opponentPosition === 'way_back_deep') attackScore += 35;
  if (opponentPosition === 'recovering') attackScore += 30;
  if (opponentPosition === 'slightly_off') attackScore += 15;

  if (lastShotQuality >= 80) attackScore += 30; // We hit a great shot
  if (lastShotQuality >= 60) attackScore += 15; // We hit a good shot

  if (ballQuality.height === 'high') attackScore += 20; // Sitter
  if (ballQuality.depth === 'short') attackScore += 25; // Short ball
  if (ballQuality.timeAvailable === 'plenty') attackScore += 15;

  // Defensive requirement
  const defensiveRequired =
    ballQuality.timeAvailable === 'rushed' ||
    (ballQuality.speed === 'fast' && ballQuality.height === 'low') ||
    opponentPosition === 'at_net' ||
    lastShotQuality < 30; // We hit a weak shot

  // Classify attack opportunity
  let attackLevel: 'none' | 'low' | 'medium' | 'high';
  if (attackScore >= 70) attackLevel = 'high';
  else if (attackScore >= 40) attackLevel = 'medium';
  else if (attackScore >= 20) attackLevel = 'low';
  else attackLevel = 'none';

  return {
    attackOpportunity: attackLevel,
    netApproachSuitable:
      attackScore >= 40 &&
      rallyLength >= 3 &&
      !defensiveRequired &&
      opponentPosition !== 'at_net',
    winnerAttemptSuitable: attackScore >= 30 && !defensiveRequired,
    defensiveRequired,
    tacticalShotSuitable:
      opponentPosition === 'well_positioned' &&
      rallyLength >= 5 &&
      ballQuality.timeAvailable !== 'rushed',
    recommendedAggression: Math.min(100, attackScore)
  };
}
```

### 3. Net Approach Decision (Hybrid Approach)

Combine player stats with situational factors:

```typescript
shouldApproachNet(
  shooter: PlayerProfile,
  opportunity: TacticalOpportunity,
  rallyState: RallyState
): boolean {
  const netApproachStat = shooter.playStyle.netApproach;
  const playStyleType = shooter.playStyle.type;

  // Base probability based on player type
  let baseProbability = 0;
  if (playStyleType === 'serve_volley') {
    baseProbability = 0.5; // 50% base for serve-volleyers
  } else if (netApproachStat >= 70) {
    baseProbability = 0.3; // 30% for net players
  } else if (netApproachStat >= 50) {
    baseProbability = 0.15; // 15% for occasional net players
  } else {
    baseProbability = 0.05; // 5% for baseliners
  }

  // Situational modifiers
  if (!opportunity.netApproachSuitable) return false;

  let probability = baseProbability;

  if (opportunity.attackOpportunity === 'high') probability *= 2.5;
  else if (opportunity.attackOpportunity === 'medium') probability *= 1.5;

  if (rallyState.lastShotQuality >= 80) probability *= 1.3;
  if (rallyState.opponentPosition === 'way_back_deep') probability *= 1.5;

  // Special case: serve-volleyers approach after serve
  if (playStyleType === 'serve_volley' && rallyState.rallyLength === 1) {
    probability = 0.7; // 70% chance after serve
  }

  return Math.random() < Math.min(0.9, probability);
}
```

**Key Insight**: Net players *look for* opportunities more often (higher base rate), but everyone approaches more when the situation is right.

### 4. Winner Attempt Decision

Similar hybrid approach for going for winners:

```typescript
shouldAttemptWinner(
  shooter: PlayerProfile,
  opportunity: TacticalOpportunity,
  rallyState: RallyState
): boolean {
  const aggression = shooter.playStyle.aggression;
  const playStyleType = shooter.playStyle.type;

  // Base probability by playstyle
  let baseProbability = 0;
  if (playStyleType === 'aggressive') {
    baseProbability = 0.25; // 25% for aggressive players
  } else if (playStyleType === 'all_court') {
    baseProbability = 0.15; // 15% for all-court
  } else if (playStyleType === 'serve_volley') {
    baseProbability = 0.12; // 12% for serve-volley (prefer net game)
  } else if (playStyleType === 'counterpuncher') {
    baseProbability = 0.08; // 8% for counterpunchers
  } else { // defensive
    baseProbability = 0.05; // 5% for defensive players
  }

  if (!opportunity.winnerAttemptSuitable) {
    // Aggressive players sometimes go for it anyway
    if (aggression >= 80 && Math.random() < 0.15) {
      return true;
    }
    return false;
  }

  let probability = baseProbability;

  if (opportunity.attackOpportunity === 'high') probability *= 3.0;
  else if (opportunity.attackOpportunity === 'medium') probability *= 1.8;
  else if (opportunity.attackOpportunity === 'low') probability *= 1.2;

  if (rallyState.lastShotQuality >= 85) probability *= 1.4;

  return Math.random() < Math.min(0.85, probability);
}
```

### 5. Tactical Shot Decision (Drop Shots, Lobs, Angles)

```typescript
shouldUseTacticalShot(
  shooter: PlayerProfile,
  rallyState: RallyState,
  opportunity: TacticalOpportunity
): { use: boolean; type?: 'drop_shot' | 'lob' | 'angle_shot' } {
  const shotVariety = shooter.stats.mental.shot_variety;

  // Only high-variety players use tactical shots frequently
  if (shotVariety < 50) return { use: false };

  if (!opportunity.tacticalShotSuitable) return { use: false };

  // Base probability scales with shot variety stat
  const baseProbability = (shotVariety - 50) / 200; // 0% at 50, 25% at 100

  if (Math.random() > baseProbability) return { use: false };

  // Choose tactical shot type based on situation
  const { opponentPosition, ballQuality } = rallyState;

  // Drop shot: opponent back, we have time
  if (opponentPosition === 'way_back_deep' && ballQuality.depth === 'short') {
    return { use: true, type: 'drop_shot' };
  }

  // Lob: opponent at net or pressing forward
  if (opponentPosition === 'at_net') {
    return { use: true, type: 'lob' };
  }

  // Angle shot: opponent slightly off, we can pull them wider
  if (opponentPosition === 'slightly_off' || opponentPosition === 'well_positioned') {
    return { use: true, type: 'angle_shot' };
  }

  // Default to angle shot
  return { use: true, type: 'angle_shot' };
}
```

### 6. Main Selection Logic

Putting it all together:

```typescript
selectShot(
  shooter: PlayerProfile,
  opponent: PlayerProfile,
  rallyState: RallyState,
  matchState: MatchState
): ShotType {
  const playStyle = shooter.playStyle;
  const { rallyLength, opponentPosition } = rallyState;

  // Calculate preferences and opportunities
  const shotPreference = this.calculateShotPreference(shooter);
  const opportunity = this.evaluateTacticalSituation(rallyState);

  // SPECIAL CASE: Return of serve (rallyLength === 1)
  if (rallyLength === 1) {
    if (playStyle.aggression > 80 && Math.random() < 0.3) {
      // Aggressive power return - choose forehand or backhand
      return Math.random() < shotPreference.forehandProbability
        ? 'return_forehand_power'
        : 'return_backhand_power';
    }
    // Use shot preference for regular returns
    return Math.random() < shotPreference.forehandProbability
      ? 'return_forehand'
      : 'return_backhand';
  }

  // SPECIAL CASE: Opponent at net - must pass or lob
  if (opponentPosition === 'at_net') {
    if (Math.random() < 0.3) return 'lob';
    return Math.random() < shotPreference.forehandProbability
      ? 'passing_shot_forehand'
      : 'passing_shot_backhand';
  }

  // DEFENSIVE SITUATION: Must stay in point
  if (opportunity.defensiveRequired) {
    const defenseOptions: ShotType[] = ['defensive_slice', 'lob'];
    if (playStyle.consistency > 60) {
      defenseOptions.push('slice_forehand', 'slice_backhand');
    }
    return defenseOptions[Math.floor(Math.random() * defenseOptions.length)];
  }

  // DECISION TREE: Check for special shots first

  // 1. Net approach?
  if (this.shouldApproachNet(shooter, opportunity, rallyState)) {
    return Math.random() < shotPreference.forehandProbability
      ? 'forehand_approach'
      : 'backhand_approach';
  }

  // 2. Go for power shot?
  if (this.shouldAttemptWinner(shooter, opportunity, rallyState)) {
    return Math.random() < shotPreference.forehandProbability
      ? 'forehand_power'
      : 'backhand_power';
  }

  // 3. Tactical shot?
  const tacticalDecision = this.shouldUseTacticalShot(shooter, rallyState, opportunity);
  if (tacticalDecision.use) {
    return tacticalDecision.type!;
  }

  // 4. Long rally defensive shift (11+ shots)
  if (rallyLength > 10 && playStyle.consistency > 60 && Math.random() < 0.4) {
    return Math.random() < shotPreference.forehandProbability
      ? 'slice_forehand'
      : 'slice_backhand';
  }

  // 5. DEFAULT: Regular groundstroke using shot preference
  return Math.random() < shotPreference.forehandProbability
    ? 'forehand'
    : 'backhand';
}
```

## Opponent Position Tracking

Update opponent position after each shot in the rally simulation:

```typescript
private updateOpponentPosition(
  shotResult: ShotResult,
  shotType: ShotType,
  currentOpponentPosition: OpponentPosition
): OpponentPosition {
  // If shot was an error, opponent doesn't move
  if (!shotResult.success) return currentOpponentPosition;

  const quality = shotResult.quality;

  // High quality shots push opponent out of position
  if (quality >= 85) {
    if (shotType.includes('angle')) return 'way_out_wide';
    if (shotType.includes('deep') || quality >= 90) return 'way_back_deep';
    return 'slightly_off';
  }

  // Good shots create some advantage
  if (quality >= 70) {
    return 'slightly_off';
  }

  // Weak shots let opponent recover
  if (quality < 50) {
    return 'well_positioned';
  }

  // Medium shots: opponent stays in current position or recovers slightly
  if (currentOpponentPosition === 'way_out_wide' ||
      currentOpponentPosition === 'way_back_deep') {
    return 'recovering';
  }
  if (currentOpponentPosition === 'recovering') {
    return 'slightly_off';
  }

  return 'well_positioned';
}
```

## Implementation Steps

### Phase 1: Create ShotSelector Class
1. Create `src/core/ShotSelector.ts`
2. Add new types to `src/types/index.ts`:
   - `OpponentPosition`
   - `BallQuality`
   - `ShotPreference`
   - `TacticalOpportunity`
   - `RallyState` (enhance existing)
3. Implement helper methods:
   - `calculateShotPreference()`
   - `evaluateTacticalSituation()`
   - `shouldApproachNet()`
   - `shouldAttemptWinner()`
   - `shouldUseTacticalShot()`
4. Implement main `selectShot()` method

### Phase 2: Integrate with PointSimulator
1. Add `updateOpponentPosition()` method to PointSimulator
2. Track `opponentPosition` state throughout rally loop
3. Build `RallyState` object with all context
4. Replace `selectShotType()` call with `shotSelector.selectShot()`
5. Update opponent position after each successful shot

### Phase 3: Enhance Shot Context
1. Calculate `BallQuality` from previous shot result
2. Track shooter court position (deuce/ad/center)
3. Pass richer context to ShotCalculator

### Phase 4: Testing & Validation
1. Create unit tests for ShotSelector methods
2. Run simulated matches and verify:
   - Shot preference ratios match stat differentials
   - Aggressive players attempt more winners
   - Net players approach in suitable situations
   - Opponent position tracking creates realistic patterns
   - Each playstyle feels distinct

### Phase 5: Balance & Tuning
1. Adjust probability multipliers if needed
2. Fine-tune thresholds for attack opportunities
3. Balance aggressive vs defensive playstyle behaviors
4. Ensure realistic net approach frequencies

## Expected Behavioral Changes

### Aggressive Players (offensive ≥70, defensive ≤50)
- **Before**: 25-30% winner attempts in mid-rally based on random chance
- **After**: 25-35% winner attempts, scales with opportunity quality. Goes for winners even in neutral situations.

### Defensive/Counterpuncher (defensive ≥70, offensive ≤50)
- **Before**: Same winner attempt rate, just uses slice more in long rallies
- **After**: 5-10% winner attempts, only in high-quality opportunities. Uses slice/lob proactively when under pressure.

### Serve-Volley (volley ≥70, serve ≥65)
- **Before**: Random 30% chance to volley in mid-rally if netApproach > 60
- **After**: 70% approach after serve, 40-60% approach on strong groundstrokes that push opponent back

### Shot Preference Examples
- **Before**: Player with FH 85, BH 60 hits 50% forehands
- **After**: Same player hits 62.5% forehands, actively runs around backhand

### Opponent Exploitation
- **Before**: No awareness of opponent position, all shots treated equally
- **After**: When opponent pushed wide/deep, 2-3x more likely to attempt winner or approach net

## Success Metrics

1. **Shot preference accuracy**: FH/BH ratio should match calculated preference within 5%
2. **Playstyle differentiation**: Aggressive players should attempt 3-5x more winners than defensive players
3. **Net approach realism**: Serve-volleyers should approach 60-80% after serve, baseliners 5-15% overall
4. **Opportunity exploitation**: Winner attempts should be 2-3x higher when opponent out of position vs well-positioned
5. **Rally flow**: Average rally length should remain similar (defensive players slightly longer, aggressive slightly shorter)

## Future Enhancements (Out of Scope)

- Momentum tracking (player on hot streak gets more aggressive)
- Fatigue affecting shot selection (more conservative when tired)
- Score situation (more aggressive when ahead, more conservative when behind)
- Surface-specific strategies beyond success rates
- Pattern recognition (opponent weak to body serves, etc.)
- Shot sequence patterns (set up forehand winner with backhand crosscourt)
