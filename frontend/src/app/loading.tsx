export default function Loading() {
  return (
    <div className="container-page flex min-h-screen items-center justify-center pt-[var(--header-h)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-clay" />
        <p className="eyebrow">Đang tải</p>
      </div>
    </div>
  );
}
