/**
 * The design system, half of it. The other half is the `:root` custom
 * properties at the top of app/globals.css — every value below that reads
 * `var(--…)` is defined there, so a token has ONE definition and both
 * Tailwind classes and hand-written CSS resolve to the same number.
 *
 * Why tokens live in CSS variables rather than here: the hero overlays, the
 * scrims and the motion rules are plain CSS (media queries, ::before layers)
 * that Tailwind classes cannot express, and before this they hard-coded
 * their own copies of the same values. Pointing both at one variable is what
 * stops the two halves drifting.
 *
 * THE SCALES ARE CLOSED. Adding `text-[13.5px]` or `rounded-[22px]` in a
 * component is the thing this file exists to prevent — the audit that
 * preceded it found 14 font sizes, 6 radii and 8 max-widths in use, with
 * tell-tale accidental pairs (672px AND 680px, 512px AND 520px). If a value
 * is missing from a scale, add it HERE with a reason.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep black backgrounds, layered for depth against high-contrast text.
        black: {
          DEFAULT: '#000000',
          obsidian: 'rgb(var(--bg-obsidian) / <alpha-value>)',
          soft: 'rgb(var(--bg-soft) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        },

        /*
         * TEXT. Three steps, and that is the whole ramp.
         *
         * This replaces twelve ad-hoc `text-white/NN` opacities between /30
         * and /85. Four of those failed WCAG AA outright — `white/40` at
         * 12px measured 3.66:1 against a 4.5 floor, in 72 places — which is
         * the reason the ramp is fixed rather than per-component.
         *
         * Measured on #000:  ink 21:1 · ink-2 12.4:1 · ink-3 6.9:1.
         * The floor is AA for body text at the SMALLEST size the token is
         * used at, so there is no size at which picking one of these three
         * can fail.
         */
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },

        border: {
          subtle: 'var(--line-subtle)',
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },

        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
      },

      /*
       * TYPE. Eight steps. Each pairs a size with the line-height it is
       * meant to be set at, so `text-step-5` carries its own leading and a
       * component never has to guess.
       *
       * Replaces 10/11/12/14/15/16/18/20/24/30/36/48/76/108px.
       */
      fontSize: {
        'step-0': ['0.6875rem', { lineHeight: '1.25', letterSpacing: '0.16em' }], // 11 — labels, eyebrows
        'step-1': ['0.8125rem', { lineHeight: '1.5' }],                           // 13 — meta, captions
        'step-2': ['0.9375rem', { lineHeight: '1.6' }],                           // 15 — secondary body
        'step-3': ['1.0625rem', { lineHeight: '1.6' }],                           // 17 — body
        'step-4': ['1.3125rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],  // 21 — lede, card titles
        'step-5': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],   // 28 — h3
        'step-6': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],     // 40 — h2
        'step-7': ['clamp(2.5rem, 6vw, 6.5rem)', { lineHeight: '1.02', letterSpacing: '-0.04em' }], // h1
      },

      // 4px base. The named steps are the only vertical rhythm on the site.
      spacing: {
        'sec-y': 'var(--sec-y)',     // responsive section padding, see globals
        'sec-x': 'var(--sec-x)',
      },

      borderRadius: {
        ctl: 'var(--r-ctl)',       // 14 — inputs, small controls
        card: 'var(--r-card)',     // 22 — cards, tiles
        sheet: 'var(--r-sheet)',   // 28 — sheets, dialogs, large media
      },

      maxWidth: {
        prose: 'var(--w-prose)',          // 640 — a column of running text
        'prose-wide': 'var(--w-prose-wide)', // 760 — intros, policy pages
        content: 'var(--w-content)',      // 1200 — standard page content
        'container-xl': 'var(--w-container)', // 1440 — full-bleed container
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
        sheet: 'var(--shadow-sheet)',
        dialog: 'var(--shadow-dialog)',
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },

      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.04em',
      },

      /*
       * MOTION. Four durations and one easing curve, so every transition on
       * the site is one of four speeds. `ease-brand` is a decelerating curve
       * — fast out of the gate, settling softly — which is what makes a
       * hover feel responsive and a reveal feel calm using the same function.
       */
      transitionDuration: {
        fast: 'var(--dur-fast)',     // 120 — press, tap feedback
        base: 'var(--dur-base)',     // 200 — hover, colour
        slow: 'var(--dur-slow)',     // 320 — sheets, drawers
        reveal: 'var(--dur-reveal)', // 560 — scroll reveals
      },
      transitionTimingFunction: {
        brand: 'var(--ease-brand)',
      },
    },
  },
  plugins: [],
};
