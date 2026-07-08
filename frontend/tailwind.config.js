/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        textMain: '#1e293b',
        textMuted: '#64748b',
        success: '#10b981',
        danger: '#ef4444'
      }
    },
  },
  plugins: [],
}
