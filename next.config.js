/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: 'C:/Users/Bro/Documents/Delivery-app',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'media.delivery.rw',
      },
    ],
  },
};

module.exports = nextConfig;
