import Image from 'next/image';
import { Reveal } from '@/components/animation/Reveal';

export function Story() {
  return (
    <section id="story" className="bg-bone py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-xl2">
          <Image
            src="https://picsum.photos/seed/story/900/1100"
            alt="Câu chuyện thương hiệu"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow mb-4">Câu chuyện của chúng tôi</p>
          <h2 className="text-display-md mb-6">
            Vẻ đẹp đến từ <span className="italic text-clay">sự tinh giản</span>
          </h2>
          <p className="mb-5 max-w-lg leading-relaxed text-graphite">
            MAISON ra đời từ niềm tin rằng thời trang không cần phô trương để trở nên ấn tượng.
            Mỗi thiết kế là kết quả của quá trình tuyển chọn chất liệu kỹ lưỡng và đường cắt tinh tế.
          </p>
          <p className="max-w-lg leading-relaxed text-graphite">
            Chúng tôi hướng đến thời trang bền vững — ít hơn nhưng tốt hơn, để mỗi món đồ
            đồng hành cùng bạn qua nhiều mùa.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
