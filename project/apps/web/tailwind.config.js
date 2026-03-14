/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        neutral: "rgb(var(--color-neutral) / <alpha-value>)",
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated":
          "rgb(var(--color-surface-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        focus: "rgb(var(--color-focus) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        disabled: "rgb(var(--color-disabled) / <alpha-value>)",

        // Backward-compatible aliases during incremental migration.
        app: {
          bg: "rgb(var(--color-bg) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          "surface-elevated":
            "rgb(var(--color-surface-elevated) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
          "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
          "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
          focus: "rgb(var(--color-focus) / <alpha-value>)",
          disabled: "rgb(var(--color-disabled) / <alpha-value>)",
        },
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
