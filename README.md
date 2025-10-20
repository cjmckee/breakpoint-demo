# Tennis RPG - Transparent Stat-Based Simulation

A simplified tennis RPG with transparent statistical correlation between player stats and match outcomes. This project demonstrates a clean, stat-driven tennis simulation engine built from scratch.

## 🎾 Core Features

- **20-Stat Player System**: Technical, Physical, and Mental attributes that directly influence performance
- **Transparent Simulation**: Every stat point matters through sliding scale probability calculations
- **Realistic Tennis**: Point-by-point simulation following proper tennis scoring and mechanics
- **Player Archetypes**: Power players, defensive specialists, and all-around styles
- **Match Statistics**: Comprehensive tracking including serve percentages, winners, and stat correlations

## 🏗️ Architecture

### Core Components

- **PlayerProfile** (`src/core/PlayerProfile.ts`): Manages 20 player stats with play style calculation
- **ShotCalculator** (`src/core/ShotCalculator.ts`): Transparent stat-to-outcome mapping using sliding scales
- **PointSimulator** (`src/core/PointSimulator.ts`): Point-by-point tennis simulation
- **MatchSimulator** (`src/core/MatchSimulator.ts`): Complete match orchestration
- **ScoreTracker** (`src/core/ScoreTracker.ts`): Tennis scoring with key moment detection
- **MatchStatistics** (`src/core/MatchStatistics.ts`): Comprehensive match analytics

### Player Stats (20 Total)

**Technical (10):**
- Serve, Forehand, Backhand, Volley, Overhead
- Drop Shot, Slice, Return, Spin, Placement

**Physical (5):**
- Speed, Stamina, Strength, Agility, Recovery

**Mental (5):**
- Focus, Anticipation, Shot Variety, Offensive, Defensive

## 🚀 Quick Start

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Run validation tests:**
   ```bash
   npm test
   ```

3. **Open the HTML interface:**
   Open `index.html` in a web browser

## 🧪 Testing the Simulation

The project includes comprehensive validation to prove stat correlation:

```typescript
// Example: Testing serve improvement
const baselinePlayer = new PlayerProfile('player', 'Baseline', {
  technical: { serve: 50, /* other stats */ },
  // ...
});

const improvedPlayer = new PlayerProfile('improved', 'Better Server', {
  technical: { serve: 75, /* other stats */ },
  // ...
});

// Simulate matches to see win rate improvement
const results = MatchSimulator.simulateMultipleMatches(config, 100);
```

## 🎯 Key Validation Points

- ✅ Stats directly influence shot success rates
- ✅ Training improvements lead to better match performance
- ✅ Different player archetypes play realistically
- ✅ Match outcomes correlate with player stat differences
- ✅ All calculations are transparent and verifiable

## 🔧 Development

### Build System
- TypeScript compilation with strict type checking
- ES2022 target for modern JavaScript features
- Modular architecture with clean imports

### Testing
- `npm test`: Runs validation tests proving stat correlation
- `npm run dev`: Build and run basic validation
- `npm run build`: Compile TypeScript to dist/

### File Structure
```
src/
├── types/index.ts          # Complete type definitions
├── core/
│   ├── PlayerProfile.ts    # Player management & stats
│   ├── ShotCalculator.ts   # Core probability engine
│   ├── PointSimulator.ts   # Point-by-point simulation
│   ├── MatchSimulator.ts   # Match orchestration
│   ├── ScoreTracker.ts     # Tennis scoring
│   └── MatchStatistics.ts  # Analytics & tracking
└── test/
    └── basic-validation.ts  # Validation tests
```

## 🎮 How It Works

### Sliding Scale Calculations

Unlike bucket-based systems, every stat point matters:

```typescript
// Linear interpolation: stat 0 = min%, stat 100 = max%
const successRate = range.min + (statValue / 100) * (range.max - range.min);
```

A player with 39 serve performs differently than one with 21 serve, ensuring meaningful progression.

### Match Flow

1. **Point Simulation**: Serve → Return → Rally with realistic shot selection
2. **Stat Integration**: Each shot uses relevant stats (serve uses serve stat, forehand uses forehand, etc.)
3. **Context Awareness**: Difficulty, pressure, and court position affect outcomes
4. **Transparent Tracking**: All statistics correlate directly with underlying stat differences

## 📊 Example Output

```
🎾 Starting match: Power Player vs Counterpuncher
📊 Player stats: 72 vs 71
🏆 Match complete: player wins 6-4, 6-3
📈 Duration: 47 minutes, 89 points played

Key Statistics:
• Serve Success: 68.2% vs 61.4%
• Winners: 23 vs 14
• Serve Stat Correlation: 94.3%
```

## 🔄 Migration from Complex Stack

This project represents a successful migration from an over-engineered full-stack architecture (React + FastAPI + PostgreSQL + Docker) to a clean, focused simulation engine. The key insight was rebuilding the match simulation from scratch to ensure proper stat integration.

## 🎯 Future Enhancements

- Pseudo-RNG for deterministic testing
- Career progression system
- Training mechanics
- Tournament simulation
- Save/load functionality
- Enhanced UI/UX

---

**Built with transparency in mind** - every calculation is verifiable and every stat point matters.