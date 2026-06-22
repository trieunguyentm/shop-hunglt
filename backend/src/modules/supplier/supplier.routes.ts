import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  createSupplierSchema,
  listSuppliersSchema,
  supplierIdSchema,
  updateSupplierSchema,
} from './supplier.schema';
import * as supplierController from './supplier.controller';

const router = Router();

// Toàn bộ là dữ liệu quản trị — yêu cầu STAFF/ADMIN
router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.get('/', validate(listSuppliersSchema), supplierController.list);
router.get('/:id', validate(supplierIdSchema), supplierController.detail);
router.post('/', validate(createSupplierSchema), supplierController.create);
router.patch('/:id', validate(updateSupplierSchema), supplierController.update);
router.delete('/:id', validate(supplierIdSchema), supplierController.remove);

export default router;
