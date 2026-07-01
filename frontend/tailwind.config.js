/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(0 0% 15%)',
        input: 'hsl(0 0% 15%)',
        ring: 'hsl(0 0% 100%)',
        background: '#000000',
        foreground: '#ffffff',
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1a1a1a',
          foreground: '#a0a0a0',
        },
        accent: {
          DEFAULT: '#1a1a1a',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
