/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "kiiya-primary": "#7C6EF5",
        "kiiya-warm": "#F0956A",
        "kiiya-romantic": "#E8A0BF",
        "kiiya-bg": "#F7F5FF",
        "kiiya-dark": "#1E1B2E",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
