/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1a1a1a',
          700: '#262626',
          600: '#3a3a3a',
          500: '#737373',
          400: '#a3a3a3',
          300: '#d4d4d4',
          200: '#e5e5e5',
          100: '#f5f5f5',
          50:  '#fafafa'
        },
        accent: {
          DEFAULT: '#FFD400', // brand yellow
          dim: '#E6BF00',
          soft: '#FFF4B0'
        },
        success: '#16a34a',
        warn: '#f59e0b',
        danger: '#dc2626'
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(0,0,0,0.04), 0 1px 3px 0 rgba(0,0,0,0.06)',
        pop: '0 8px 24px -8px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: []
}
