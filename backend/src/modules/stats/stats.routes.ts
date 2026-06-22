import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import * as statsController from './stats.controller';

const router = Router();

// UC9 — Thống kê: STAFF/ADMIN
router.get('/overview', authenticate, authorize('ADMIN', 'STAFF'), statsController.overview);

export default router;
