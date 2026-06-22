import { ProductsManager } from '@/components/admin/ProductsManager';

export const metadata = { title: 'Quản lý sản phẩm — MAISON' };

export default function AdminProductsPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý sản phẩm</h1>
      <ProductsManager />
    </div>
  );
}
