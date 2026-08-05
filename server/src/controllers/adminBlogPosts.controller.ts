import { NextFunction, Response } from 'express';
import { createBlogPostSchema, updateBlogPostSchema } from '../validators/adminBlogPosts.validators';
import * as adminBlogPostsService from '../services/adminBlogPosts.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const posts = await adminBlogPostsService.listBlogPosts(req.adminAuth!.businessId);
    res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createBlogPostSchema.parse(req.body);
    const post = await adminBlogPostsService.createBlogPost(req.adminAuth!.businessId, input);
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateBlogPostSchema.parse(req.body);
    const post = await adminBlogPostsService.updateBlogPost(
      req.adminAuth!.businessId,
      req.params.id as string,
      input,
    );
    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminBlogPostsService.deleteBlogPost(req.adminAuth!.businessId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
