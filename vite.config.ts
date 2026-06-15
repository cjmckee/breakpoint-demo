import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        // Precache app shell + all SFX (632KB); music is runtime-cached by the SW
        globPatterns: ['**/*.{js,css,html}', 'audio/sfx/**/*.{wav,ogg}'],
        globIgnores: ['**/node_modules/**', 'audio/music/**'],
      },
      manifest: {
        name: 'Breakpoint - Tennis RPG',
        short_name: 'Breakpoint',
        description: 'A tennis RPG game where you rise from the club ranks to the world stage!',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: process.env.NODE_ENV === 'production' ? '/breakpoint-demo/' : '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  esbuild: {
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
});
