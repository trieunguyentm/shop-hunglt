import { z } from 'zod';

// Đăng nhập/đăng xuất/refresh do Keycloak + Auth.js xử lý ở frontend.
// Backend chỉ cần schema cho đăng ký (phương án tạo user qua Admin API).
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự').max(50),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
    phone: z.string().optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
