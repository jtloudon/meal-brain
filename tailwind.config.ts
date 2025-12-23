import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors (from docs/07_ui_design_system.md)
        primary: '#4A90E2',
        secondary: '#333333',
        accent: '#FFA500',
        surface: '#F9F9F9',
        border: '#F0F0F0',
      },
    },
  },
  plugins: [],
};

export default config;
