/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Fonts ────────────────────────────────────── */
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },

      /* ── Colors ───────────────────────────────────── */
      colors: {
        "bc-bg": "var(--bc-bg)",
        "bc-bg-elev": "var(--bc-bg-elev)",
        "bc-bg-tint": "var(--bc-bg-tint)",
        "bc-surface": "var(--bc-surface)",
        "bc-surface-2": "var(--bc-surface-2)",
        "bc-surface-muted": "var(--bc-surface-muted)",
        "bc-surface-glass": "var(--bc-surface-glass)",

        "bc-primary": "var(--bc-primary)",
        "bc-primary-hover": "var(--bc-primary-hover)",
        "bc-primary-soft": "var(--bc-primary-soft)",
        "bc-primary-soft-strong": "var(--bc-primary-soft-strong)",

        "bc-secondary": "var(--bc-secondary)",
        "bc-secondary-soft": "var(--bc-secondary-soft)",

        "bc-accent-sage": "var(--bc-accent-sage)",
        "bc-accent-sky": "var(--bc-accent-sky)",
        "bc-accent-plum": "var(--bc-accent-plum)",

        "bc-text": "var(--bc-text)",
        "bc-text-soft": "var(--bc-text-soft)",
        "bc-subtext": "var(--bc-subtext)",
        "bc-border": "var(--bc-border)",
        "bc-border-strong": "var(--bc-border-strong)",
        "bc-border-glow": "var(--bc-border-glow)",

        "bc-success": "var(--bc-success)",
        "bc-warning": "var(--bc-warning)",
        "bc-danger": "var(--bc-danger)",
      },

      /* ── Background images / gradients ────────────── */
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "bc-primary-grad":
          "linear-gradient(135deg, var(--bc-primary-grad-from), var(--bc-primary-grad-mid), var(--bc-primary-grad-to))",
        "bc-secondary-grad":
          "linear-gradient(135deg, var(--bc-secondary-grad-from), var(--bc-secondary-grad-to))",
        "bc-hero": "var(--bc-hero-bg)",
      },

      /* ── Border radius ────────────────────────────── */
      borderRadius: {
        "bc-sm": "8px",
        "bc-md": "10px",
        "bc-lg": "14px",
        "bc-xl": "18px",
        "bc-2xl": "22px",
        "bc-3xl": "28px",
      },

      /* ── Box shadows ──────────────────────────────── */
      boxShadow: {
        "bc-xs": "var(--bc-shadow-xs)",
        "bc-sm": "var(--bc-shadow-sm)",
        "bc-md": "var(--bc-shadow-md)",
        "bc-lg": "var(--bc-shadow-lg)",
        "bc-xl": "var(--bc-shadow-xl)",
        "bc-glow": "var(--bc-shadow-glow)",
        "bc-primary": "var(--bc-shadow-primary)",
        "bc-primary-hover": "var(--bc-shadow-primary-hover)",
      },

      /* ── Transitions ──────────────────────────────── */
      transitionTimingFunction: {
        "bc-ease": "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      /* ── Animations & keyframes ───────────────────── */
      keyframes: {
        "bc-fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bc-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "bc-float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "bc-blob": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(18px, -12px) scale(1.05)" },
          "66%": { transform: "translate(-12px, 8px) scale(0.97)" },
        },
        "bc-pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.4)" },
        },
      },
      animation: {
        "bc-fade-up": "bc-fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "bc-float": "bc-float 4s ease-in-out infinite",
        "bc-float-slow": "bc-float-slow 6s ease-in-out infinite",
        "bc-blob": "bc-blob 14s ease-in-out infinite",
        "bc-pulse-glow": "bc-pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
