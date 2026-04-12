# Breakpoint - Tennis RPG

A stat-based tennis career simulation where you rise from club player to elite champion. Train your skills, compete in tournaments, build relationships, and make choices that shape your career — all driven by transparent, stat-based match simulation.



https://github.com/user-attachments/assets/89e2e7da-4380-474b-b45c-0763cf81c882



## How to Play

### The Daily Loop

Each day has 4 time slots (Morning, Afternoon, Evening, Night). Spend them on:

- **Training** — Improve your stats across 10 session types. Perform well to promote your training tier from Bronze up through Silver, Gold, and Diamond for bigger gains and ability unlocks.
- **Matches** — Play friendly matches against opponents at your level, or enter tournaments for bracket-style competition with story events woven into each round.
- **Rest** — Recover energy. Running out of energy limits what you can do.
- **Story Events** — Narrative moments trigger based on your stats, relationships, and career progress. Your choices have real consequences.

### Matches

Matches simulate point-by-point using your stats. At critical moments — break points, set points, match points — you make tactical decisions that influence the outcome. After each match you earn experience, stat gains, and sometimes items or abilities based on your performance.

Every shot of every rally is calculated using your stats (and your opponent's stats) and used in a cascading sigmoid function to generate realistic outcomes. Incoming shots of high quality require higher quality responses to continue the rally, while lower incoming quality means better opportunities for offense. Playstyle factors into both tendencies and chance of success.

### Progression Systems

- **20 Stats** across Technical, Physical, and Mental categories (all 0–100). Every point matters.
- **Equipment** — Equip a racquet, shoes, outfit, and hat for persistent stat boosts. Use consumables for energy recovery and temporary buffs before activities.
- **Abilities** — Passive bonuses ranging from Common to Legendary rarity. Unlocked through high-tier training and challenges.
- **Challenges** — Objective-based goals (reach stat thresholds, win matches, build relationships) that reward items, abilities, and stat boosts.

### Storylines

Five branching narrative arcs unfold as you play:

- **Coach** — Learn fundamentals from Coach Gonzalez and unlock advanced training techniques.
- **Rival** — A competitive relationship with Jordan that pushes you to prove yourself.
- **Romance** — Meet Alex at a tournament and build a relationship through shared experiences.
- **Family** — Navigate support and pressure from your parent as your career develops.
- **Career** — Agent recruitment, sponsorship deals, and the professional circuit.

Your choices in story events affect your stats, relationships, and which future events become available.

### Tips for New Players

- **Watch your energy** — Training and matches cost energy. Don't burn out right before a tournament.
- **Perform well in matches** — Good performance in matches will reward you with better stat gains, but poor performance is worse than just training.
- **Equip items before matches** — Even small stat boosts add up in close matches.
- **Explore story choices** — Different decisions open different paths. There's no single "right" answer.
- **Match your playstyle** — Train the stats that complement your chosen playstyle for the fastest progression.

## Getting Started

```bash
npm install
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
```

Requires Node.js 18+.

---

## Development

### Tech Stack

- React 19 + TypeScript (strict mode)
- Zustand for state management (with persistence)
- Vite for build tooling
- Tailwind CSS for styling

### Project Structure

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

See [CLAUDE.md](CLAUDE.md) for comprehensive development guidelines, architecture principles, and coding conventions.

## Credits

Audio assets are provided by third parties under their respective licenses.
See [CREDITS.md](CREDITS.md) for full attribution.

- **Music** by [Tim Kulig](https://timkulig.com) — licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Sound effects** by [Kenney](https://kenney.nl) — released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/)

## License

The Breakpoint - Tennis RPG source code is released under the [MIT License](LICENSE).
Third-party assets remain under their original licenses as noted above.
