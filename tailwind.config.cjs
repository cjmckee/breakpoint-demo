/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pixel art retro theme
        'pixel-bg': '#1a1a2e',
        'pixel-text': '#eee',
        'pixel-primary': '#16213e',
        'pixel-secondary': '#0f3460',
        'pixel-accent': '#e94560',
        'pixel-success': '#2ecc71',
        'pixel-warning': '#f39c12',
        'pixel-error': '#e74c3c',
        // Dark mode variants
        'dark-pixel-bg': '#0f0f1e',
        'dark-pixel-text': '#f5f5f5',
        'dark-pixel-primary': '#1a1a3e',
        'dark-pixel-secondary': '#141e30',
        'dark-pixel-accent': '#ff6b81',
        'dark-pixel-text-secondary': '#a0a0a0',
      },
      fontFamily: {
        'game': ['"Press Start 2P"', 'monospace'],
        'mono': ['monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
