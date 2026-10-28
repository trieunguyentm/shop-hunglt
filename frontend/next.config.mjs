/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Đóng gói gọn cho Docker (server.js + node_modules tối thiểu)
  output: 'standalone',
  images: {
    // Admin có thể dán URL ảnh từ bất kỳ nguồn HTTPS nào (CDN, Unsplash...) — tránh
    // next/image ném lỗi "hostname not configured" làm hỏng trang sản phẩm.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // three.js transpile (một số subpackage cần)
  transpilePackages: ['three'],
};

export default nextConfig;
