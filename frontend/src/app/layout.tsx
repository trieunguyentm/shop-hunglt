import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartSync } from '@/components/cart/CartSync';

// Serif display cho tiêu đề (đặc trưng tạp chí thời trang)
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});

// Sans cho nội dung
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: {
    default: 'MAISON — Thời trang tối giản, bền vững',
    template: '%s · MAISON',
  },
  description:
    'Hệ thống bán hàng thời trang MAISON. Thiết kế tối giản cao cấp, chất liệu bền vững.',
  keywords: ['thời trang', 'MAISON', 'tối giản', 'bền vững', 'thời trang Việt Nam'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'MAISON — Thời trang tối giản, bền vững',
    description: 'Thiết kế tối giản cao cấp, chất liệu bền vững.',
    siteName: 'MAISON',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <CartSync />
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
