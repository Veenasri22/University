/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#090d16'
        }
      },
      fontFamily: {
        sans:   ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        inter:  ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fadeIn':     'fadeIn 0.4s ease-out both',
        'slideUp':    'slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'slideDown':  'slideDown 0.3s ease-out both',
        'scaleIn':    'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 2.4s ease-in-out infinite',
        'gradient':   'gradientShift 6s ease infinite',
        'float-ping': 'floatPing 2.4s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeIn:        { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:       { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:     { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:       { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradientShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        floatPing:     { '0%,100%': { transform: 'scale(1)', opacity: '0.8' }, '50%': { transform: 'scale(1.5)', opacity: '0' } },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-blue':    '0 0 30px -5px rgba(59,130,246,0.35)',
        'glow-indigo':  '0 0 30px -5px rgba(99,102,241,0.35)',
        'glow-emerald': '0 0 30px -5px rgba(16,185,129,0.30)',
        'glow-red':     '0 0 30px -5px rgba(239,68,68,0.35)',
        'glow-amber':   '0 0 30px -5px rgba(245,158,11,0.30)',
        'glow-purple':  '0 0 30px -5px rgba(168,85,247,0.30)',
        'panel':        '0 20px 60px -15px rgba(0,0,0,0.7)',
      }
    },
  },
  plugins: [],
}
