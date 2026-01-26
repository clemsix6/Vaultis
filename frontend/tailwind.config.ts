import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Vaultis - Tech Premium
        gold: {
          DEFAULT: "#C9A227",
          light: "#E5C04B",
          dark: "#A68A1F",
          muted: "#8B7355",
        },
        surface: {
          DEFAULT: "#0a0a0a",
          card: "#111111",
          elevated: "#161616",
        },
        border: {
          DEFAULT: "#1a1a1a",
          subtle: "#252525",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gold-gradient": "linear-gradient(135deg, #C9A227 0%, #E5C04B 50%, #C9A227 100%)",
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "#030303",
            foreground: "#fafafa",
            primary: {
              50: "#FDF8E7",
              100: "#F9EEC4",
              200: "#F3DC8E",
              300: "#E5C04B",
              400: "#C9A227",
              500: "#C9A227",
              600: "#A68A1F",
              700: "#836D19",
              800: "#5F4F12",
              900: "#3C310C",
              DEFAULT: "#C9A227",
              foreground: "#030303",
            },
            focus: "#C9A227",
          },
        },
      },
    }),
  ],
};

export default config;
