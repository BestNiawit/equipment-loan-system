/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // Disable optimization — local internal tool, no CDN needed
    unoptimized: true,
  },
}

export default nextConfig
