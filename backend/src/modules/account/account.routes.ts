import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  accountIdSchema,
  createAccountSchema,
  listAccountsSchema,
  updateAccountSchema,
} from './account.schema';
import * as accountController from './account.controller';

const router = Router();

// UC7 — Quản lý tài khoản: chỉ ADMIN
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate(listAccountsSchema), accountController.list);
router.post('/', validate(createAccountSchema), accountController.create);
router.patch('/:id', validate(updateAccountSchema), accountController.update);
router.delete('/:id', validate(accountIdSchema), accountController.remove);

export default router;
