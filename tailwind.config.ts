import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        "paper-2": "var(--color-paper-2)",
        "paper-3": "var(--color-paper-3)",
        ink: "var(--color-ink)",
        "ink-deep": "var(--color-ink-deep)",
        "ink-2": "var(--color-ink-2)",
        muted: "var(--color-muted)",
        neutral: "var(--color-neutral)",
        rule: "var(--color-rule)",
        "rule-2": "var(--color-rule-2)",
        accent: "var(--color-accent)",
        "accent-deep": "var(--color-accent-deep)",
        "accent-soft": "var(--color-accent-soft)",
        "accent-ink": "var(--color-accent-ink)",
        focus: "var(--color-focus)",
        success: "var(--color-success)",
        "success-soft": "var(--color-success-soft)",
        warn: "var(--color-warn)",
        "warn-soft": "var(--color-warn-soft)",
        danger: "var(--color-danger)",
        "danger-soft": "var(--color-danger-soft)",
        info: "var(--color-info)",
        "info-soft": "var(--color-info-soft)",
        purple: "var(--color-purple)",
        "purple-soft": "var(--color-purple-soft)",
        scrim: "var(--color-scrim)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
