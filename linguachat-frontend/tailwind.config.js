/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /*
         * Semantic names only. `lc-*` is what the components ask for, and every
         * entry resolves to a CSS variable, so light and night are one set of
         * classes. The legacy aliases (coral/blue/green/violet) are kept because
         * surfaces still reference them and index.css remaps them onto this
         * palette — there is no purple left to point at.
         */
        lc: {
          bg:        'var(--bg)',
          paper:     'var(--surface)',
          elevated:  'var(--surface)',
          soft:      'var(--surface-soft)',
          sunk:      'var(--surface-sunk)',
          ink:       'var(--ink)',
          text:      'var(--text)',
          muted:     'var(--muted)',
          'muted-soft': 'var(--muted-soft)',
          border:    'var(--border)',
          'border-strong': 'var(--border-strong)',
          accent:    'var(--accent)',
          'accent-strong': 'var(--accent-strong)',
          'accent-soft': 'var(--accent-soft)',
          'accent-tint': 'var(--accent-tint)',
          positive:  'var(--positive)',
          'positive-deep': 'var(--positive-deep)',
          'positive-soft': 'var(--positive-soft)',
          info:      'var(--info)',
          'info-soft': 'var(--info-soft)',
          green:     'var(--positive)',
          blue:      'var(--info)',
          coral:     'var(--accent)',
          yellow:    'var(--accent-tint)',
          violet:    'var(--accent)',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        display: ["'Bricolage Grotesque'", 'Figtree', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        warm:       'var(--shadow-sm)',
        'warm-lg':  'var(--shadow-lg)',
        mission:    'var(--shadow-md)',
        'blue-soft':'var(--shadow-sm)',
        'violet-soft':'var(--shadow-sm)',
        'inner-hi': 'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      animation: {
        'fade-up':    'fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.32,0.72,0,1) both',
        'scale-in':   'scaleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        'message-in': 'messageIn 0.32s cubic-bezier(0.32,0.72,0,1) both',
        'popover-in': 'popoverIn 0.2s cubic-bezier(0.32,0.72,0,1) both',
        'pop-in':     'popIn 0.42s cubic-bezier(0.34,1.56,0.64,1) both',
        'sticker-in': 'stickerIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'node-pulse': 'nodePulse 2.4s ease-in-out infinite',
        'dot-bounce': 'dotBounce 1.4s ease-in-out infinite',
        'glow-breathe':'glowBreathe 3s ease-in-out infinite',
        'slide-in-left':'slideInLeft 0.35s cubic-bezier(0.32,0.72,0,1) both',
        'slide-in-right':'slideInRight 0.35s cubic-bezier(0.32,0.72,0,1) both',
        'sheet-up':   'sheetUp 0.3s cubic-bezier(0.32,0.72,0,1) both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        messageIn: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.99)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        popoverIn: {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.6)' },
          '60%':  { opacity: '1', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        stickerIn: {
          from: { opacity: '0', transform: 'scale(0.82) rotate(-2deg)' },
          to:   { opacity: '1', transform: 'scale(1) rotate(-0.5deg)' },
        },
        nodePulse: {
          '0%,100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 var(--accent-soft)' },
          '50%':     { transform: 'scale(1.04)', boxShadow: '0 0 0 7px transparent' },
        },
        dotBounce: {
          '0%,80%,100%': { transform: 'scale(0.75)', opacity: '0.35' },
          '40%':          { transform: 'scale(1)',    opacity: '1' },
        },
        glowBreathe: {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        sheetUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
