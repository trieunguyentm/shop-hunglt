import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as productService from './product.service';

// ===== Public =====
export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.listProducts(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return sendSuccess(res, product);
});

// ===== Admin =====
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.adminListProducts(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const adminDetail = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductByIdAdmin(req.params.id);
  return sendSuccess(res, product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  return sendSuccess(res, product, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return sendSuccess(res, product);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.params.id);
  return sendSuccess(res, result);
});
