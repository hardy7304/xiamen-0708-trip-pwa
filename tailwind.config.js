/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f8f5ef',
        navy: '#0f172a',
        gold: '#c9a96e',
        'gold-light': '#e8d5b0',
        ocean: '#2c6e91',
        'ocean-light': '#4a9cc2',
        sand: '#e8dcc8',
        'warm-gray': '#5c5548',
        'soft-white': '#fefdfb',
        coral: '#d4786c',
      },
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          '"Noto Sans SC"',
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          'system-ui',
          'sans-serif',
        ],
        serif: [
          '"Noto Serif TC"',
          '"Noto Serif SC"',
          'Georgia',
          'serif',
        ],
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 20px rgba(15, 23, 42, 0.10)',
        nav: '0 -2px 12px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};