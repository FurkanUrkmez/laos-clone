import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as productsService from '../services/products.service';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const products = await productsService.listActiveProducts(req.auth!.businessId);
    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}
