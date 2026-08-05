import { NextFunction, Response } from 'express';
import * as adminCustomersService from '../services/adminCustomers.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const customers = await adminCustomersService.listCustomers(req.adminAuth!.businessId);
    res.status(200).json({ customers });
  } catch (err) {
    next(err);
  }
}
