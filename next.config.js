/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Node.js built-in modules on the client side
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
