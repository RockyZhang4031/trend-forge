/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          // 背景层
          'bg-deep': '#05070A',
          'bg-panel': 'rgba(10, 14, 23, 0.75)',
          'bg-elevated': 'rgba(16, 22, 36, 0.85)',
          // 主品牌色 — 冷青电光
          'primary': '#00F0FF',
          'primary-dim': 'rgba(0, 240, 255, 0.15)',
          'primary-glow': 'rgba(0, 240, 255, 0.4)',
          // 辅助色
          'accent-warm': '#FF6B35',
          'accent-cold': '#6C5CE7',
          'accent-growth': '#00D9A5',
          'accent-alert': '#FF2E63',
          // 文字层级
          'text': '#E8ECF1',
          'text-secondary': '#8B95A5',
          'text-tertiary': '#4A5568',
          // 边框
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          'border-glow': 'rgba(0, 240, 255, 0.3)',
          // 兼容旧引用
          'surface': 'rgba(10, 14, 23, 0.75)',
          'card': 'rgba(16, 22, 36, 0.85)',
          'border': 'rgba(255, 255, 255, 0.06)',
          'muted': '#8B95A5',
          'success': '#00D9A5',
          'warning': '#FF6B35',
          'error': '#FF2E63',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'scan-line': 'scan-line 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
