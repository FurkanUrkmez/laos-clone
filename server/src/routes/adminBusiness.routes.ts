import { Router } from 'express';
import * as adminBusinessController from '../controllers/adminBusiness.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminBusinessRouter = Router();

adminBusinessRouter.use(authenticateAdmin);
adminBusinessRouter.get('/', adminBusinessController.getBusiness);
adminBusinessRouter.patch('/', adminBusinessController.updateBusiness);
