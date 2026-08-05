import { NextFunction, Response } from 'express';
import { updateBusinessSchema } from '../validators/adminBusiness.validators';
import * as adminBusinessService from '../services/adminBusiness.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function getBusiness(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const business = await adminBusinessService.getBusiness(req.adminAuth!.businessId);
    res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}

export async function updateBusiness(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateBusinessSchema.parse(req.body);
    const business = await adminBusinessService.updateBusiness(req.adminAuth!.businessId, input);
    res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}
