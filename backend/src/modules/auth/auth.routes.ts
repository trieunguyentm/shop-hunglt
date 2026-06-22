import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { registerSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

// UC13 - Đăng ký tài khoản khách hàng (tùy chọn — có thể dùng trang đăng ký của Keycloak)
router.post('/register', validate(registerSchema), authController.register);

// Đồng bộ + lấy thông tin người dùng hiện tại (yêu cầu access token Keycloak)
router.get('/me', authenticate, authController.me);

export default router;
