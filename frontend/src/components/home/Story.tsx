import Image from 'next/image';
import { Leaf, Ruler, Shirt } from 'lucide-react';
import { Reveal } from '@/components/animation/Reveal';
import { SITE_IMAGES } from '@/lib/images';

const POINTS = [
  { icon: Shirt, title: 'Basic mà không nhàm', text: 'Thiết kế tối giản, dễ phối cho mọi dịp.' },
  { icon: Ruler, title: 'Form chuẩn người Việt', text: 'Bảng size đo theo vóc dáng thực tế.' },
  { icon: Leaf, title: 'Chất liệu dễ chịu', text: 'Cotton, linen thoáng mát cho khí hậu nóng ẩm.' },
];

export function Story() {
  return (
    <section id="story" className="scroll-mt-24 py-20">
      <div className="container-page">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-surface p-5 shadow-soft sm:p-8 lg:grid-cols-2 lg:gap-14 lg:p-10">
          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted lg:aspect-[5/6]">
            <Image src={SITE_IMAGES.story} alt="Giá treo quần áo tối giản của MAISON" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-3">Câu chuyện MAISON</p>
            <h2 className="heading-2">
              Ít món hơn, <span className="mark-lime">mặc được nhiều hơn</span>
            </h2>
            <p className="mt-5 max-w-lg text-ink-2">
              MAISON bắt đầu từ một ý tưởng đơn giản: tủ đồ đẹp không cần nhiều. Chúng tôi tập trung vào những món cơ bản
              được cắt may chỉn chu, để bạn phối nhanh mỗi sáng mà vẫn có chất riêng.
            </p>
            <ul className="mt-8 space-y-4">
              {POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-ink-3">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
