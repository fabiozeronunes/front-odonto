import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./admin.service.js";

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await service.getDashboard();
  res.json({ data: metrics });
});

export const users = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listUsers(req.query);
  res.json(result);
});

export const billingSummary = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.getBillingSummary();
  res.json({ data: result });
});

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.setUserActive(req.params.id, true);
  res.json({ data: result });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.setUserActive(req.params.id, false);
  res.json({ data: result });
});

export const setRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.setUserRole(req.params.id, req.body.role);
  res.json({ data: result });
});

export const setPlan = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.setUserPlan(req.params.id, req.body.planId);
  res.json({ data: result });
});

export const updateContact = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.updateUserContact(req.params.id, { phone: req.body.phone ?? null });
  res.json({ data: result });
});

export const notifyWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.notifyUserWhatsApp(req.params.id);
  res.json({ data: result });
});
