import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateReceiptInput, ListReceiptsQuery } from './stock.schema';

function genReceiptCode(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `PN-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const receiptInclude = {
  supplier: { select: { id: true, name: true } },
  createdBy: { select: { username: true } },
  items: { include: { product: { select: { name: true, sku: true } } } },
};

/**
 * Lập phiếu nhập kho — tạo phiếu + chi tiết, CỘNG tồn kho (sản phẩm + biến thể),
 * cập nhật giá nhập mới nhất. Toàn bộ trong 1 transaction.
 */
export async function createReceipt(createdById: string, input: CreateReceiptInput) {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) throw AppError.notFound('Không tìm thấy nhà cung cấp');

  return prisma.$transaction(async (tx) => {
    let total = 0;
    const itemsData: Prisma.StockReceiptItemCreateManyReceiptInput[] = [];

    for (const it of input.items) {
      const product = await tx.product.findUnique({ where: { id: it.productId } });
      if (!product) throw AppError.badRequest(`Sản phẩm không tồn tại: ${it.productId}`);

      const lineTotal = it.quantity * it.costPrice;
      total += lineTotal;
      itemsData.push({
        productId: it.productId,
        size: it.size ?? null,
        color: it.color ?? null,
        quantity: it.quantity,
        costPrice: it.costPrice,
        lineTotal,
      });

      // Cộng tồn tổng + cập nhật giá nhập mới nhất
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity }, costPrice: it.costPrice },
      });
      // Cộng tồn biến thể nếu có
      if (it.size || it.color) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: it.productId, size: it.size ?? '', color: it.color ?? '' },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { increment: it.quantity } },
          });
        }
      }
    }

    return tx.stockReceipt.create({
      data: {
        code: genReceiptCode(),
        supplierId: input.supplierId,
        createdById,
        total,
        note: input.note,
        items: { createMany: { data: itemsData } },
      },
      include: receiptInclude,
    });
  });
}

export async function listReceipts(query: ListReceiptsQuery) {
  const { page, pageSize, supplierId } = query;
  const where: Prisma.StockReceiptWhereInput = supplierId ? { supplierId } : {};
  const [items, total] = await Promise.all([
    prisma.stockReceipt.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        supplier: { select: { name: true } },
        createdBy: { select: { username: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.stockReceipt.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getReceipt(id: string) {
  const receipt = await prisma.stockReceipt.findUnique({ where: { id }, include: receiptInclude });
  if (!receipt) throw AppError.notFound('Không tìm thấy phiếu nhập');
  return receipt;
}
