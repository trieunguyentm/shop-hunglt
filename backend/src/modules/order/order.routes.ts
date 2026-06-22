import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  updateStatusSchema,
} from './order.schema';
import * as orderController from './order.controller';

const router = Router();

router.use(authenticate);

const staff = authorize('ADMIN', 'STAFF');

// Staff/Admin (đặt route cụ thể trước /:id)
router.get('/', staff, validate(listOrdersSchema), orderController.list);
router.get('/manage/:id', staff, validate(orderIdSchema), orderController.adminGet);
router.patch('/:id/status', staff, validate(updateStatusSchema), orderController.updateStatus);

// Customer
router.post('/', validate(createOrderSchema), orderController.create);
router.get('/me', orderController.listMine);
router.get('/:id', validate(orderIdSchema), orderController.getMine);
router.get('/:id/reconcile', validate(orderIdSchema), orderController.reconcile);
router.post('/:id/cancel', validate(orderIdSchema), orderController.cancel);

export default router;
