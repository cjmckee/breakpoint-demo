# Emoji inventory

The game drew about 480 emoji (166 distinct, in 71 files) when this was taken on 2026-10-21.
They are all pixel icons now (`src/data/pixelIcons.ts`, drawn with `<PixelIcon>`), and
`src/test/emojiCheck.ts`, part of `npm test`, fails on any emoji added back to game source.

## Where the icons live

- **Tables**: currencies (`CURRENCY_ICONS`), stats (`STAT_ICONS`), effects (`EFFECT_META`),
  tactics (`TacticalOption.icon`, in the posture's colour), surfaces (`SURFACE_ICONS`, drawn
  with `<SurfaceIcon>`), items (`ITEM_ICONS`, `<ItemIcon>`), archetypes (`<ArchetypeLabel>`),
  calendar events, mood faces, menu and encyclopedia tabs, relationship tiers, and key moment
  stakes, conditions and results.
- **Story options** name a `mood` (bold, careful, kind, cheeky, smart, social, decline), drawn
  from `STORY_MOOD_ICONS`. A new option picks one of the seven.
- **`GLYPHS`** is the shared set: trophy, crown, flame, heart, book, shield, warning, die, lock,
  coin, faces, animals and more. Look there before drawing a new icon.
- **Screens** that used an emoji only to decorate text that already said it (section headings,
  "Train Harder 🔥", "⚡ Today") dropped it rather than gaining an icon.
- **Minigame balls** are the CSS-drawn ball on its own; the 🎾 inside it was a ball in a ball.

## Left as they are

- **Text glyphs, not emoji**: ☰ (menu button), ♪ (music), ★ (tactic stat weights, hang out),
  ▶ ▼ and arrows. They draw in the pixel font. `emojiCheck` allows ☰ ♪ ★.
- **Developer output**: `trace`/`console` in `core/MatchSimulator.ts`, `game/MatchOrchestrator.ts`
  and elsewhere, the ✅/❌ lines in the `src/test/*Check.ts` scripts, and 🐛 in
  `debug/DebugPanel.tsx`. Players never see these, and `emojiCheck` skips them.
