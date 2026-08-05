/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  // Domain colour classes are built dynamically (`bg-domain-${id}` …) in
  // HomeView and MatrixView, so the scanner can't see them.
  safelist: [1, 2, 3, 4, 5].flatMap((n) => [
    `bg-domain-${n}`,
    `bg-domain-${n}/10`,
    `text-domain-${n}`,
  ]),
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f7f5',
          100: '#ececea',
          200: '#d6d6d2',
          300: '#a8a89f',
          400: '#76766c',
          500: '#4a4a42',
          600: '#2f2f29',
          700: '#1d1d19',
          800: '#121210',
          900: '#0a0a08',
        },
        accent: {
          DEFAULT: '#d97757',
          soft: '#f4ddcf',
          ink: '#7a3614',
        },
        domain: {
          1: '#d97757',
          2: '#5e8ca8',
          3: '#6f9c6e',
          4: '#b78a3d',
          5: '#8a6fa8',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        prose: '72ch',
      },
    },
  },
  plugins: [],
}
