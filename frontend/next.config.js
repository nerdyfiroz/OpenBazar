/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://openbazar.onrender.com/api';

// Extract just the origin (protocol + host + port) from the API base URL
let backendOrigin = 'https://openbazar.onrender.com';
try {
  const url = new URL(API_BASE);
  backendOrigin = url.origin;
} catch {
  // keep default
}

const backendUrl = new URL(backendOrigin);

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    localPatterns: [
      {
        pathname: '/**',
        search: '?*',
      },
      {
        pathname: '/**',
        search: '',
      },
    ],
    remotePatterns: [
      // Allow Cloudinary-hosted images (when backend stores uploads in Cloudinary)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
      // Allow images from the backend server
      {
        protocol: backendUrl.protocol.replace(':', ''),
        hostname: backendUrl.hostname,
        port: backendUrl.port || '',
        pathname: '/uploads/**',
      },
      // Allow the production domain
      {
        protocol: 'https',
        hostname: 'open-bazar.me',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.open-bazar.me',
        pathname: '/uploads/**',
      },
      // Allow onrender.com (deployed backend)
      {
        protocol: 'https',
        hostname: '**.onrender.com',
        pathname: '/uploads/**',
      },
      // Allow Unsplash fallback images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Proxy /uploads/* and all /api/* routes (with Next.js internal pages/api taking priority)
  async rewrites() {
    return {
      fallback: [
        {
          source: '/uploads/:path*',
          destination: `${backendOrigin}/uploads/:path*`,
        },
        {
          source: '/api/:path*',
          destination: `${backendOrigin}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
