/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Hide Next.js dev indicator
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // TypeScript strict mode
  typescript: {
    // Don't build with errors
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
