import path from "node:path";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { downloadVideo, getInfo, ytDlpAvailable, uploadToYouTube } from "./youtube.service.js";

export const info = asyncHandler(async (req: Request, res: Response) => {
  const url = String(req.query.url ?? "");
  const data = await getInfo(url);
  res.json({ data });
});

export const importFromUrl = asyncHandler(async (req: Request, res: Response) => {
  const url = String(req.body.url ?? "");
  if (!ytDlpAvailable()) {
    throw new ApiError(
      501,
      "O download de vídeos do YouTube exige o yt-dlp instalado no servidor"
    );
  }
  const videoInfo = await getInfo(url);
  const destinationDir = path.join(process.cwd(), "public", "uploads", "videos");
  const { file } = await downloadVideo(url, videoInfo.id, destinationDir);
  const videoUrl = `/uploads/videos/${file}`;
  res.status(201).json({
    data: {
      ...videoInfo,
      videoUrl,
      absoluteVideoUrl: `${env.apiUrl}${videoUrl}`,
      downloaded: true,
    },
  });
});

export const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Nenhum arquivo de vídeo enviado");
  }

  const title = String(req.body.title ?? "Aula gravada").slice(0, 100);
  const description = String(req.body.description ?? "").slice(0, 5000);
  const tags = req.body.tags
    ? String(req.body.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const result = await uploadToYouTube(
    file.buffer,
    file.originalname,
    title,
    description,
    tags
  );

  res.status(201).json({ data: result });
});