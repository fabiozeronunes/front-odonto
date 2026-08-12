import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./videos.service.js";
import type { CreateVideoInput, UpdateVideoInput, VideoQueryInput } from "./videos.validators.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listVideos(req.query as VideoQueryInput, {
    admin: req.query.all === "true",
  });
  res.json(result);
});

export const myVideos = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMyVideos((req as AuthenticatedRequest).user.id, req.query);
  res.json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getVideo(req.params.slugOrId, {
    admin: req.query.all === "true",
  });
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const auth = req as AuthenticatedRequest;
  const video = await service.createVideo(
    req.body as CreateVideoInput,
    auth.user.id,
    auth.user.role === "ADMIN"
  );
  res.status(201).json({ data: video });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const video = await service.updateVideo(
    req.params.id,
    req.body as UpdateVideoInput,
    (req as AuthenticatedRequest).user
  );
  res.json({ data: video });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteVideo(req.params.id, (req as AuthenticatedRequest).user);
  res.json(result);
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const video = await service.setPublishState(req.params.id, "PUBLISHED", (req as AuthenticatedRequest).user);
  res.json({ data: video });
});

export const unpublish = asyncHandler(async (req: Request, res: Response) => {
  const video = await service.setPublishState(req.params.id, "DRAFT", (req as AuthenticatedRequest).user);
  res.json({ data: video });
});

export const favorite = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.toggleFavorite(
    (req as AuthenticatedRequest).user.id,
    req.params.id
  );
  res.json(result);
});

export const favorites = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listFavorites((req as AuthenticatedRequest).user.id, req.query);
  res.json(result);
});

export const watch = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.recordWatch(
    (req as AuthenticatedRequest).user.id,
    req.params.id
  );
  res.json(result);
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listWatchHistory((req as AuthenticatedRequest).user.id, req.query);
  res.json(result);
});

export const imageTags = asyncHandler(async (_req: Request, res: Response) => {
  const result = await service.listImageTags();
  res.json({ data: result });
});

export const searchImages = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.searchImages(req.query.tag ? String(req.query.tag) : undefined);
  res.json({ data: result });
});