import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as loyaltyService from '../services/loyalty.service';

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const loyalty = await loyaltyService.getMyLoyalty(req.auth!.businessId, req.auth!.userId);
    res.status(200).json(loyalty);
  } catch (err) {
    next(err);
  }
}
