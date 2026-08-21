import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep Slate/Navy untuk teks & elemen gelap utama
        ink: "#0F172A",
        // Latar belakang warm off-white bernuansa pastel dingin
        paper: "#F8FAFC",
        "paper-deep": "#F1F5F9",

        // Aksentulasi Utama: Biru Prabowo (Pastel Sky Blue) & Varian Deep-nya
        turmeric: "#60A5FA", // Aksen terang (Light Blue)
        "turmeric-deep": "#2563EB", // Aksen tegas (Brand Blue)

        // Indikator Sentimen & Status
        sage: "#059669", // Positif (Emerald Green)
        brick: "#E11D48", // Negatif (Rose Red)

        // Muted Colors untuk border & secondary text
        muted: "#64748B",
        "muted-deep": "#334155",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "blue-glow": "0 4px 20px -2px rgba(37, 99, 235, 0.12)",
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
        barGrow: {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        fadeSlide: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "12%": { opacity: "1", transform: "translateY(0)" },
          "88%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "150% 0" },
        },
      },
      animation: {
        "tag-pop": "tagPop 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "rise-in": "riseIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "bar-grow": "barGrow 1.1s ease-in-out infinite",
        "fade-slide": "fadeSlide 1.8s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
