/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure external packages for server components (moved to root level)
  serverExternalPackages: ['@react-pdf/renderer', 'html2pdf.js', 'pdfmake', 'qrcode.react'],
  experimental: {
    // Add other experimental features here if needed
  },
  // Output as standalone for Docker, but this is automatically handled by Vercel
  // If deploying to Vercel, you can keep or remove this as Vercel optimizes the deployment
  output: 'standalone',
  // Add Vercel specific configurations if needed
  poweredByHeader: false,
};

export default nextConfig;
