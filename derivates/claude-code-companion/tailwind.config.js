/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d8e0',
          300: '#aeb6c4',
          400: '#7c8699',
          500: '#566075',
          600: '#3f485c',
          700: '#2c3344',
          800: '#1c2231',
          900: '#0e121b',
        },
        stage: {
          s1: '#1E728C',
          s2: '#e88c30',
          s3: '#7a3eae',
          s4: '#2f9d6a',
          s5: '#c0367a',
          s6: '#5868c2',
          s7: '#a86f2e',
          s8: '#3a8a8a',
        },
        rung: {
          B: '#2f9d6a',
          I: '#e88c30',
          A: '#c0367a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
