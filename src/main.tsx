import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initAnalytics } from './analytics/analytics';
import { setSeed } from './core/random';
import { installTestHandle } from './debug/testHandle';

initAnalytics();
installTestHandle();

// `?seed=123` makes every roll in the session reproducible — the e2e driver uses
// it to replay a match shot for shot. Dev-only on purpose: in a shipped build it
// would let a player re-roll loot and story outcomes until they liked them.
if (import.meta.env.DEV) {
  const raw = new URLSearchParams(window.location.search).get('seed');
  const seed = Number(raw);
  // `raw !== null` rather than a truthiness check, so `?seed=0` is a real seed.
  if (raw !== null && raw.trim() !== '' && Number.isFinite(seed)) {
    setSeed(seed);
    console.log(`[random] seeded with ${seed} — this session is reproducible`);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
