import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import * as paymentController from './payment.controller';

const router = Router();

// Public — PayOS gọi webhook (không xác thực bằng JWT, dùng chữ ký PayOS)
router.post('/payos/webhook', paymentController.payosWebhook);

// Trạng thái cấu hình cổng (cho FE)
router.get('/status', paymentController.status);

// Đăng ký webhook URL với PayOS — ADMIN
router.post(
  '/payos/confirm-webhook',
  authenticate,
  authorize('ADMIN'),
  paymentController.confirmWebhook,
);

export default router;
