import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as blogService from '../services/blog.service';
import { paginationQuerySchema } from '../validators/pagination.validators';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, hasMore } = await blogService.listPublishedBlogPosts(req.auth!.businessId, pagination);
    res.status(200).json({ posts: items, page: pagination.page, hasMore });
  } catch (err) {
    next(err);
  }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const post = await blogService.getPublishedBlogPost(req.auth!.businessId, req.params.id as string);
    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
}
