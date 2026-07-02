/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "hsl(0, 0%, 0%)",
        foreground: "hsl(0, 0%, 98%)",
        card: {
          DEFAULT: "hsl(0, 0%, 6%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 4%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        primary: {
          DEFAULT: "hsl(45, 93%, 47%)",
          foreground: "hsl(0, 0%, 9%)",
        },
        secondary: {
          DEFAULT: "hsl(0, 0%, 12%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        muted: {
          DEFAULT: "hsl(0, 0%, 12%)",
          foreground: "hsl(0, 0%, 63%)",
        },
        accent: {
          DEFAULT: "hsl(45, 93%, 47%)",
          foreground: "hsl(0, 0%, 9%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        border: "hsl(0, 0%, 15%)",
        input: "hsl(0, 0%, 15%)",
        ring: "hsl(45, 93%, 47%)",
      },
      borderRadius: {
        lg: "0.8rem",
        md: "calc(0.8rem - 2px)",
        sm: "calc(0.8rem - 4px)",
      },
    },
  },
  plugins: [],
};
