/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "kiiya-primary": "#7C6EF5",
        "kiiya-warm": "#F0956A",
        "kiiya-romantic": "#E8A0BF",
        "kiiya-bg": "#F7F5FF",
        "kiiya-dark": "#1E1B2E",
        // Dark-mode surface palette (referenced via dark: variants).
        "kiiya-night": "#0F0E17",
        "kiiya-surface": "#1A1825",
        "kiiya-surface-2": "#221F32",
        "kiiya-sidebar": "#13111E",
        "kiiya-line": "#2D2A3E",
        "kiiya-text": "#F0EEFF",
        "kiiya-muted": "#A89EC9",
        "kiiya-faint": "#6B6480",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.1", fontWeight: "800" }],
        h1: ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)",
        primary: "0 4px 14px rgba(124,110,245,0.4)",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
        pill: "100px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(20px, -30px) scale(1.08)" },
          "66%": { transform: "translate(-15px, 15px) scale(0.95)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        modalIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "float-slow": "float 8s ease-in-out 1s infinite",
        blob: "blob 7s infinite",
        shimmer: "shimmer 2s infinite",
        "slide-up": "slideUp 0.3s ease-out both",
        "fade-in": "fadeIn 0.2s ease-out both",
        "modal-in": "modalIn 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
