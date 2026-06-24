/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lc: {
          bg:       'var(--bg-main)',
          paper:    'var(--bg-paper)',
          elevated: 'var(--bg-elevated)',
          ink:      'var(--ink)',
          muted:    'var(--ink-muted)',
          border:   'var(--border)',
          green:    'var(--green)',
          blue:     'var(--blue)',
          coral:    'var(--coral)',
          yellow:   'var(--yellow)',
          violet:   'var(--violet)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        warm:       '0 2px 16px -4px rgba(31,41,51,0.08), 0 1px 4px -2px rgba(31,41,51,0.04)',
        'warm-lg':  '0 8px 40px -8px rgba(31,41,51,0.12), 0 2px 8px -4px rgba(31,41,51,0.06)',
        mission:    '0 0 0 1.5px var(--coral), 0 8px 32px -8px rgba(249,115,91,0.18)',
        'blue-soft':'0 4px 24px -4px rgba(59,130,196,0.18)',
        'violet-soft':'0 4px 24px -4px rgba(124,92,255,0.18)',
        'inner-hi': 'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      animation: {
        'fade-up':    'fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
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
        stickerIn: {
          from: { opacity: '0', transform: 'scale(0.82) rotate(-2deg)' },
          to:   { opacity: '1', transform: 'scale(1) rotate(-0.5deg)' },
        },
        nodePulse: {
          '0%,100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59,130,196,0.4)' },
          '50%':     { transform: 'scale(1.06)', boxShadow: '0 0 0 8px rgba(59,130,196,0)' },
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
