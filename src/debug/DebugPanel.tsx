/**
 * Debug Panel (dev-only)
 * Lets you export/import the full save state and quick-load bundled test
 * saves from src/debug/saves/, so you can jump straight into a scenario
 * (e.g. "day 11 story event") instead of replaying up to it every time.
 */

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../stores/gameStore';

// Lazy so bundled test-save JSON isn't pulled into the eagerly-loaded chunk.
const testSaveModules = import.meta.glob('./saves/*.json') as Record<
  string,
  () => Promise<{ default: unknown }>
>;

function saveNameFromPath(path: string): string {
  return path.replace('./saves/', '').replace(/\.json$/, '');
}

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
