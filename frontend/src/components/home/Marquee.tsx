const ITEMS = ['Hàng mới mỗi tuần', 'Đổi trả 30 ngày', 'Giao hàng toàn quốc', 'Thanh toán COD & QR', 'Thiết kế tại Việt Nam'];

/** Dải chữ chạy ngang vô tận — nhịp chuyển giữa các section. */
export function Marquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="-rotate-1 overflow-hidden border-y-2 border-ink bg-lime-400 py-3.5 text-ink" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-base font-extrabold uppercase tracking-wide sm:text-lg">
            {item}
            <span className="text-brand-600">✱</span>
          </span>
        ))}
      </div>
    </div>
  );
}
