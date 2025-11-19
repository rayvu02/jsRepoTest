/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./sitescript.js",
    "./test.html"
  ],
  theme: {
    extend: {
      animation: {
        'border-streak': 'border-rotate 3s linear infinite',
        'cta-streak': 'cta-streak 4s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        'border-rotate': {
          '0%': { '--border-angle': '0deg' },
          '100%': { '--border-angle': '360deg' },
        },
        'cta-streak': {
          '0%': {
            transform: 'translateX(-200%) skewX(-15deg)',
            opacity: '0',
          },
          '10%': {
            opacity: '0.7',
          },
          '50%': {
            opacity: '0.9',
          },
          '90%': {
            opacity: '0.7',
          },
          '100%': {
            transform: 'translateX(200%) skewX(-15deg)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
}

