export default function ProductsLoading() {
  return (
    <div className="container-page pt-[calc(var(--header-h)+3rem)]">
      <div className="mb-10">
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-bone" />
        <div className="h-10 w-64 animate-pulse rounded bg-bone" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse rounded-xl2 bg-bone" />
            <div className="mt-4 h-3 w-16 animate-pulse rounded bg-bone" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-bone" />
          </div>
        ))}
      </div>
    </div>
  );
}
