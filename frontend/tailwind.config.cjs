const plugin = require("tailwindcss/plugin");
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "toast-in-right": {
          "0%": { opacity: "0", transform: "translateX(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "toast-out-right": {
          "0%": { opacity: "1", transform: "translateX(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateX(8px) scale(0.98)" },
        },
      },
      animation: {
        "scale-in": "scale-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "toast-in": "toast-in-right 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "toast-out":
          "toast-out-right 180ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".clip-pixel-corners-btn": {
          "clip-path": `polygon(
            0px calc(100% - 8px),
            2px calc(100% - 8px),
            2px calc(100% - 4px),
            6px calc(100% - 4px),
            6px 100%,
            calc(100% - 6px) 100%,
            calc(100% - 6px) calc(100% - 4px),
            calc(100% - 2px) calc(100% - 4px),
            calc(100% - 2px) calc(100% - 8px),
            100% calc(100% - 8px),
            100% 8px,
            calc(100% - 2px) 8px,
            calc(100% - 2px) 4px,
            calc(100% - 6px) 4px,
            calc(100% - 6px) 0px,
            6px 0px,
            6px 4px,
            2px 4px,
            2px 8px,
            0px 8px
          )`,
        },
      });
    }),
  ],
};
