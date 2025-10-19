# Player Stats System Analysis

## Overview
Analysis of the existing player statistics system from the reference codebase to extract core mechanics for the simplified implementation.

## Player Stat Categories

### Technical Skills (10 stats)
All stats range from 0-100, default starting value: 20

1. **serve** - Serve power and accuracy
2. **forehand** - Forehand groundstroke effectiveness
3. **backhand** - Backhand groundstroke effectiveness
4. **volley** - Net play effectiveness
5. **overhead** - Overhead/smash shots
6. **drop_shot** (dropShot) - Drop shot placement and execution
7. **slice** - Slice shot effectiveness
8. **return_stat** (return) - Return of serve capability
9. **spin** - Topspin and shot variation
10. **placement** - Shot placement accuracy

### Physical Stats (5 stats)
All stats range from 0-100, default starting value: 20

1. **speed** - Court movement speed
2. **stamina** - Endurance and fatigue resistance
3. **strength** - Shot power and physical strength
4. **agility** - Quick directional changes
5. **recovery** - Recovery between points/matches

### Mental Stats (5 stats)
All stats range from 0-100, default starting value: 20

1. **focus** - Concentration under pressure
2. **anticipation** - Reading opponent shots
3. **shot_variety** (shotVariety) - Strategic shot selection
4. **offensive** - Aggressive play style effectiveness
5. **defensive** - Defensive play style effectiveness

### Experience Stats (2 stats)
Unbounded integers, default starting value: 0

1. **match_experience** (matchExperience) - Experience from playing matches
2. **tournament_experience** (tournamentExperience) - Experience from tournaments

## Ability System

### Ability Structure
```typescript
interface Ability {
  name: string;
  level: number; // 1-5
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  modifiers: {
    statBoosts: StatBoosts;
    additional: Record<string, number>;
  };
  description?: string;
  effects?: string;
}
```

### Stat Boosts
Abilities can provide stat boosts ranging from -100 to +100 for any player stat.

## Training System

### Training Categories
1. **TECHNICAL** - Improves technical skills
2. **PHYSICAL** - Improves physical attributes
3. **MENTAL** - Improves mental attributes
4. **TACTICAL** - Improves strategic play
5. **RECOVERY** - Restores energy and reduces fatigue

### Training Tiers
1. **BRONZE** - Basic training sessions
2. **SILVER** - Intermediate training
3. **GOLD** - Advanced training
4. **PLATINUM** - Elite training
5. **DIAMOND** - Master training (can unlock abilities)

### Training Mechanics
- **Energy Cost**: Each training session costs energy
- **Time Slots**: Training takes time slots from the day
- **Stat Boosts**: Direct improvements to specific stats
- **Efficiency**: Training effectiveness varies
- **Mood Impact**: Training affects player mood
- **Tier Progression**: Can be promoted/demoted between tiers

## Activity System

### Activity Types
1. **Training** - Stat improvement sessions
2. **Matches** - Competitive play for experience
3. **Rest** - Energy restoration
4. **Story** - Narrative events with choices
5. **Tournament** - Multi-match competitions
6. **Skip** - Time passage without activity

### Activity Results
Each activity produces structured results including:
- Stat changes
- Energy cost/restoration
- Time slots used
- Mood impact
- Experience gained
- Special rewards (abilities, items)

## Issues with Current Implementation

### Match Simulation Problems
1. **Stat Integration Issues**: Player stats don't properly influence match outcomes
2. **Over-complexity**: Too many layers between stats and results
3. **Inconsistent Calculation**: Shot quality calculations don't reliably use player stats
4. **Missing Direct Correlation**: Hard to see how training affects match performance

### System Complexity
1. **Too Many Layers**: Multiple abstraction layers obscure stat influence
2. **Circular Dependencies**: Complex interdependencies between engines
3. **Validation Overhead**: Extensive validation that doesn't add gameplay value
4. **Backend Dependency**: Unnecessary server complexity for single-player game

## Simplified Implementation Strategy

### Core Stats to Keep (Reduced to 12 essential stats)
**Technical (6 stats):**
1. serve
2. forehand
3. backhand
4. volley
5. return
6. placement

**Physical (3 stats):**
1. speed
2. stamina
3. strength

**Mental (3 stats):**
1. focus
2. anticipation
3. shot_variety

### Stat Ranges
- Keep 0-100 range for familiarity
- Start players at 25-35 for variety
- Training increases by 1-3 points per session
- Abilities provide 5-20 point bonuses

### Direct Match Correlation
Each stat should have clear, documented impact on specific match situations:
- **serve** → serve success rate and ace probability
- **forehand/backhand** → groundstroke winner/error rates
- **volley** → net point success
- **return** → return winner rate and break point conversion
- **placement** → shot accuracy and court positioning
- **speed** → defensive shot reach and court coverage
- **stamina** → performance decline over long matches
- **strength** → shot power and deep court positioning
- **focus** → performance under pressure (key points)
- **anticipation** → opponent shot prediction
- **shot_variety** → tactical option effectiveness

## Migration Priority
1. Extract core 12 stats with clear definitions
2. Create simple training system with direct stat impacts
3. Build match simulation with transparent stat → outcome mapping
4. Add progression system showing clear improvement correlation
5. Implement localStorage save system for player profiles