import type { Config } from "tailwindcss";

// Token system for the toolkit — a working "creator ops" panel, not a
// marketing page. Deliberately not the cream/terracotta or near-black/
// acid-green defaults: cool paper background, ink sidebar, single indigo
// signal color, warm/green reserved strictly for blocked/eligible states.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1E2A",
        paper: "#EFF1F4",
        surface: "#FFFFFF",
        line: "#DADDE3",
        muted: "#6B7080",
        accent: {
          DEFAULT: "#4B3AFF",
          dim: "#EDEBFF",
          ink: "#2B21B8",
        },
        success: {
          DEFAULT: "#128A63",
          bg: "#E1F5EC",
        },
        warning: {
          DEFAULT: "#C24914",
          bg: "#FBEAE0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(28, 30, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
