/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        baseball: {
          green: '#2d5a27',
          dirt: '#8b7355',
          grass: '#4a7c59',
        }
      }
    },
  },
  plugins: [],
}

