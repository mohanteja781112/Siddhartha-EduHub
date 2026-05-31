/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Re-trigger tailwind build
  ],
  theme: {
    extend: {
      colors: {
        'edu-blue': '#4F8A8B', // Soft blue
        'edu-navy': '#072A40', // Navy
        'edu-gold': '#FBD46D', // Gold
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
