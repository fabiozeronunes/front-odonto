import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./settings.service.js";
import { prisma } from "../../lib/prisma.js";

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

export const heroVideoGet = asyncHandler(async (_req: Request, res: Response) => {
  const value = await service.getSiteSetting("heroVideo");
  res.json({ data: value ?? null });
});

export const heroVideoPost = asyncHandler(async (req: Request, res: Response) => {
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!url) {
    res.status(400).json({ error: { message: "URL do vídeo é obrigatória." } });
    return;
  }
  const value = await service.upsertSiteSetting("heroVideo", url);
  res.json({ data: value });
});

export const heroVideoDelete = asyncHandler(async (_req: Request, res: Response) => {
  await prisma.siteSetting.deleteMany({ where: { key: "heroVideo" } });
  res.json({ data: null });
});

export const homeLockGet = asyncHandler(async (_req: Request, res: Response) => {
  const value = await service.getSiteSetting("homeLock");
  let enabled = false;
  let unlockMinutes = 0;
  if (value) {
    try {
      const raw = typeof value === "string" ? JSON.parse(value) : value;
      const parsed = raw as Record<string, unknown>;
      enabled = parsed.enabled === true || parsed.enabled === "true";
      unlockMinutes = Number(parsed.unlockMinutes) > 0 ? Number(parsed.unlockMinutes) : 0;
    } catch {
      enabled = false;
      unlockMinutes = 0;
    }
  }
  res.json({ data: { enabled, unlockMinutes } });
});

export const homeLockPost = asyncHandler(async (req: Request, res: Response) => {
  const enabled = req.body?.enabled === true || req.body?.enabled === "true";
  const unlockMinutes = Math.max(0, Number(req.body?.unlockMinutes) || 0);
  await service.upsertSiteSetting("homeLock", JSON.stringify({ enabled, unlockMinutes }));
  res.json({ data: { enabled, unlockMinutes } });
});

export const paymentGet = asyncHandler(async (_req: Request, res: Response) => {
  const value = await service.getPaymentSettings();
  res.json({ data: value });
});

export const paymentPost = asyncHandler(async (req: Request, res: Response) => {
  const data =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
  const value = await service.upsertPaymentSettings(data);
  res.json({ data: value });
});