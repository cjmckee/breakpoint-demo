/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// A new build takes over as soon as it installs. Left waiting, it only activates once every
// tab of the old build has closed, which a player who keeps the game open, or plays it
// installed, may never do, so they'd stay on the old build until they cleared site data.
self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Music streams use HTTP range requests for seeking — CacheFirst + RangeRequestsPlugin
// handles both full-file caching and byte-range requests from cached responses.
registerRoute(
  ({ url }) => url.pathname.includes('/audio/music/'),
  new CacheFirst({
    cacheName: 'audio-music-cache',
    plugins: [
      new RangeRequestsPlugin(),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);
