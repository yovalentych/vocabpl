import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2b2118",
        paper: "#fbf3ea",
        moss: "#3f5c4f",
        terracotta: "#d46a4c",
        gold: "#e7b26f",
        fog: "#f4ede6"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "serif"]
      },
      boxShadow: {
        soft: "0 16px 34px rgba(43,33,24,0.18)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.65)"
      }
    }
  },
  plugins: []
};

export default config;
