/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-montserrat)",
          "var(--font-almarai)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        "camion-red": "#b92124",
      },

      keyframes: {
        /* existing */
        "logo-breathe": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-1px) scale(1.01)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "spin-fast": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },

        /* promo pulse (desktop) */
        promoPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.95" },
        },

        /* ✅ MOBILE PROMO MARQUEE */
        "camion-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },

      animation: {
        /* existing */
        "logo-breathe": "logo-breathe 1.4s ease-in-out infinite",
        "fade-in": "fade-in 180ms ease-out both",
        "spin-fast": "spin-fast 0.7s linear infinite",

        /* promo animations */
        promoPulse: "promoPulse 1.2s ease-in-out infinite",
        "camion-marquee": "camion-marquee 10s linear infinite",
      },
    },
  },
  plugins: [],
};
