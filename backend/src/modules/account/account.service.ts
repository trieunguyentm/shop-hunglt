import { prisma } from '../../config/prisma';
import * as keycloak from '../../services/keycloakAdmin';
import { mapPrimaryRole } from '../auth/auth.service';
import type {
  CreateAccountInput,
  ListAccountsQuery,
  UpdateAccountInput,
} from './account.schema';

const ALL_ROLES = ['ADMIN', 'STAFF', 'CUSTOMER'];

/** UC7 — Danh sách tài khoản (đọc từ Keycloak, kèm vai trò). */
export async function listAccounts(query: ListAccountsQuery) {
  const { search, page, pageSize } = query;
  const users = await keycloak.listUsers({
    search,
    first: (page - 1) * pageSize,
    max: pageSize,
  });

  const items = await Promise.all(
    users.map(async (u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? '',
      fullName: [u.firstName, u.lastName].filter(Boolean).join(' '),
      enabled: u.enabled,
      roles: (await keycloak.getUserRealmRoles(u.id)).filter((r) => ALL_ROLES.includes(r)),
    })),
  );

  return { items, meta: { page, pageSize, total: items.length } };
}

/** UC7 — Tạo tài khoản nhân viên/quản trị. */
export async function createAccount(input: CreateAccountInput) {
  const [firstName, ...rest] = input.fullName.trim().split(' ');
  const keycloakId = await keycloak.createUser({
    username: input.username,
    email: input.email,
    firstName,
    lastName: rest.join(' '),
    password: input.password,
  });
  await keycloak.assignRealmRoles(keycloakId, input.roles);

  const primary = mapPrimaryRole(input.roles);
  const role = await prisma.role.upsert({
    where: { name: primary },
    update: {},
    create: { name: primary },
  });
  await prisma.account.create({
    data: {
      keycloakId,
      username: input.username,
      email: input.email,
      roleId: role.id,
    },
  });

  return { id: keycloakId, username: input.username, roles: input.roles };
}

/** UC7 — Cập nhật vai trò / trạng thái tài khoản. */
export async function updateAccount(keycloakId: string, input: UpdateAccountInput) {
  if (input.roles) {
    const current = await keycloak.getUserRealmRoles(keycloakId);
    const desired = input.roles;
    const desiredSet: string[] = desired;
    const toAdd = desired.filter((r) => !current.includes(r));
    const toRemove = current.filter((r) => ALL_ROLES.includes(r) && !desiredSet.includes(r));
    if (toAdd.length) await keycloak.assignRealmRoles(keycloakId, toAdd);
    if (toRemove.length) await keycloak.removeRealmRoles(keycloakId, toRemove);

    // Đồng bộ vai trò chính xuống DB
    const primary = mapPrimaryRole(desired);
    const role = await prisma.role.upsert({
      where: { name: primary },
      update: {},
      create: { name: primary },
    });
    await prisma.account.updateMany({ where: { keycloakId }, data: { roleId: role.id } });
  }

  if (input.enabled !== undefined) {
    await keycloak.setUserEnabled(keycloakId, input.enabled);
    await prisma.account.updateMany({
      where: { keycloakId },
      data: { status: input.enabled ? 'ACTIVE' : 'INACTIVE' },
    });
  }

  return { id: keycloakId, updated: true };
}

/** UC7 — Xóa tài khoản. */
export async function deleteAccount(keycloakId: string) {
  await keycloak.deleteUser(keycloakId);
  await prisma.account.deleteMany({ where: { keycloakId } });
  return { id: keycloakId, deleted: true };
}
