/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        emotion: {
          happy: '#F59E0B',      // Amber 500 - WCAG AA 개선
          sad: '#3B82F6',        // Blue 500 - 더 진한 대비
          angry: '#F87171',      // Red 400 - 부드러운 빨강
          anxious: '#A78BFA',    // Purple 400 - 유지
          neutral: '#6B7280',    // Gray 500 - 더 진한 대비
          surprised: '#FB923C',  // Orange 400 - 밝은 오렌지
          disgusted: '#10B981',  // Emerald 500 - 유지
          fearful: '#8B5CF6',    // Violet 500 - 유지
        },
        semantic: {
          success: '#10B981',    // Emerald 500
          warning: '#F59E0B',    // Amber 500
          error: '#EF4444',      // Red 500
          info: '#3B82F6',       // Blue 500
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
