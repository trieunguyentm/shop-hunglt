import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { createReceiptSchema, listReceiptsSchema, receiptIdSchema } from './stock.schema';
import * as stockController from './stock.controller';

const router = Router();

// Quản lý kho — STAFF/ADMIN
router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.get('/', validate(listReceiptsSchema), stockController.list);
router.post('/', validate(createReceiptSchema), stockController.create);
router.get('/:id', validate(receiptIdSchema), stockController.detail);

export default router;
