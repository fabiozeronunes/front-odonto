import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./grade.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.listGrade((req as AuthenticatedRequest).user.id);
  res.json({ data: items });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.createGrade((req as AuthenticatedRequest).user.id, req.body);
  res.status(201).json({ data: item });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.updateGrade((req as AuthenticatedRequest).user.id, req.params.id, req.body);
  res.json({ data: item });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteGrade((req as AuthenticatedRequest).user.id, req.params.id);
  res.json({ ok: true });
});

export const removeAll = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteAllGrade((req as AuthenticatedRequest).user.id);
  res.json({ ok: true });
});