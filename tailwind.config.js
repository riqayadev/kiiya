/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "kiiya-primary": "#7C6EF5",
        "kiiya-warm": "#F0956A",
        "kiiya-romantic": "#E8A0BF",
        "kiiya-bg": "#F7F5FF",
        "kiiya-dark": "#1E1B2E",
      },
    },
  },
  plugins: [],
};
