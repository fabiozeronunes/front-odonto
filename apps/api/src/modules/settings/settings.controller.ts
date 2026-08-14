import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./settings.service.js";

export const logoGet = asyncHandler(async (_req: Request, res: Response) => {
  const value = await service.getSiteSetting("logo");
  res.json({ data: value ?? null });
});

export const logoPost = asyncHandler(async (req: Request, res: Response) => {
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!url) {
    res.status(400).json({ error: { message: "URL do logotipo é obrigatória." } });
    return;
  }
  const value = await service.upsertSiteSetting("logo", url);
  res.json({ data: value });
});