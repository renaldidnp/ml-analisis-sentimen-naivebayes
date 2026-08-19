import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191F1B",
        paper: "#F2EEE1",
        "paper-deep": "#E7E1CD",
        turmeric: "#D69A2D",
        "turmeric-deep": "#B8811F",
        sage: "#587A52",
        brick: "#A44432",
        muted: "#767065",
        "muted-deep": "#5A5550",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      keyframes: {
        tagPop: {
          "0%": { opacity: "0", transform: "translateY(4px) scale(0.94)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "tag-pop": "tagPop 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "rise-in": "riseIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
