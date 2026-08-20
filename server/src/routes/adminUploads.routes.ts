import { Router } from 'express';
import * as adminUploadsController from '../controllers/adminUploads.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminUploadsRouter = Router();

adminUploadsRouter.use(authenticateAdmin);
adminUploadsRouter.post('/', adminUploadsController.upload);
