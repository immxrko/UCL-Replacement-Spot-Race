import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#020617"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(148, 163, 184, 0.1), 0 20px 40px -20px rgba(59, 130, 246, 0.65)"
      },
      backgroundImage: {
        "hero-grad": "radial-gradient(1200px circle at 20% 0%, rgba(56, 189, 248, 0.25), transparent 45%), radial-gradient(900px circle at 100% 20%, rgba(168, 85, 247, 0.25), transparent 35%)"
      }
    }
  },
  plugins: []
};

export default config;
