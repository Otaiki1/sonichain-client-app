/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF2E63',
        secondary: '#FF6B9D',
        accent: '#00FFFF',
        background: '#1A0E14',
        card: '#2A1520',
        border: '#3D1F2E',
        error: '#FF4444',
        success: '#28FFBF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#D4A5B8',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      fontSize: {
        h1: ['32px', { lineHeight: '38px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '29px', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '21px', fontWeight: '400' }],
        small: ['12px', { lineHeight: '18px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
