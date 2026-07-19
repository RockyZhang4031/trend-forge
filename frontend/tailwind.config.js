/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0a0e1a',
          surface: '#111827',
          card: '#1a2332',
          border: '#2a3a52',
          primary: '#3da0c1',
          accent: '#96771c',
          success: '#448d5c',
          warning: '#9e834e',
          error: '#884d47',
          text: '#e2e8f0',
          muted: '#8892a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
