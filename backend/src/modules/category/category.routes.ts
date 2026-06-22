import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from './category.schema';
import * as categoryController from './category.controller';

const router = Router();

// Public — cho menu & bộ lọc cửa hàng
router.get('/', categoryController.list);
router.get('/:id', validate(categoryIdSchema), categoryController.detail);

// Ghi — STAFF/ADMIN
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  validate(createCategorySchema),
  categoryController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  validate(updateCategorySchema),
  categoryController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  validate(categoryIdSchema),
  categoryController.remove,
);

export default router;
