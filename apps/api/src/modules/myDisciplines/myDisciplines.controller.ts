import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./myDisciplines.service.js";

export const setup = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getSetup((req as AuthenticatedRequest).user.id);
  res.json({ data });
});

export const saveCurso = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.saveCurso((req as AuthenticatedRequest).user.id, String(req.body?.curso ?? ""));
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.createDiscipline((req as AuthenticatedRequest).user.id, String(req.body?.name ?? ""));
  res.status(201).json({ data: item });
});

export const rename = asyncHandler(async (req: Request, res: Response) => {
  const item = await service.renameDiscipline((req as AuthenticatedRequest).user.id, req.params.id, String(req.body?.name ?? ""));
  res.json({ data: item });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteDiscipline((req as AuthenticatedRequest).user.id, req.params.id);
  res.json({ ok: true });
});