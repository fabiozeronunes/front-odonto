import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./study.service.js";
import type { SaveResourceInput, GenerateResourceInput } from "./study.validators.js";

export const save = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.saveResource(
    (req as AuthenticatedRequest).user.id,
    req.body as SaveResourceInput
  );
  res.status(201).json({ data: result });
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.generateResource(
    (req as AuthenticatedRequest).user.id,
    req.body as GenerateResourceInput
  );
  res.status(201).json({ data: result });
});

export const generateAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.generateAll(
    (req as AuthenticatedRequest).user.id,
    req.body as GenerateResourceInput
  );
  res.status(201).json({ data: result });
});

export const transcribe = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.transcribeResource(
    (req as AuthenticatedRequest).user.id,
    req.body as { videoId?: string; caseStudyId?: string }
  );
  res.status(201).json({ data: result });
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMyResources((req as AuthenticatedRequest).user.id);
  res.json({ data: result });
});

export const byVideo = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listVideoResources(
    (req as AuthenticatedRequest).user.id,
    req.params.videoId
  );
  res.json({ data: result });
});

export const byCase = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listCaseResources(
    (req as AuthenticatedRequest).user.id,
    req.params.caseStudyId
  );
  res.json({ data: result });
});

export const one = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getResource((req as AuthenticatedRequest).user.id, req.params.id);
  res.json({ data: result });
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.submitToLibrary((req as AuthenticatedRequest).user.id, req.params.id);
  res.json({ data: result });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteResource((req as AuthenticatedRequest).user.id, req.params.id);
  res.json({ data: result });
});

export const vote = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.voteResource(
    (req as AuthenticatedRequest).user.id,
    req.params.id,
    Number(req.body.value ?? 1)
  );
  res.json({ data: result });
});

export const saveKey = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.saveGeminiKey(
    (req as AuthenticatedRequest).user.id,
    req.body.geminiApiKey
  );
  res.json({ data: result });
});

export const myKey = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getMyGeminiKey((req as AuthenticatedRequest).user.id);
  res.json({ data: result });
});