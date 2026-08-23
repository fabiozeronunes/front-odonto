import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { google } from "googleapis";
import { Readable } from "node:stream";
import { ApiError } from "../../utils/errors.js";
import { env } from "../../config/env.js";

const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
let cleanupTimer: NodeJS.Timeout | null = null;

export function parseYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getInfo(url: string) {
  const videoId = parseYoutubeId(url);
  if (!videoId) throw new ApiError(400, "URL do YouTube inválida");

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new ApiError(404, "Vídeo não encontrado no YouTube");
  }
  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
    html?: string;
  };

  return {
    id: videoId,
    title: data.title ?? "Vídeo do YouTube",
    author: data.author_name ?? "",
    authorUrl: data.author_url ?? "",
    thumbnailUrl: data.thumbnail_url?.replace("hqdefault", "maxresdefault") ?? "",
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export function ytDlpAvailable(): boolean {
  try {
    execSync("which yt-dlp", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function downloadVideo(
  url: string,
  videoId: string,
  destinationDir: string
): Promise<{ file: string }> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(destinationDir, { recursive: true });
    const output = path.join(destinationDir, `${videoId}.%(ext)s`);
    const proc = spawn(
      "yt-dlp",
      [
        "--no-playlist",
        "--no-part",
        "-f",
        "best[ext=mp4]/best",
        "-o",
        output,
        url,
      ],
      { stdio: ["ignore", "ignore", "ignore"] }
    );
    proc.on("error", (err) => reject(new ApiError(503, `yt-dlp não executou: ${err.message}`)));
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new ApiError(502, "Falha ao baixar o vídeo do YouTube"));
      }
      const files = fs.readdirSync(destinationDir);
      const file = files.find((f) => f.startsWith(videoId) && !f.includes(".part"));
      if (!file) return reject(new ApiError(502, "Arquivo de vídeo não gerado pelo yt-dlp"));
      resolve({ file });
    });
  });
}

export function cleanupOldDownloads() {
  const videosDir = path.join(process.cwd(), "public", "uploads", "videos");
  if (!fs.existsSync(videosDir)) return;

  const now = Date.now();
  let cleaned = 0;

  for (const file of fs.readdirSync(videosDir)) {
    const filePath = path.join(videosDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile() && now - stat.mtimeMs > CLEANUP_MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    } catch {
      // ignore individual file errors
    }
  }

  if (cleaned > 0) {
    console.log(`[CLEANUP] Removed ${cleaned} old YouTube download(s)`);
  }
}

export function startCleanupSchedule() {
  if (cleanupTimer) return;
  // Run cleanup every 6 hours
  cleanupTimer = setInterval(cleanupOldDownloads, 6 * 60 * 60 * 1000);
  // Run once on startup (after 5 minutes)
  setTimeout(cleanupOldDownloads, 5 * 60 * 1000);
}

function getYouTubeClient() {
  if (!env.youtubeClientId || !env.youtubeClientSecret || !env.youtubeRefreshToken) {
    throw new ApiError(501, "Upload para YouTube não configurado. Defina YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET e YOUTUBE_REFRESH_TOKEN.");
  }
  const oauth2Client = new google.auth.OAuth2(
    env.youtubeClientId,
    env.youtubeClientSecret
  );
  oauth2Client.setCredentials({ refresh_token: env.youtubeRefreshToken });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

export function getYouTubeAuthUrl(redirectUri: string): string {
  if (!env.youtubeClientId) {
    throw new ApiError(501, "YOUTUBE_CLIENT_ID não configurado");
  }
  const oauth2Client = new google.auth.OAuth2(
    env.youtubeClientId,
    env.youtubeClientSecret,
    redirectUri
  );
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });
}

export async function exchangeYouTubeCode(code: string, redirectUri: string) {
  if (!env.youtubeClientId || !env.youtubeClientSecret) {
    throw new ApiError(501, "YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET não configurados");
  }
  const oauth2Client = new google.auth.OAuth2(
    env.youtubeClientId,
    env.youtubeClientSecret,
    redirectUri
  );
  const { tokens } = await oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date,
  };
}

export interface YouTubeUploadResult {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
  title: string;
}

export async function uploadToYouTube(
  videoBuffer: Buffer,
  filename: string,
  title: string,
  description: string,
  tags: string[]
): Promise<YouTubeUploadResult> {
  const youtube = getYouTubeClient();

  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: env.youtubeCategoryId,
          defaultLanguage: "pt-BR",
        },
        status: {
          privacyStatus: "unlisted",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        mimeType: filename.endsWith(".mp4") ? "video/mp4" : "video/webm",
        body: Readable.from(videoBuffer),
      },
    },
    {
      timeout: 300_000,
    }
  );

  const videoId = res.data.id;
  if (!videoId) {
    throw new ApiError(502, "Falha ao enviar vídeo para YouTube");
  }

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    title,
  };
}