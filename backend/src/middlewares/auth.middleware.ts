import { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// Mở rộng kiểu Request để mang thông tin người dùng đã xác thực từ Keycloak
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthUser {
  keycloakId: string; // sub
  username: string;
  email: string;
  fullName: string;
  roles: string[]; // realm roles (ADMIN/STAFF/CUSTOMER...)
}

// JWKS của Keycloak — jose tự cache khoá công khai và làm mới khi xoay khoá
const JWKS = createRemoteJWKSet(new URL(env.keycloak.jwksUri));

interface KeycloakAccessToken extends JWTPayload {
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles?: string[] };
}

/** Lấy danh sách realm roles của ứng dụng từ payload token. */
export function extractRoles(payload: KeycloakAccessToken): string[] {
  return payload.realm_access?.roles ?? [];
}

/**
 * Xác thực access token do Keycloak cấp (verify chữ ký qua JWKS + iss + exp [+ aud]).
 * Gán thông tin người dùng vào req.user.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Thiếu access token'));
  }
  const token = header.slice('Bearer '.length);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.keycloak.issuer,
      ...(env.keycloak.audience ? { audience: env.keycloak.audience } : {}),
    });
    const p = payload as KeycloakAccessToken;
    req.user = {
      keycloakId: p.sub ?? '',
      username: p.preferred_username ?? '',
      email: p.email ?? '',
      fullName: p.name ?? [p.given_name, p.family_name].filter(Boolean).join(' '),
      roles: extractRoles(p),
    };
    return next();
  } catch {
    return next(AppError.unauthorized('Access token không hợp lệ hoặc đã hết hạn'));
  }
}

/**
 * Giới hạn truy cập theo realm role. VD: authorize('ADMIN', 'STAFF').
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    const ok = req.user.roles.some((r) => roles.includes(r));
    if (!ok) {
      return next(AppError.forbidden('Vai trò của bạn không được phép thực hiện thao tác này'));
    }
    return next();
  };
}
