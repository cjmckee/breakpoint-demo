import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
