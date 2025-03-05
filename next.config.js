/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static generation for problematic pages
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // Remove problematic pages from static generation
    const pathMap = { ...defaultPathMap };
    delete pathMap['/components/WordSelection'];
    delete pathMap['/room-created'];
    return pathMap;
  },
}

module.exports = nextConfig 