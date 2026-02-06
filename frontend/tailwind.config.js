/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#113780",
        "primary-dark": "#0C2A5C",
        "primary-light": "#1E4A9C",
        secondary: "#14b8a6",
        accent: "#f97316",
      },
    },
  },
  plugins: [],
};
