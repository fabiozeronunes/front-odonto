import { asyncHandler } from "../../utils/asyncHandler.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./affiliates.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listAffiliates(req.query);
  res.json(result);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAffiliateDetail(req.params.id);
  res.json({ data: result });
});

export const enable = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.enableAffiliate(req.params.id, Number(req.body.commissionRate ?? 20));
  res.json({ data: result });
});

export const disable = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.disableAffiliate(req.params.id);
  res.json({ data: result });
});

export const setRate = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.setAffiliateCommissionRate(
    req.params.id,
    Number(req.body.commissionRate),
    req.body.productCommissionRate != null ? Number(req.body.productCommissionRate) : undefined
  );
  res.json({ data: result });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  const result = await service.getAffiliateSummary(userId);
  res.json({ data: result });
});

export const registerPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.registerReferredPayment(
    req.params.id,
    req.body.referredUserId,
    Number(req.body.amount ?? 0)
  );
  res.json({ data: result });
});

export const pay = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.payCommission(req.params.commissionId);
  res.json({ data: result });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.cancelCommission(req.params.commissionId);
  res.json({ data: result });
});