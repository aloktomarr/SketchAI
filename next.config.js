/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static generation for problematic pages
  experimental: {
    // This tells Next.js to not statically optimize these pages
    excludeDefaultMomentLocales: false,
  },
  // Use this instead of exportPathMap
  unstable_runtimeJS: true,
  // Explicitly set which pages should be server-side rendered
  trailingSlash: false,
  // Disable automatic static optimization for specific pages
  async headers() {
    return [
      {
        source: '/room-created',
        headers: [
          {
            key: 'x-static-export',
            value: 'false',
          },
        ],
      },
      {
        source: '/components/WordSelection',
        headers: [
          {
            key: 'x-static-export',
            value: 'false',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig 