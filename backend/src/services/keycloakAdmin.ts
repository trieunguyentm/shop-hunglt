import { env } from '../config/env';
import { AppError } from '../utils/AppError';

/**
 * Wrapper gọi Keycloak Admin REST API (dùng để đăng ký & quản lý tài khoản từ backend).
 * Lấy admin token bằng password grant của client `admin-cli` ở realm master.
 * Tài liệu: https://www.keycloak.org/docs-api/latest/rest-api/
 */

const { baseUrl, realm, adminClientId, adminUsername, adminPassword } = env.keycloak;
const ADMIN_BASE = `${baseUrl}/admin/realms/${realm}`;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 5000) {
    return cachedToken.value;
  }

  const res = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: adminClientId,
      username: adminUsername,
      password: adminPassword,
    }),
  });

  if (!res.ok) {
    throw new AppError(502, 'Không lấy được admin token từ Keycloak');
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return json.access_token;
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAdminToken();
  return fetch(`${ADMIN_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
}

interface RoleRepresentation {
  id: string;
  name: string;
}

/** Tạo user mới, trả về Keycloak user id. */
export async function createUser(input: {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}): Promise<string> {
  const res = await adminFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: 'password', value: input.password, temporary: false }],
    }),
  });

  if (res.status === 409) {
    throw AppError.conflict('Tên đăng nhập hoặc email đã tồn tại trên Keycloak');
  }
  if (!res.ok && res.status !== 201) {
    throw new AppError(502, 'Tạo user trên Keycloak thất bại');
  }
  // Keycloak trả id trong header Location: .../users/{id}
  const location = res.headers.get('location') ?? '';
  const id = location.split('/').pop();
  if (!id) throw new AppError(502, 'Không lấy được id user mới từ Keycloak');
  return id;
}

async function getRealmRole(name: string): Promise<RoleRepresentation> {
  const res = await adminFetch(`/roles/${encodeURIComponent(name)}`);
  if (!res.ok) throw new AppError(502, `Không tìm thấy realm role: ${name}`);
  return (await res.json()) as RoleRepresentation;
}

/** Gán các realm role cho user. */
export async function assignRealmRoles(userId: string, roleNames: string[]): Promise<void> {
  const roles = await Promise.all(roleNames.map(getRealmRole));
  const res = await adminFetch(`/users/${userId}/role-mappings/realm`, {
    method: 'POST',
    body: JSON.stringify(roles),
  });
  if (!res.ok) throw new AppError(502, 'Gán vai trò trên Keycloak thất bại');
}

/** Bỏ gán realm role khỏi user. */
export async function removeRealmRoles(userId: string, roleNames: string[]): Promise<void> {
  const roles = await Promise.all(roleNames.map(getRealmRole));
  const res = await adminFetch(`/users/${userId}/role-mappings/realm`, {
    method: 'DELETE',
    body: JSON.stringify(roles),
  });
  if (!res.ok) throw new AppError(502, 'Bỏ vai trò trên Keycloak thất bại');
}

/** Danh sách user (có tìm kiếm). */
export async function listUsers(params?: {
  search?: string;
  first?: number;
  max?: number;
}): Promise<KeycloakUser[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  qs.set('first', String(params?.first ?? 0));
  qs.set('max', String(params?.max ?? 50));
  const res = await adminFetch(`/users?${qs.toString()}`);
  if (!res.ok) throw new AppError(502, 'Lấy danh sách user thất bại');
  return (await res.json()) as KeycloakUser[];
}

/** Lấy realm roles của 1 user. */
export async function getUserRealmRoles(userId: string): Promise<string[]> {
  const res = await adminFetch(`/users/${userId}/role-mappings/realm`);
  if (!res.ok) return [];
  const roles = (await res.json()) as RoleRepresentation[];
  return roles.map((r) => r.name);
}

/** Bật/khóa user. */
export async function setUserEnabled(userId: string, enabled: boolean): Promise<void> {
  const res = await adminFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new AppError(502, 'Cập nhật trạng thái user thất bại');
}

/** Xóa user. */
export async function deleteUser(userId: string): Promise<void> {
  const res = await adminFetch(`/users/${userId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    throw new AppError(502, 'Xóa user thất bại');
  }
}
