import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`[config] Thiếu biến môi trường bắt buộc: ${key}`);
  }
  return value;
}

const issuer = required('KEYCLOAK_ISSUER', 'http://localhost:8080/realms/fashion-shop');

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/fashion_shop',
  ),
  keycloak: {
    issuer,
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ??
      `${issuer}/protocol/openid-connect/certs`,
    // Audience kỳ vọng trong access token; để trống để bỏ qua kiểm tra aud.
    audience: process.env.KEYCLOAK_AUDIENCE ?? '',
    // Admin API — dùng để đăng ký & quản lý tài khoản từ backend
    baseUrl: process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM ?? 'fashion-shop',
    adminClientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID ?? 'admin-cli',
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME ?? 'admin',
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin',
  },
  // URL frontend (dùng cho returnUrl/cancelUrl của PayOS)
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  payos: {
    clientId: process.env.PAYOS_CLIENT_ID ?? '',
    apiKey: process.env.PAYOS_API_KEY ?? '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY ?? '',
    get configured() {
      return Boolean(this.clientId && this.apiKey && this.checksumKey);
    },
  },
} as const;
