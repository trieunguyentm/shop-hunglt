import {
  PrismaClient,
  RoleName,
  DiscountType,
  ProductStatus,
} from '@prisma/client';
import dotenv from 'dotenv';

// Lưu ý: Tài khoản người dùng do Keycloak quản lý (xem code/infra/keycloak).
// Bảng Account/Customer được đồng bộ tự động khi user đăng nhập lần đầu (GET /auth/me).
// Seed chỉ tạo dữ liệu danh mục/sản phẩm + vai trò (Role) tham chiếu.

dotenv.config();

const prisma = new PrismaClient();

// Ảnh sản phẩm thật (Unsplash — miễn phí sử dụng), theo slug sản phẩm
const PRODUCT_IMAGES: Record<string, [string, string]> = {
  'ao-thun-cotton-oversize': [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&w=900&q=80'
  ],
  'so-mi-linen-tay-dai': [
    'https://images.unsplash.com/photo-1752825609278-f9696bc9d7bd?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1740711152088-88a009e877bb?auto=format&fit=crop&w=900&q=80'
  ],
  'quan-jean-slim-fit': [
    'https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=900&q=80'
  ],
  'quan-short-kaki': [
    'https://images.unsplash.com/photo-1697319452360-ee47502e39f6?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1771711286856-765bdbca923f?auto=format&fit=crop&crop=top&w=900&h=760&q=80'
  ],
  'dam-suong-toi-gian': [
    'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=80'
  ],
  'chan-vay-xep-ly': [
    'https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=80'
  ],
  'tui-tote-canvas': [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1535981444082-2a5dc0548ef3?auto=format&fit=crop&w=900&q=80'
  ],
  'that-lung-da-bo': [
    'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1752386296085-fd15d8b46ee7?auto=format&fit=crop&w=900&q=80'
  ],
};

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // 1) Vai trò
  const [adminRole, staffRole, customerRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, description: 'Quản trị viên' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.STAFF },
      update: {},
      create: { name: RoleName.STAFF, description: 'Nhân viên' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.CUSTOMER },
      update: {},
      create: { name: RoleName.CUSTOMER, description: 'Khách hàng' },
    }),
  ]);

  void adminRole;
  void staffRole;
  void customerRole;
  console.log('   ✓ Vai trò (ADMIN/STAFF/CUSTOMER) sẵn sàng. Tài khoản đăng nhập qua Keycloak.');

  // 3) Danh mục
  const categoriesData = [
    { name: 'Áo', description: 'Áo thun, sơ mi, khoác' },
    { name: 'Quần', description: 'Quần jean, kaki, short' },
    { name: 'Đầm & Váy', description: 'Đầm, chân váy' },
    { name: 'Phụ kiện', description: 'Túi, thắt lưng, mũ' },
  ];
  const categories = [];
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { name: c.name, slug: slugify(c.name), description: c.description },
    });
    categories.push(cat);
  }

  // 4) Nhà cung cấp
  const supplier = await prisma.supplier.upsert({
    where: { id: 'seed-supplier-1' },
    update: {},
    create: {
      id: 'seed-supplier-1',
      name: 'Xưởng may Thời Trang Việt',
      address: 'Hà Nội',
      phone: '0911222333',
      email: 'ncc@fashion.local',
      contactPerson: 'Trần Thị Cung',
    },
  });

  // 5) Sản phẩm mẫu
  const productsData = [
    { name: 'Áo thun cotton oversize', price: 199000, cost: 90000, cat: 0, material: 'Cotton 100%' },
    { name: 'Sơ mi linen tay dài', price: 349000, cost: 180000, cat: 0, material: 'Linen' },
    { name: 'Quần jean slim-fit', price: 459000, cost: 250000, cat: 1, material: 'Denim' },
    { name: 'Quần short kaki', price: 259000, cost: 120000, cat: 1, material: 'Kaki' },
    { name: 'Đầm suông tối giản', price: 529000, cost: 300000, cat: 2, material: 'Tuyết mưa' },
    { name: 'Chân váy xếp ly', price: 389000, cost: 200000, cat: 2, material: 'Polyester' },
    { name: 'Túi tote canvas', price: 179000, cost: 70000, cat: 3, material: 'Canvas' },
    { name: 'Thắt lưng da bò', price: 299000, cost: 140000, cat: 3, material: 'Da bò' },
  ];

  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Đen', 'Trắng', 'Be'];

  for (let i = 0; i < productsData.length; i++) {
    const p = productsData[i];
    const slug = slugify(p.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        sku: `SP-${String(i + 1).padStart(4, '0')}`,
        name: p.name,
        slug,
        description: `${p.name} — chất liệu ${p.material}, thiết kế hiện đại, dễ phối đồ.`,
        salePrice: p.price,
        costPrice: p.cost,
        stock: 100,
        material: p.material,
        status: ProductStatus.ACTIVE,
        categoryId: categories[p.cat].id,
        supplierId: supplier.id,
        images: {
          create: [
            {
              url: PRODUCT_IMAGES[slug]?.[0] ?? `https://picsum.photos/seed/${slug}/800/1000`,
              alt: p.name,
              isPrimary: true,
              sortOrder: 0,
            },
            {
              url: PRODUCT_IMAGES[slug]?.[1] ?? `https://picsum.photos/seed/${slug}-2/800/1000`,
              alt: `${p.name} - góc khác`,
              sortOrder: 1,
            },
          ],
        },
        variants: {
          create: sizes.flatMap((size) =>
            colors.map((color) => ({ size, color, stock: 10 })),
          ),
        },
      },
    });
    // DB seed từ bản cũ còn ảnh picsum (ảnh ngẫu nhiên) → thay bằng ảnh sản phẩm thật
    const imgs = PRODUCT_IMAGES[slug];
    if (imgs) {
      const old = await prisma.productImage.findMany({
        where: { productId: product.id },
        orderBy: { sortOrder: 'asc' },
      });
      for (const [idx, img] of old.entries()) {
        if (img.url.includes('picsum.photos') && imgs[idx]) {
          await prisma.productImage.update({ where: { id: img.id }, data: { url: imgs[idx] } });
        }
      }
    }
  }

  // 6) Khuyến mãi mẫu
  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      name: 'Chào mừng - giảm 10%',
      code: 'WELCOME10',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      minOrderTotal: 300000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      quantityLeft: 1000,
      isActive: true,
    },
  });

  console.log('✅ Seed hoàn tất.');
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
