import { Router } from 'express';
import * as adminCustomersController from '../controllers/adminCustomers.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminCustomersRouter = Router();

adminCustomersRouter.use(authenticateAdmin);
adminCustomersRouter.get('/', adminCustomersController.list);
