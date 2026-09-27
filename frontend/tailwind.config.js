/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          indigo: '#27187E',     // Indigo Ink
          cornflower: '#758BFD', // Cornflower Blue
          periwinkle: '#AEB8FE', // Periwinkle
          platinum: '#F1F2F6',   // Platinum
          orange: '#FF8600',     // Princeton Orange
        },
        navy: {
          950: '#0f0933',
          900: '#160d4a',
          800: '#27187E', // Exact Indigo Ink #27187E
          700: '#342299',
          600: '#4530be',
          500: '#5843dc',
        },
        teal: {
          300: '#AEB8FE', // Periwinkle
          400: '#758BFD', // Cornflower Blue
          500: '#5f75f7',
          600: '#4a60ea',
        },
        amber: {
          300: '#ffa742',
          400: '#FF8600', // Princeton Orange
          500: '#e67700',
          600: '#cc6a00',
        },
        purple: {
          300: '#c5ccfe',
          400: '#AEB8FE', // Periwinkle
          500: '#8a9cfc',
          600: '#758BFD',
        },
        orange: {
          400: '#FF8600', // Princeton Orange
          500: '#e67700',
          600: '#cc6a00',
        },
        platinum: {
          DEFAULT: '#F1F2F6',
          light: '#ffffff',
          dark: '#e2e4ed',
        },
        slate: {
          850: '#150f38',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
