import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/errors.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import { listMyUploads, toPublicUrl } from "./uploads.service.js";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "Nenhuma imagem enviada");
  const userId = (req as AuthenticatedRequest).user.id;
  res.status(201).json({ data: { url: toPublicUrl(userId, req.file.filename) } });
});

export const myUploads = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  res.json({ data: listMyUploads(userId) });
});