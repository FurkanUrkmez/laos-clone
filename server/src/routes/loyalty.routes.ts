import { Router } from 'express';
import * as loyaltyController from '../controllers/loyalty.controller';
import { authenticate } from '../middleware/auth';

export const loyaltyRouter = Router();

loyaltyRouter.get('/me', authenticate, loyaltyController.me);
