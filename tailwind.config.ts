import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/data/**/*.{js,ts,jsx,tsx,mdx}', // Added this line
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'coin-click-effect': { /* Added for completeness, but defined in globals.css for utility class */
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        'boost-pulse': {
          '50%': {
            transform: 'scale(1.05)',
            filter: 'drop-shadow(0 0 8px hsl(var(--primary))) brightness(1.15)',
          },
        },
        'rocket-rumble': {
          '0%': { transform: 'translate(0, 0) rotate(0)' },
          '25%': { transform: 'translate(1px, -1px) rotate(-0.2deg)' },
          '50%': { transform: 'translate(-1px, 1px) rotate(0.2deg)' },
          '75%': { transform: 'translate(1px, 1px) rotate(-0.2deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0)' },
        },
        'rocket-flames': {
          '0%': { 'box-shadow': '0 0 10px 0 #ffac81, 0 0 15px 5px #ff928b', opacity: '1' },
          '50%': { 'box-shadow': '0 0 12px 2px #ffac81, 0 0 18px 8px #ff928b', opacity: '0.8' },
          '100%': { 'box-shadow': '0 0 10px 0 #ffac81, 0 0 15px 5px #ff928b', opacity: '1' },
        },
        'staff-sway': {
          '0%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
          '100%': { transform: 'rotate(-3deg)' },
        },
        'magic-sparkles': {
          '0%': { filter: 'drop-shadow(0 0 3px #c084fc) drop-shadow(0 0 5px #c084fc)' },
          '50%': { filter: 'drop-shadow(0 0 5px #a78bfa) drop-shadow(0 0 10px #818cf8)' },
          '100%': { filter: 'drop-shadow(0 0 3px #c084fc) drop-shadow(0 0 5px #c084fc)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 4s ease-out',
        'accordion-up': 'accordion-up 4s ease-out',
        'coin-click': 'coin-click-effect 0.3s ease-out', /* Added for completeness */
        'boost-pulse': 'boost-pulse 12s ease-in-out infinite',
        'rocket-rumble': 'rocket-rumble 0.2s infinite linear',
        'rocket-flames': 'rocket-flames 0.4s infinite linear',
        'staff-sway': 'staff-sway 2.5s infinite ease-in-out',
        'magic-sparkles': 'magic-sparkles 1.5s infinite ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
