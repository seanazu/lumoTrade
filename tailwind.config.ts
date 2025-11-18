import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern dark mode colors
        dark: {
          bg: {
            primary: '#0a0a0f',
            secondary: '#14141f',
            tertiary: '#1a1a2e',
          },
          accent: {
            primary: '#6366f1',    // Indigo
            secondary: '#8b5cf6',  // Purple
            success: '#10b981',    // Emerald
            warning: '#f59e0b',    // Amber
            danger: '#ef4444',     // Red
          },
        },
        // Lemon fresh light mode colors
        light: {
          bg: {
            primary: '#fffef7',     // Warm white
            secondary: '#fffce8',   // Light lemon
            tertiary: '#fff9d0',    // Soft lemon
          },
          accent: {
            primary: '#eab308',     // Bright yellow
            secondary: '#f59e0b',   // Amber
            success: '#22c55e',     // Green
            warning: '#f97316',     // Orange
            danger: '#dc2626',      // Red
          },
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          glow: 'var(--border-glow)',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

