import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import accountRoutes from '../modules/account/account.routes';
import categoryRoutes from '../modules/category/category.routes';
import supplierRoutes from '../modules/supplier/supplier.routes';
import productRoutes from '../modules/product/product.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/order/order.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import promotionRoutes from '../modules/promotion/promotion.routes';
import reviewRoutes from '../modules/review/review.routes';
import stockRoutes from '../modules/stock/stock.routes';
import customerRoutes from '../modules/customer/customer.routes';
import statsRoutes from '../modules/stats/stats.routes';
import contactRoutes from '../modules/contact/contact.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'fashion-shop-api' } });
});

// Đăng ký các module. Khi làm theo PLAN, thêm route mới tại đây:
//   router.use('/categories', categoryRoutes);
//   router.use('/orders', orderRoutes);  ...
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/promotions', promotionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/stock-receipts', stockRoutes);
router.use('/customers', customerRoutes);
router.use('/stats', statsRoutes);
router.use('/contact', contactRoutes);

export default router;
