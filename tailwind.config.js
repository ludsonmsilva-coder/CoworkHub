/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0E4A7A",
          light: "#E8F0F7",
          dark: "#0B3A62",
        },
        ink: "#111827",
        "ink-mid": "#374151",
        "ink-low": "#6B7280",
        paper: "#F2F5F8",
        "paper-dark": "#0B1220",
        card: "#FFFFFF",
        "card-dark": "#111C2D",
        border: "#E5E7EB",
        "border-dark": "#243245",
        success: "#059669",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};
