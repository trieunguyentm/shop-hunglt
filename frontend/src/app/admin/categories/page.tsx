import { CategoriesManager } from '@/components/admin/CategoriesManager';

export const metadata = { title: 'Quản lý danh mục — MAISON' };

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý danh mục</h1>
      <CategoriesManager />
    </div>
  );
}
