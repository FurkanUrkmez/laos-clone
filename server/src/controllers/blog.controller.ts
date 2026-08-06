import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as blogService from '../services/blog.service';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const posts = await blogService.listPublishedBlogPosts(req.auth!.businessId);
    res.status(200).json({ posts });
  } catch (err) {
    next(err);
  }
}
