/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        raised: 'var(--bg-raised)',
        brand: {
          primary: 'var(--brand-primary)',
          dark: 'var(--brand-dark)',
          light: 'var(--brand-light)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
        },
        positive: {
          DEFAULT: 'var(--positive)',
          light: 'var(--positive-light)',
          dark: 'var(--positive-dark)',
        },
        negative: {
          DEFAULT: 'var(--negative)',
          light: 'var(--negative-light)',
          dark: 'var(--negative-dark)',
        },
        neutral: 'var(--neutral)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border)'
      }
    },
  },
  plugins: [],
}
