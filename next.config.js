/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
  webpack(config) {
    return config;
  },
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 