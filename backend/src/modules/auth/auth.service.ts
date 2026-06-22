import { RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { AuthUser } from '../../middlewares/auth.middleware';
import * as keycloak from '../../services/keycloakAdmin';
import type { RegisterInput } from './auth.schema';

/** Chọn vai trò chính theo độ ưu tiên ADMIN > STAFF > CUSTOMER. */
export function mapPrimaryRole(roles: string[]): RoleName {
  if (roles.includes('ADMIN')) return RoleName.ADMIN;
  if (roles.includes('STAFF')) return RoleName.STAFF;
  return RoleName.CUSTOMER;
}

async function ensureRole(name: RoleName) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

/**
 * Đồng bộ thông tin từ access token Keycloak xuống DB (idempotent).
 * - Upsert Account theo keycloakId.
 * - Nếu là CUSTOMER: tạo hồ sơ Customer + giỏ hàng nếu chưa có.
 */
export async function syncFromToken(authUser: AuthUser) {
  if (!authUser.keycloakId) throw AppError.unauthorized('Token thiếu thông tin người dùng');

  const primary = mapPrimaryRole(authUser.roles);
  const role = await ensureRole(primary);

  const account = await prisma.account.upsert({
    where: { keycloakId: authUser.keycloakId },
    update: {
      username: authUser.username,
      email: authUser.email,
      roleId: role.id,
    },
    create: {
      keycloakId: authUser.keycloakId,
      username: authUser.username || authUser.keycloakId,
      email: authUser.email || `${authUser.keycloakId}@no-email.local`,
      roleId: role.id,
    },
  });

  if (primary === RoleName.CUSTOMER) {
    const existing = await prisma.customer.findUnique({ where: { accountId: account.id } });
    if (!existing) {
      await prisma.customer.create({
        data: {
          accountId: account.id,
          fullName: authUser.fullName || authUser.username || 'Khách hàng',
          cart: { create: {} },
        },
      });
    }
  }

  return getProfileByKeycloakId(authUser.keycloakId);
}

/**
 * Đảm bảo có hồ sơ Customer (+ Cart) cho người dùng hiện tại — dùng cho cart/order.
 * Cho phép bất kỳ ai có realm role CUSTOMER (kể cả admin có thêm role này).
 */
export async function ensureCustomer(authUser: AuthUser) {
  if (!authUser.keycloakId) throw AppError.unauthorized();
  if (!authUser.roles.includes('CUSTOMER')) {
    throw AppError.forbidden('Chỉ khách hàng mới sử dụng được chức năng này');
  }
  const role = await ensureRole(mapPrimaryRole(authUser.roles));
  const account = await prisma.account.upsert({
    where: { keycloakId: authUser.keycloakId },
    update: { username: authUser.username, email: authUser.email, roleId: role.id },
    create: {
      keycloakId: authUser.keycloakId,
      username: authUser.username || authUser.keycloakId,
      email: authUser.email || `${authUser.keycloakId}@no-email.local`,
      roleId: role.id,
    },
  });
  const existing = await prisma.customer.findUnique({ where: { accountId: account.id } });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      accountId: account.id,
      fullName: authUser.fullName || authUser.username || 'Khách hàng',
      cart: { create: {} },
    },
  });
}

/** Đảm bảo có Account (mirror) cho người dùng hiện tại — trả về account. Dùng cho audit (nhập kho...). */
export async function ensureAccount(authUser: AuthUser) {
  if (!authUser.keycloakId) throw AppError.unauthorized();
  const role = await ensureRole(mapPrimaryRole(authUser.roles));
  return prisma.account.upsert({
    where: { keycloakId: authUser.keycloakId },
    update: { username: authUser.username, email: authUser.email, roleId: role.id },
    create: {
      keycloakId: authUser.keycloakId,
      username: authUser.username || authUser.keycloakId,
      email: authUser.email || `${authUser.keycloakId}@no-email.local`,
      roleId: role.id,
    },
  });
}

/** Lấy hồ sơ người dùng theo keycloakId. */
export async function getProfileByKeycloakId(keycloakId: string) {
  const account = await prisma.account.findUnique({
    where: { keycloakId },
    include: { role: true, customer: true },
  });
  if (!account) throw AppError.notFound('Chưa đồng bộ tài khoản');
  return toAccountDto(account);
}

/**
 * Đăng ký khách hàng mới (UC13) qua Keycloak Admin API + đồng bộ DB.
 * (Phương án thay thế cho trang đăng ký mặc định của Keycloak.)
 */
export async function register(input: RegisterInput) {
  const [firstName, ...rest] = input.fullName.trim().split(' ');
  const lastName = rest.join(' ');

  const keycloakId = await keycloak.createUser({
    username: input.username,
    email: input.email,
    firstName,
    lastName,
    password: input.password,
  });
  await keycloak.assignRealmRoles(keycloakId, ['CUSTOMER']);

  const role = await ensureRole(RoleName.CUSTOMER);
  const account = await prisma.account.create({
    data: {
      keycloakId,
      username: input.username,
      email: input.email,
      roleId: role.id,
      customer: {
        create: { fullName: input.fullName, phone: input.phone, cart: { create: {} } },
      },
    },
    include: { role: true, customer: true },
  });

  return toAccountDto(account);
}

function toAccountDto(account: {
  id: string;
  username: string;
  email: string;
  status: string;
  role: { name: string };
  customer: { id: string; fullName: string; phone: string | null } | null;
}) {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    status: account.status,
    role: account.role.name,
    customer: account.customer
      ? {
          id: account.customer.id,
          fullName: account.customer.fullName,
          phone: account.customer.phone,
        }
      : null,
  };
}
