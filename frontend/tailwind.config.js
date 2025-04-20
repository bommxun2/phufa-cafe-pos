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
        'sage': {
          100: '#E6E9E6', // Background color from the design
        },
        'primary': {
          DEFAULT: '#006837', // Green color used in buttons
        },
      },
    },
  },
  plugins: [],
} 