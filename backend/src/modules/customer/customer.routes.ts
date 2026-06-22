import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { customerIdSchema, listCustomersSchema, updateCustomerSchema } from './customer.schema';
import * as customerController from './customer.controller';

const router = Router();

// UC6 — Quản lý khách hàng: STAFF/ADMIN
router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.get('/', validate(listCustomersSchema), customerController.list);
router.get('/:id', validate(customerIdSchema), customerController.detail);
router.patch('/:id', validate(updateCustomerSchema), customerController.update);

export default router;
