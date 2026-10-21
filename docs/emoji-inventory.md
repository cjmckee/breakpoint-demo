# Emoji inventory

Where the game still draws emoji, to be replaced with pixel icons (`src/data/pixelIcons.ts`,
drawn with `<PixelIcon>`). Taken 2026-10-21: about 480 uses of 166 distinct emoji in 71 files.
Line numbers drift, so search for the file's emoji rather than trusting them.

Most of the count is in a handful of lookup tables. Swapping a table's value type from an
emoji string to a pixel icon id replaces every screen that reads it in one go, so do those
first.

Done so far, all in `src/data/pixelIcons.ts`: currencies (`CURRENCY_ICONS`), stats
(`STAT_ICONS`), effects (`EFFECT_META`), tactics (`TacticalOption.icon`, in the posture's colour),
surfaces (`SURFACE_ICONS`, drawn with `<SurfaceIcon>`), items (`ITEM_ICONS`, which
`ItemAcquiredModal` now shares) and calendar events.

`GLYPHS` is the shared set to draw from before adding a new icon: it already has a trophy, crown,
flame, heart, book, shield, warning, die, smile, sparkle and more, which cover much of what's left
below (stakes 👑 🔥, mood 😊, Randomize 🎲).

## 1. Icon tables: one change each, many screens

| Table                  | Where                                                                | What                                                                     | Count |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----- |
| Mood                   | `src/components/StatusBar.tsx`                                       | Eight mood faces, 📅 ⚡ (time of day and the wallet are pixel icons now) | 10    |
| Menu and help sections | `src/components/MenuModal.tsx`, `src/hooks/useMenuModal.ts`          | ⚙️ 📚 💬, 🎯 📖 📊 🏟️ ⌨️ ⚔️ 💝                                           | 10    |
| Archetype glyphs       | `src/data/archetypes.ts`                                             | 🐅 🐢 🦂 🦅 🦊                                                           | 5     |
| Ability rarity         | `src/game/AbilitySystem.ts`                                          | ⚪ 🟢 🔵 🟡                                                              | 4     |
| Relationship tiers     | `src/components/Relationships.tsx`                                   | 🤝 😊 💛 💎, 🧊 Strained                                                 | 5     |
| Key moment results     | `src/game/KeyMomentResolver.ts`, `src/components/KeyMomentModal.tsx` | 🌟 ✅ ❌ 💥 (the same four in both), stakes 👑 ⭐ 🚨 🔥 💡               | ~20   |

Fold the key moment results (the same four in two files) into one table first, so they get
drawn once.

## 2. Story option emoji (authored data)

Story options carry an `emoji` field, about 66 across `src/data/storyEvents/` (`miscEvents` 22,
`coachStoryline` 14, `careerStoryline` 9, `romanceStoryline` 7, `familyStoryline` 6,
`rivalStoryline` 6, `interactionEvents` 2). They're open-ended (🎣 🪂 🦆 🌶️ 🍗 🧗), so a
one-to-one icon set would be large. Two ways to go:

- a small set of option _moods_ (bold, careful, kind, cheeky, decline…) that each option
  names, with one pixel icon per mood; or
- drop the field and let the option text stand alone.

## 3. One-offs in components

Headings, buttons and big decorative icons written straight into the markup:

- **Match summary** (`MatchSummaryModal.tsx`, 27): section headings (📊 🎯 🎁 ⚡ 🎾 🏸 🔥),
  highlight icons, the Continue button (💪 🔥). The biggest single screen.
- **Pre-match** (`PreMatchScreen.tsx`, 9): venue chips 💨 🥵 📣 📍, 🎾 Start Match, Need ⚡.
- **Shop** (`Shop.tsx`, 8): section icons 🧪 ⚔️ ✨, 💰 balance, 🔒 🛒 empty states.
- **Story modals**: `StoryEventModal.tsx` 📜 👁 🔒; `StoryEventResultModal.tsx` 💜 💔 😊 😞 ⚡ ⭐ 🎒.
- **Training result** (`TrainingResultModal.tsx`): 💪 ⚡ 😊 😞 🌟.
- **Tournaments**: `TournamentList.tsx` 👑 🏆; `TournamentMatch.tsx` 🎾 🎗️; `ActiveTournamentCard.tsx` 🎾.
- **Development and menu**: ⭐ spec points (`DevelopmentScreen.tsx`, `MainMenu.tsx`), ⬡ on the menu.
- **Challenges**: `ActiveChallenges.tsx` 📋 ✅; `CompletedChallenges.tsx` ✅ 🏆; `ChallengeRewardModal.tsx` 🏆 ⭐.
- **Match setup** (`MatchSetup.tsx`): 🔒 tier locks, Need ⚡, 🎾 Preview Match.
- **Live match** (`match/MatchCockpit.tsx`): 🔥 🥶 hot and cold streaks.
- **Inventory** (`inventory/ItemEffects.tsx`): 😊 🔄.
- **Smaller**: `App.tsx` 🎾 loading and welcome; `WelcomeOverlay.tsx` 🎾; `HangoutUnlockedModal.tsx` 🎾 🤝;
  `PlayerCreation.tsx` 🎲 Randomize; `UpcomingTeamMatchCard.tsx` ⚡ Today.
- **Minigames**: the ball 🎾 in `CornerPainter`, `RallyRhythm`, `ReadReturn`, `Serve`, `TouchSlice`;
  💥 in Serve; 🐟 💧 in `FishingCast`. `BALL_ICON` (already on the training focus picker) covers five of them.
- **Text**: `data/tutorialSteps.ts` and `data/glossary.ts` mention 🌟 💥 🎯 ⚠️ in their prose,
  so they need updating when those icons change.

## 4. Leave as they are

- **Text glyphs, not emoji**: ☰ (menu button), ♪ (music), ★ (tactic stat weights), → arrows.
  They draw in the pixel font, so they already fit.
- **Developer output**: `trace`/`console.log` in `core/MatchSimulator.ts`, `core/ShotCalculator.ts`,
  `game/MatchOrchestrator.ts`, `game/StoryEventManager.ts`, `utils/matchAnalysis.ts`, the ✅/❌
  lines in the `src/test/*Check.ts` scripts, and 🐛 in `debug/DebugPanel.tsx`. Players never see these.

## Keeping it from growing back

Once a section is converted, a check like `spriteCheck` could fail on any emoji in
`src/components` or `src/data` outside an allowlist, so new ones don't creep back in.
