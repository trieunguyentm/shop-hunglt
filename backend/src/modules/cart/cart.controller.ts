import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import { ensureCustomer } from '../auth/auth.service';
import * as cartService from './cart.service';

async function customerId(req: Request): Promise<string> {
  if (!req.user) throw AppError.unauthorized();
  const customer = await ensureCustomer(req.user);
  return customer.id;
}

export const get = asyncHandler(async (req: Request, res: Response) => {
  const data = await cartService.getCart(await customerId(req));
  return sendSuccess(res, data);
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await cartService.addItem(await customerId(req), req.body);
  return sendSuccess(res, data, 201);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await cartService.updateItem(await customerId(req), req.params.id, req.body.quantity);
  return sendSuccess(res, data);
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const data = await cartService.removeItem(await customerId(req), req.params.id);
  return sendSuccess(res, data);
});
