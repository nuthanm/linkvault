/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fafaf9',
        surface: '#ffffff',
        border: '#e7e5e4',
        ink: '#1c1917',
        muted: '#78716c',
        accent: '#2563eb',
      },
    },
  },
  plugins: [],
};
