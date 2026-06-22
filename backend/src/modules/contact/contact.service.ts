import { ContactStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateContactInput, ListContactQuery } from './contact.schema';

/** Khách gửi liên hệ (public). */
export async function createContact(input: CreateContactInput) {
  return prisma.contactMessage.create({ data: input });
}

/** Danh sách tin nhắn liên hệ (STAFF/ADMIN). */
export async function listContacts(query: ListContactQuery) {
  const { page, pageSize, status } = query;
  const where: Prisma.ContactMessageWhereInput = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contactMessage.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** Cập nhật trạng thái xử lý. */
export async function updateContactStatus(id: string, status: ContactStatus) {
  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) throw AppError.notFound('Không tìm thấy tin nhắn');
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}
