/** npx tailwindcss -i ./css/input.css -o ./css/tailwind.css --watch */

module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"  
  ],
  darkMode: 'class', 
  theme: {
    extend: {},
  },
}

