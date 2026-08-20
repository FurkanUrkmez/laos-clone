import { NextFunction, Response } from 'express';
import * as adminProductsService from '../services/adminProducts.service';
import { createProductSchema, updateProductSchema } from '../validators/adminProducts.validators';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const products = await adminProductsService.listProducts(req.adminAuth!.businessId);
    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createProductSchema.parse(req.body);
    const product = await adminProductsService.createProduct(req.adminAuth!.businessId, input);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateProductSchema.parse(req.body);
    const product = await adminProductsService.updateProduct(
      req.adminAuth!.businessId,
      req.params.id as string,
      input,
    );
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminProductsService.deleteProduct(req.adminAuth!.businessId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
