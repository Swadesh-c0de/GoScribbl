import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pastel: {
          purple: {
            light: "#E6E6FA",
            DEFAULT: "#DCD0FF",
            dark: "#B19CD9",
            deep: "#7B68EE",
          },
          pink: {
            light: "#FFB6C1",
            DEFAULT: "#FFB7B2",
            dark: "#FF69B4",
          },
          green: {
            light: "#98FB98",
            DEFAULT: "#E2F0CB",
            dark: "#77DD77",
          },
          yellow: {
            light: "#FFFACD",
            DEFAULT: "#FFDAC1",
            dark: "#FFD700",
          },
          blue: {
            light: "#E0FFFF",
            DEFAULT: "#B5EAD7",
            dark: "#87CEEB",
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-fredoka)', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
