import { Request, Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import { ensureCustomer } from '../auth/auth.service';
import * as orderService from './order.service';

async function customer(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return ensureCustomer(req.user);
}

// ===== Customer =====
export const create = asyncHandler(async (req: Request, res: Response) => {
  const c = await customer(req);
  const result = await orderService.createOrder({ id: c.id, fullName: c.fullName }, req.body);
  return sendSuccess(res, result, 201);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const c = await customer(req);
  return sendSuccess(res, await orderService.listMyOrders(c.id));
});

export const getMine = asyncHandler(async (req: Request, res: Response) => {
  const c = await customer(req);
  return sendSuccess(res, await orderService.getOrderForCustomer(c.id, req.params.id));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const c = await customer(req);
  return sendSuccess(res, await orderService.cancelOrder(c.id, req.params.id));
});

export const reconcile = asyncHandler(async (req: Request, res: Response) => {
  const c = await customer(req);
  return sendSuccess(res, await orderService.reconcilePayos(req.params.id, c.id));
});

// ===== Staff/Admin =====
export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.listOrders(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const adminGet = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await orderService.getOrderAdmin(req.params.id));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const updated = await orderService.updateStatus(req.params.id, req.body.status as OrderStatus);
  return sendSuccess(res, updated);
});
