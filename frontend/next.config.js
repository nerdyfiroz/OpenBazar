/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001/api';

// Extract just the origin (protocol + host + port) from the API base URL
let backendOrigin = 'http://localhost:5001';
try {
  const url = new URL(API_BASE);
  backendOrigin = url.origin;
} catch {
  // keep default
}

const backendUrl = new URL(backendOrigin);

const nextConfig = {
  images: {
    remotePatterns: [
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

  // Proxy /uploads/* requests to the backend so images load without CORS issues
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
