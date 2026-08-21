import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import { ForbiddenError } from "../../utils/errors.js";
import * as service from "./caseStudies.service.js";
import type {
  CreateCaseStudyInput,
  UpdateCaseStudyInput,
} from "./caseStudies.validators.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const wantsAll = req.query.all === "true";
  if (wantsAll && !(req as AuthenticatedRequest).user) {
    throw new ForbiddenError("Acesso restrito a administradores");
  }
  if (wantsAll && (req as AuthenticatedRequest).user?.role !== "ADMIN") {
    throw new ForbiddenError("Acesso restrito a administradores");
  }
  const result = await service.listCaseStudies(req.query, {
    admin: wantsAll,
  });
  res.json(result);
});

export const myCaseStudies = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMyCaseStudies((req as AuthenticatedRequest).user.id, req.query);
  res.json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const wantsAll = req.query.all === "true";
  if (wantsAll && !(req as AuthenticatedRequest).user) {
    throw new ForbiddenError("Acesso restrito a administradores");
  }
  if (wantsAll && (req as AuthenticatedRequest).user?.role !== "ADMIN") {
    throw new ForbiddenError("Acesso restrito a administradores");
  }
  const result = await service.getCaseStudy(req.params.slugOrId, {
    admin: wantsAll,
  });
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const caseStudy = await service.createCaseStudy(
    req.body as CreateCaseStudyInput,
    (req as AuthenticatedRequest).user.id
  );
  res.status(201).json({ data: caseStudy });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const caseStudy = await service.updateCaseStudy(
    req.params.id,
    req.body as UpdateCaseStudyInput,
    (req as AuthenticatedRequest).user
  );
  res.json({ data: caseStudy });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteCaseStudy(req.params.id, (req as AuthenticatedRequest).user);
  res.json(result);
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const caseStudy = await service.setPublishState(
    req.params.id,
    "PUBLISHED",
    (req as AuthenticatedRequest).user
  );
  res.json({ data: caseStudy });
});

export const unpublish = asyncHandler(async (req: Request, res: Response) => {
  const caseStudy = await service.setPublishState(
    req.params.id,
    "DRAFT",
    (req as AuthenticatedRequest).user
  );
  res.json({ data: caseStudy });
});