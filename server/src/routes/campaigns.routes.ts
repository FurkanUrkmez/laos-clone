import { Router } from 'express';
import * as campaignsController from '../controllers/campaigns.controller';
import { authenticate } from '../middleware/auth';

export const campaignsRouter = Router();

campaignsRouter.get('/', authenticate, campaignsController.list);
