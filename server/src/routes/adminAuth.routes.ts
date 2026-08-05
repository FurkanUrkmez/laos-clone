import { Router } from 'express';
import * as adminAuthController from '../controllers/adminAuth.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', adminAuthController.login);
adminAuthRouter.post('/refresh', adminAuthController.refresh);
adminAuthRouter.post('/logout', adminAuthController.logout);
adminAuthRouter.get('/me', authenticateAdmin, adminAuthController.me);
