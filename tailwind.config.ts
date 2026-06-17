import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coffee: {
          950: "#fdf6ec",
          900: "#fdf6ec",
          800: "#f5ead8",
          700: "#ede0c8",
          600: "#e2d0b0",
          500: "#c8ad88",
          400: "#9a7d58",
          300: "#7a5a3a",
          200: "#8B4A00",
          100: "#4a3020",
          50:  "#2c1a0e",
        },
        cream: {
          DEFAULT: "#2c1a0e",
          muted:   "#4a3020",
          faint:   "#7a5a3a",
        },
        status: {
          green: "#4CAF50",
          amber: "#EF9F27",
          red:   "#E24B4A",
          blue:  "#60A0E8",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans:    ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;