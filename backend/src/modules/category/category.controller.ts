import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as categoryService from './category.service';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await categoryService.listCategories();
  return sendSuccess(res, data);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getCategory(req.params.id);
  return sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.createCategory(req.body);
  return sendSuccess(res, data, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.deleteCategory(req.params.id);
  return sendSuccess(res, data);
});
