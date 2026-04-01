import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde7ff',
          200: '#c0d0ff',
          300: '#94afff',
          400: '#6080ff',
          500: '#3d57f5',
          600: '#2b3eea',
          700: '#242fd4',
          800: '#2129ac',
          900: '#212888',
          950: '#151854',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
