import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppToaster } from '@/components/providers/AppToaster';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { CartSync } from '@/components/cart/CartSync';

// Montserrat — cùng họ font với hocthongminh.com, có đủ dấu tiếng Việt
const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: {
    default: 'MAISON — Thời trang trẻ, mặc là chất',
    template: '%s · MAISON',
  },
  description: 'MAISON — thời trang trẻ trung, tối giản và dễ phối. Giao hàng toàn quốc, đổi trả 30 ngày.',
  keywords: ['thời trang', 'MAISON', 'streetwear', 'thời trang trẻ', 'thời trang Việt Nam'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'MAISON — Thời trang trẻ, mặc là chất',
    description: 'Thời trang trẻ trung, tối giản và dễ phối.',
    siteName: 'MAISON',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FAFAF7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <body>
        <AuthProvider>
          <ConfirmProvider>
            <CartSync />
            {children}
            <AppToaster />
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
