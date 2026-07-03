/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0F766E',
          800: '#115e59',
          900: '#134e4a',
        },
        ink:      '#14212B',
        body:     '#3D4B54',
        mist:     '#F6F8F7',
        surface:  '#FFFFFF',
        border:   '#E2E8E6',
        success:  '#1B9C6E',
        warning:  '#D68A1F',
        critical: '#C0392B',
        info:     '#2563A8',
        // Tint variants for status backgrounds (pill backgrounds)
        'success-tint':  '#EDFAF4',
        'warning-tint':  '#FEF6E7',
        'critical-tint': '#FDEEEC',
        'info-tint':     '#EFF4FC',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card':      '0 1px 3px 0 rgba(20, 33, 43, 0.06), 0 1px 2px -1px rgba(20, 33, 43, 0.04)',
        'card-hover':'0 8px 24px -4px rgba(20, 33, 43, 0.10), 0 2px 8px -2px rgba(20, 33, 43, 0.06)',
        'sidebar':   '2px 0 12px 0 rgba(20, 33, 43, 0.06)',
      },
      borderRadius: {
        'xl2': '1rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0'  },
        },
        'pulse-blip': {
          '0%, 85%, 100%': { opacity: '0' },
          '90%':            { opacity: '1' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        'count-up': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer:      'shimmer 1.6s infinite linear',
        'pulse-blip': 'pulse-blip 3.5s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.2s ease-out forwards',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
