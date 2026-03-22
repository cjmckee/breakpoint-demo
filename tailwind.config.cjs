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
        'pixel-text-muted': '#a0a0a0',
        'pixel-border': '#2d3748',
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
      animation: {
        'pulse-heartbeat': 'pulse-heartbeat 1.5s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'bounce-medium': 'bounce-medium 2s ease-in-out infinite',
        'bounce-strong': 'bounce-strong 2s ease-in-out infinite',
        'bounce-intense': 'bounce-intense 2s ease-in-out infinite',
        'stat-increase': 'stat-increase 0.6s ease-out',
        'stat-decrease': 'stat-decrease 0.6s ease-out',
        'pixel-glow': 'pixel-glow 2s ease-in-out infinite',
        'pixel-scale': 'pixel-scale 0.2s ease-out',
        'word-drift': 'word-drift 2.5s ease-in-out infinite',
        'word-drift-subtle': 'word-drift-subtle 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-heartbeat': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(calc(1 + var(--pulse-intensity, 0.1) * 0.1))',
            opacity: 'calc(0.8 + var(--pulse-intensity, 0.1) * 0.2)',
          },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'bounce-medium': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-strong': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'bounce-intense': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        'stat-increase': {
          '0%': { transform: 'scale(1)', color: 'rgb(34, 197, 94)' },
          '50%': { transform: 'scale(1.2)', color: 'rgb(22, 163, 74)' },
          '100%': { transform: 'scale(1)', color: 'rgb(34, 197, 94)' },
        },
        'stat-decrease': {
          '0%': { transform: 'scale(1)', color: 'rgb(239, 68, 68)' },
          '50%': { transform: 'scale(1.2)', color: 'rgb(220, 38, 38)' },
          '100%': { transform: 'scale(1)', color: 'rgb(239, 68, 68)' },
        },
        'pixel-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(251, 146, 60, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(251, 146, 60, 0.8)' },
        },
        'pixel-scale': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'word-drift': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'word-drift-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-1.5px)' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
