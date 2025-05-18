/** @type {import('tailwindcss').Config} */
export default {
  darkMode:'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      dropShadow: {
        'custom-light': '0 2px 7px rgba(255, 255, 255, 0.3)',
        'custom-dark': '0 2px 4px rgba(0, 0, 0, 0.3)',
       'custom-red': '0px 0 1px rgba(255, 0, 0, 0.5)',
      },
      colors: {
        'bg': '#111827',
        'card': '#374151',
        'border':'#4b5563',
        'custom-black': '#09090b',
        'custom-white': '#38c172',
        'custom-secondary': '#18181b',
        'bluee':'#4c91ff',
        'blueh':'#3A59D1',
      }
      
    },
  },
  plugins: [],
}

