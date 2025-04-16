/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    // Only on the server side
    if (isServer) {
      // Handle pdf-parse and other Node.js modules
      config.externals = [...config.externals, 'canvas', 'jsdom'];
    } else {
      // For the client side, provide empty modules for Node.js specific modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
