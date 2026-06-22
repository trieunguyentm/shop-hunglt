import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { createReviewSchema, eligibilitySchema, listReviewsSchema } from './review.schema';
import * as reviewController from './review.controller';

const router = Router();

// Public — xem đánh giá sản phẩm
router.get('/', validate(listReviewsSchema), reviewController.list);

// Khách hàng đã đăng nhập
router.get('/eligibility', authenticate, validate(eligibilitySchema), reviewController.eligibility);
router.post('/', authenticate, validate(createReviewSchema), reviewController.create);

export default router;
