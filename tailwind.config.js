/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./sitescript.js",
    "./test.html"
  ],
  theme: {
    extend: {
      // Custom animations are defined in src/input.css, not here
      // This prevents Tailwind from generating utility classes that conflict with our custom CSS
    },
  },
  plugins: [],
}

