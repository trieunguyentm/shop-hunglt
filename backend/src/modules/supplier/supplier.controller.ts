import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as supplierService from './supplier.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await supplierService.listSuppliers(req.query.search as string | undefined);
  return sendSuccess(res, data);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const data = await supplierService.getSupplier(req.params.id);
  return sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await supplierService.createSupplier(req.body);
  return sendSuccess(res, data, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await supplierService.updateSupplier(req.params.id, req.body);
  return sendSuccess(res, data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await supplierService.deleteSupplier(req.params.id);
  return sendSuccess(res, data);
});
