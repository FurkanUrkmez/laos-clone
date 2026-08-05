import { NextFunction, Response } from 'express';
import * as adminProductsService from '../services/adminProducts.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const products = await adminProductsService.listProducts(req.adminAuth!.businessId);
    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}
