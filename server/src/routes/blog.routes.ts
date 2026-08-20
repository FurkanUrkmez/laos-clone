import { Router } from 'express';
import * as blogController from '../controllers/blog.controller';
import { authenticate } from '../middleware/auth';

export const blogRouter = Router();

blogRouter.get('/', authenticate, blogController.list);
blogRouter.get('/:id', authenticate, blogController.show);
