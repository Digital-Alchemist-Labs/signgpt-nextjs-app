/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette based on #445ED4 - Modern indigo/blue
        primary: {
          25: "#FAFBFF", // Ultra light background
          50: "#F4F6FF", // Light background
          100: "#E8ECFF", // Subtle accent
          200: "#D1DAFF", // Light borders
          300: "#A8B8FF", // Light text/icons
          400: "#7B92FF", // Medium emphasis
          500: "#445ED4", // Main brand color
          600: "#3B52C4", // Hover states
          700: "#2D3E9F", // Active states
          800: "#1E2B73", // Dark text
          900: "#0F1B4C", // Darkest text
          950: "#080F2A", // Maximum contrast
        },

        // Secondary palette - Complementary teal/cyan
        secondary: {
          25: "#F7FFFE",
          50: "#ECFFFE",
          100: "#D0FCFC",
          200: "#A6F7F7",
          300: "#67EDED",
          400: "#22D9D9",
          500: "#06B6B6", // Main secondary
          600: "#059999",
          700: "#087A7A",
          800: "#0D6161",
          900: "#0F4F4F",
          950: "#042E2E",
        },

        // Accent palette - Warm coral/orange
        accent: {
          25: "#FFFCFA",
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316", // Main accent
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },

        // Neutral palette - Cool grays with slight blue tint
        neutral: {
          25: "#FAFBFC",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B", // Main neutral
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },

        // Semantic colors
        success: {
          25: "#F6FEF9",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981", // Main success
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },

        warning: {
          25: "#FFFCF5",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // Main warning
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },

        error: {
          25: "#FFFBFA",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444", // Main error
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
        },

        // Background colors for better theming
        background: {
          primary: "#FFFFFF",
          secondary: "#F8FAFC",
          tertiary: "#F1F5F9",
        },

        // Dark mode background colors
        "background-dark": {
          primary: "#0F172A",
          secondary: "#1E293B",
          tertiary: "#334155",
        },

        // Surface colors for cards, modals, etc.
        surface: {
          primary: "#FFFFFF",
          secondary: "#F8FAFC",
          tertiary: "#F1F5F9",
          inverse: "#1E293B",
          "output-container": "#F1F5F9", // Slightly darker for output containers in light mode
        },

        "surface-dark": {
          primary: "#1E293B",
          secondary: "#334155",
          tertiary: "#475569",
          inverse: "#F8FAFC",
          "output-container": "#1E293B", // Same as primary for dark mode
        },

        // Border colors
        border: {
          primary: "#E2E8F0",
          secondary: "#CBD5E1",
          tertiary: "#94A3B8",
          focus: "#445ED4",
        },

        "border-dark": {
          primary: "#334155",
          secondary: "#475569",
          tertiary: "#64748B",
          focus: "#7B92FF",
        },
      },

      // Enhanced spacing scale
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },

      // Enhanced border radius
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      // Enhanced shadows with color-aware variants
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        primary: "0 4px 14px 0 rgb(68 94 212 / 0.25)",
        "primary-lg": "0 10px 30px 0 rgb(68 94 212 / 0.3)",
      },

      // Animation enhancements
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
