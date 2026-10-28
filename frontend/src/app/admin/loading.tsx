import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-80" />
      <Skeleton className="mt-8 h-96 rounded-2xl" />
    </div>
  );
}
