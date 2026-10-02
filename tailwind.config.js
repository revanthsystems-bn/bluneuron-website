/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep black backgrounds, layered for depth against high-contrast white text.
        black: {
          DEFAULT: '#000000',
          obsidian: '#030303',
          soft: '#0A0A0A',
          surface: '#121212',
          elevated: '#1A1A1A',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          DEFAULT: 'rgba(255, 255, 255, 0.12)',
          strong: 'rgba(255, 255, 255, 0.2)',
        },
        accent: {
          DEFAULT: '#3B82F6',
          soft: '#60A5FA',
        },
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      backgroundImage: {
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'radial-fade':
          'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.04em',
      },
      maxWidth: {
        'container-xl': '1440px',
      },
    },
  },
  plugins: [],
};
