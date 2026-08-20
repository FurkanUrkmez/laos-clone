import { Router } from 'express';
import * as productsController from '../controllers/products.controller';
import { authenticate } from '../middleware/auth';

export const productsRouter = Router();

productsRouter.get('/', authenticate, productsController.list);
