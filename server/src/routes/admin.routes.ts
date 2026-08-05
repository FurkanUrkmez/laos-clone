import { Router } from 'express';
import { adminAuthRouter } from './adminAuth.routes';
import { adminBusinessRouter } from './adminBusiness.routes';
import { adminCampaignsRouter } from './adminCampaigns.routes';
import { adminBlogPostsRouter } from './adminBlogPosts.routes';
import { adminCustomersRouter } from './adminCustomers.routes';
import { adminProductsRouter } from './adminProducts.routes';
import { adminLoyaltyRouter } from './adminLoyalty.routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.use('/business', adminBusinessRouter);
adminRouter.use('/campaigns', adminCampaignsRouter);
adminRouter.use('/blog-posts', adminBlogPostsRouter);
adminRouter.use('/customers', adminCustomersRouter);
adminRouter.use('/products', adminProductsRouter);
adminRouter.use('/loyalty', adminLoyaltyRouter);
