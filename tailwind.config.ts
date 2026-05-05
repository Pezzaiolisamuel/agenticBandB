import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f8f6f1",
          100: "#efe8d9",
          200: "#ddceb0",
          300: "#cdb489",
          400: "#bd9b66",
          500: "#a8824c",
          600: "#85673c",
          700: "#654e30",
          800: "#453624",
          900: "#271d15"
        }
      }
    }
  },
  plugins: []
};

export default config;

