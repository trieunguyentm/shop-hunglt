import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as statsService from './stats.service';

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, await statsService.overview());
});
