import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        village: {
          blue:      '#1877F2',
          blueDark:  '#1565C0',
          blueLight: '#42A5F5',
          bg:        '#F8F9FF',
        },
        // Day in Paradise — warm golden hour
        day: {
          bg:      '#FFF8EE',
          surface: '#FFFDF7',
          card:    '#FFFFFF',
          border:  '#F0E6D3',
          text:    '#2D1F0E',
          muted:   '#8B6F47',
          accent:  '#E8770A',
          gold:    '#F4A015',
          green:   '#2D7D46',
          sky:     '#4A90D9',
        },
        // Night in Paradise — tribal firelight
        night: {
          bg:      '#0A0B12',
          surface: '#0E1020',
          card:    '#12152A',
          border:  '#1E2240',
          text:    '#F0EBE0',
          muted:   '#7A7FA8',
          fire:    '#FF6B2B',
          ember:   '#FFB84D',
          spirit:  '#1877F2',
          glow:    '#4F9FFF',
          star:    '#E8D5FF',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: '#1877F2', foreground: '#FFFFFF' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
