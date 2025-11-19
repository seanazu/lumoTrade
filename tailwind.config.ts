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
            primary: '#111111',
            secondary: '#1a1a1a',
            tertiary: '#242424',
          },
          accent: {
            primary: '#4ecdc4',    // Turquoise
            secondary: '#1a535c',  // Dark teal
            success: '#4ecdc4',    // Turquoise
            warning: '#ffe66d',    // Yellow
            danger: '#ff6b6b',     // Coral
          },
        },
        // Vibrant modern palette
        light: {
          bg: {
            primary: '#f7fff7',     // Off-white cream
            secondary: '#ffffff',   // Pure white
            tertiary: '#e8f7f5',    // Very light teal tint
          },
          accent: {
            primary: '#4ecdc4',     // Bright turquoise
            secondary: '#1a535c',   // Dark teal
            highlight: '#ffe66d',   // Sunny yellow
            success: '#4ecdc4',     // Turquoise for gains
            warning: '#ffe66d',     // Yellow for alerts
            danger: '#ff6b6b',      // Coral red for losses
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
      boxShadow: {
        'glass-light': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glass-dark': '0 0 0 1px rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'glow': '0 0 0 1px rgba(78, 205, 196, 0.2)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

