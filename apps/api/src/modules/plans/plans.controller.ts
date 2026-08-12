import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./plans.service.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plans.validators.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await service.listPlans();
  res.json({ data: plans });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const plan = await service.createPlan(req.body as CreatePlanInput);
  res.status(201).json({ data: plan });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const plan = await service.updatePlan(req.params.id, req.body as UpdatePlanInput);
  res.json({ data: plan });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deletePlan(req.params.id);
  res.json(result);
});
