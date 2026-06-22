import { describe, expect, it } from 'vitest';
import { mapPrimaryRole } from './auth.service';
import { extractRoles } from '../../middlewares/auth.middleware';

// Test logic ánh xạ vai trò từ realm roles của Keycloak.
describe('mapPrimaryRole', () => {
  it('ưu tiên ADMIN cao nhất', () => {
    expect(mapPrimaryRole(['CUSTOMER', 'STAFF', 'ADMIN'])).toBe('ADMIN');
  });

  it('STAFF khi không có ADMIN', () => {
    expect(mapPrimaryRole(['CUSTOMER', 'STAFF'])).toBe('STAFF');
  });

  it('mặc định CUSTOMER', () => {
    expect(mapPrimaryRole(['CUSTOMER'])).toBe('CUSTOMER');
    expect(mapPrimaryRole([])).toBe('CUSTOMER');
  });
});

describe('extractRoles', () => {
  it('đọc realm_access.roles từ payload token', () => {
    expect(extractRoles({ realm_access: { roles: ['ADMIN', 'STAFF'] } })).toEqual([
      'ADMIN',
      'STAFF',
    ]);
  });

  it('trả mảng rỗng khi token không có realm_access', () => {
    expect(extractRoles({})).toEqual([]);
  });
});
