/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emerald: {
          950: '#022c22',
        },
        wali: {
          green:   '#1D9E75',
          'green-dark': '#0F6E56',
          'green-light': '#E1F5EE',
          gold:    '#BA7517',
          'gold-light': '#FAEEDA',
          warn:    '#D85A30',
          'warn-light': '#FAECE7',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease forwards',
        'fade-in':   'fadeIn 0.3s ease forwards',
        'pulse-dot': 'pulseDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        pulseDot: { '0%,80%,100%': { opacity: 0.2 }, '40%': { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
