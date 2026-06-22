/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Đóng gói gọn cho Docker (server.js + node_modules tối thiểu)
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // three.js transpile (một số subpackage cần)
  transpilePackages: ['three'],
};

export default nextConfig;
