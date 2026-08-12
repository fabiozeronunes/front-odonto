import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./specialties.service.js";
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from "./specialties.validators.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const specialties = await service.listSpecialties({
    includeInactive: req.query.all === "true",
  });
  res.json({ data: specialties });
});

export const mySpecialties = asyncHandler(async (req: Request, res: Response) => {
  const specialties = await service.listMySpecialties((req as AuthenticatedRequest).user.id);
  res.json({ data: specialties });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const specialty = await service.getSpecialty(req.params.slugOrId);
  res.json({ data: specialty });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const specialty = await service.createSpecialty(
    req.body as CreateSpecialtyInput,
    (req as AuthenticatedRequest).user.id
  );
  res.status(201).json({ data: specialty });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const specialty = await service.updateSpecialty(
    req.params.id,
    req.body as UpdateSpecialtyInput,
    (req as AuthenticatedRequest).user
  );
  res.json({ data: specialty });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteSpecialty(req.params.id, (req as AuthenticatedRequest).user);
  res.json(result);
});
