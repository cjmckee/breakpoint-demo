# Test saves

Drop exported saves here and they become quick-load buttons in the Debug Panel
(`DebugPanel.tsx` picks them up with `import.meta.glob('./saves/*.json')`, so the
filename is the label — no registration step).

Export one with the Debug Panel's Export button, which stamps the current
`storeVersion` into the JSON.

## These go stale, and they go stale silently

`gameStore.importSave` rejects any save whose `storeVersion` doesn't equal
`CURRENT_STORE_VERSION` — the same guard rehydration uses, for the same reason
(see `stores/migrations.ts`: this project tried field-by-field migration once and
kept finding corners it missed). A save recorded before a shape change is exactly
the stale-schema data that guard exists to catch.

So **every bump of `CURRENT_STORE_VERSION` invalidates every file in this
folder.** Nothing warns you at build time; the button just fails to load. When
you bump the version, re-record the scenarios you still want.

The two saves that used to live here were removed at store version 6 — they
predated the `storeVersion` field entirely and still carried the pre-consolidation
20-stat shape (`slice` in `core` rather than `net`), so they had been dead for a
while without anyone noticing.
