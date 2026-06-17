/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light: '#F4F7EE',
          dark: '#728246',
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
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          light: '#EAF3E2',
          DEFAULT: '#7BA05B',
          dark: '#648748',
        },
        warning: {
          light: '#FBF1E8',
          DEFAULT: '#D8A06B',
          dark: '#B77E4B',
        },
        beige: {
          light: '#F8F2EC',
          DEFAULT: '#EEDCCB',
        },
        app: {
          background: '#FAF9F7',
          card: '#FFFFFF',
          surface: '#F6F4EF',
          'surface-muted': '#F1EEE8',
          border: '#E8E6E1',
          ring: '#8A9B5A',
          text: {
            title: '#1F1F1F',
            primary: '#2D2D2D',
            secondary: '#7A7A7A',
            muted: '#95908A',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 8px 26px rgba(45, 45, 45, 0.07)',
        card: '0 14px 34px rgba(45, 45, 45, 0.08)',
        insetSoft: 'inset 0 1px 0 rgba(255, 255, 255, 0.65)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'success-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '65%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'success-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.55)', opacity: '0' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-5vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(105vh) rotate(540deg)', opacity: '0' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'kds-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.15)' },
          '50%': { boxShadow: '0 0 0 6px rgba(220, 38, 38, 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'success-pop': 'success-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'success-ring': 'success-ring 1.2s ease-out infinite',
        'confetti-fall': 'confetti-fall 2.8s ease-in forwards',
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'kds-pulse': 'kds-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
