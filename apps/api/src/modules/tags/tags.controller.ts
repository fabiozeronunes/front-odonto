import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./tags.service.js";
import type { CreateTagInput, UpdateTagInput } from "./tags.validators.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listTags(req.query);
  res.json(result);
});

export const myTags = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMyTags((req as AuthenticatedRequest).user.id);
  res.json({ data: result });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const tag = await service.getTag(req.params.slugOrId);
  res.json({ data: tag });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const tag = await service.createTag(req.body as CreateTagInput, (req as AuthenticatedRequest).user.id);
  res.status(201).json({ data: tag });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const tag = await service.updateTag(
    req.params.id,
    req.body as UpdateTagInput,
    (req as AuthenticatedRequest).user
  );
  res.json({ data: tag });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteTag(req.params.id, (req as AuthenticatedRequest).user);
  res.json(result);
});