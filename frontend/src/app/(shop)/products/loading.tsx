import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function ProductsLoading() {
  return (
    <div className="container-page page-top">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-56" />
      <div className="my-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
