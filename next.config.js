/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for client-side only components
  unstable_runtimeJS: true,
  // Prevent automatic static optimization for specific paths
  async rewrites() {
    return [
      {
        source: '/room-created',
        destination: '/room-created'
      },
      {
        source: '/components/WordSelection',
        destination: '/components/WordSelection'
      }
    ]
  }
}

module.exports = nextConfig 