import path from "node:path";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { downloadVideo, getInfo, ytDlpAvailable, uploadToYouTube, getYouTubeAuthUrl, exchangeYouTubeCode, getYouTubeAccessToken } from "./youtube.service.js";

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

export const auth = asyncHandler(async (req: Request, res: Response) => {
  const redirectUri = `${env.apiUrl}/api/youtube/callback`;
  const url = getYouTubeAuthUrl(redirectUri);
  res.json({ data: { url, redirectUri } });
});

export const callback = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.query.code ?? "");
  const error = String(req.query.error ?? "");
  if (error) {
    res.status(400).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;text-align:center;padding:60px"><h1 style="color:red">Erro na autorização</h1><p>${error}</p></body></html>`);
    return;
  }
  if (!code) {
    res.status(400).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;text-align:center;padding:60px"><h1 style="color:red">Código não recebido</h1></body></html>`);
    return;
  }
  const redirectUri = `${env.apiUrl}/api/youtube/callback`;
  const tokens = await exchangeYouTubeCode(code, redirectUri);
  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>YouTube Autorizado!</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px">
  <h1 style="color:green">YouTube Autorizado com sucesso!</h1>
  <p>Copie o <strong>Refresh Token</strong> abaixo e adicione como variável de ambiente no Vercel:</p>
  <code style="display:block;background:#f4f4f4;padding:16px;border-radius:8px;margin:20px auto;max-width:500px;word-break:break-all;font-size:14px">${tokens.refreshToken}</code>
  <p style="color:#666">Nome da variável: <strong>YOUTUBE_REFRESH_TOKEN</strong></p>
  <p style="color:#666">Depois feche esta aba.</p>
</body></html>`);
});

export const token = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = await getYouTubeAccessToken();
  res.json({ data: { accessToken } });
});