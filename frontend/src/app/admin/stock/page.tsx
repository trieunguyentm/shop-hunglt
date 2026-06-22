import { StockManager } from '@/components/admin/StockManager';

export const metadata = { title: 'Quản lý kho — MAISON' };

export default function AdminStockPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Nhập kho</h1>
      <StockManager />
    </div>
  );
}
