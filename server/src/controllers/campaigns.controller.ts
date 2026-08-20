import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as campaignsService from '../services/campaigns.service';
import { paginationQuerySchema } from '../validators/pagination.validators';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, hasMore } = await campaignsService.listActiveCampaigns(req.auth!.businessId, pagination);
    res.status(200).json({ campaigns: items, page: pagination.page, hasMore });
  } catch (err) {
    next(err);
  }
}
