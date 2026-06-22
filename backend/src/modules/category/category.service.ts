import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { uniqueSlug } from '../../utils/slugify';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

/** Danh sách danh mục (phẳng) kèm số sản phẩm — FE tự dựng cây cha-con. */
export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true, children: true } } },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true },
  });
  if (!category) throw AppError.notFound('Không tìm thấy danh mục');
  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = await uniqueSlug(input.name, async (s) => {
    const c = await prisma.category.findUnique({ where: { slug: s } });
    return c !== null;
  });
  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      parentId: input.parentId || null,
    },
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await getCategory(id);
  if (input.parentId === id) {
    throw AppError.badRequest('Danh mục không thể là cha của chính nó');
  }
  return prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      parentId: input.parentId === undefined ? undefined : input.parentId || null,
    },
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!category) throw AppError.notFound('Không tìm thấy danh mục');
  if (category._count.products > 0) {
    throw AppError.conflict('Không thể xóa: danh mục đang chứa sản phẩm');
  }
  if (category._count.children > 0) {
    throw AppError.conflict('Không thể xóa: danh mục đang có danh mục con');
  }
  await prisma.category.delete({ where: { id } });
  return { id, deleted: true };
}
