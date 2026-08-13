import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/errors.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import { listMyUploads, saveUploadedFile } from "./uploads.service.js";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "Nenhuma imagem enviada");
  const userId = (req as AuthenticatedRequest).user.id;
  const url = await saveUploadedFile(userId, req.file);
  res.status(201).json({ data: { url } });
});

export const myUploads = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  res.json({ data: await listMyUploads(userId) });
});