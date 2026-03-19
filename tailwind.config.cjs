/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f5ff',
          100: '#e4e7ff',
          300: '#818cf8',
          400: '#6366f1',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3'
        },
        accent: {
          500: '#f97316'
        }
      },
      borderRadius: {
        xl: '1rem'
      }
    }
  },
  plugins: []
};

