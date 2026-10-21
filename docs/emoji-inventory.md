# Emoji inventory

Where the game still draws emoji, to be replaced with pixel icons (`src/data/pixelIcons.ts`,
drawn with `<PixelIcon>`). Taken 2026-10-21: about 480 uses of 166 distinct emoji in 71 files.
Line numbers drift, so search for the file's emoji rather than trusting them.

## 1. Icon tables and story options: done

Every lookup table is now pixel icons, all in `src/data/pixelIcons.ts`: currencies
(`CURRENCY_ICONS`), stats (`STAT_ICONS`), effects (`EFFECT_META`), tactics (`TacticalOption.icon`,
in the posture's colour), surfaces (`SURFACE_ICONS`, drawn with `<SurfaceIcon>`), items
(`ITEM_ICONS`), calendar events, mood faces, menu and encyclopedia tabs, archetypes
(`<ArchetypeLabel>`), relationship tiers, and key moment stakes, conditions and results.

Story options name a `mood` (bold, careful, kind, cheeky, smart, social, decline) instead of
an emoji, drawn from `STORY_MOOD_ICONS`. A new option picks one of the seven.

`GLYPHS` is the shared set to draw from before adding a new icon: trophy, crown, flame, heart,
book, shield, warning, die, smile, sparkle, star, check, cross and more already cover much of
what's left below (🏆 👑 🔥 🎲 ✅ ⭐).

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
