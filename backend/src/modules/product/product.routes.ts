import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  adminListProductsSchema,
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  productSlugSchema,
  updateProductSchema,
} from './product.schema';
import * as productController from './product.controller';

const router = Router();

const staff = [authenticate, authorize('ADMIN', 'STAFF')] as const;

// Quản trị (đặt trước /:slug để không bị nuốt route) — STAFF/ADMIN
router.get('/manage/list', ...staff, validate(adminListProductsSchema), productController.adminList);
router.get('/manage/:id', ...staff, validate(productIdSchema), productController.adminDetail);
router.post('/', ...staff, validate(createProductSchema), productController.create);
router.patch('/:id', ...staff, validate(updateProductSchema), productController.update);
router.delete('/:id', ...staff, validate(productIdSchema), productController.remove);

// Public — danh sách & chi tiết cho cửa hàng
router.get('/', validate(listProductsSchema), productController.list);
router.get('/:slug', validate(productSlugSchema), productController.detail);

export default router;
