import { LoadingBlock } from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <div className="container-page page-top">
      <LoadingBlock className="min-h-[50vh]" />
    </div>
  );
}
