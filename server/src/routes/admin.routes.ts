import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
