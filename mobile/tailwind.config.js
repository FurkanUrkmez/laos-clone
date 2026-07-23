/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Bu değerler src/theme/colors.ts ile senkron tutulmalı.
      colors: {
        primary: '#6B3E26',
        background: '#F8F3ED',
        cream: '#EFE6DA',
        cardBackground: '#FFFFFF',
        textPrimary: '#3A2418',
        textSecondary: '#8A7563',
        accent: '#C98A4B',
      },
    },
  },
  plugins: [],
};
