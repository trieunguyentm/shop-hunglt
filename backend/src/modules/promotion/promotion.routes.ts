import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  applyPromotionSchema,
  createPromotionSchema,
  promotionIdSchema,
  updatePromotionSchema,
} from './promotion.schema';
import * as promotionController from './promotion.controller';

const router = Router();

// Áp mã (khách đã đăng nhập, ở trang thanh toán)
router.post('/apply', authenticate, validate(applyPromotionSchema), promotionController.apply);

// Quản trị — ADMIN
const admin = [authenticate, authorize('ADMIN')] as const;
router.get('/', ...admin, promotionController.list);
router.post('/', ...admin, validate(createPromotionSchema), promotionController.create);
router.patch('/:id', ...admin, validate(updatePromotionSchema), promotionController.update);
router.delete('/:id', ...admin, validate(promotionIdSchema), promotionController.remove);

export default router;
