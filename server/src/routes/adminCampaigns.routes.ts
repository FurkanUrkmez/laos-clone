import { Router } from 'express';
import * as adminCampaignsController from '../controllers/adminCampaigns.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminCampaignsRouter = Router();

adminCampaignsRouter.use(authenticateAdmin);
adminCampaignsRouter.get('/', adminCampaignsController.list);
adminCampaignsRouter.post('/', adminCampaignsController.create);
adminCampaignsRouter.patch('/:id', adminCampaignsController.update);
adminCampaignsRouter.delete('/:id', adminCampaignsController.remove);
