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

export const heroSmartProgressGet = asyncHandler(async (_req: Request, res: Response) => {
  const value = await service.getSiteSetting("heroSmartProgress");
  let boost = 1.2;
  if (value) {
    try {
      const raw = typeof value === "string" ? JSON.parse(value) : value;
      const parsed = raw as Record<string, unknown>;
      const candidate = Number(parsed.boost);
      if (candidate >= 1 && candidate <= 3) boost = candidate;
    } catch {
      boost = 1.2;
    }
  }
  res.json({ data: { boost } });
});

export const heroSmartProgressPost = asyncHandler(async (req: Request, res: Response) => {
  const candidate = Number(req.body?.boost);
  const boost = candidate >= 1 && candidate <= 3 ? candidate : 1.2;
  await service.upsertSiteSetting("heroSmartProgress", JSON.stringify({ boost }));
  res.json({ data: { boost } });
});

export const heroContentGet = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getHeroContent();
  res.json({ data });
});

export const heroContentPost = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.saveHeroContent({
    title: req.body?.title,
    subtitle: req.body?.subtitle,
    businessArea: req.body?.businessArea,
    tags: req.body?.tags,
  });
  res.json({ data });
});

export const heroGenerate = asyncHandler(async (req: Request, res: Response) => {
  const options = await service.generateHeroSuggestions({
    businessArea: req.body?.businessArea,
    tags: req.body?.tags,
    count: req.body?.count,
  });
  res.json({ data: options });
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

export const faqGet = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getFaq();
  res.json({ data });
});

export const faqPost = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.saveFaq(req.body);
  res.json({ data });
});