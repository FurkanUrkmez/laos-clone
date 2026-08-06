import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as campaignsService from '../services/campaigns.service';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaigns = await campaignsService.listActiveCampaigns(req.auth!.businessId);
    res.status(200).json({ campaigns });
  } catch (err) {
    next(err);
  }
}
