import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { createContactSchema, listContactSchema, updateContactSchema } from './contact.schema';
import * as contactController from './contact.controller';

const router = Router();

// Public — khách gửi liên hệ
router.post('/', validate(createContactSchema), contactController.create);

// STAFF/ADMIN — xem & xử lý
const staff = [authenticate, authorize('ADMIN', 'STAFF')] as const;
router.get('/', ...staff, validate(listContactSchema), contactController.list);
router.patch('/:id', ...staff, validate(updateContactSchema), contactController.updateStatus);

export default router;
