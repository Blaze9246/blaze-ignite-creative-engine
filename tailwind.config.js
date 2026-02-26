/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blaze: {
          accent: '#11D6A3',
          accent2: '#0EB88A',
          panel: '#0D1111',
          panel2: '#111616',
          line: '#1A2020',
          text: '#E8F3F1',
          muted: '#7A8B88',
          danger: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
