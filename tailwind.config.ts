import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          "50": "#f5f8fa",
          "100": "#eaeff4",
          "200": "#cfdde8",
          "300": "#a6c1d3",
          "400": "#759ebb",
          "500": "#5482a3",
          "600": "#416988",
          "700": "#36546e",
          "800": "#2f485d",
          "900": "#2b3e4f",
          "950": "#202d3a",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans TC", "sans-serif"],
      },
      backgroundImage: {
        noise: "url('/noise.svg')",
      },
    },
  },
  plugins: [],
};
export default config;
