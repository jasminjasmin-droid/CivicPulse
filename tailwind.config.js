/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Government Fresh Theme
        gov: {
          primary: '#1565C0',     // Royal Blue
          primaryLight: '#E3F2FD',
          primaryDark: '#0D47A1',
          secondary: '#26A69A',   // Teal
          secondaryLight: '#E0F2F1',
          secondaryDark: '#00796B',
          accent: '#FFB300',      // Amber
          accentLight: '#FFF8E1',
          success: '#43A047',     // Green
          successLight: '#E8F5E9',
          warning: '#FB8C00',     // Orange
          warningLight: '#FFF3E0',
          error: '#E53935',       // Red
          errorLight: '#FFEBEE',
          bg: '#F5F7FA',          // Fresh light background
          card: '#FFFFFF',
          text: '#263238',        // Dark Gray
          muted: '#546E7A',
          border: '#CFD8DC',
          borderLight: '#ECEFF1',
        },
        civic: {
          critical: '#E53935',
          high: '#E53935',
          medium: '#FB8C00',
          inProgress: '#1565C0',
          resolved: '#43A047',
          escalated: '#8E24AA',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans Tamil',
          'Noto Sans Devanagari',
          'sans-serif'
        ],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(21, 101, 192, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 16px -2px rgba(21, 101, 192, 0.10), 0 2px 6px -1px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 8px 24px -4px rgba(21, 101, 192, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 12px 32px -4px rgba(21, 101, 192, 0.16), 0 6px 16px -2px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
