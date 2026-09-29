/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc4fa',
          400: '#36a5f6',
          500: '#0c87eb',
          600: '#016ac9',
          700: '#0254a3',
          800: '#064886',
          900: '#0b3d6f',
        },
        ev: {
          teal: '#00a3ad',
          orange: '#f37021',
          yellow: '#f4eb22',
          blue: '#1e3a8a',
          navy: '#0f172a',
          purple: '#6b21a8',
          rowHeader: '#8b80b6',
        }
      },
    },
  },
  plugins: [],
}
