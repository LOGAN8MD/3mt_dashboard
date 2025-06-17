/** @type {import('tailwindcss').Config} */
// export default {
//     content: [
//       "./index.html",
//       "./src/**/*.{js,ts,jsx,tsx}",
//     ],
//     theme: {
//       extend: {},
//     },
//     plugins: [],
//   }

module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}", // Update the file types that TailwindCSS should scan
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};