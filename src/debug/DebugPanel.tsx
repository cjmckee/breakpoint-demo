/**
 * Debug Panel (dev-only)
 * Lets you export/import the full save state and quick-load bundled test
 * saves from src/debug/saves/, so you can jump straight into a scenario
 * (e.g. "day 11 story event") instead of replaying up to it every time.
 *
 * Also runs any story event on demand, which is the faster route when the
 * scenario you want is a single event rather than a whole game state.
 */

import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../stores/gameStore';
import { StoryEventRepository } from '../data/storyEvents';
import { isTracing, setTracing } from '../core/trace';

// Lazy so bundled test-save JSON isn't pulled into the eagerly-loaded chunk.
const testSaveModules = import.meta.glob('./saves/*.json') as Record<
  string,
  () => Promise<{ default: unknown }>
>;

function saveNameFromPath(path: string): string {
  return path.replace('./saves/', '').replace(/\.json$/, '');
}

/** Events shown at once. The list is long enough that the panel needs a lid on it. */
const EVENT_RESULT_LIMIT = 25;

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tracing, setTracingState] = useState(isTracing());
  const [status, setStatus] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorted once: the repository is a static module-level array.
  const allEvents = useMemo(
    () =>
      [...StoryEventRepository.getAllEvents()].sort((a, b) => a.id.localeCompare(b.id)),
    []
  );

  const matchingEvents = useMemo(() => {
    const needle = eventFilter.trim().toLowerCase();
    if (!needle) return allEvents;
    return allEvents.filter(
      (event) =>
        event.id.toLowerCase().includes(needle) ||
        event.name.toLowerCase().includes(needle) ||
        event.tags.some((tag) => tag.includes(needle))
    );
  }, [allEvents, eventFilter]);

  const handleTriggerEvent = (eventId: string, eventName: string) => {
    const { player, debugTriggerStoryEvent } = useGameStore.getState();
    if (!player) {
      setStatus('Create a player first — an event has nobody to happen to.');
      return;
    }
    debugTriggerStoryEvent(eventId);
    setStatus(`Triggered "${eventName}".`);
    setIsOpen(false);
  };

  const handleExport = () => {
    const { exportSave, calendar } = useGameStore.getState();
    const json = exportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `save-day${calendar.currentDay}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported save (day ${calendar.currentDay}). Drop it in src/debug/saves/ to reuse it as a test save.`);
  };

  const applyImport = (json: string, label: string) => {
    const success = useGameStore.getState().importSave(json);
    setStatus(success ? `Loaded "${label}".` : `Failed to load "${label}" — check console for details.`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyImport(String(reader.result), file.name);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadTestSave = async (path: string) => {
    const load = testSaveModules[path];
    if (!load) return;
    const mod = await load();
    applyImport(JSON.stringify(mod.default), saveNameFromPath(path));
  };

  const panel = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90"
      style={{ zIndex: 999999, pointerEvents: 'auto' }}
    >
      <div
        className="bg-pixel-card border-4 border-pixel-border w-full max-w-lg mx-4 p-6 max-h-[90vh] flex flex-col overflow-y-auto"
        style={{ pointerEvents: 'auto' }}
      >
        <h2 className="text-xl font-bold text-pixel-text mb-1">🐛 Debug Panel</h2>
        <p className="text-xs text-pixel-text-muted mb-4">Dev-only. Not present in production builds.</p>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-pixel-text-muted uppercase tracking-wider mb-2">Current Save</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 bg-pixel-accent border-4 border-pixel-accent-dark text-white font-bold px-3 py-2 text-sm hover:bg-pixel-accent-light"
            >
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-pixel-secondary border-4 border-pixel-secondary-dark text-white font-bold px-3 py-2 text-sm hover:bg-pixel-secondary-light"
            >
              Import File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-pixel-text-muted uppercase tracking-wider mb-1">Match Tracing</h3>
          <p className="text-xs text-pixel-text-muted mb-2">
            Narrates every shot to the console — the stat, its modifiers, the sigmoid
            midpoints and the outcome cascade. Off by default: one match is tens of
            thousands of lines, enough to make the console useless for anything else.
          </p>
          <button
            onClick={() => {
              const next = !tracing;
              setTracing(next);
              setTracingState(next);
            }}
            className={`w-full border-4 font-bold px-3 py-2 text-sm ${
              tracing
                ? 'bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light'
                : 'bg-pixel-bg-dark border-pixel-border text-pixel-text hover:border-pixel-accent'
            }`}
          >
            {tracing ? 'Tracing ON — click to stop' : 'Tracing OFF — click to start'}
          </button>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-pixel-text-muted uppercase tracking-wider mb-2">Test Saves</h3>
          {Object.keys(testSaveModules).length === 0 ? (
            <p className="text-xs text-pixel-text-muted">
              None yet. Export a save above and drop the file into src/debug/saves/ to make it a quick-load scenario.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.keys(testSaveModules).sort().map((path) => (
                <button
                  key={path}
                  onClick={() => handleLoadTestSave(path)}
                  className="w-full text-left bg-pixel-bg-dark border-2 border-pixel-border text-pixel-text px-3 py-2 text-sm hover:bg-pixel-secondary hover:text-white transition-colors"
                >
                  {saveNameFromPath(path)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-pixel-text-muted uppercase tracking-wider mb-1">Trigger Story Event</h3>
          <p className="text-xs text-pixel-text-muted mb-2">
            Runs the event now, ignoring its prerequisites. Choices are still filtered by
            their own prerequisites, so you see what a qualifying player would.
          </p>
          <input
            type="text"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            placeholder="Filter by id, name, or tag…"
            className="w-full bg-pixel-bg-dark border-2 border-pixel-border text-pixel-text px-3 py-2 text-sm mb-2"
          />
          <div className="max-h-56 overflow-y-auto space-y-1 border-2 border-pixel-border p-1">
            {matchingEvents.length === 0 ? (
              <p className="text-xs text-pixel-text-muted p-2">No event matches "{eventFilter}".</p>
            ) : (
              matchingEvents.slice(0, EVENT_RESULT_LIMIT).map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleTriggerEvent(event.id, event.name)}
                  className="w-full text-left bg-pixel-bg-dark border-2 border-pixel-border text-pixel-text px-3 py-2 text-sm hover:bg-pixel-secondary hover:text-white transition-colors"
                >
                  <span className="font-bold">{event.name}</span>
                  <span className="block text-xs opacity-70">
                    {event.id} · {event.tags.join(', ')}
                  </span>
                </button>
              ))
            )}
          </div>
          {matchingEvents.length > EVENT_RESULT_LIMIT && (
            <p className="text-xs text-pixel-text-muted mt-1">
              Showing {EVENT_RESULT_LIMIT} of {matchingEvents.length} — narrow the filter.
            </p>
          )}
        </div>

        {status && (
          <p className="text-xs text-pixel-text-muted border-t border-pixel-border pt-3 mb-3">{status}</p>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="font-bold border-4 bg-pixel-accent border-pixel-accent-dark text-white hover:bg-pixel-accent-light px-6 py-2 text-base w-full mt-auto"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed w-10 h-10 bg-pixel-card border-4 border-pixel-border rounded-full flex items-center justify-center text-lg shadow-lg hover:bg-pixel-secondary transition-colors"
        style={{ bottom: '1.5rem', left: '1.5rem', zIndex: 99999, pointerEvents: 'auto' }}
        title="Debug Panel"
      >
        🐛
      </button>
      {isOpen && createPortal(panel, document.body)}
    </>
  );
};
