import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function ProductDetailLoading() {
  return (
    <div className="container-page page-top">
      <Skeleton className="mb-6 h-4 w-56" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-[4/5] rounded-3xl" />
        <div className="space-y-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-8 w-40" />
          <SkeletonText lines={3} />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
