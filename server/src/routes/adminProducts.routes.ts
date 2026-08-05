import { Router } from 'express';
import * as adminProductsController from '../controllers/adminProducts.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminProductsRouter = Router();

adminProductsRouter.use(authenticateAdmin);
adminProductsRouter.get('/', adminProductsController.list);
