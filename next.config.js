/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  images: {
    domains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  },
};

export default nextConfig;
