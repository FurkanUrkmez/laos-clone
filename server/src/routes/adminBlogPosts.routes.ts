import { Router } from 'express';
import * as adminBlogPostsController from '../controllers/adminBlogPosts.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

export const adminBlogPostsRouter = Router();

adminBlogPostsRouter.use(authenticateAdmin);
adminBlogPostsRouter.get('/', adminBlogPostsController.list);
adminBlogPostsRouter.post('/', adminBlogPostsController.create);
adminBlogPostsRouter.patch('/:id', adminBlogPostsController.update);
adminBlogPostsRouter.delete('/:id', adminBlogPostsController.remove);
