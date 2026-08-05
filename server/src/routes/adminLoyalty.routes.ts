import { Router } from 'express';
import * as adminLoyaltyController from '../controllers/adminLoyalty.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminLoyaltyRouter = Router();

adminLoyaltyRouter.use(authenticateAdmin);
adminLoyaltyRouter.post('/scan', adminLoyaltyController.scan);
adminLoyaltyRouter.post('/redeem', adminLoyaltyController.redeem);
