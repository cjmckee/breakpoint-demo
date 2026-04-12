# Tennis RPG

A stat-based tennis career simulation game built with React, TypeScript, and Zustand. Create a player, train your skills, compete in tournaments, and experience story-driven events as you rise through the ranks.

## Getting Started

```bash
npm install
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
```

Requires Node.js 18+.

## Tech Stack

- React 19 + TypeScript (strict mode)
- Zustand for state management (with persistence)
- Vite for build tooling
- Tailwind CSS for styling

## Project Structure

```
src/
├── core/           # Pure simulation engine (no React dependencies)
├── game/           # Game system managers and orchestrators
├── stores/         # Zustand state management
├── components/     # React UI components
├── types/          # TypeScript type definitions
├── config/         # Tuning constants and thresholds
├── data/           # Static game data (characters, items, story events, tournaments)
└── hooks/          # Custom React hooks
```

## Core Systems

### Match Simulation (`src/core/`)

The simulation engine is built from pure TypeScript classes with no React dependencies:

- **ShotCalculator** — Maps player stats to shot outcomes using sliding-scale probability calculations. Every stat point matters through linear interpolation rather than discrete buckets.
- **ShotSelector** — Chooses shot types based on court position, rally state, and player tendencies.
- **PointSimulator** — Simulates individual points: serve, return, and rally exchanges with momentum and pressure tracking.
- **MatchSimulator** — Orchestrates full matches with proper tennis scoring (games, sets, tiebreaks).
- **ScoreTracker** — Manages tennis scoring state and detects key moments (break points, set points, match points).
- **MatchStatistics** — Collects match analytics: aces, winners, unforced errors, serve percentages, rally lengths.
- **TacticalAnalyzer** — Evaluates tactical positions and shot selection quality.

### Player Stats

Players have 20 stats across three categories, all on a 0-100 scale:

| Technical (10) | Physical (5) | Mental (5) |
|---|---|---|
| Serve, Forehand, Backhand, Volley, Overhead | Speed, Stamina, Strength, Agility, Recovery | Focus, Anticipation, Shot Variety, Offensive, Defensive |
| Drop Shot, Slice, Return, Spin, Placement | | |

### Game Systems (`src/game/`)

- **PlayerManager** — Player creation with three playstyle archetypes (Offensive, Defensive, Balanced), each granting different starting stat bonuses.
- **MatchOrchestrator** — Wraps the simulation engine with interactive key moments, where players make tactical decisions that affect point outcomes.
- **MatchRewardSystem** — Calculates post-match rewards: stat gains, experience, items, and ability unlocks based on performance.
- **TrainingSystem** — Generates training sessions across 8 types (Groundstroke, Serve & Volley, Footwork, etc.) with a tier system (Bronze/Silver/Gold/Diamond) that scales stat gains.
- **AbilitySystem** — Defines abilities with rarity tiers (Common through Legendary) that provide passive stat boosts during matches. Abilities are primarily unlocked through Diamond-tier training.
- **ItemManager** — Equipment (racquet, shoes, outfit, hat) and consumable management. Equipped items provide persistent stat boosts.
- **ChallengeManager** — Objective-based progression with flexible requirements (stat thresholds, match stats, relationship levels) and rewards.
- **StoryEventManager** — Triggers and resolves narrative events based on prerequisites (stats, relationships, completed events, tournament state). Player choices affect stats, relationships, and future event availability.
- **TournamentManager** — Multi-round tournament progression with winner's/loser's brackets and story event integration before and after matches.
- **TimeManager** — Calendar system with seasons, days, and 4 time slots per day (Morning, Afternoon, Evening, Night). Activities consume time slots and the calendar gates scheduled content.
- **CalendarService** — Coordinates scheduled events (tournament matches, story events) with the time system.
- **StoryMatchManager** — Manages story-driven matches that are triggered through narrative events rather than player-initiated.

### State Management (`src/stores/`)

- **gameStore** — Central persistent store for all career state: player data, calendar, activity history, story progress, challenges, tournaments, and UI modal queue.
- **matchStore** — Transient store for active match state during simulation.

### Story Content (`src/data/storyEvents/`)

Story events are organized into storylines: rival, coach, family, romance, career, tournament, and milestone events. Each storyline has prerequisite chains that create branching narrative arcs. Characters (defined in `src/data/characters.ts`) include coaches, rivals, and friends with tracked relationship scores.

### Tournaments (`src/data/tournaments/`)

Tournament definitions include bracket structures, per-round opponents with specific stats, story event hooks for each round, and prerequisite conditions for entry.

## Credits

Audio assets are provided by third parties under their respective licenses.
See [CREDITS.md](CREDITS.md) for full attribution.

- **Music** by [Tim Kulig](https://timkulig.com) — licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Sound effects** by [Kenney](https://kenney.nl) — released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/)

## License

The Tennis RPG source code is released under the [MIT License](LICENSE).
Third-party assets remain under their original licenses as noted above.
