/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6B21A8", // Deep Purple
        secondary: "#10B981", // Neon Green
        background: {
          light: "#F3F4F6",
          dark: "#111827",
        },
        card: {
          light: "#FFFFFF",
          dark: "#1F2937",
        },
        text: {
          light: "#111827",
          dark: "#F9FAFB",
        }
      },
    },
  },
  plugins: [],
}
