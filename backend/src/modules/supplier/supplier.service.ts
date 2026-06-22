import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateSupplierInput, UpdateSupplierInput } from './supplier.schema';

export async function listSuppliers(search?: string) {
  const where: Prisma.SupplierWhereInput = search
    ? { name: { contains: search, mode: 'insensitive' } }
    : {};
  return prisma.supplier.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw AppError.notFound('Không tìm thấy nhà cung cấp');
  return supplier;
}

export async function createSupplier(input: CreateSupplierInput) {
  return prisma.supplier.create({
    data: { ...input, email: input.email || null },
  });
}

export async function updateSupplier(id: string, input: UpdateSupplierInput) {
  await getSupplier(id);
  return prisma.supplier.update({
    where: { id },
    data: { ...input, ...(input.email !== undefined ? { email: input.email || null } : {}) },
  });
}

export async function deleteSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!supplier) throw AppError.notFound('Không tìm thấy nhà cung cấp');
  if (supplier._count.products > 0) {
    throw AppError.conflict('Không thể xóa: nhà cung cấp đang gắn với sản phẩm');
  }
  await prisma.supplier.delete({ where: { id } });
  return { id, deleted: true };
}
