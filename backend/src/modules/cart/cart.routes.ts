import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { addItemSchema, cartItemIdSchema, updateItemSchema } from './cart.schema';
import * as cartController from './cart.controller';

const router = Router();

// Giỏ hàng yêu cầu đăng nhập (khách hàng)
router.use(authenticate);

router.get('/', cartController.get);
router.post('/items', validate(addItemSchema), cartController.addItem);
router.patch('/items/:id', validate(updateItemSchema), cartController.updateItem);
router.delete('/items/:id', validate(cartItemIdSchema), cartController.removeItem);

export default router;
