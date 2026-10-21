/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A1628",
        card: "#122238",
        edge: "#1A2E47",
        elevated: "#172941",
        deep: "#080E1A",
        paper: "#E8EEF4",
        dim: "#A8B8C8",
        muted: "#6B7D91",
        line: "#2A3E57",
        orange: "#D2691E",
        steel: "#6B93B8",
        sage: "#5B8F6F",
      },
      fontFamily: {
        display: ['Georgia', '"Times New Roman"', "serif"],
        body: ["Calibri", '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ["Consolas", '"Courier New"', "monospace"],
      },
    },
  },
  plugins: [],
};
