import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Mua sắm',
    links: [
      { label: 'Sản phẩm mới', href: '/products?sort=newest' },
      { label: 'Áo', href: '/products?category=ao' },
      { label: 'Quần', href: '/products?category=quan' },
      { label: 'Phụ kiện', href: '/products?category=phu-kien' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Chính sách đổi trả', href: '#' },
      { label: 'Hướng dẫn chọn size', href: '#' },
      { label: 'Vận chuyển', href: '#' },
      { label: 'Liên hệ', href: '/contact' },
    ],
  },
  {
    title: 'Về MAISON',
    links: [
      { label: 'Câu chuyện thương hiệu', href: '/#story' },
      { label: 'Cửa hàng', href: '#' },
      { label: 'Tuyển dụng', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="mt-32 border-t border-line bg-bone">
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl">
              MAISON<span className="text-clay">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-graphite">
              Thời trang tối giản, bền vững. Được tuyển chọn cho phong cách hiện đại.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="link-underline text-sm text-graphite hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-xs text-mist sm:flex-row sm:items-center">
          <p>© 2026 MAISON. Đồ án Thực tập doanh nghiệp.</p>
          <p>Next.js · TailwindCSS · three.js · GSAP · Node.js</p>
        </div>
      </div>
    </footer>
  );
}
