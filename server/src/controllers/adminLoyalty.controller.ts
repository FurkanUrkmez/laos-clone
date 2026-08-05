import { NextFunction, Response } from 'express';
import { redeemSchema, scanSchema } from '../validators/adminLoyalty.validators';
import * as adminLoyaltyService from '../services/adminLoyalty.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function scan(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = scanSchema.parse(req.body);
    const result = await adminLoyaltyService.scanProduct(req.adminAuth!.businessId, input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function redeem(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = redeemSchema.parse(req.body);
    const result = await adminLoyaltyService.redeemReward(req.adminAuth!.businessId, input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
