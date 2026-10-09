/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        spin: 'spin 1.8s linear infinite',
      },
      colors: {
        ink: '#222831',
        panel: '#393e46',
        paper: '#eeeeee',
        brand: { DEFAULT: '#ffd369', dark: '#f2c14e' }
      }
    },
  },
  plugins: [],
}
