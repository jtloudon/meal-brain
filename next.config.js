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
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // TypeScript strict mode
  typescript: {
    // Don't build with errors
    ignoreBuildErrors: false,
  },

  // Disable static optimization for now (authenticated app)
  output: 'standalone',
};

module.exports = nextConfig;
