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
              url: `https://picsum.photos/seed/${slug}/800/1000`,
              alt: p.name,
              isPrimary: true,
              sortOrder: 0,
            },
            {
              url: `https://picsum.photos/seed/${slug}-2/800/1000`,
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
    void product;
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
