/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand palette — moss/forest greens
        moss: {
          50:  '#f4f7f2',
          100: '#e3ebe0',
          200: '#c7d9c2',
          300: '#a3bf9b',
          400: '#7a9f70',
          500: '#5a7c52',
          600: '#466340',
          700: '#3d5a36',
          800: '#2f452a',
          900: '#243620',
          950: '#131f11',
        },
        // Deep forest palette — used throughout UI components
        forest: {
          50:  '#f0f7f0',
          100: '#d8edd9',
          200: '#b1dcb3',
          300: '#82c285',
          400: '#52a556',
          500: '#328a38',
          600: '#256e2c',
          700: '#1d5622',
          800: '#164019',
          900: '#0d2b11',
          950: '#071a0a',
        },
        wood: {
          50:  '#faf6f0',
          100: '#f0e6d6',
          200: '#e0ccaf',
          300: '#ccad82',
          400: '#b8925c',
          500: '#8b6f4e',
          600: '#6b543b',
          700: '#5c4a32',
          800: '#4a3b29',
          900: '#3a2f22',
        },
        warm: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        sky: {
          400: '#7dd3fc',
          500: '#38bdf8',
          600: '#0284c7',
        },
        cream:           '#faf8f5',
        ink:             '#1c1917',
        surface:         'rgba(0,0,0,0.03)',
        'surface-border':'rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      ringWidth: {
        '1.5': '1.5px',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out',
        'slide-up':      'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-right':'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-in':      'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-soft':   'bounceSoft 2s ease infinite',
        'pulse-soft':    'pulseSoft 2s ease infinite',
        'float':         'floatY 4s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        'card':   '0 4px 16px rgba(0,0,0,0.06)',
        'float':  '0 8px 28px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'modal':  '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        'forest': '0 4px 14px rgba(37,86,34,0.35)',
      },
    },
  },
  plugins: [],
}
