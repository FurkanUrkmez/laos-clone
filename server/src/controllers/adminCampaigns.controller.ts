import { NextFunction, Response } from 'express';
import { createCampaignSchema, updateCampaignSchema } from '../validators/adminCampaigns.validators';
import * as adminCampaignsService from '../services/adminCampaigns.service';
import { AdminAuthenticatedRequest } from '../middleware/adminAuth';

export async function list(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaigns = await adminCampaignsService.listCampaigns(req.adminAuth!.businessId);
    res.status(200).json({ campaigns });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = createCampaignSchema.parse(req.body);
    const campaign = await adminCampaignsService.createCampaign(req.adminAuth!.businessId, input);
    res.status(201).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateCampaignSchema.parse(req.body);
    const campaign = await adminCampaignsService.updateCampaign(
      req.adminAuth!.businessId,
      req.params.id as string,
      input,
    );
    res.status(200).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminCampaignsService.deleteCampaign(req.adminAuth!.businessId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
