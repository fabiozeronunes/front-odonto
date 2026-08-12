import path from "node:path";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { downloadVideo, getInfo, ytDlpAvailable } from "./youtube.service.js";

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