const ITEMS = ['Giao hàng toàn quốc', 'Đổi trả trong 30 ngày', 'Chất liệu bền vững', 'Thiết kế tại Việt Nam'];

/** Dải chữ chạy ngang vô tận — điểm nhấn động giữa các section. */
export function Marquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-line bg-ink py-4 text-ivory">
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-12 text-sm uppercase tracking-widest2">
            {item}
            <span className="text-clay">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
