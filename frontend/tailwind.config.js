/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Share Tech Mono"', 'monospace'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        tactical: {
          dark: '#0a0a0a',
          panel: '#111111',
          grid: '#1a1a1a',
          border: '#333333',
          neon: '#00ff41',       // Classic hacker green
          neonHover: '#00cc33',
          alert: '#ff003c',      // Hard red
          warn: '#ffb000',       // Amber
          text: '#c8d4c9',       // Muted green-grey for standard text
        }
      },
      backgroundImage: {
        'scanlines': 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
      },
      animation: {
        'glitch': 'glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite',
        'blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(-1px, -1px)' },
          '60%': { transform: 'translate(2px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
          '100%': { transform: 'translate(0)' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

