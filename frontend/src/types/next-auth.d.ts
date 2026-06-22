import type { DefaultSession } from 'next-auth';

// Mở rộng kiểu Session & JWT của Auth.js để mang access token + realm roles.
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    roles?: string[];
    error?: string;
    user: DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    roles?: string[];
    error?: string;
  }
}
