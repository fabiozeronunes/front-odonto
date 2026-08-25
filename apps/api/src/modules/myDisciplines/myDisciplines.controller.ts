import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./myDisciplines.service.js";

export const setup = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getSetup((req as AuthenticatedRequest).user.id);
  res.json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.createDiscipline((req as AuthenticatedRequest).user.id, req.body ?? {});
  res.status(201).json({ data: item });
});

export const rename = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.updateDiscipline((req as AuthenticatedRequest).user.id, req.params.id, req.body ?? {});
  res.json({ data: item });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteDiscipline((req as AuthenticatedRequest).user.id, req.params.id);
  res.json({ ok: true });
});