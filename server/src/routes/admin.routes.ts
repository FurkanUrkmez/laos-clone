import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
