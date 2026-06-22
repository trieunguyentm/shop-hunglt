import { Request, Response } from 'express';
import { ContactStatus } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as contactService from './contact.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const msg = await contactService.createContact(req.body);
  return sendSuccess(res, { id: msg.id, message: 'Đã gửi liên hệ, chúng tôi sẽ phản hồi sớm.' }, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await contactService.listContacts(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const msg = await contactService.updateContactStatus(req.params.id, req.body.status as ContactStatus);
  return sendSuccess(res, msg);
});
