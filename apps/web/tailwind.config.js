/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          pressed: "rgb(var(--color-primary-pressed) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          hover: "rgb(var(--color-secondary-hover) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          soft: "rgb(var(--color-success-soft) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          soft: "rgb(var(--color-danger-soft) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          soft: "rgb(var(--color-warning-soft) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          soft: "rgb(var(--color-info-soft) / <alpha-value>)",
        },
        neutral: {
          DEFAULT: "rgb(var(--color-neutral) / <alpha-value>)",
        },
        app: {
          bg: "rgb(var(--color-bg) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          "surface-elevated":
            "rgb(var(--color-surface-elevated) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
          "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
          "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
          disabled: "rgb(var(--color-disabled) / <alpha-value>)",
          focus: "rgb(var(--color-focus) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
