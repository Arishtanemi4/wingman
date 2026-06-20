/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.jsx',
    './main.jsx',
    './pages/**/*.jsx',
    './components/**/*.jsx',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0f0f1a',
        card: '#16182a',
        'card-hover': '#1e2035',
        border: '#2a2d45',
      },
    },
  },
  plugins: [],
}
