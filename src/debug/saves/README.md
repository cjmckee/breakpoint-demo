# Test saves

Drop exported saves here and they become quick-load buttons in the Debug Panel
(`DebugPanel.tsx` picks them up with `import.meta.glob('./saves/*.json')`, so the
filename is the label — no registration step).

Export one with the Debug Panel's Export button, which stamps the current
`storeVersion` into the JSON.

## They survive a version bump, but not a breaking one

`gameStore.importSave` runs the same migrations rehydration does (see
`stores/migrations.ts`), so a save recorded against an older `storeVersion` loads
with its progress carried forward. Two cases still fail, and they fail silently —
the button just doesn't load:

- a save below `RESET_BEFORE_VERSION`, the breaking floor. Raising that floor
  invalidates every file here that predates it, so re-record the scenarios you
  still want when you raise it;
- a save from a build *newer* than the one you're running, e.g. after checking
  out an older branch.

Note that an import refuses these rather than resetting: rehydration owns the
save it loads and can hand back a fresh game, but an import would be replacing
the game you're currently playing.

The two saves that used to live here were removed at store version 6 — they
predated the `storeVersion` field entirely and still carried the pre-consolidation
20-stat shape (`slice` in `core` rather than `net`), which is below the floor.
