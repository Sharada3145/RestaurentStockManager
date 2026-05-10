/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        luxury: {
          cream:   '#F8F5F0',
          white:   '#FFFDF8',
          gold:    '#C9A227',
          terracotta: '#C97A40',
          olive:   '#6B8E23',
          burgundy: '#7A1F3D',
          border:  '#E7DFC8',
          text: {
            primary: '#2D2A26',
            secondary: '#6B7280',
            muted: '#9CA3AF',
          },
        },
        hospitality: { // Legacy keys preserved for minimal breakages if used in logic, but re-mapped
          dark:    '#F8F5F0', 
          gold:    '#C9A227',
          copper:  '#C97A40',
          emerald: '#10B981',
          crimson: '#EF4444',
          cream:   '#F8F5F0',
          charcoal:'#2D2A26',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
          info:    '#3B82F6',
        }
      },
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(135deg, #C9A227 0%, #C97A40 100%)',
        'glass-panel':     'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%)',
        'warm-glow':       'radial-gradient(circle at center, rgba(201, 162, 39, 0.1) 0%, transparent 70%)',
      },
      boxShadow: {
        premium: '0 0 0 1px rgba(231, 223, 200, 0.5), 0 10px 40px -10px rgba(45, 42, 38, 0.1)',
        gold:    '0 0 20px rgba(201, 162, 39, 0.15)',
        'gold-lg': '0 0 35px rgba(201, 162, 39, 0.25)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in':   'fadeIn 0.5s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'pulse-slow':'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-pulse':'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glowPulse: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
};
