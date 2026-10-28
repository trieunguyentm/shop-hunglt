import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/** Khung cho toàn bộ trang bán hàng: header cố định + footer. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
